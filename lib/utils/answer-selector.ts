import { ParsedInstruction } from './instruction-parser';

export interface GradedQuestion {
  id: string               // QuestionResult id
  questionId: string       // e.g. "Q1", "1a", "2"
  score: number
  maxScore: number
  documentOrder: number    // 0-based order found in script
}

export interface SelectionResult {
  selected: GradedQuestion[]    // questions that count
  excluded: GradedQuestion[]    // questions that don't count
  totalScore: number
  totalMaxScore: number
  selectionApplied: boolean     // false if ANSWER_ALL
  strategy: string
}

function normaliseQuestionId(id: string): string {
  // Normalise for comparison: remove spaces, lowercase
  // "Question 1" -> "1", "Q1" -> "1", "q1a" -> "1a"
  return id
    .toLowerCase()
    .replace(/^question\s*/i, '')
    .replace(/^q/, '')
    .trim();
}

function isCompulsory(
  questionId: string, 
  compulsoryList: string[]
): boolean {
  const norm = normaliseQuestionId(questionId);
  return compulsoryList.some(c => 
    normaliseQuestionId(c) === norm ||
    norm.startsWith(normaliseQuestionId(c))
  );
}

export function selectAnswers(
  questions: GradedQuestion[],
  instruction: ParsedInstruction,
  strategy: 'BEST_SCORE' | 'FIRST_N' = 'BEST_SCORE'
): SelectionResult {

  // Compute the total number of questions that should count
  // For COMPULSORY_PLUS_CHOICE: total = compulsory count + choiceCount
  // For OPEN_CHOICE / ANSWER_ALL: total = choiceCount
  const totalRequired = 
    instruction.type === 'COMPULSORY_PLUS_CHOICE'
      ? instruction.compulsory.length + instruction.choiceCount
      : instruction.choiceCount;

  // If ANSWER_ALL or student answered no more than required
  if (
    instruction.type === 'ANSWER_ALL' || 
    questions.length <= totalRequired
  ) {
    return {
      selected: questions,
      excluded: [],
      totalScore: questions.reduce((s, q) => s + q.score, 0),
      totalMaxScore: questions.reduce(
        (s, q) => s + q.maxScore, 0
      ),
      selectionApplied: false,
      strategy
    };
  }

  let selected: GradedQuestion[] = [];
  let pool: GradedQuestion[] = [...questions];

  // Step 1: Extract compulsory questions first
  if (
    instruction.type === 'COMPULSORY_PLUS_CHOICE' && 
    instruction.compulsory.length > 0
  ) {
    const compulsoryQs = pool.filter(q => 
      isCompulsory(q.questionId, instruction.compulsory)
    );
    selected.push(...compulsoryQs);
    pool = pool.filter(q => 
      !isCompulsory(q.questionId, instruction.compulsory)
    );
  }

  // Step 2: Select remaining from pool
  // For COMPULSORY_PLUS_CHOICE: choiceCount IS the number to pick from pool
  // For OPEN_CHOICE: remaining = choiceCount minus already-selected compulsory
  const remaining = instruction.type === 'COMPULSORY_PLUS_CHOICE'
    ? instruction.choiceCount
    : instruction.choiceCount - selected.length;

  if (remaining > 0 && pool.length > 0) {
    if (strategy === 'BEST_SCORE') {
      // Sort by score descending, take top N
      const sorted = [...pool].sort(
        (a, b) => b.score - a.score
      );
      selected.push(...sorted.slice(0, remaining));
    } else {
      // FIRST_N: take first N by document order
      const ordered = [...pool].sort(
        (a, b) => a.documentOrder - b.documentOrder
      );
      selected.push(...ordered.slice(0, remaining));
    }
  }

  // Step 3: Everything else is excluded
  const selectedIds = new Set(selected.map(q => q.id));
  const excluded = questions.filter(q => !selectedIds.has(q.id));

  const totalScore = selected.reduce(
    (s, q) => s + q.score, 0
  );
  
  // Max score is based on required questions only
  // Use the selected questions' maxScore values
  const totalMaxScore = selected.reduce(
    (s, q) => s + q.maxScore, 0
  );

  return {
    selected,
    excluded,
    totalScore,
    totalMaxScore,
    selectionApplied: true,
    strategy
  };
}
