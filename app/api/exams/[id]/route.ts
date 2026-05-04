import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

const updateExamSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  totalMarks: z.number().min(1, 'Total marks must be greater than 0').optional(),
  duration: z.number().optional(),
  examDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

// GET /api/exams/[id] - Get a single exam
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const exam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        createdById: session.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        rubrics: {
          include: {
            questions: {
              include: {
                points: true,
              },
            },
          },
        },
        _count: {
          select: {
            scripts: true,
            results: true,
            batches: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

// PUT /api/exams/[id] - Update an exam
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Check if exam exists and belongs to user
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        createdById: session.userId,
      },
    });

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateExamSchema.parse(body);

    const updatedExam = await prisma.exam.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedExam);
  } catch (error) {
    console.error('Error updating exam:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

// DELETE /api/exams/[id] - Soft delete an exam (archive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Check if exam exists and belongs to user
    const existingExam = await prisma.exam.findFirst({
      where: {
        id: params.id,
        createdById: session.userId,
      },
    });

    if (!existingExam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting status to ARCHIVED
    const archivedExam = await prisma.exam.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({
      message: 'Exam archived successfully',
      exam: archivedExam,
    });
  } catch (error) {
    console.error('Error archiving exam:', error);
    return NextResponse.json(
      { error: 'Failed to archive exam' },
      { status: 500 }
    );
  }
}
