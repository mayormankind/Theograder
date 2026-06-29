import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { parseExamInstruction } from '@/lib/utils/instruction-parser';
import { logActivity } from '@/lib/services/activity-log';

// Validation schemas
const createExamSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  courseCode: z.string().optional(),
  courseName: z.string().optional(),
  totalMarks: z.number().min(1, 'Total marks must be greater than 0'),
  duration: z.number().optional(),
  examDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  examInstructions: z.string().optional(),
  selectionStrategy: z.enum(['BEST_SCORE', 'FIRST_N']).optional(),
});

const updateExamSchema = createExamSchema.partial().extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

// GET /api/exams - List exams for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      createdById: session.userId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get exams with counts
    const [exams, total] = await Promise.all([
      prisma.exam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              scripts: true,
            },
          },
          scripts: {
            where: {
              status: 'GRADED',
            },
            select: {
              id: true,
            },
          },
        },
      }),
      prisma.exam.count({ where }),
    ]);

    const mappedExams = exams.map(exam => ({
      ...exam,
      _count: {
        scripts: exam._count?.scripts || 0,
        graded: exam.scripts?.length || 0,
      },
      scripts: undefined, // Keep HTTP response payload lightweight
    }));

    return NextResponse.json({
      exams: mappedExams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const validatedData = createExamSchema.parse(body);

    const { examInstructions, selectionStrategy, ...rest } = validatedData;

    // Parse instruction if provided
    const parsedInstruction = examInstructions 
      ? parseExamInstruction(examInstructions)
      : null;

    const exam = await prisma.exam.create({
      data: {
        ...rest,
        examInstructions: examInstructions || null,
        parsedInstruction: parsedInstruction 
          ? JSON.parse(JSON.stringify(parsedInstruction)) 
          : null,
        selectionStrategy: selectionStrategy || 'BEST_SCORE',
        createdById: session.userId!,
      },
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

    void logActivity({
      userId: session.userId,
      action: 'EXAM_CREATED',
      resource: 'EXAM',
      resourceId: exam.id,
      metadata: { examTitle: exam.title },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    );
  }
}
