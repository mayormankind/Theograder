import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const examId = formData.get('examId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'uploads', session.user.id);
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

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

      uploadedFiles.push({
        id: fileId,
        name: fileName,
        originalName: file.name,
        size: file.size,
        type: fileExtension.replace('.', ''),
        mimeType: file.type,
        status: 'uploaded',
        progress: 100,
        examId,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // In a real implementation, you would save these to a database
    // For now, we'll just return the file info
    return NextResponse.json(uploadedFiles, { status: 201 });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    // In a real implementation, you would fetch from database
    // For now, return mock data
    const mockFiles = [
      {
        id: 'f1',
        name: 'STU2021_0044_Okonkwo.pdf',
        originalName: 'STU2021_0044_Okonkwo.pdf',
        size: 2.3 * 1024 * 1024,
        type: 'pdf',
        mimeType: 'application/pdf',
        status: 'done',
        progress: 100,
        examId,
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return NextResponse.json(mockFiles);
  } catch (error) {
    console.error('Error fetching uploaded files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploaded files' },
      { status: 500 }
    );
  }
}
