import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/batches/[id] - Get batch details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    const batch = await prisma.batch.findFirst({
      where: {
        id: id,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
        items: {
          include: {
            script: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                status: true,
                studentId: true,
                studentName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batch' },
      { status: 500 }
    );
  }
}

// DELETE /api/batches/[id] - Cancel a batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    // Check if batch exists and belongs to user
    const batch = await prisma.batch.findFirst({
      where: {
        id: id,
        exam: {
          createdById: session.userId,
        },
      },
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    if (batch.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed batch' },
        { status: 400 }
      );
    }

    // Update batch status to cancelled
    const cancelledBatch = await prisma.batch.update({
      where: { id: id },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      message: 'Batch cancelled successfully',
      batch: cancelledBatch,
    });
  } catch (error) {
    console.error('Error cancelling batch:', error);
    return NextResponse.json(
      { error: 'Failed to cancel batch' },
      { status: 500 }
    );
  }
}
