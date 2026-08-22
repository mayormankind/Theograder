/**
 * Canonical question-label normaliser.
 *
 * MUST mirror `normalize_question_label` in
 * ai-service/app/routes/grading.py so that question labels line up across
 * the whole pipeline (segmentation output, rubric keys, DB persistence).
 *
 *   "Question 1" -> "1"   "Q2b" -> "2b"   "2(a)" -> "2a"   "3." -> "3"
 *
 * Only the leading "question"/"q" prefix is stripped (not every "q"), so
 * words like "equal" are never corrupted. Whitespace, dots and parentheses
 * are removed so "2 (a)", "2(a)" and "2a" all collapse to the same key.
 */
export function normalizeQuestionLabel(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/^(?:question\s*|q)/, "")
    .replace(/[\s.()]/g, "");
}
