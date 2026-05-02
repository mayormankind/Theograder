export type Page =
  | 'dashboard'
  | 'exams'
  | 'scripts'
  | 'upload'
  | 'rubrics'
  | 'create-rubric'
  | 'processing'
  | 'results'
  | 'report'
  | 'settings'
  | 'grading';

export interface Exam {
  id: string;
  title: string;
  course: string;
  date: string;
  totalScripts: number;
  graded: number;
  status: 'active' | 'completed' | 'draft';
}

export interface Script {
  id: string;
  studentId: string;
  studentName: string;
  examTitle: string;
  uploadedAt: string;
  status: 'uploaded' | 'processing' | 'done' | 'pending_review';
  score?: number;
  totalMarks: number;
  confidence?: number;
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

export interface GradingResult {
  questionId: string;
  questionNumber: string;
  partLabel: string;
  studentAnswer: string;
  score: number;
  maxScore: number;
  similarityScore: number;
  confidence: number;
  matchedConcepts: string[];
  missingConcepts: string[];
  overrideScore?: number;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'processed' | 'reviewed' | 'exam_created';
  description: string;
  timestamp: string;
  user: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
