import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email-service';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { examId, total, successful, failed, flagged } = await request.json();

    // Get exam title and lecturer details
    const exam = await prisma.exam.findFirst({
      where: { id: examId },
      include: {
        createdBy: {
          select: { email: true, name: true }
        }
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' }, 
        { status: 404 }
      );
    }

    await emailService.sendGradingCompleteEmail(
      exam.createdBy.email,
      exam.createdBy.name,
      {
        examTitle: exam.title,
        examId: exam.id,
        total,
        successful,
        failed,
        flagged: flagged || []
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
