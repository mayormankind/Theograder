import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/results/[id] - Get individual result details
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
            status: true,
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
            similarityScores: {
              include: {
                rubricPoint: true,
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

// PUT /api/results/[id]/approve - Approve a single result
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
    });

    if (!existingResult) {
      return NextResponse.json(
        { error: 'Result not found or access denied' },
        { status: 404 }
      );
    }

    const { status } = await request.json();

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const updatedResult = await prisma.result.update({
      where: { id: id },
      data: { status },
    });

    return NextResponse.json({
      message: `Result ${status.toLowerCase()} successfully`,
      result: updatedResult,
    });
  } catch (error) {
    console.error('Error updating result status:', error);
    return NextResponse.json(
      { error: 'Failed to update result status' },
      { status: 500 }
    );
  }
}
