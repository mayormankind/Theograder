import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/batches/[id]/status - Poll batch status from AI service
export async function GET(
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
      include: {
        items: {
          include: {
            script: true,
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

    // If batch is already completed or failed, return current status
    if (batch.status === 'COMPLETED' || batch.status === 'FAILED' || batch.status === 'CANCELLED') {
      return NextResponse.json({
        batchId: batch.id,
        status: batch.status,
        totalFiles: batch.totalFiles,
        processedFiles: batch.processedFiles,
        failedFiles: batch.failedFiles,
        startedAt: batch.startedAt,
        completedAt: batch.completedAt,
        progress: batch.totalFiles > 0 ? (batch.processedFiles / batch.totalFiles) * 100 : 0,
      });
    }

    // Get AI service URL
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // For now, we'll simulate polling since we don't have job_id stored
    // In a real implementation, you'd store the job_id and poll the AI service
    try {
      // Simulate checking AI service status
      // This would normally be: GET ${aiServiceUrl}/batch-status/{job_id}
      
      // For demo purposes, let's update progress based on current items
      const processedCount = await prisma.batchItem.count({
        where: {
          batchId: id,
          status: 'COMPLETED',
        },
      });

      const failedCount = await prisma.batchItem.count({
        where: {
          batchId: id,
          status: 'FAILED',
        },
      });

      const progress = (processedCount + failedCount) / batch.totalFiles * 100;

      // Update batch with current progress
      const updatedBatch = await prisma.batch.update({
        where: { id: id },
        data: {
          processedFiles: processedCount,
          failedFiles: failedCount,
          status: processedCount + failedCount === batch.totalFiles ? 'COMPLETED' : 'PROCESSING',
          completedAt: processedCount + failedCount === batch.totalFiles ? new Date() : undefined,
        },
      });

      return NextResponse.json({
        batchId: batch.id,
        status: updatedBatch.status,
        totalFiles: batch.totalFiles,
        processedFiles: processedCount,
        failedFiles: failedCount,
        startedAt: batch.startedAt,
        completedAt: updatedBatch.completedAt,
        progress,
      });

    } catch (aiError) {
      console.error('AI service polling error:', aiError);
      
      // Mark batch as failed if we can't reach AI service
      await prisma.batch.update({
        where: { id: id },
        data: {
          status: 'FAILED',
        },
      });

      return NextResponse.json(
        { 
          error: 'Failed to check batch status',
          batchId: batch.id,
          status: 'FAILED',
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('Error checking batch status:', error);
    return NextResponse.json(
      { error: 'Failed to check batch status' },
      { status: 500 }
    );
  }
}
