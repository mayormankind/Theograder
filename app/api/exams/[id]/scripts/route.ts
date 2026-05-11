import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/exams/[id]/scripts - Get all scripts for an exam
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;
    
    const { id } = await params;

    // Verify exam belongs to user
    const exam = await prisma.exam.findFirst({
      where: {
        id: id,
        createdById: session.userId,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
    }

    const scripts = await prisma.script.findMany({
      where: {
        examId: id,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          orderBy: { gradedAt: 'desc' },
          take: 1,
          select: {
            totalScore: true,
            maxScore: true,
            confidence: true,
            status: true,
          },
        },
      },
    });

    // Map to frontend format
    const formattedScripts = scripts.map(s => {
      const result = s.results[0];
      
      // Determine frontend status
      let frontendStatus: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED' = 'UPLOADED';
      if (s.status === 'PROCESSING') {
        frontendStatus = 'PROCESSING';
      } else if (s.status === 'PROCESSED') {
        frontendStatus = 'PROCESSED';
      } else if (s.status === 'FAILED') {
        frontendStatus = 'FAILED';
      } else {
        frontendStatus = 'UPLOADED';
      }

      // Compute score
      const score = result?.totalScore ?? null;
      const totalMarks = result?.maxScore ?? exam.totalMarks;

      return {
        id: s.id,
        studentName: s.studentName || 'Unknown Student',
        studentId: s.studentId || 'Not extracted',
        fileName: s.originalName,
        fileUrl: s.filePath,
        status: frontendStatus,
        score: score,
        totalMarks: totalMarks,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ scripts: formattedScripts });
  } catch (error) {
    console.error('Error fetching scripts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scripts' },
      { status: 500 }
    );
  }
}
