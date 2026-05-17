// app/api/scripts/[scriptId]/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { downloadFileFromSupabase, getSignedUrl } from '@/lib/supabase';

// POST /api/scripts/[scriptId]/process - Process a single script (OCR, segment, grade)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  const { scriptId } = await params;
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Fetch script and its exam's rubric
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          include: {
            rubrics: {
              include: {
                questions: {
                  include: {
                    points: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    if (!script.exam.rubrics || script.exam.rubrics.length === 0) {
      return NextResponse.json(
        { error: 'No rubric found for this exam. Create a rubric before grading.' },
        { status: 400 }
      );
    }

    const rubric = script.exam.rubrics[0];

    // Update status to PROCESSING
    await prisma.script.update({
      where: { id: scriptId },
      data: { status: 'PROCESSING' },
    });

    // ── STAGE 1: OCR ──────────────────────────────────────
    // Generate a signed URL so the AI service can download from private Supabase storage
    const signedFileUrl = await getSignedUrl('uploads', script.filePath, 120);

    const ocrResponse = await fetch(`${AI_SERVICE_URL}/ocr-from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: signedFileUrl }),
    });

    if (!ocrResponse.ok) {
      throw new Error(`OCR failed: ${ocrResponse.statusText}`);
    }

    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.extracted_text;

    if (!extractedText) {
      throw new Error('OCR returned no text');
    }

    // Save extracted text
    await prisma.script.update({
      where: { id: scriptId },
      data: {
        extractedText: extractedText,
        extractionMethod: ocrData.extraction_method || 'hybrid',
        confidenceFlag: ocrData.confidence_flag || 'acceptable',
        studentId: ocrData.student_id,
        studentName: ocrData.student_name,
      },
    });

    // ── STAGE 2: SEGMENTATION ─────────────────────────────
    const segmentResponse = await fetch(`${AI_SERVICE_URL}/segment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: extractedText }),
    });

    if (!segmentResponse.ok) {
      throw new Error(`Segmentation failed: ${segmentResponse.statusText}`);
    }

    const segments = await segmentResponse.json();

    // ── STAGE 3: GRADING ──────────────────────────────────
    // Build rubric payload in the shape FastAPI /grade expects
    const rubricPayload: Record<string, any> = {};

    for (const question of rubric.questions) {
      const questionKey = question.questionId;
      rubricPayload[questionKey] = question.points.map(point => ({
        point: point.point,
        weight: point.weight,
      }));
    }

    // Download file from Supabase for grading
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFileFromSupabase('uploads', script.filePath);
    } catch (downloadError) {
      console.error('Failed to download file from Supabase:', downloadError);
      throw new Error('Failed to download script file from storage');
    }

    const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: script.mimeType });

    // Create form data for AI service
    const formData = new FormData();
    formData.append('file', fileBlob, script.originalName);
    formData.append('rubric_str', JSON.stringify(rubricPayload));
    formData.append('extracted_text', extractedText);

    const gradeResponse = await fetch(`${AI_SERVICE_URL}/grade`, {
      method: 'POST',
      body: formData,
    });

    if (!gradeResponse.ok) {
      const errorText = await gradeResponse.text();
      throw new Error(`Grading failed: ${errorText}`);
    }

    const gradeData = await gradeResponse.json();

    // ── SAVE GRADES TO DB ─────────────────────────────────
    await prisma.$transaction(async (tx) => {
      const totalScore = gradeData.questions?.reduce((sum: number, q: any) => sum + (q.score || 0), 0) || 0;
      const avgConfidence = gradeData.questions?.length > 0 
        ? gradeData.questions.reduce((sum: number, q: any) => sum + (q.confidence || 0), 0) / gradeData.questions.length
        : 0.5;

      // Create main result
      const newResult = await tx.result.create({
        data: {
          scriptId: script.id,
          examId: script.examId,
          gradedById: session.userId!,
          totalScore: totalScore,
          maxScore: script.exam.totalMarks,
          confidence: avgConfidence,
          status: 'PENDING',
        },
      });

      // Create question results
      if (gradeData.questions && Array.isArray(gradeData.questions)) {
        for (const question of gradeData.questions) {
          // Normalize rubric matching logic to match AI service normalization
          const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "").replace(/^question/, "").replace(/^q/, "");
          const target = normalize(question.question);
          
          const rubricQuestion = rubric.questions.find(
            rq => normalize(rq.questionId) === target
          );

          if (rubricQuestion) {
            // Find the student answer from segments
            const answerFromSegments = Object.entries(segments)
              .find(([k]) => normalize(k) === target)?.[1] || '';

            await tx.questionResult.create({
              data: {
                resultId: newResult.id,
                questionId: question.question,
                question: question.question,
                answer: question.answer || 
                        (answerFromSegments as string) || '',
                score: question.score || 0,
                maxScore: rubricQuestion.maxScore,
                confidence: question.confidence || 0.5,
                breakdown: {
                  similarities: question.breakdown || [],
                  matchedConcepts: question.matched_concepts || [],
                  partialConcepts: question.partial_concepts || [],
                  missingConcepts: question.missing_concepts || [],
                },
                rubricQuestionId: rubricQuestion.id,
              },
            });
          }
        }
      }

      // Update script status
      await tx.script.update({
        where: { id: scriptId },
        data: { status: 'PROCESSED' },
      });
    });

    // Compute total score to return to frontend
    const totalScore = gradeData.questions?.reduce((sum: number, q: any) => sum + (q.score || 0), 0) || 0;
    const totalPossible = script.exam.totalMarks;

    return NextResponse.json({
      success: true,
      scriptId,
      totalScore: Math.round(totalScore * 10) / 10,
      totalPossible,
      grades: gradeData.questions,
    });

  } catch (error: any) {
    console.error(`Processing failed for script ${scriptId}:`, error);

    // Mark script as UPLOADED so it can be retried
    await prisma.script.update({
      where: { id: scriptId },
      data: { status: 'UPLOADED' },
    }).catch(() => {});

    return NextResponse.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
}
