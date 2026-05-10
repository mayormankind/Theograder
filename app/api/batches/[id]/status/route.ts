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

    // Poll AI service for actual batch status
    try {
      if (!batch.jobId) {
        // No job_id - fall back to counting database items
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

        return NextResponse.json({
          batchId: batch.id,
          status: batch.status,
          totalFiles: batch.totalFiles,
          processedFiles: processedCount,
          failedFiles: failedCount,
          startedAt: batch.startedAt,
          completedAt: batch.completedAt,
          progress,
        });
      }

      // Poll AI service for job status
      const response = await fetch(`${aiServiceUrl}/batch-status/${batch.jobId}`);

      if (!response.ok) {
        throw new Error(`AI service error: ${response.statusText}`);
      }

      const jobStatus = await response.json();

      // Update batch status based on AI service response
      let newStatus: string = batch.status;
      if (jobStatus.status === 'completed') {
        newStatus = 'COMPLETED';
      } else if (jobStatus.status === 'processing') {
        newStatus = 'PROCESSING';
      }

      // Update batch with AI service status
      const updatedBatch = await prisma.batch.update({
        where: { id: id },
        data: {
          status: newStatus as any,
          processedFiles: jobStatus.results?.length || 0,
          completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        },
      });

      // If results are available, update batch items and create results
      if (jobStatus.results && Array.isArray(jobStatus.results)) {
        for (let i = 0; i < jobStatus.results.length; i++) {
          const result = jobStatus.results[i];
          const batchItem = batch.items[i];

          if (batchItem && result) {
            // Update batch item status
            await prisma.batchItem.update({
              where: { id: batchItem.id },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
              },
            });

            // Create result record if script exists
            if (batchItem.scriptId) {
              // Calculate total score
              const totalScore = result.questions?.reduce((sum: number, q: any) => sum + (q.score || 0), 0) || 0;

              await prisma.result.create({
                data: {
                  scriptId: batchItem.scriptId,
                  examId: batch.examId,
                  gradedById: session.userId!,
                  totalScore,
                  maxScore: 60, // Default max score
                  confidence: 1.0, // Default confidence for batch grading
                  feedback: `Graded via batch processing`,
                },
              });
            }
          }
        }
      }

      const progress = batch.totalFiles > 0 ? (updatedBatch.processedFiles / batch.totalFiles) * 100 : 0;

      return NextResponse.json({
        batchId: batch.id,
        status: updatedBatch.status,
        totalFiles: batch.totalFiles,
        processedFiles: updatedBatch.processedFiles,
        failedFiles: updatedBatch.failedFiles,
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
