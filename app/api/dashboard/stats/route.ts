import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/dashboard/stats - Get dashboard statistics for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get all stats in parallel for better performance
    const [
      totalExams,
      totalScriptsGraded,
      pendingReview,
      avgConfidence,
      recentActivity,
      gradingTrends,
    ] = await Promise.all([
      // Total exams created by user
      prisma.exam.count({
        where: {
          createdById: session.userId,
        },
      }),

      // Total scripts graded by user
      prisma.result.count({
        where: {
          gradedById: session.userId,
        },
      }),

      // Pending review count
      prisma.result.count({
        where: {
          gradedById: session.userId,
          status: 'PENDING',
        },
      }),

      // Average confidence score
      prisma.result.aggregate({
        where: {
          gradedById: session.userId,
        },
        _avg: {
          confidence: true,
        },
      }),

      // Recent activity (last 5 activities)
      prisma.activityLog.findMany({
        where: {
          userId: session.userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          createdAt: true,
        },
      }),

      // Grading trends (last 30 days)
      prisma.result.groupBy({
        by: ['gradedAt'],
        where: {
          gradedById: session.userId,
          gradedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          confidence: true,
        },
      }),
    ]);

    // Format grading trends for chart display
    const trends = gradingTrends.map(trend => ({
      date: trend.gradedAt.toISOString().split('T')[0],
      count: trend._count.id,
      avgConfidence: trend._avg.confidence || 0,
    }));

    // Get additional stats
    const [examsByStatus, scoreDistribution] = await Promise.all([
      // Exams by status
      prisma.exam.groupBy({
        by: ['status'],
        where: {
          createdById: session.userId,
        },
        _count: {
          id: true,
        },
      }),

      // Score distribution
      prisma.result.groupBy({
        by: ['examId'],
        where: {
          gradedById: session.userId,
        },
        _avg: {
          totalScore: true,
        },
      }),
    ]);

    // Format exams by status
    const examStatusCounts = examsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get exam information for score distribution
    const examIds = scoreDistribution.map(stat => stat.examId);
    const exams = await prisma.exam.findMany({
      where: {
        id: { in: examIds },
        createdById: session.userId,
      },
      select: {
        id: true,
        title: true,
        totalMarks: true,
      },
    });

    // Create a map for quick lookup
    const examMap = exams.reduce((acc, exam) => {
      acc[exam.id] = exam;
      return acc;
    }, {} as Record<string, { title: string; totalMarks: number }>);

    // Format score distribution
    const scoreStats = scoreDistribution.map(stat => {
      const exam = examMap[stat.examId];
      return {
        examId: stat.examId,
        examTitle: exam?.title || 'Unknown',
        avgScore: stat._avg.totalScore || 0,
        maxScore: exam?.totalMarks || 0,
        percentage: exam?.totalMarks ? ((stat._avg.totalScore || 0) / exam.totalMarks) * 100 : 0,
      };
    });

    return NextResponse.json({
      overview: {
        totalExams,
        totalScriptsGraded,
        pendingReview,
        avgConfidence: avgConfidence._avg.confidence || 0,
      },
      recentActivity,
      gradingTrends: trends,
      examStatusCounts,
      scoreDistribution: scoreStats,
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
