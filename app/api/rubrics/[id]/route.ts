import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const rubric = await prisma.rubric.findFirst({
      where: {
        id: id,
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
    });

    if (!rubric) {
      return NextResponse.json({ error: 'Rubric not found' }, { status: 404 });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, examId, questions } = data;
    const { id } = await params;

    // Calculate total marks
    const totalMarks = questions?.reduce((acc: number, q: { maxScore: number }) => acc + q.maxScore, 0) || 0;

    const rubric = await prisma.rubric.update({
      where: {
        id: id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(examId && { examId }),
        ...(questions && { totalMarks }),
        updatedAt: new Date(),
      },
      include: {
        questions: {
          include: {
            points: true,
          },
        },
      },
    });

    return NextResponse.json(rubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    return NextResponse.json(
      { error: 'Failed to update rubric' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.rubric.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Rubric deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    return NextResponse.json(
      { error: 'Failed to delete rubric' },
      { status: 500 }
    );
  }
}
