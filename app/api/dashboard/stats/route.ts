import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

// GET /api/dashboard/stats - Get dashboard statistics for authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // All DB queries in a single parallel batch
    const [
      totalExams,
      totalScriptsGraded,
      pendingReview,
      avgConfidence,
      recentActivity,
      gradingTrends,
      examsByStatus,
      scoreDistribution,
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

      // Grading trends (last 30 days, grouped by calendar day)
      prisma.$queryRaw<Array<{ date: Date; count: number; avg_confidence: number | null }>>(Prisma.sql`
        SELECT
          DATE("gradedAt")   AS date,
          COUNT(id)::int     AS count,
          AVG(confidence)    AS avg_confidence
        FROM results
        WHERE "gradedById" = ${session.userId}
          AND "gradedAt" >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE("gradedAt")
        ORDER BY date ASC
      `),

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

      // Score distribution — joins exams so we avoid a second round-trip
      prisma.$queryRaw<Array<{ examId: string; examTitle: string; totalMarks: number; avgScore: number | null }>>(Prisma.sql`
        SELECT
          r."examId",
          e.title          AS "examTitle",
          e."totalMarks",
          AVG(r."totalScore") AS "avgScore"
        FROM results r
        JOIN exams e ON e.id = r."examId"
        WHERE r."gradedById" = ${session.userId}
        GROUP BY r."examId", e.title, e."totalMarks"
      `),
    ]);

    // Format grading trends for chart display
    const trends = gradingTrends.map(row => ({
      date: row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date),
      count: Number(row.count),
      avgConfidence: row.avg_confidence ?? 0,
    }));


    // Format exams by status
    const examStatusCounts = examsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Format score distribution into standard buckets
    const bucketCounts = {
      '0–40': 0,
      '41–50': 0,
      '51–60': 0,
      '61–70': 0,
      '71–100': 0,
    };
    
    scoreDistribution.forEach(stat => {
      if (stat.totalMarks > 0) {
        const percentage = ((stat.avgScore || 0) / stat.totalMarks) * 100;
        if (percentage <= 40) bucketCounts['0–40']++;
        else if (percentage <= 50) bucketCounts['41–50']++;
        else if (percentage <= 60) bucketCounts['51–60']++;
        else if (percentage <= 70) bucketCounts['61–70']++;
        else bucketCounts['71–100']++;
      }
    });

    const scoreStats = [
      { examTitle: '0–40', percentage: bucketCounts['0–40'] },
      { examTitle: '41–50', percentage: bucketCounts['41–50'] },
      { examTitle: '51–60', percentage: bucketCounts['51–60'] },
      { examTitle: '61–70', percentage: bucketCounts['61–70'] },
      { examTitle: '71–100', percentage: bucketCounts['71–100'] },
    ];

    // Build the last 7 days
    const last7Days: { date: string; count: number; avgConfidence: number; uploaded: number; processed: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Mon"
      last7Days.push({
        date: dateStr,
        count: 0,
        avgConfidence: 0,
        uploaded: 0,
        processed: 0,
      });
    }

    // Map trending data into the 7 days
    trends.forEach(trend => {
      const d = new Date(trend.date);
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayData = last7Days.find(d => d.date === dateStr);
      if (dayData) {
        dayData.count += trend.count;
        dayData.processed += trend.count;
        // Basic moving average for confidence
        dayData.avgConfidence = dayData.avgConfidence === 0 
          ? trend.avgConfidence 
          : (dayData.avgConfidence + trend.avgConfidence) / 2;
      }
    });

    return NextResponse.json({
      overview: {
        totalExams,
        totalScriptsGraded,
        pendingReview,
        avgConfidence: avgConfidence._avg.confidence || 0,
      },
      recentActivity,
      gradingTrends: last7Days,
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
