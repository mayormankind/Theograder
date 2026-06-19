import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

const presignSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  files: z.array(
    z.object({
      name: z.string().min(1),
      size: z.number().positive(),
      type: z.string().min(1),
    })
  ).min(1, 'At least one file is required'),
});

const MAX_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// POST /api/upload/presign - Generate signed upload URLs for direct-to-Supabase upload
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { examId, files } = presignSchema.parse(body);

    // Verify exam exists and belongs to user
    const exam = await prisma.exam.findFirst({
      where: { id: examId, createdById: session.userId },
    });
    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const presignedFiles = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 20MB` },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `File ${file.name} is not a supported format` },
          { status: 400 }
        );
      }

      const fileId = uuidv4();
      const fileName = `${fileId}${ext}`;
      const storagePath = `${session.userId}/${examId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('uploads')
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
        console.error('Supabase presign error:', error);
        return NextResponse.json(
          { error: `Failed to create upload URL for ${file.name}` },
          { status: 500 }
        );
      }

      presignedFiles.push({
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        signedUrl: data.signedUrl,
        token: data.token,
      });
    }

    return NextResponse.json({ presignedFiles });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URLs' },
      { status: 500 }
    );
  }
}
