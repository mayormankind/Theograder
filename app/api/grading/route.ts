import { NextRequest, NextResponse } from 'next/server';
import { Prisma, ResultStatus } from '@prisma/client';
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
    const status = searchParams.get('status');

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

    // Build the script-level where clause, pushing status logic into the DB
    const scriptWhere: Prisma.ScriptWhereInput = { examId };

    if (status === 'PENDING') {
      // Scripts with no results yet
      scriptWhere.results = { none: {} };
    } else if (status && status !== 'ALL') {
      // Scripts that have at least one result matching the requested status
      scriptWhere.results = {
        some: { examId, gradedById: session.userId!, status: status as ResultStatus },
      };
    }

    const resultIncludeWhere = {
      examId,
      gradedById: session.userId,
    };

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where: scriptWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          results: {
            where: resultIncludeWhere,
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

    return NextResponse.json({
      scripts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
