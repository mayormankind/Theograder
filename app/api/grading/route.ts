import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

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
