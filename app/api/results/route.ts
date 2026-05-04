import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/results - List results with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const examId = searchParams.get('examId');
    const status = searchParams.get('status') as any;
    const scoreMin = searchParams.get('scoreMin');
    const scoreMax = searchParams.get('scoreMax');
    const studentId = searchParams.get('studentId');
    const exportFormat = searchParams.get('export'); // 'csv' or 'pdf'

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      gradedById: session.userId,
    };

    if (examId) {
      where.examId = examId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (scoreMin || scoreMax) {
      where.totalScore = {};
      if (scoreMin) where.totalScore.gte = parseFloat(scoreMin);
      if (scoreMax) where.totalScore.lte = parseFloat(scoreMax);
    }

    if (studentId) {
      where.script = {
        studentId: { contains: studentId, mode: 'insensitive' }
      };
    }

    // If export format is requested, return all results without pagination
    if (exportFormat === 'csv' || exportFormat === 'pdf') {
      const results = await prisma.result.findMany({
        where,
        include: {
          script: {
            select: {
              studentId: true,
              studentName: true,
              originalName: true,
            },
          },
          exam: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              courseName: true,
              totalMarks: true,
            },
          },
          questions: {
            select: {
              questionId: true,
              question: true,
              score: true,
              maxScore: true,
              confidence: true,
            },
            orderBy: {
              questionId: 'asc',
            },
          },
        },
        orderBy: [
          { exam: { title: 'asc' } },
          { script: { studentId: 'asc' } },
        ],
      });

      if (exportFormat === 'csv') {
        return generateCSVExport(results);
      } else if (exportFormat === 'pdf') {
        return generatePDFExport(results);
      }
    }

    // Normal paginated response
    const [results, total] = await Promise.all([
      prisma.result.findMany({
        where,
        skip,
        take: limit,
        include: {
          script: {
            select: {
              id: true,
              studentId: true,
              studentName: true,
              originalName: true,
              status: true,
            },
          },
          exam: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              courseName: true,
              totalMarks: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
        orderBy: { gradedAt: 'desc' },
      }),
      prisma.result.count({ where }),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

// Helper function to generate CSV export
function generateCSVExport(results: any[]) {
  const headers = [
    'Student ID',
    'Student Name',
    'Exam Title',
    'Course Code',
    'Total Score',
    'Max Score',
    'Percentage',
    'Confidence',
    'Status',
    'Graded Date',
  ];

  const csvRows = [
    headers.join(','),
    ...results.map(result => [
      `"${result.script.studentId || ''}"`,
      `"${result.script.studentName || ''}"`,
      `"${result.exam.title}"`,
      `"${result.exam.courseCode || ''}"`,
      result.totalScore,
      result.maxScore,
      `${((result.totalScore / result.maxScore) * 100).toFixed(2)}%`,
      result.confidence?.toFixed(3) || '',
      result.status,
      `"${result.gradedAt.toISOString()}"`,
    ].join(',')),
  ];

  const csvContent = csvRows.join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="results-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

// Helper function to generate PDF export (simplified version)
function generatePDFExport(results: any[]) {
  // For now, return a simple text-based PDF
  // In a real implementation, you'd use a library like jsPDF or puppeteer
  let pdfContent = 'TheoGrader - Results Export\n';
  pdfContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  pdfContent += '='.repeat(80) + '\n\n';

  results.forEach(result => {
    pdfContent += `Student: ${result.script.studentName || 'Unknown'} (${result.script.studentId || 'N/A'})\n`;
    pdfContent += `Exam: ${result.exam.title}\n`;
    pdfContent += `Course: ${result.exam.courseCode || 'N/A'}\n`;
    pdfContent += `Score: ${result.totalScore}/${result.maxScore} (${((result.totalScore / result.maxScore) * 100).toFixed(2)}%)\n`;
    pdfContent += `Confidence: ${result.confidence?.toFixed(3) || 'N/A'}\n`;
    pdfContent += `Status: ${result.status}\n`;
    pdfContent += `Graded: ${result.gradedAt.toLocaleString()}\n`;
    pdfContent += '-'.repeat(40) + '\n\n';
  });

  return new NextResponse(pdfContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="results-export-${new Date().toISOString().split('T')[0]}.txt"`,
    },
  });
}

// PUT /api/results - Bulk approve results
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { resultIds, status } = await request.json();

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return NextResponse.json(
        { error: 'Result IDs are required' },
        { status: 400 }
      );
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Update results in bulk
    const updatedResults = await prisma.result.updateMany({
      where: {
        id: { in: resultIds },
        gradedById: session.userId,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      message: `Successfully ${status.toLowerCase()} ${updatedResults.count} results`,
      updatedCount: updatedResults.count,
    });

  } catch (error) {
    console.error('Error updating results:', error);
    return NextResponse.json(
      { error: 'Failed to update results' },
      { status: 500 }
    );
  }
}
