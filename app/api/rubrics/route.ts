import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rubrics = await prisma.rubric.findMany({
      where: {
        createdById: session.user.id,
      },
      include: {
        questions: {
          include: {
            points: true,
          },
        },
        exam: {
          select: {
            courseCode: true,
            courseName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(rubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, examId, questions } = data;

    // Validate required fields
    if (!title || !questions) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total marks
    const totalMarks = questions.reduce((acc: number, q: any) => acc + q.maxScore, 0);

    const rubric = await prisma.rubric.create({
      data: {
        title,
        description,
        totalMarks,
        createdById: session.user.id,
        examId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            questionId: q.questionId || `Q${index + 1}`,
            question: q.question,
            maxScore: q.maxScore,
            points: {
              create: q.points?.map((point: any) => ({
                point: point.point,
                weight: point.weight || 1.0,
                maxScore: point.maxScore,
              })) || [],
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

    return NextResponse.json(rubric, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to create rubric' },
      { status: 500 }
    );
  }
}
