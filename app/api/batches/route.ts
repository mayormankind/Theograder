import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const createBatchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  description: z.string().optional(),
  examId: z.string().min(1, 'Exam ID is required'),
});

// GET /api/batches - List batches for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as any;
    const examId = searchParams.get('examId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      exam: {
        createdById: session.userId,
      },
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (examId) {
      where.examId = examId;
    }

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              courseCode: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return NextResponse.json({
      batches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

// POST /api/batches - Start a new batch grading job
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const batchData = JSON.parse(formData.get('batchData') as string);

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const validatedData = createBatchSchema.parse(JSON.parse(batchData));

    // Verify exam exists and belongs to user
    const exam = await prisma.exam.findFirst({
      where: {
        id: validatedData.examId,
        createdById: session.userId,
      },
      include: {
        rubrics: true,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    if (exam.rubrics.length === 0) {
      return NextResponse.json({ error: 'Exam has no rubric configured' }, { status: 400 });
    }

    // Get AI service URL
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Create batch record
    const batch = await prisma.batch.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        examId: validatedData.examId,
        totalFiles: files.length,
        status: 'PENDING',
      },
    });

    // Upload files to Supabase and create batch items
    const uploadedFiles = [];
    for (const [index, file] of files.entries()) {
      const fileId = uuidv4();
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const fileName = `${fileId}${fileExtension}`;
      
      // Path in Supabase bucket
      const storagePath = `${session.userId}/${validatedData.examId}/${fileName}`;

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

      // Upload to Supabase Storage
      try {
        await uploadFileToSupabase(file, 'uploads', storagePath);
      } catch (uploadError) {
        console.error('Supabase upload error:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload ${file.name} to storage` },
          { status: 500 }
        );
      }

      // Create script record
      const script = await prisma.script.create({
        data: {
          filename: fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          filePath: storagePath, // Store Supabase path
          examId: validatedData.examId,
          status: 'PROCESSING',
        },
      });

      // Create batch item
      const batchItem = await prisma.batchItem.create({
        data: {
          batchId: batch.id,
          filename: file.name,
          scriptId: script.id,
          status: 'PENDING',
        },
      });

      uploadedFiles.push({
        scriptId: script.id,
        filename: file.name,
        batchItemId: batchItem.id,
      });
    }

    // Start batch processing by calling AI service
    try {
      const batchFormData = new FormData();
      batchFormData.append('rubric_id', exam.rubrics[0].id);
      
      // Add all files to form data
      for (const [index, file] of files.entries()) {
        batchFormData.append(`files`, file);
      }

      const response = await fetch(`${aiServiceUrl}/batch-grade`, {
        method: 'POST',
        body: batchFormData,
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const batchResult = await response.json();

      // Update batch with job ID
      await prisma.batch.update({
        where: { id: batch.id },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Batch processing started',
        batch: {
          ...batch,
          jobId: batchResult.job_id,
        },
        files: uploadedFiles,
      }, { status: 201 });

    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Mark batch as failed
      await prisma.batch.update({
        where: { id: batch.id },
        data: {
          status: 'FAILED',
        },
      });

      return NextResponse.json(
        { error: 'Failed to start batch processing', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error creating batch:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}
