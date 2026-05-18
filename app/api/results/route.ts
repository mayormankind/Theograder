// src/app/api/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

// GET /api/results - List results with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const examId = searchParams.get("examId");
    const status = searchParams.get("status") as any;
    const scoreMin = searchParams.get("scoreMin");
    const scoreMax = searchParams.get("scoreMax");
    const studentId = searchParams.get("studentId");
    const scriptId = searchParams.get("scriptId");
    const exportFormat = searchParams.get("export"); // 'csv' or 'pdf'

    const skip = (page - 1) * limit;

    // Special case: Fetch specific result by scriptId for ResultsPage
    if (scriptId) {
      const result = await prisma.result.findFirst({
        where: { scriptId, gradedById: session.userId },
        include: {
          questions: {
            include: {
              rubricQuestion: {
                include: {
                  points: true,
                },
              },
            },
            orderBy: {
              questionId: "asc",
            },
          },
        },
      });

      if (!result) {
        return NextResponse.json({ results: [] });
      }

      // Map to GradingResult shape expected by frontend
      const mappedResults = result.questions.map((q) => {
        const breakdown = (q.breakdown as any) || {};
        const similarities = (breakdown.similarities as number[]) || [];

        const avgSimilarity =
          similarities.length > 0
            ? similarities.reduce((sum: number, s: number) => sum + s, 0) /
              similarities.length
            : 0;

        return {
          questionId: q.id,
          questionNumber: q.questionId,
          partLabel: q.questionId,
          studentAnswer: q.answer || "",
          expectedAnswer:
            q.rubricQuestion?.points?.map((p) => p.point).join("; ") ?? "",
          score: q.score,
          maxScore: q.maxScore,
          similarityScore: Math.round(avgSimilarity * 100),
          confidence: Math.round(q.confidence * 100),
          matchedConcepts: breakdown.matchedConcepts || [],
          partialConcepts: breakdown.partialConcepts || [],
          missingConcepts: breakdown.missingConcepts || [],
        };
      });

      return NextResponse.json({
        resultId: result.id,
        results: mappedResults,
      });
    }

    // Build where clause
    const where: any = {
      gradedById: session.userId,
    };

    if (examId) {
      where.examId = examId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (scoreMin || scoreMax) {
      where.totalScore = {};
      if (scoreMin) where.totalScore.gte = parseFloat(scoreMin);
      if (scoreMax) where.totalScore.lte = parseFloat(scoreMax);
    }

    if (studentId) {
      where.script = {
        studentId: { contains: studentId, mode: "insensitive" },
      };
    }

    // If export format is requested, return all results without pagination
    if (exportFormat === "csv" || exportFormat === "pdf" || exportFormat === "json") {
      if (exportFormat === "json") {
        const results = await prisma.result.findMany({
          where,
          include: {
            script: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                studentId: true,
                studentName: true,
                extractedText: true,
                filePath: true,
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
            questions: {
              include: {
                rubricQuestion: {
                  include: {
                    points: true,
                  },
                },
              },
              orderBy: {
                questionId: "asc",
              },
            },
          },
          orderBy: [{ exam: { title: "asc" } }, { script: { studentId: "asc" } }],
        });

        // Map the breakdown JSON for easier consumption in the frontend
        const mappedResults = results.map((result) => {
          const mappedQuestions = result.questions.map((q) => {
            const breakdown = (q.breakdown as any) || {};
            const similarities = (breakdown.similarities as number[]) || [];
            const avgSimilarity =
              similarities.length > 0
                ? similarities.reduce((sum: number, s: number) => sum + s, 0) /
                  similarities.length
                : 0;

            return {
              ...q,
              matchedConcepts: breakdown.matchedConcepts || [],
              partialConcepts: breakdown.partialConcepts || [],
              missingConcepts: breakdown.missingConcepts || [],
              similarityScore: Math.round(avgSimilarity * 100),
            };
          });

          return {
            ...result,
            questions: mappedQuestions,
          };
        });

        return NextResponse.json({ results: mappedResults });
      }

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
              questionId: "asc",
            },
          },
        },
        orderBy: [{ exam: { title: "asc" } }, { script: { studentId: "asc" } }],
      });

      if (exportFormat === "csv") {
        return generateCSVExport(results);
      } else if (exportFormat === "pdf") {
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
        orderBy: { gradedAt: "desc" },
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
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 },
    );
  }
}

// Helper function to generate CSV export
function generateCSVExport(results: any[]) {
  const headers = [
    "Student ID",
    "Student Name",
    "Exam Title",
    "Course Code",
    "Total Score",
    "Max Score",
    "Percentage",
    "Confidence",
    "Status",
    "Graded Date",
  ];

  const csvRows = [
    headers.join(","),
    ...results.map((result) =>
      [
        `"${result.script.studentId || ""}"`,
        `"${result.script.studentName || ""}"`,
        `"${result.exam.title}"`,
        `"${result.exam.courseCode || ""}"`,
        result.totalScore,
        result.maxScore,
        `${((result.totalScore / result.maxScore) * 100).toFixed(2)}%`,
        result.confidence?.toFixed(3) || "",
        result.status,
        `"${result.gradedAt.toISOString()}"`,
      ].join(","),
    ),
  ];

  const csvContent = csvRows.join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="results-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

// Helper function to generate PDF export
function generatePDFExport(results: any[]) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(15, 31, 61); // #0f1f3d
  doc.text("TheoGrader - Results Export", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

  const tableData = results.map((result) => [
    result.script.studentId || "N/A",
    result.script.studentName || "Unknown",
    result.exam.title,
    `${result.totalScore}/${result.maxScore}`,
    `${((result.totalScore / result.maxScore) * 100).toFixed(2)}%`,
    result.confidence?.toFixed(2) || "N/A",
    result.status,
  ]);

  (doc as any).autoTable({
    startY: 36,
    head: [
      ["Student ID", "Name", "Exam", "Score", "%", "Confidence", "Status"],
    ],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [15, 31, 61] },
    styles: { fontSize: 9 },
  });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="results-export-${new Date().toISOString().split("T")[0]}.pdf"`,
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
        { error: "Result IDs are required" },
        { status: 400 },
      );
    }

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be APPROVED or REJECTED" },
        { status: 400 },
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
    console.error("Error updating results:", error);
    return NextResponse.json(
      { error: "Failed to update results" },
      { status: 500 },
    );
  }
}
