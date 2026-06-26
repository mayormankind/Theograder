export type InstructionType = 
  | 'ANSWER_ALL'
  | 'OPEN_CHOICE'
  | 'COMPULSORY_PLUS_CHOICE'

export type SelectionStrategy = 'BEST_SCORE' | 'FIRST_N'

export interface ParsedInstruction {
  type: InstructionType
  choiceCount: number        // how many questions to count
  compulsory: string[]       // e.g. ["Q1", "1"] if compulsory
  selectionStrategy: SelectionStrategy
  raw: string                // original instruction text
}

export function parseExamInstruction(
  instruction: string
): ParsedInstruction {
  if (!instruction || !instruction.trim()) {
    return {
      type: 'ANSWER_ALL',
      choiceCount: 999,
      compulsory: [],
      selectionStrategy: 'BEST_SCORE',
      raw: instruction || ''
    };
  }

  const text = instruction.toLowerCase().trim();

  // Detect number words and digits
  const numberWords: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4,
    'five': 5, 'six': 6, 'seven': 7, 'eight': 8,
    'nine': 9, 'ten': 10
  };

  function extractNumber(str: string): number | null {
    // Try digit first
    const digitMatch = str.match(/\b(\d+)\b/);
    if (digitMatch) return parseInt(digitMatch[1]);
    // Try word
    for (const [word, val] of Object.entries(numberWords)) {
      if (str.includes(word)) return val;
    }
    return null;
  }

  function extractCompulsoryQuestions(str: string): string[] {
    // Match "question 1", "Q1", "question one" etc.
    const matches = str.match(
      /(?:question\s*|q)(\d+[a-z]?)/gi
    );
    if (!matches) return [];
    return matches.map(m => 
      m.replace(/question\s*/i, '').replace(/q/i, '').trim()
    );
  }

  // Pattern: "answer all questions"
  if (
    text.includes('answer all') || 
    text.includes('all questions') ||
    text.includes('attempt all')
  ) {
    return {
      type: 'ANSWER_ALL',
      choiceCount: 999,
      compulsory: [],
      selectionStrategy: 'BEST_SCORE',
      raw: instruction
    };
  }

  // Pattern: "answer question 1 and any other N"
  // or "answer question 1 and any N other"
  const compulsoryPlusPattern = 
    /(?:answer|attempt)\s+question[s]?\s+\d+[a-z]?.*?and\s+any\s+(?:other\s+)?(\w+)/i;
  const compulsoryMatch = text.match(compulsoryPlusPattern);

  if (compulsoryMatch) {
    const choiceCount = extractNumber(compulsoryMatch[1]);
    const compulsory = extractCompulsoryQuestions(text);
    if (choiceCount !== null) {
      return {
        type: 'COMPULSORY_PLUS_CHOICE',
        choiceCount,
        compulsory,
        selectionStrategy: 'BEST_SCORE',
        raw: instruction
      };
    }
  }

  // Pattern: "answer any N questions" / "attempt any N"
  const openChoicePattern = 
    /(?:answer|attempt)\s+any\s+(\w+)\s+(?:of\s+\w+\s+)?questions?/i;
  const openMatch = text.match(openChoicePattern);

  if (openMatch) {
    const choiceCount = extractNumber(openMatch[1]);
    if (choiceCount !== null) {
      return {
        type: 'OPEN_CHOICE',
        choiceCount,
        compulsory: [],
        selectionStrategy: 'BEST_SCORE',
        raw: instruction
      };
    }
  }

  // Pattern: "answer N questions" (without "any")
  const simplePattern = 
    /(?:answer|attempt)\s+(\w+)\s+questions?/i;
  const simpleMatch = text.match(simplePattern);

  if (simpleMatch) {
    const choiceCount = extractNumber(simpleMatch[1]);
    if (choiceCount !== null && choiceCount < 20) {
      return {
        type: 'OPEN_CHOICE',
        choiceCount,
        compulsory: [],
        selectionStrategy: 'BEST_SCORE',
        raw: instruction
      };
    }
  }

  // Default: treat as answer all if parsing fails
  return {
    type: 'ANSWER_ALL',
    choiceCount: 999,
    compulsory: [],
    selectionStrategy: 'BEST_SCORE',
    raw: instruction
  };
}
