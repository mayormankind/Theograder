import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

const updateRubricSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  examId: z.string().nullable().optional(),
  isTemplate: z.boolean().optional(),
  questions: z.array(z.object({
    id: z.string().optional(),
    questionId: z.string().optional(),
    question: z.string().min(1, 'Question text is required'),
    maxScore: z.number().min(1, 'Max score must be greater than 0'),
    points: z.array(z.object({
      id: z.string().optional(),
      point: z.string().min(1, 'Point text is required'),
      weight: z.number().min(0).default(1.0),
      maxScore: z.number().min(0),
    })).optional().default([]),
  })).optional(),
});

// GET /api/rubrics/[id] - Get a single rubric
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const rubric = await prisma.rubric.findFirst({
      where: {
        id: params.id,
        OR: [
          { createdById: session.userId },
          { isTemplate: true },
        ],
      },
      include: {
        questions: {
          include: {
            points: true,
          },
          orderBy: {
            questionId: 'asc',
          },
        },
        exam: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            courseName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!rubric) {
      return NextResponse.json(
        { error: 'Rubric not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubric' },
      { status: 500 }
    );
  }
}

// PUT /api/rubrics/[id] - Update a rubric
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Check if rubric exists and belongs to user
    const existingRubric = await prisma.rubric.findFirst({
      where: {
        id: params.id,
        createdById: session.userId,
      },
    });

    if (!existingRubric) {
      return NextResponse.json(
        { error: 'Rubric not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateRubricSchema.parse(body);

    // Prepare update data
    const updateData: any = {
      title: validatedData.title,
      description: validatedData.description,
      examId: validatedData.examId,
      isTemplate: validatedData.isTemplate,
    };

    // If questions are provided, we need to handle the complex update
    if (validatedData.questions) {
      // Calculate new total marks
      const totalMarks = validatedData.questions.reduce(
        (acc, q) => acc + q.maxScore, 
        0
      );
      updateData.totalMarks = totalMarks;

      // Store questions in a const to avoid TypeScript issues
      const questions = validatedData.questions;

      // Delete existing questions and points, then recreate
      await prisma.$transaction(async (tx) => {
        // Delete existing points
        await tx.rubricPoint.deleteMany({
          where: {
            question: {
              rubricId: params.id,
            },
          },
        });

        // Delete existing questions
        await tx.rubricQuestion.deleteMany({
          where: {
            rubricId: params.id,
          },
        });

        // Create new questions and points
        for (const [index, question] of questions.entries()) {
          const createdQuestion = await tx.rubricQuestion.create({
            data: {
              questionId: question.questionId || `Q${index + 1}`,
              question: question.question,
              maxScore: question.maxScore,
              rubricId: params.id,
            },
          });

          // Create points for this question
          if (question.points && question.points.length > 0) {
            await tx.rubricPoint.createMany({
              data: question.points.map(point => ({
                point: point.point,
                weight: point.weight,
                maxScore: point.maxScore,
                questionId: createdQuestion.id,
              })),
            });
          }
        }
      });
    }

    const updatedRubric = await prisma.rubric.update({
      where: { id: params.id },
      data: updateData,
      include: {
        questions: {
          include: {
            points: true,
          },
          orderBy: {
            questionId: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update rubric' },
      { status: 500 }
    );
  }
}

// DELETE /api/rubrics/[id] - Delete a rubric
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Check if rubric exists and belongs to user
    const existingRubric = await prisma.rubric.findFirst({
      where: {
        id: params.id,
        createdById: session.userId,
      },
    });

    if (!existingRubric) {
      return NextResponse.json(
        { error: 'Rubric not found or access denied' },
        { status: 404 }
      );
    }

    // Don't allow deletion if rubric is linked to an exam
    if (existingRubric.examId) {
      return NextResponse.json(
        { error: 'Cannot delete rubric that is linked to an exam' },
        { status: 400 }
      );
    }

    // Delete rubric (cascade will handle questions and points)
    await prisma.rubric.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Rubric deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
