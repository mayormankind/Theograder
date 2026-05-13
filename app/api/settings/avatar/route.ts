import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, updateSession } from '@/lib/session';
import { uploadFileToSupabase, getPublicUrl } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG and WebP are allowed.' }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Max 2MB allowed.' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `avatar-${session.userId}-${uuidv4()}.${fileExtension}`;
    const storagePath = `avatars/${fileName}`;

    // Upload to Supabase Storage (using 'uploads' bucket as it's known to exist)
    await uploadFileToSupabase(file, 'uploads', storagePath);

    // Get public URL
    const publicUrl = getPublicUrl('uploads', storagePath);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: publicUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      }
    });

    // Update session
    const response = NextResponse.json({ 
      message: 'Avatar updated successfully',
      avatarUrl: publicUrl,
      user: updatedUser
    });

    await updateSession(request, response, {
      avatar: publicUrl
    });

    return response;

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
