import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionData } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionData(request);
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();
    const { id } = await params;

    const originalRubric = await prisma.rubric.findFirst({
      where: {
        id: id,
        createdById: session.userId,
      },
      include: {
        questions: {
          include: {
            points: true,
          },
        },
      },
    });

    if (!originalRubric) {
      return NextResponse.json({ error: 'Original rubric not found' }, { status: 404 });
    }

    const duplicatedRubric = await prisma.rubric.create({
      data: {
        title: title || `${originalRubric.title} (Copy)`,
        description: originalRubric.description,
        totalMarks: originalRubric.totalMarks,
        createdById: session.userId,
        examId: originalRubric.examId,
        questions: {
          create: originalRubric.questions.map((q: any) => ({
            questionId: q.questionId,
            question: q.question,
            maxScore: q.maxScore,
            points: {
              create: q.points.map((point: { point: string, weight: number, maxScore: number }) => ({
                point: point.point,
                weight: point.weight,
                maxScore: point.maxScore,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            points: true,
          },
        },
      },
    });

    return NextResponse.json(duplicatedRubric, { status: 201 });
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate rubric' },
      { status: 500 }
    );
  }
}
