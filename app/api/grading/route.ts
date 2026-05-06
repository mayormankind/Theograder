import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { downloadFileFromSupabase } from '@/lib/supabase';

const gradeScriptSchema = z.object({
  scriptId: z.string().min(1, 'Script ID is required'),
  rubricId: z.string().optional(),
});

// GET /api/grading - List scripts pending review for an exam
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // Verify exam belongs to user
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdById: session.userId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    // Build where clause for scripts
    const scriptWhere: any = {
      examId,
    };

    // Build where clause for results
    const resultWhere: any = {
      examId,
      gradedById: session.userId,
    };

    if (status && status !== 'ALL') {
      resultWhere.status = status;
    }

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where: scriptWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            where: resultWhere,
            include: {
              _count: {
                select: {
                  questions: true,
                },
              },
            },
          },
        },
      }),
      prisma.script.count({ where: scriptWhere }),
    ]);

    // Filter scripts based on results status
    const filteredScripts = scripts.filter(script => {
      if (status === 'PENDING') {
        return script.results.length === 0;
      }
      return script.results.length > 0;
    });

    return NextResponse.json({
      scripts: filteredScripts,
      pagination: {
        page,
        limit,
        total: filteredScripts.length,
        pages: Math.ceil(filteredScripts.length / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching grading scripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grading scripts' },
      { status: 500 }
    );
  }
}

// POST /api/grading/grade - Grade a single script via AI service
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const validatedData = gradeScriptSchema.parse(body);

    // Get AI service URL
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Get script and verify access
    const script = await prisma.script.findFirst({
      where: {
        id: validatedData.scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          include: {
            rubrics: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Check if already graded
    const existingResult = await prisma.result.findFirst({
      where: {
        scriptId: validatedData.scriptId,
        gradedById: session.userId,
      },
    });

    if (existingResult) {
      return NextResponse.json({ error: 'Script already graded' }, { status: 400 });
    }

    // Determine which rubric to use
    let rubricId = validatedData.rubricId;
    if (!rubricId && script.exam.rubrics.length > 0) {
      rubricId = script.exam.rubrics[0].id; // Use first available rubric
    }

    if (!rubricId) {
      return NextResponse.json({ error: 'No rubric available for grading' }, { status: 400 });
    }

    // Download file from Supabase Storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFileFromSupabase('uploads', script.filePath);
    } catch (downloadError) {
      console.error('Failed to download file from Supabase:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download script file from storage' },
        { status: 500 }
      );
    }

    const fileBlob = new Blob([new Uint8Array(fileBuffer)], { type: script.mimeType });

    // Create form data for AI service
    const formData = new FormData();
    formData.append('image', fileBlob, script.originalName);
    formData.append('rubric_id', rubricId);

    // Call AI service
    const response = await fetch(`${aiServiceUrl}/grade`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service grading error:', errorText);
      return NextResponse.json(
        { error: 'Failed to grade script', details: errorText },
        { status: response.status }
      );
    }

    const gradingResult = await response.json();

    // Save result to database
    const result = await prisma.$transaction(async (tx) => {
      // Create main result
      const newResult = await tx.result.create({
        data: {
          scriptId: validatedData.scriptId,
          examId: script.examId,
          gradedById: session.userId!,
          totalScore: gradingResult.totalScore,
          maxScore: gradingResult.maxScore,
          confidence: gradingResult.confidence,
          feedback: gradingResult.feedback,
          status: 'PENDING',
        },
      });

      // Create question results
      if (gradingResult.questions && Array.isArray(gradingResult.questions)) {
        for (const question of gradingResult.questions) {
          // Find corresponding rubric question
          const rubricQuestion = await tx.rubricQuestion.findFirst({
            where: {
              rubricId,
              questionId: question.questionId,
            },
          });

          if (rubricQuestion) {
            await tx.questionResult.create({
              data: {
                resultId: newResult.id,
                questionId: question.questionId,
                question: question.question,
                answer: question.answer,
                score: question.score,
                maxScore: question.maxScore,
                confidence: question.confidence,
                breakdown: question.breakdown || {},
                feedback: question.feedback,
                rubricQuestionId: rubricQuestion.id,
              },
            });
          }
        }
      }

      // Update script status
      await tx.script.update({
        where: { id: validatedData.scriptId },
        data: { 
          status: 'PROCESSED',
          extractedText: gradingResult.extractedText,
          extractionMethod: gradingResult.extractionMethod,
          confidenceFlag: gradingResult.confidenceFlag,
          studentId: gradingResult.studentId,
          studentName: gradingResult.studentName,
        },
      });

      return newResult;
    });

    return NextResponse.json({
      message: 'Script graded successfully',
      result,
    }, { status: 201 });

  } catch (error) {
    console.error('Error grading script:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Check if it's a network/connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'AI service is unavailable. Please check your connection and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to grade script' },
      { status: 500 }
    );
  }
}
