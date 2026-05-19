import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/lib/services/notification-service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { examId, total, successful, failed, flagged } = await request.json();

    const exam = await prisma.exam.findFirst({
      where: { id: examId },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    await notificationService.notify({
      userId: session.userId!,
      type: "GRADING_COMPLETE",
      title: 'Batch Grading Complete',
      message: `Batch grading for ${exam.title} finished. Processed: ${total}, Succeeded: ${successful}, Failed: ${failed}. Flagged scripts: ${flagged ? flagged.length : 0}.`,
      link: `/dashboard/results?examId=${exam.id}`,
      metadata: {
        examId: exam.id,
        examTitle: exam.title,
        total,
        successful,
        failed,
        flagged
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

