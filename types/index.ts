export type Page =
  | 'dashboard'
  | 'exams'
  | 'scripts'
  | 'upload'
  | 'rubrics'
  | 'create-rubric'
  | 'results'
  | 'report'
  | 'settings'
  | 'grading';

export interface Exam {
  id: string;
  title: string;
  description?: string;
  courseCode?: string;
  courseName?: string;
  totalMarks: number;
  duration?: number;
  examDate?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  examInstructions?: string;
  selectionStrategy?: 'BEST_SCORE' | 'FIRST_N';
  createdAt: string;
  updatedAt: string;
  _count?: {
    scripts: number;
    graded: number;
  };
}

export interface Script {
  id: string;
  filename: string;
  originalName: string;
  studentId?: string;
  studentName?: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  examId: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'GRADED';
  createdAt: string;
}

export interface RubricQuestion {
  id: string;
  questionNumber: string;
  questionText: string;
  parts: RubricPart[];
  totalMarks: number;
}

export interface RubricPart {
  id: string;
  label: string;
  expectedAnswer: string;
  keyPoints: string[];
  marks: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GradingResult {
  questionId: string;
  questionNumber: string;
  partLabel: string;
  studentAnswer: string;
  expectedAnswer: string;
  score: number;
  maxScore: number;
  similarityScore: number;
  confidence: number;
  matchedConcepts: string[];
  partialConcepts: string[];
  missingConcepts: string[];
  overrideScore?: number;
  answer?: string;
  questionText?: string;
  countedInTotal?: boolean;
  excludedReason?: string | null;
}

