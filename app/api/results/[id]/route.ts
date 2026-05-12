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

    // Map the breakdown JSON for easier consumption in the frontend
    const mappedQuestions = result.questions.map(q => {
      const breakdown = (q.breakdown as any) || {};
      return {
        ...q,
        matchedConcepts: breakdown.matchedConcepts || [],
        missingConcepts: breakdown.missingConcepts || [],
        similarityScore: Math.round(((breakdown.similarities as number[])?.[0] || 0) * 100),
      };
    });

    return NextResponse.json({
      ...result,
      questions: mappedQuestions
    });
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

    const { status, overrides } = await request.json();

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update individual question scores if overrides provided
      if (overrides && typeof overrides === 'object') {
        for (const [qResultId, newScore] of Object.entries(overrides)) {
          await tx.questionResult.update({
            where: { id: qResultId },
            data: { score: parseFloat(newScore as string) }
          });
        }
      }

      // 2. Update result status and total score
      const updated = await tx.result.update({
        where: { id: id },
        data: { 
          status,
          ...(overrides ? {
            totalScore: (await tx.questionResult.aggregate({
              where: { resultId: id },
              _sum: { score: true }
            }))._sum.score || 0
          } : {})
        },
      });

      // 3. Update script status to GRADED if approved
      if (status === 'APPROVED') {
        await tx.script.update({
          where: { id: updated.scriptId },
          data: { status: 'GRADED' }
        });
      }

      return updated;
    });

    return NextResponse.json({
      message: `Result ${status.toLowerCase()} successfully`,
      result,
    });
  } catch (error) {
    console.error('Error updating result status:', error);
    return NextResponse.json(
      { error: 'Failed to update result status' },
      { status: 500 }
    );
  }
}
