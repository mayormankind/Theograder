// app/api/scripts/[scriptId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/scripts/[scriptId] - Get a single script
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { scriptId } = await params;

    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          select: {
            title: true,
            totalMarks: true,
          },
        },
        results: {
          orderBy: { gradedAt: 'desc' },
          take: 1,
          include: {
            questions: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error('Error fetching script:', error);
    return NextResponse.json(
      { error: 'Failed to fetch script' },
      { status: 500 }
    );
  }
}

// PATCH /api/scripts/[scriptId] - Update editable script fields (e.g. matric number)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { scriptId } = await params;

    const body = await request.json().catch(() => ({}));
    const rawStudentId = body?.studentId;

    if (typeof rawStudentId !== 'string' || rawStudentId.trim().length === 0) {
      return NextResponse.json(
        { error: 'A valid matric number is required' },
        { status: 400 }
      );
    }

    const studentId = rawStudentId.trim();

    // Ensure the script exists and belongs to one of the lecturer's exams
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      select: { id: true },
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.script.update({
      where: { id: scriptId },
      data: { studentId },
      select: { id: true, studentId: true },
    });

    // Best-effort audit log; never block the response on it
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE',
        resource: 'SCRIPT',
        resourceId: scriptId,
        metadata: { field: 'studentId', value: studentId },
      },
    }).catch((err) => console.error('Failed to log matric update:', err));

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating script:', error);
    return NextResponse.json(
      { error: 'Failed to update script' },
      { status: 500 }
    );
  }
}

