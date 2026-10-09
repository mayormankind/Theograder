// app/api/scripts/[scriptId]/process/route.ts
// OCR + segmentation + grading is long-running; override Vercel's 10s default.
// Requires Vercel Pro (max 300s). On Hobby the cap is 60s — adjust accordingly.
export const maxDuration = 300;

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { downloadFileFromSupabase } from "@/lib/supabase";
import { notificationService } from "@/lib/services/notification-service";
import { selectAnswers, GradedQuestion } from '@/lib/utils/answer-selector';
import { ParsedInstruction } from '@/lib/utils/instruction-parser';
import { normalizeQuestionLabel } from '@/lib/utils/question-label';
import { logActivity } from '@/lib/services/activity-log';

// ---------------------------------------------------------------------------
// Lenient matric normaliser (mirrors ai-service identity.py)
// ---------------------------------------------------------------------------
// Canonical form: LLL/DD/DDDD
// Handles: spaces inside components, missing slashes, I/1/S/5 confusion,
//          lowercase, dash-in-serial ("92-93" -> "9279").
// Falls back to raw OCR text when normalization is impossible, so the
// lecturer always has something editable instead of a blank field.
function normalizeMatric(raw: string): string | undefined {
  if (!raw) return undefined;

  const upper = raw.toUpperCase();

  // 1. Find the matric area near a label
  const labelMatch = upper.match(
    /(?:CANDIDATE['S?]*\s*NUMBER|MATRIC|ID|NO\.?)\s*[:\-]?\s*([^\n]+)/i,
  );
  let candidate = labelMatch ? labelMatch[1].trim() : upper.trim();

  // 2. Strip spaces around separators and remove all spaces
  const cleaned = candidate.replace(/\s*\/\s*/g, "/").replace(/\s+/g, "");

  // 3. Try slash-separated form first
  const slashParts = cleaned.split("/");
  let dept: string | undefined;
  let year: string | undefined;
  let serial: string | undefined;

  if (slashParts.length >= 3) {
    dept = slashParts[0].replace(/[^A-Z]/g, "").slice(0, 5);
    year = (slashParts[1] || "").replace(/\D/g, "").slice(-2);
    serial = (slashParts.slice(2).join("") || "").replace(/\D/g, "").slice(0, 5);
  } else {
    // 4. Concatenated form: try to split by pattern LLL + DD + DDDD
    const m = cleaned.match(/^([A-Z]{2,5})(\d{2})(\d{3,5})$/);
    if (m) {
      dept = m[1];
      year = m[2];
      serial = m[3];
    }
  }

  if (dept && year && serial) {
    return `${dept}/${year}/${serial}`;
  }

  // 5. Fallback: return the raw candidate text so the lecturer can edit it
  return candidate.trim() || undefined;
}

// POST /api/scripts/[scriptId]/process - Process a single script (OCR, segment, grade)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> },
) {
  const { scriptId } = await params;
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Fetch script and its exam's rubric
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          include: {
            rubrics: {
              include: {
                questions: {
                  include: {
                    points: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const rubric = script.exam.rubrics?.[0];

    if (!rubric || !rubric.questions || rubric.questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "No rubric questions found for this exam. Add questions to the rubric before grading.",
        },
        { status: 400 },
      );
    }

    // Fetch user preferences for auto-flagging and confidence threshold
    const userSettings = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { confidenceThreshold: true, autoFlag: true },
    });
    const threshold = userSettings?.confidenceThreshold ?? 70;
    const shouldAutoFlag = userSettings?.autoFlag ?? true;

    // Update status to PROCESSING
    await prisma.script.update({
      where: { id: scriptId },
      data: { status: "PROCESSING" },
    });

    // ── STAGE 1: DOWNLOAD & OCR ───────────────────────────
    let fileBuffer: Buffer;
    try {
      fileBuffer = await downloadFileFromSupabase("uploads", script.filePath);
    } catch (downloadError) {
      console.error("Failed to download file from Supabase:", downloadError);
      throw new Error("Failed to download script file from storage");
    }

    const fileBlob = new Blob([new Uint8Array(fileBuffer)], {
      type: script.mimeType,
    });

    // Reuse previously extracted text when available. OCR is non-deterministic
    // and expensive; re-running it on every re-grade was a key source of
    // score drift between attempts. We only re-OCR when there is no usable
    // text yet (or the previous extraction was flagged low quality).
    let extractedText: string = script.extractedText || "";
    const needsOcr =
      !extractedText.trim() ||
      script.confidenceFlag === "low_quality_fallback_used";

    let ocrData: { extraction_method?: string; confidence_flag?: string } = {
      extraction_method: script.extractionMethod || "hybrid",
      confidence_flag: script.confidenceFlag || "acceptable",
    };

    if (needsOcr) {
      const ocrFormData = new FormData();
      ocrFormData.append("file", fileBlob, script.originalName);

      const ocrResponse = await fetch(`${AI_SERVICE_URL}/ocr`, {
        method: "POST",
        body: ocrFormData,
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        throw new Error(`OCR failed: ${errorText}`);
      }

      const freshOcr = await ocrResponse.json();
      extractedText = freshOcr.extracted_text;

      if (!extractedText) {
        throw new Error("OCR returned no text");
      }

      ocrData = {
        extraction_method: freshOcr.extraction_method,
        confidence_flag: freshOcr.confidence_flag,
      };
    }

    // Fallback Identity Extraction from the OCR'd text.
    // Use the lenient parser to handle spaces, missing slashes, and
    // common OCR confusions (I/1, S/5, O/0).
    const fallbackMatric = normalizeMatric(extractedText);

    // Check if we already have a valid student ID from the upload phase
    const hasValidIdentity =
      script.studentId &&
      script.studentId !== "Not extracted" &&
      script.studentId !== "Unknown";

    const dataToUpdate: Prisma.ScriptUpdateInput = {
      extractedText: extractedText,
      extractionMethod: ocrData.extraction_method || "hybrid",
      confidenceFlag: ocrData.confidence_flag || "acceptable",
    };

    if (!hasValidIdentity) {
      if (fallbackMatric) dataToUpdate.studentId = fallbackMatric;
    }

    // Save extracted text and potentially fallback identity
    await prisma.script.update({
      where: { id: scriptId },
      data: dataToUpdate,
    });

    // ── STAGE 2: SEGMENTATION ─────────────────────────────
    // Send the rubric's canonical labels so the AI service performs
    // rubric-aware (and deterministic) segmentation instead of guessing.
    const expectedLabels = rubric.questions.map((q) =>
      normalizeQuestionLabel(q.questionId),
    );

    const segmentResponse = await fetch(`${AI_SERVICE_URL}/segment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw_text: extractedText,
        expected_labels: expectedLabels,
      }),
    });

    if (!segmentResponse.ok) {
      throw new Error(`Segmentation failed: ${segmentResponse.statusText}`);
    }

    const segments = (await segmentResponse.json()) as Record<string, string>;

    // ── STAGE 3: GRADING ──────────────────────────────────
    // Build rubric payload in the shape FastAPI /grade expects
    const rubricPayload: Record<string, unknown> = {};

    for (const question of rubric.questions) {
      const questionKey = question.questionId;
      rubricPayload[questionKey] = question.points.map((point) => ({
        point: point.point,
        weight: point.weight,
        maxScore: point.maxScore,
        // Pass question total marks on every point
        // so grading.py can access it regardless of
        // which point it reads from
        questionMaxScore: question.maxScore,
      }));
    }

    // Create form data for AI service
    const formData = new FormData();
    formData.append("file", fileBlob, script.originalName);
    formData.append("rubric_str", JSON.stringify(rubricPayload));
    formData.append("extracted_text", extractedText);

    const gradeResponse = await fetch(`${AI_SERVICE_URL}/grade`, {
      method: "POST",
      body: formData,
    });

    if (!gradeResponse.ok) {
      const errorText = await gradeResponse.text();
      // A 503 from the AI service means the embedding/OCR provider is
      // temporarily unavailable. Crucially, the grade transaction below is
      // never reached, so NO zero-score result is persisted — the script
      // stays retryable. Surface this as transient so the UI can say
      // "try again" rather than implying the script itself is bad.
      if (gradeResponse.status === 503) {
        const transientErr = new Error(
          "AI grading service is temporarily unavailable. The script was NOT graded — please retry in a moment.",
        );
        (transientErr as unknown as { transient: boolean }).transient = true;
        throw transientErr;
      }
      throw new Error(`Grading failed: ${errorText}`);
    }

    const gradeData = await gradeResponse.json();

    if (!gradeData.questions || gradeData.questions.length === 0) {
      await prisma.script.update({
        where: { id: scriptId },
        data: { status: "UPLOADED" },
      });
      return NextResponse.json(
        {
          error:
            "Grading produced no question results. This usually means the rubric is empty or the OCR text could not be matched to any rubric questions. The script was NOT graded and can be retried.",
          transient: false,
        },
        { status: 422 },
      );
    }

    // ── APPLY ANSWER SELECTION ──────────────────────
    const instruction = script.exam.parsedInstruction as 
      ParsedInstruction | null;
    const strategy = (script.exam.selectionStrategy || 
      'BEST_SCORE') as 'BEST_SCORE' | 'FIRST_N';

    // Build GradedQuestion array from gradeData
    const gradedQuestions: GradedQuestion[] =
      (gradeData.questions || []).map(
        (q: Record<string, unknown>, index: number) => {
          const rubricQ = rubric.questions.find(rq =>
            normalizeQuestionLabel(rq.questionId) === normalizeQuestionLabel(q.question as string)
          );
          return {
            id: q.question as string,        // temp id for selection
            questionId: q.question as string,
            score: (q.score as number) || 0,
            maxScore: rubricQ?.maxScore || 0,
            documentOrder: index
          };
        }
      );

    // Run selection
    const selectionResult = instruction
      ? selectAnswers(gradedQuestions, instruction, strategy)
      : {
          selected: gradedQuestions,
          excluded: [],
          totalScore: gradedQuestions.reduce(
            (s, q) => s + q.score, 0
          ),
          totalMaxScore: gradedQuestions.reduce(
            (s, q) => s + q.maxScore, 0
          ),
          selectionApplied: false,
          strategy: 'BEST_SCORE'
        };

    // Build a set of selected question IDs for lookup
    const selectedQuestionIds = new Set(
      selectionResult.selected.map(q => q.questionId)
    );

    // Build exclusion reason map
    const exclusionReasons = new Map<string, string>();
    selectionResult.excluded.forEach(q => {
      exclusionReasons.set(
        q.questionId,
        strategy === 'BEST_SCORE'
          ? `Not selected — lower score (${q.score}/${q.maxScore})` 
          : `Not selected — answered after required limit` 
      );
    });

    // ── SAVE RESULT WITH CORRECT TOTALS ─────────────
    // Use selectionResult totals, NOT raw gradeData totals
    const totalScore = selectionResult.totalScore;
    const avgConfidence = gradeData.questions?.length > 0
      ? gradeData.questions
          .filter((q: Record<string, unknown>) =>
            selectedQuestionIds.has(q.question as string)
          )
          .reduce(
            (sum: number, q: Record<string, unknown>) => sum + (q.confidence as number || 0),
            0
          ) / Math.max(selectionResult.selected.length, 1)
      : 0.5;
    const avgConfidencePct = Math.round(avgConfidence * 100);
    const isFlagged = shouldAutoFlag && avgConfidencePct < threshold;
    const resultStatus = isFlagged ? "PENDING" : "APPROVED";

    // ── SAVE GRADES TO DB ─────────────────────────────────
    await prisma.$transaction(async (tx) => {
      // Idempotency: a script has exactly ONE current result. Re-grading used
      // to append a new Result each time, leaving duplicates that the results
      // API (findFirst) could pick between arbitrarily — so the same script
      // appeared to score differently on refresh. Delete prior results first;
      // QuestionResult rows cascade on the Result delete.
      await tx.result.deleteMany({ where: { scriptId: script.id } });

      // Create main result
      const newResult = await tx.result.create({
        data: {
          scriptId: script.id,
          examId: script.examId,
          gradedById: session.userId!,
          totalScore: Math.round(totalScore * 10) / 10,
          maxScore: selectionResult.totalMaxScore || 
                    script.exam.totalMarks,
          confidence: avgConfidence,
          status: resultStatus,
        },
      });

      // Create question results
      if (gradeData.questions && Array.isArray(gradeData.questions)) {
        for (const question of gradeData.questions) {
          // Use the shared normaliser (mirrors the AI service) so rubric
          // matching is consistent across the whole pipeline.
          const target = normalizeQuestionLabel(question.question);

          const rubricQuestion = rubric.questions.find(
            (rq) => normalizeQuestionLabel(rq.questionId) === target,
          );

          if (rubricQuestion) {
            const isCounted = selectedQuestionIds.has(
              question.question
            );
            const excludedReason = exclusionReasons.get(
              question.question
            ) || null;

            // Find the student answer from segments
            const answerFromSegments =
              Object.entries(segments).find(
                ([k]) => normalizeQuestionLabel(k) === target,
              )?.[1] || "";

            await tx.questionResult.create({
              data: {
                resultId: newResult.id,
                questionId: question.question,
                question: question.question,
                answer: question.answer || (answerFromSegments as string) || "",
                score: question.score || 0,
                maxScore: rubricQuestion.maxScore,
                confidence: question.confidence || 0.5,
                breakdown: {
                  similarities: question.breakdown || [],
                  matchedConcepts: question.matched_concepts || [],
                  partialConcepts: question.partial_concepts || [],
                  missingConcepts: question.missing_concepts || [],
                },
                countedInTotal: isCounted,
                excludedReason: excludedReason,
                rubricQuestionId: rubricQuestion.id,
              },
            });
          }
        }
      }

      // Safety net: ensure every rubric question has a QuestionResult row.
      // The AI may return fewer questions than the rubric defines (e.g. when
      // segmentation misses an answer). Missing questions get an explicit
      // zero-score row so the Review page always shows a complete picture.
      const returnedQuestionIds = new Set(
        (gradeData.questions || [])
          .map((q: Record<string, unknown>) => normalizeQuestionLabel(q.question as string))
      );

      for (const rq of rubric.questions) {
        const normId = normalizeQuestionLabel(rq.questionId);
        if (!returnedQuestionIds.has(normId)) {
          const isCounted = selectedQuestionIds.has(rq.questionId);
          const excludedReason = exclusionReasons.get(rq.questionId) || null;
          const answerFromSegments: string = Object.entries(segments).find(
            ([k]) => normalizeQuestionLabel(k) === normId,
          )?.[1] || "";

          await tx.questionResult.create({
            data: {
              resultId: newResult.id,
              questionId: rq.questionId,
              question: rq.questionId,
              answer: answerFromSegments || "",
              score: 0,
              maxScore: rq.maxScore,
              confidence: 0,
              breakdown: {
                similarities: [],
                matchedConcepts: [],
                partialConcepts: [],
                missingConcepts: rq.points.map((p) => p.point),
              },
              countedInTotal: isCounted,
              excludedReason: excludedReason,
              rubricQuestionId: rq.id,
            },
          });
        }
      }

      // Update script status
      await tx.script.update({
        where: { id: scriptId },
        data: { status: "PROCESSED" },
      });
    });

    void logActivity({
      userId: session.userId,
      action: 'GRADING_COMPLETED',
      resource: 'SCRIPT',
      resourceId: scriptId,
      metadata: { examId: script.examId },
    });

    const totalPossible = selectionResult.totalMaxScore || script.exam.totalMarks;

    // Fire & Forget: Dispatch script flagged notification if confidence fell below threshold
    if (isFlagged) {
      notificationService
        .notify({
          userId: session.userId!,
          type: "SCRIPT_FLAGGED",
          title: "Script Flagged for Manual Review",
          message: `Student matric number "${script.studentId || "Unknown"}" graded with ${avgConfidencePct}% confidence (threshold: ${threshold}%).`,
          link: `/dashboard/grading?scriptId=${script.id}&examId=${script.examId}`,
          metadata: {
            scriptId: script.id,
            studentId: script.studentId,
            confidence: avgConfidencePct,
          },
        })
        .catch((err) =>
          console.error("Failed to dispatch flagged notification:", err),
        );
    }

    return NextResponse.json({
      success: true,
      scriptId,
      totalScore: Math.round(selectionResult.totalScore * 10) / 10,
      totalPossible,
      selectionApplied: selectionResult.selectionApplied,
      selectedCount: selectionResult.selected.length,
      excludedCount: selectionResult.excluded.length,
      grades: gradeData.questions,
    });
  } catch (error: unknown) {
    console.error(`Processing failed for script ${scriptId}:`, error);

    // Mark script as UPLOADED so it can be retried. We deliberately do NOT
    // persist a zero-score Result on failure — an ungraded script must never
    // look like a student who scored 0.
    await prisma.script
      .update({
        where: { id: scriptId },
        data: { status: "UPLOADED" },
      })
      .catch(() => {});

    const isTransient = (error as { transient?: boolean })?.transient === true;
    const errorMessage = error instanceof Error ? error.message : "Processing failed";
    return NextResponse.json(
      { error: errorMessage, transient: isTransient },
      { status: isTransient ? 503 : 500 },
    );
  }
}
