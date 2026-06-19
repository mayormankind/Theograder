import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import { uploadFileToSupabase, deleteFileFromSupabase, getSignedUrl } from '@/lib/supabase';
import { extractAndSaveIdentity } from '@/lib/upload-utils';

const uploadSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
});

// POST /api/upload - Upload exam scripts
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData();
    let files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File;
    
    if (files.length === 0 && singleFile) {
      files = [singleFile];
    }

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

    const uploadedScripts = [];

    for (const file of files) {
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

      // Create script record in database
      const script = await prisma.script.create({
        data: {
          filename: fileName,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          filePath: storagePath, // Store Supabase path
          examId: validatedData.examId,
          status: 'UPLOADED',
        },
      });

      // Fire and forget identity extraction
      getSignedUrl('uploads', storagePath, 120).then(signedUrl => {
        extractAndSaveIdentity(
          script.id, 
          signedUrl, 
          process.env.AI_SERVICE_URL || 'http://localhost:8000'
        ).catch(err => console.error('[Upload] Identity extraction failed:', err));
      }).catch(err => console.error('[Upload] Failed to get signed URL for identity extraction:', err));

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

    // Log recent activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'UPLOAD',
        resource: 'SCRIPT',
        resourceId: validatedData.examId,
        metadata: { examId: validatedData.examId, count: files.length },
      },
    }).catch(err => console.error('Failed to log upload activity:', err));

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

// GET /api/upload - List uploaded scripts
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Increased default limit
    const status = searchParams.get('status') as any;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (examId) {
      where.examId = examId;
      // Also verify exam belongs to user if filtering by exam
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          createdById: session.userId,
        },
      });
      if (!exam) {
        return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
      }
    } else {
      // Fetch scripts for all user's exams
      where.exam = {
        createdById: session.userId
      };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [scriptsData, total] = await Promise.all([
      prisma.script.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          exam: {
            select: {
              title: true,
              totalMarks: true,
            }
          },
          results: {
            orderBy: { gradedAt: 'desc' },
            take: 1,
            select: {
              totalScore: true,
              maxScore: true,
              confidence: true,
              status: true,
            }
          }
        }
      }),
      prisma.script.count({ where }),
    ]);

    // Map to frontend format
    const scripts = scriptsData.map(s => {
      const result = s.results[0];
      
      // Determine frontend status
      let frontendStatus: 'UPLOADED' | 'PROCESSING' | 'PENDING_REVIEW' | 'GRADED' = 'UPLOADED';
      if (result) {
        if (result.status === 'PENDING') {
          frontendStatus = 'PENDING_REVIEW';
        } else {
          frontendStatus = 'GRADED';
        }
      } else if (s.status === 'PROCESSING') {
        frontendStatus = 'PROCESSING';
      } else {
        frontendStatus = 'UPLOADED';
      }

      return {
        id: s.id,
        fileName: s.originalName,
        studentName: s.studentName || 'Unknown Student',
        studentId: s.studentId || 'Not extracted',
        examId: s.examId,
        examTitle: s.exam.title,
        status: frontendStatus,
        uploadedAt: s.createdAt.toLocaleDateString(),
        score: result?.totalScore,
        totalMarks: result?.maxScore || s.exam.totalMarks,
        confidence: result ? Math.round(result.confidence * 100) : undefined,
      };
    });

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

// DELETE /api/upload - Bulk delete scripts
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { scriptIds } = body;

    if (!scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
      return NextResponse.json(
        { error: 'Script IDs are required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Find all scripts that exist and belong to the user
    const scripts = await prisma.script.findMany({
      where: {
        id: { in: scriptIds },
        exam: {
          createdById: session.userId,
        },
      },
      select: {
        id: true,
        filePath: true,
      },
    });

    if (scripts.length === 0) {
      return NextResponse.json({ error: 'No scripts found or access denied' }, { status: 404 });
    }

    const foundIds = scripts.map((s) => s.id);

    // Delete files from Supabase Storage
    for (const script of scripts) {
      try {
        await deleteFileFromSupabase('uploads', script.filePath);
      } catch (error) {
        console.error(`Error deleting file ${script.filePath} from Supabase:`, error);
      }
    }

    // Perform database deletion in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated results (which cascades to QuestionResult)
      await tx.result.deleteMany({
        where: { scriptId: { in: foundIds } },
      });
      // 2. Delete the scripts themselves
      await tx.script.deleteMany({
        where: { id: { in: foundIds } },
      });
    });

    return NextResponse.json({
      message: `Successfully deleted ${foundIds.length} scripts`,
      deletedCount: foundIds.length,
    });
  } catch (error) {
    console.error('Error bulk deleting scripts:', error);
    return NextResponse.json(
      { error: 'Failed to delete scripts' },
      { status: 500 }
    );
  }
}

