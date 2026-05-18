import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to determine letter grade and color from percentage
const getGradeDetails = (pct: number) => {
  if (pct >= 70) return { grade: "A", color: [13, 148, 136] }; // teal-600
  if (pct >= 60) return { grade: "B", color: [37, 99, 235] };  // blue-600
  if (pct >= 50) return { grade: "C", color: [217, 119, 6] };  // amber-600
  if (pct >= 45) return { grade: "D", color: [234, 88, 12] };  // orange-600
  return { grade: "F", color: [220, 38, 38] };                 // red-600
};

export const generateIndividualReportPDF = (gradingResult: any) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Calculate Scores and Details
  const totalScore = gradingResult.totalScore || 0;
  const totalMax = gradingResult.maxScore || 100;
  const pct = Math.round((totalScore / totalMax) * 100);
  const avgConf = Math.round((gradingResult.overallConfidence || gradingResult.confidence || 0.8) * 100);
  const { grade, color: gradeColor } = getGradeDetails(pct);

  const studentName = gradingResult.script?.studentName || gradingResult.studentName || "N/A";
  const studentId = gradingResult.script?.studentId || gradingResult.studentId || "N/A";
  const examTitle = gradingResult.exam?.title || gradingResult.examTitle || "Examination";
  const courseCode = gradingResult.exam?.courseCode || gradingResult.courseCode || "N/A";
  const courseName = gradingResult.exam?.courseName || "N/A";
  
  const gradedDate = gradingResult.gradedAt
    ? new Date(gradingResult.gradedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  // Draw Header Banner
  doc.setFillColor(15, 31, 61); // Deep Navy (#0f1f3d)
  doc.rect(0, 0, pageWidth, 42, "F");

  // Title Text inside Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("THEOGRADER — INDIVIDUAL GRADING REPORT", margin, 12);

  doc.setFontSize(18);
  doc.text(examTitle, margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text(`${courseCode} · ${courseName}`, margin, 29);

  // Grade badge inside banner on the right
  const badgeWidth = 24;
  const badgeHeight = 24;
  const badgeX = pageWidth - margin - badgeWidth;
  const badgeY = 9;

  // Grade Box border & fill
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, "F");
  
  // Grade Letter
  doc.setTextColor(gradeColor[0], gradeColor[1], gradeColor[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(grade, badgeX + badgeWidth / 2, badgeY + 12, { align: "center" });

  // Grade Percentage
  doc.setFontSize(9);
  doc.text(`${pct}%`, badgeX + badgeWidth / 2, badgeY + 19, { align: "center" });

  let currentY = 48;

  // 2. Student & Evaluation Info Section
  doc.setFillColor(248, 250, 252); // Very light gray background
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, "F");
  
  // Small light gray inner border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 28, 2, 2, "D");

  doc.setTextColor(148, 163, 184); // Slate text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  // Row 1 Labels
  doc.text("STUDENT NAME", margin + 6, currentY + 7);
  doc.text("STUDENT ID (MATRIC NUMBER)", margin + (pageWidth - margin * 2) / 2 + 6, currentY + 7);

  // Row 2 Labels
  doc.text("DATE GRADED", margin + 6, currentY + 20);
  doc.text("EVALUATION SYSTEM", margin + (pageWidth - margin * 2) / 2 + 6, currentY + 20);

  doc.setTextColor(30, 41, 59); // Slate-800 text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  // Row 1 Values
  doc.text(studentName, margin + 6, currentY + 12);
  doc.text(studentId, margin + (pageWidth - margin * 2) / 2 + 6, currentY + 12);

  // Row 2 Values
  doc.text(gradedDate, margin + 6, currentY + 25);
  doc.text("TheoGrader AI (Sentence-BERT)", margin + (pageWidth - margin * 2) / 2 + 6, currentY + 25);

  currentY += 34;

  // 3. Score Summary Blocks
  const blockWidth = (pageWidth - margin * 2 - 8) / 3;
  
  // Block 1: Total Score
  doc.setFillColor(240, 253, 250); // Teal-50
  doc.roundedRect(margin, currentY, blockWidth, 18, 2, 2, "F");
  doc.setDrawColor(204, 251, 241); // Teal-100
  doc.roundedRect(margin, currentY, blockWidth, 18, 2, 2, "D");
  doc.setTextColor(13, 148, 136); // Teal-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("TOTAL SCORE", margin + 5, currentY + 5);
  doc.setFontSize(12);
  doc.text(`${totalScore} / ${totalMax}`, margin + 5, currentY + 13);

  // Block 2: Percentage
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.roundedRect(margin + blockWidth + 4, currentY, blockWidth, 18, 2, 2, "F");
  doc.setDrawColor(219, 234, 254); // Blue-100
  doc.roundedRect(margin + blockWidth + 4, currentY, blockWidth, 18, 2, 2, "D");
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PERCENTAGE", margin + blockWidth + 9, currentY + 5);
  doc.setFontSize(12);
  doc.text(`${pct}%`, margin + blockWidth + 9, currentY + 13);

  // Block 3: Avg Confidence
  doc.setFillColor(243, 244, 246); // Slate-100/50
  doc.roundedRect(margin + blockWidth * 2 + 8, currentY, blockWidth, 18, 2, 2, "F");
  doc.setDrawColor(229, 231, 235); // Slate-200
  doc.roundedRect(margin + blockWidth * 2 + 8, currentY, blockWidth, 18, 2, 2, "D");
  doc.setTextColor(75, 85, 99); // Slate-600
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("AVG. CONFIDENCE", margin + blockWidth * 2 + 13, currentY + 5);
  doc.setFontSize(12);
  doc.text(`${avgConf}%`, margin + blockWidth * 2 + 13, currentY + 13);

  currentY += 24;

  // 4. Per-Question Breakdown Table
  doc.setTextColor(15, 31, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Per-Question Breakdown", margin, currentY);
  
  currentY += 4;

  const tableColumns = ["Part", "Score", "Similarity Score", "Confidence", "Status"];
  const tableRows = (gradingResult.questions || []).map((q: any, i: number) => {
    const qPct = Math.round((q.score / (q.maxScore || 1)) * 100);
    const hasMissing = q.missingConcepts && q.missingConcepts.length > 0;
    
    // Status text
    let statusText = "Complete";
    if (hasMissing) {
      statusText = `${q.missingConcepts.length} missing concept(s)`;
    }

    return [
      q.questionId || q.questionNumber || `Q${i + 1}`,
      `${q.score} / ${q.maxScore}`,
      q.similarityScore !== undefined ? `${q.similarityScore}%` : "—",
      q.confidence !== undefined ? `${q.confidence}%` : "—",
      statusText
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [tableColumns],
    body: tableRows,
    theme: "grid",
    headStyles: { fillColor: [15, 31, 61], textColor: 255 },
    styles: { fontSize: 8.5, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  // Get bottom position after table
  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. Question Detailed Breakdown Section
  // Check if we need to add a page first
  if (currentY > pageHeight - 30) {
    doc.addPage();
    currentY = margin + 10;
  }

  doc.setTextColor(15, 31, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Detailed Question Evaluation", margin, currentY);
  
  // Draw thick slate accent line under the header
  doc.setDrawColor(15, 31, 61);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY + 2, margin + 45, currentY + 2);

  currentY += 9;

  (gradingResult.questions || []).forEach((q: any, i: number) => {
    const qLabel = q.questionId || q.questionNumber || `Q${i + 1}`;
    
    // Height estimation of this block to handle page break
    // Answer text height estimate + concepts height estimate
    let blockHeight = 15; // padding/titles
    const answerText = q.answer || q.studentAnswer || "No answer provided";
    const answerLines = doc.splitTextToSize(answerText, pageWidth - margin * 2 - 6);
    blockHeight += answerLines.length * 4.5;
    
    const matched = q.matchedConcepts || [];
    const partial = q.partialConcepts || [];
    const missing = q.missingConcepts || [];
    
    if (matched.length > 0) blockHeight += 6;
    if (partial.length > 0) blockHeight += 6;
    if (missing.length > 0) blockHeight += 6;

    if (currentY + blockHeight > pageHeight - margin - 10) {
      doc.addPage();
      currentY = margin + 10;
    }

    // Question Box background
    doc.setFillColor(252, 253, 254);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, blockHeight, 1.5, 1.5, "F");
    doc.setDrawColor(235, 240, 245);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, blockHeight, 1.5, 1.5, "D");

    // Left vertical accent stripe
    doc.setFillColor(15, 31, 61);
    doc.rect(margin, currentY, 2, blockHeight, "F");

    // Title / Score Header
    doc.setTextColor(15, 31, 61);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`Part: ${qLabel}`, margin + 5, currentY + 6);

    const scorePct = Math.round((q.score / (q.maxScore || 1)) * 100);
    const scoreColor = getGradeDetails(scorePct).color;
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`Score: ${q.score}/${q.maxScore} (${scorePct}%)`, pageWidth - margin - 5, currentY + 6, { align: "right" });

    let localY = currentY + 11;

    // Student Answer Subtitle & Text
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("STUDENT ANSWER", margin + 5, localY);
    
    localY += 4.5;
    
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    
    doc.text(answerLines, margin + 5, localY);
    localY += answerLines.length * 4.5;

    // Concept tags
    const renderConceptRow = (label: string, items: string[], tagBg: number[], tagText: number[], bullet: string) => {
      doc.setTextColor(tagText[0], tagText[1], tagText[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`${label}:`, margin + 5, localY + 3);

      let currentX = margin + 30;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      items.forEach((item, index) => {
        const itemText = `${bullet} ${item}${index < items.length - 1 ? ",  " : ""}`;
        const textWidth = doc.getTextWidth(itemText);
        
        if (currentX + textWidth > pageWidth - margin - 5) {
          localY += 4;
          currentX = margin + 30;
        }
        
        doc.text(itemText, currentX, localY + 3);
        currentX += textWidth;
      });

      localY += 5.5;
    };

    if (matched.length > 0) {
      renderConceptRow("MATCHED CONCEPTS", matched, [240, 253, 250], [13, 148, 136], "✓");
    }
    if (partial.length > 0) {
      renderConceptRow("PARTIAL CONCEPTS", partial, [254, 243, 199], [217, 119, 6], "~");
    }
    if (missing.length > 0) {
      renderConceptRow("MISSING CONCEPTS", missing, [254, 242, 242], [220, 38, 38], "✗");
    }

    currentY += blockHeight + 6;
  });

  // 6. Draw Footer Page Numbers
  const totalPagesCount = (doc as any).internal.getNumberOfPages();
  for (let pageNum = 1; pageNum <= totalPagesCount; pageNum++) {
    doc.setPage(pageNum);
    
    // Thin horizontal divider line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    // Left Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by TheoGrader — AI Academic Evaluation", margin, pageHeight - 10);
    
    // Right Footer
    doc.text(`Page ${pageNum} of ${totalPagesCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  // Save the PDF
  const matricName = studentId.replace(/[^a-zA-Z0-9_\-]/g, "");
  const finalFilename = `${matricName || "report"}.pdf`;
  doc.save(finalFilename);
};
