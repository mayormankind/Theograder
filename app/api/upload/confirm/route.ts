import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { getSignedUrl, deleteFileFromSupabase } from '@/lib/supabase';
import { extractAndSaveIdentity } from '@/lib/upload-utils';

const confirmSchema = z.object({
  examId: z.string().min(1),
  originalName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  storagePath: z.string().min(1),
});

// POST /api/upload/confirm - Create DB record after a successful direct Supabase upload
export async function POST(request: NextRequest) {
  // Track storagePath so we can delete the orphaned Supabase file if DB operations fail
  let confirmedStoragePath: string | null = null;

  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { examId, originalName, fileSize, mimeType, storagePath } =
      confirmSchema.parse(body);

    confirmedStoragePath = storagePath;

    // Verify the storagePath was generated for this user and exam (security check)
    if (!storagePath.startsWith(`${session.userId}/${examId}/`)) {
      return NextResponse.json({ error: 'Invalid storage path' }, { status: 400 });
    }

    // Verify exam exists and belongs to user
    const exam = await prisma.exam.findFirst({
      where: { id: examId, createdById: session.userId },
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const filename = storagePath.split('/').pop()!;

    const script = await prisma.script.create({
      data: {
        filename,
        originalName,
        fileSize,
        mimeType,
        filePath: storagePath,
        examId,
        status: 'UPLOADED',
      },
    });

    // Fire and forget identity extraction
    getSignedUrl('uploads', storagePath, 120)
      .then((signedUrl) => {
        extractAndSaveIdentity(
          script.id,
          signedUrl,
          process.env.AI_SERVICE_URL || 'http://localhost:8000'
        ).catch((err) =>
          console.error('[Confirm] Identity extraction failed:', err)
        );
      })
      .catch((err) =>
        console.error('[Confirm] Failed to get signed URL for identity extraction:', err)
      );

    // Log activity
    prisma.activityLog
      .create({
        data: {
          userId: session.userId,
          action: 'UPLOAD',
          resource: 'SCRIPT',
          resourceId: examId,
          metadata: { examId, count: 1 },
        },
      })
      .catch((err) => console.error('Failed to log upload activity:', err));

    return NextResponse.json(
      {
        message: 'File confirmed successfully',
        script: {
          id: script.id,
          filename: script.filename,
          originalName: script.originalName,
          fileSize: script.fileSize,
          mimeType: script.mimeType,
          status: script.status,
          examId: script.examId,
          createdAt: script.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    // Clean up the orphaned Supabase file if it was uploaded but DB record creation failed
    if (confirmedStoragePath) {
      deleteFileFromSupabase('uploads', confirmedStoragePath)
        .then(() => console.log('[Confirm] Cleaned up orphaned file:', confirmedStoragePath))
        .catch(err => console.error('[Confirm] Failed to clean up orphaned file:', err));
    }

    console.error('Error confirming upload:', error);
    return NextResponse.json({ error: 'Failed to confirm upload' }, { status: 500 });
  }
}

