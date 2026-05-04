import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// Validation schemas
const createRubricSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  examId: z.string().optional(),
  isTemplate: z.boolean().optional().default(false),
  questions: z.array(z.object({
    questionId: z.string().optional(),
    question: z.string().min(1, 'Question text is required'),
    maxScore: z.number().min(1, 'Max score must be greater than 0'),
    points: z.array(z.object({
      point: z.string().min(1, 'Point text is required'),
      weight: z.number().min(0).default(1.0),
      maxScore: z.number().min(0),
    })).optional().default([]),
  })).min(1, 'At least one question is required'),
});

// GET /api/rubrics - List rubrics for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeTemplates = searchParams.get('templates') === 'true';
    const examId = searchParams.get('examId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (includeTemplates) {
      where.OR = [
        { createdById: session.userId },
        { isTemplate: true },
      ];
    } else {
      where.createdById = session.userId;
    }

    if (examId) {
      where.examId = examId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rubrics, total] = await Promise.all([
      prisma.rubric.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          questions: {
            include: {
              points: true,
            },
          },
          exam: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              courseName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.rubric.count({ where }),
    ]);

    return NextResponse.json({
      rubrics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rubrics' },
      { status: 500 }
    );
  }
}

// POST /api/rubrics - Create a new rubric
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const validatedData = createRubricSchema.parse(body);

    // Calculate total marks
    const totalMarks = validatedData.questions.reduce(
      (acc, q) => acc + q.maxScore, 
      0
    );

    const rubric = await prisma.rubric.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        totalMarks,
        isTemplate: validatedData.isTemplate,
        examId: validatedData.examId,
        createdById: session.userId!,
        questions: {
          create: validatedData.questions.map((q, index) => ({
            questionId: q.questionId || `Q${index + 1}`,
            question: q.question,
            maxScore: q.maxScore,
            points: {
              create: q.points.map(point => ({
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(rubric, { status: 201 });
  } catch (error) {
    console.error('Error creating rubric:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create rubric' },
      { status: 500 }
    );
  }
}
