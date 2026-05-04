import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const uploadSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
});

// POST /api/upload - Upload exam scripts
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const examId = formData.get('examId') as string;

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const validatedData = uploadSchema.parse({ examId });

    // Verify exam exists and belongs to user
    const exam = await prisma.exam.findFirst({
      where: {
        id: validatedData.examId,
        createdById: session.userId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    // Create upload directory
    const uploadDir = join(process.cwd(), 'uploads', session.userId!, validatedData.examId);
    await mkdir(uploadDir, { recursive: true });

    const uploadedScripts = [];

    for (const file of files) {
      const fileId = uuidv4();
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileName = `${fileId}${fileExtension}`;
      const filePath = join(uploadDir, fileName);

      // Validate file
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 20MB` },
          { status: 400 }
        );
      }

      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        return NextResponse.json(
          { error: `File ${file.name} is not a supported format` },
          { status: 400 }
        );
      }

      // Save file to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Create script record in database
      const script = await prisma.script.create({
        data: {
          filename: fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          filePath: filePath,
          examId: validatedData.examId,
          status: 'PROCESSING',
        },
      });

      uploadedScripts.push({
        id: script.id,
        filename: script.filename,
        originalName: script.originalName,
        fileSize: script.fileSize,
        mimeType: script.mimeType,
        status: script.status,
        examId: script.examId,
        createdAt: script.createdAt,
      });
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      scripts: uploadedScripts,
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading files:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// GET /api/upload - List uploaded scripts for an exam
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

    // Build where clause
    const where: any = {
      examId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [scripts, total] = await Promise.all([
      prisma.script.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.script.count({ where }),
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
    console.error('Error fetching uploaded files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploaded files' },
      { status: 500 }
    );
  }
}
