import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/exams/[id]/rubric - Get the rubric for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    // Verify exam belongs to user
    const exam = await prisma.exam.findFirst({
      where: {
        id: id,
        createdById: session.userId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const rubric = await prisma.rubric.findFirst({
      where: {
        examId: id,
      },
      include: {
        questions: {
          include: {
            points: true,
          },
          orderBy: { questionId: 'asc' },
        },
      },
    });

    if (!rubric) {
      return NextResponse.json({ error: 'No rubric found for this exam' }, { status: 404 });
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
