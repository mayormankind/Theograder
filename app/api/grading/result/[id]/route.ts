import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

const updateResultSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED']).optional(),
  feedback: z.string().optional(),
  questionOverrides: z.array(z.object({
    questionId: z.string(),
    score: z.number(),
    feedback: z.string().optional(),
  })).optional(),
});

// GET /api/grading/result/[id] - Get full result detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    const result = await prisma.result.findFirst({
      where: {
        id: id,
        gradedById: session.userId,
      },
      include: {
        script: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            studentId: true,
            studentName: true,
            extractedText: true,
            filePath: true,
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            courseName: true,
            totalMarks: true,
          },
        },
        questions: {
          include: {
            rubricQuestion: {
              include: {
                points: true,
              },
            },
          },
          orderBy: {
            questionId: 'asc',
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}

// PUT /api/grading/result/[id] - Update result (lecturer override)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    const existingResult = await prisma.result.findFirst({
      where: {
        id: id,
        gradedById: session.userId,
      },
      include: {
        questions: true,
      },
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: 'Result not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateResultSchema.parse(body);

    const updatedResult = await prisma.$transaction(async (tx) => {
      let totalScore = existingResult.totalScore;

      // Update question overrides if provided
      if (validatedData.questionOverrides && validatedData.questionOverrides.length > 0) {
        for (const override of validatedData.questionOverrides) {
          const questionResult = existingResult.questions.find(
            q => q.questionId === override.questionId
          );

          if (questionResult) {
            // Calculate score difference
            const scoreDiff = override.score - questionResult.score;
            totalScore += scoreDiff;

            // Update question result
            await tx.questionResult.update({
              where: { id: questionResult.id },
              data: {
                score: override.score,
                feedback: override.feedback,
                overridden: true,
                originalScore: questionResult.score,
              },
            });
          }
        }
      }

      // Update main result
      const result = await tx.result.update({
        where: { id: id },
        data: {
          status: validatedData.status || existingResult.status,
          feedback: validatedData.feedback,
          totalScore,
        },
        include: {
          questions: {
            include: {
              rubricQuestion: {
                include: {
                  points: true,
                },
              },
            },
          },
        },
      });

      return result;
    });

    return NextResponse.json(updatedResult);
  } catch (error) {
    console.error('Error updating result:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update result' },
      { status: 500 }
    );
  }
}
