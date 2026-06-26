// app/api/scripts/[scriptId]/process/route.ts
// OCR + segmentation + grading is long-running; override Vercel's 10s default.
// Requires Vercel Pro (max 300s). On Hobby the cap is 60s — adjust accordingly.
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { downloadFileFromSupabase, getSignedUrl } from "@/lib/supabase";
import { notificationService } from "@/lib/services/notification-service";
import { selectAnswers, GradedQuestion } from '@/lib/utils/answer-selector';
import { ParsedInstruction } from '@/lib/utils/instruction-parser';

// POST /api/scripts/[scriptId]/process - Process a single script (OCR, segment, grade)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> },
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
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!script.exam.rubrics || script.exam.rubrics.length === 0) {
      return NextResponse.json(
        {
          error:
            "No rubric found for this exam. Create a rubric before grading.",
        },
        { status: 400 },
      );
    }

    const rubric = script.exam.rubrics[0];

    // Fetch user preferences for auto-flagging and confidence threshold
    const userSettings = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { confidenceThreshold: true, autoFlag: true },
    });
    const threshold = userSettings?.confidenceThreshold ?? 70;
    const shouldAutoFlag = userSettings?.autoFlag ?? true;

    // Update status to PROCESSING
    await prisma.script.update({
      where: { id: scriptId },
      data: { status: "PROCESSING" },
    });

    // ── STAGE 1: DOWNLOAD & OCR ───────────────────────────
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFileFromSupabase("uploads", script.filePath);
    } catch (downloadError) {
      console.error("Failed to download file from Supabase:", downloadError);
      throw new Error("Failed to download script file from storage");
    }

    const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
      type: script.mimeType,
    });

    const ocrFormData = new FormData();
    ocrFormData.append("file", fileBlob, script.originalName);

    const ocrResponse = await fetch(`${AI_SERVICE_URL}/ocr`, {
      method: "POST",
      body: ocrFormData,
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      throw new Error(`OCR failed: ${errorText}`);
    }

    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.extracted_text;

    if (!extractedText) {
      throw new Error("OCR returned no text");
    }

    // Fallback Identity Extraction from the OCR'd text
    const nameMatch = extractedText.match(/Name:\s*([^\n]+)/i);
    const matricMatch = extractedText.match(
      /(?:Matric|ID)\s*(?:No|Number|\.)?\s*[:\-]?\s*([^\n]+)/i,
    );

    let fallbackName = nameMatch ? nameMatch[1].trim() : undefined;
    let fallbackMatric = matricMatch ? matricMatch[1].trim() : undefined;

    // Try to correct common OCR errors in matric numbers (e.g. 1FS/2014986 -> IFS/20/4986)
    if (fallbackMatric) {
      // Strip out spaces and any trailing punctuation
      fallbackMatric = fallbackMatric.toUpperCase().replace(/[^A-Z0-9/]/g, "");
      fallbackMatric = fallbackMatric.replace(/^1([A-Z])/i, "I$1"); // Replace leading 1 with I if followed by letter

      // If it has only one slash, e.g., IFS/2014986, inject a slash after the 2-digit year
      if ((fallbackMatric.match(/\//g) || []).length === 1) {
        // Often OCR reads the second slash as a '1', e.g. /2014986 instead of /20/4986
        if (/\/(\d{2})1(\d{3,4})$/.test(fallbackMatric)) {
          fallbackMatric = fallbackMatric.replace(
            /\/(\d{2})1(\d{3,4})$/,
            "/$1/$2",
          );
        } else {
          fallbackMatric = fallbackMatric.replace(
            /\/(\d{2})(\d{3,5})$/,
            "/$1/$2",
          );
        }
      }

      // Ensure the final format somewhat matches expected (allow some leniency but prevent extreme garbage)
      if (!/^[A-Z]{2,5}\/\d{2}\/\d{3,5}$/.test(fallbackMatric)) {
        fallbackMatric = undefined; // Discard if it still doesn't look like a matric number
      }
    }

    // Check if we already have a valid student ID from the upload phase
    const hasValidIdentity =
      script.studentId &&
      script.studentId !== "Not extracted" &&
      script.studentId !== "Unknown";

    const dataToUpdate: any = {
      extractedText: extractedText,
      extractionMethod: ocrData.extraction_method || "hybrid",
      confidenceFlag: ocrData.confidence_flag || "acceptable",
    };

    if (!hasValidIdentity) {
      if (fallbackMatric) dataToUpdate.studentId = fallbackMatric;
      if (fallbackName) dataToUpdate.studentName = fallbackName;
    }

    // Save extracted text and potentially fallback identity
    await prisma.script.update({
      where: { id: scriptId },
      data: dataToUpdate,
    });

    // ── STAGE 2: SEGMENTATION ─────────────────────────────
    const segmentResponse = await fetch(`${AI_SERVICE_URL}/segment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      rubricPayload[questionKey] = question.points.map((point) => ({
        point: point.point,
        weight: point.weight,
        maxScore: point.maxScore,
        // Pass question total marks on every point
        // so grading.py can access it regardless of
        // which point it reads from
        questionMaxScore: question.maxScore,
      }));
    }

    // Create form data for AI service
    const formData = new FormData();
    formData.append("file", fileBlob, script.originalName);
    formData.append("rubric_str", JSON.stringify(rubricPayload));
    formData.append("extracted_text", extractedText);

    const gradeResponse = await fetch(`${AI_SERVICE_URL}/grade`, {
      method: "POST",
      body: formData,
    });

    if (!gradeResponse.ok) {
      const errorText = await gradeResponse.text();
      throw new Error(`Grading failed: ${errorText}`);
    }

    const gradeData = await gradeResponse.json();

    // ── APPLY ANSWER SELECTION ──────────────────────
    const instruction = script.exam.parsedInstruction as 
      ParsedInstruction | null;
    const strategy = (script.exam.selectionStrategy || 
      'BEST_SCORE') as 'BEST_SCORE' | 'FIRST_N';

    // Build GradedQuestion array from gradeData
    const gradedQuestions: GradedQuestion[] = 
      (gradeData.questions || []).map(
        (q: any, index: number) => {
          const rubricQ = rubric.questions.find(rq => {
            const norm = (s: string) => 
              s.toLowerCase()
               .replace(/^question\s*/i, '')
               .replace(/^q/, '')
               .trim();
            return norm(rq.questionId) === norm(q.question);
          });
          return {
            id: q.question,        // temp id for selection
            questionId: q.question,
            score: q.score || 0,
            maxScore: rubricQ?.maxScore || 0,
            documentOrder: index
          };
        }
      );

    // Run selection
    const selectionResult = instruction
      ? selectAnswers(gradedQuestions, instruction, strategy)
      : {
          selected: gradedQuestions,
          excluded: [],
          totalScore: gradedQuestions.reduce(
            (s, q) => s + q.score, 0
          ),
          totalMaxScore: gradedQuestions.reduce(
            (s, q) => s + q.maxScore, 0
          ),
          selectionApplied: false,
          strategy: 'BEST_SCORE'
        };

    // Build a set of selected question IDs for lookup
    const selectedQuestionIds = new Set(
      selectionResult.selected.map(q => q.questionId)
    );

    // Build exclusion reason map
    const exclusionReasons = new Map<string, string>();
    selectionResult.excluded.forEach(q => {
      exclusionReasons.set(
        q.questionId,
        strategy === 'BEST_SCORE'
          ? `Not selected — lower score (${q.score}/${q.maxScore})` 
          : `Not selected — answered after required limit` 
      );
    });

    // ── SAVE RESULT WITH CORRECT TOTALS ─────────────
    // Use selectionResult totals, NOT raw gradeData totals
    const totalScore = selectionResult.totalScore;
    const avgConfidence = gradeData.questions?.length > 0
      ? gradeData.questions
          .filter((q: any) => 
            selectedQuestionIds.has(q.question)
          )
          .reduce(
            (sum: number, q: any) => sum + (q.confidence || 0),
            0
          ) / Math.max(selectionResult.selected.length, 1)
      : 0.5;
    const avgConfidencePct = Math.round(avgConfidence * 100);
    const isFlagged = shouldAutoFlag && avgConfidencePct < threshold;
    const resultStatus = isFlagged ? "PENDING" : "APPROVED";

    // ── SAVE GRADES TO DB ─────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Create main result
      const newResult = await tx.result.create({
        data: {
          scriptId: script.id,
          examId: script.examId,
          gradedById: session.userId!,
          totalScore: Math.round(totalScore * 10) / 10,
          maxScore: selectionResult.totalMaxScore || 
                    script.exam.totalMarks,
          confidence: avgConfidence,
          status: resultStatus,
        },
      });

      // Create question results
      if (gradeData.questions && Array.isArray(gradeData.questions)) {
        for (const question of gradeData.questions) {
          // Normalize rubric matching logic to match AI service normalization
          const normalize = (s: string) =>
            s
              .toLowerCase()
              .replace(/\s+/g, "")
              .replace(/^question/, "")
              .replace(/^q/, "");
          const target = normalize(question.question);

          const rubricQuestion = rubric.questions.find(
            (rq) => normalize(rq.questionId) === target,
          );

          if (rubricQuestion) {
            const isCounted = selectedQuestionIds.has(
              question.question
            );
            const excludedReason = exclusionReasons.get(
              question.question
            ) || null;

            // Find the student answer from segments
            const answerFromSegments =
              Object.entries(segments).find(
                ([k]) => normalize(k) === target,
              )?.[1] || "";

            await tx.questionResult.create({
              data: {
                resultId: newResult.id,
                questionId: question.question,
                question: question.question,
                answer: question.answer || (answerFromSegments as string) || "",
                score: question.score || 0,
                maxScore: rubricQuestion.maxScore,
                confidence: question.confidence || 0.5,
                breakdown: {
                  similarities: question.breakdown || [],
                  matchedConcepts: question.matched_concepts || [],
                  partialConcepts: question.partial_concepts || [],
                  missingConcepts: question.missing_concepts || [],
                },
                countedInTotal: isCounted,
                excludedReason: excludedReason,
                rubricQuestionId: rubricQuestion.id,
              },
            });
          }
        }
      }

      // Update script status
      await tx.script.update({
        where: { id: scriptId },
        data: { status: "PROCESSED" },
      });
    });

    // Log recent activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'PROCESSED',
        resource: 'SCRIPT',
        resourceId: scriptId,
        metadata: { examId: script.examId },
      },
    }).catch(err => console.error('Failed to log script processed activity:', err));

    const totalPossible = selectionResult.totalMaxScore || script.exam.totalMarks;

    // Fire & Forget: Dispatch script flagged notification if confidence fell below threshold
    if (isFlagged) {
      notificationService
        .notify({
          userId: session.userId!,
          type: "SCRIPT_FLAGGED",
          title: "Script Flagged for Manual Review",
          message: `Student matric number "${script.studentId || "Unknown"}" graded with ${avgConfidencePct}% confidence (threshold: ${threshold}%).`,
          link: `/dashboard/grading?scriptId=${script.id}&examId=${script.examId}`,
          metadata: {
            scriptId: script.id,
            studentId: script.studentId,
            confidence: avgConfidencePct,
          },
        })
        .catch((err) =>
          console.error("Failed to dispatch flagged notification:", err),
        );
    }

    return NextResponse.json({
      success: true,
      scriptId,
      totalScore: Math.round(selectionResult.totalScore * 10) / 10,
      totalPossible,
      selectionApplied: selectionResult.selectionApplied,
      selectedCount: selectionResult.selected.length,
      excludedCount: selectionResult.excluded.length,
      grades: gradeData.questions,
    });
  } catch (error: any) {
    console.error(`Processing failed for script ${scriptId}:`, error);

    // Mark script as UPLOADED so it can be retried
    await prisma.script
      .update({
        where: { id: scriptId },
        data: { status: "UPLOADED" },
      })
      .catch(() => {});

    return NextResponse.json(
      { error: error.message || "Processing failed" },
      { status: 500 },
    );
  }
}
