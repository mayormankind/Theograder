export interface ExtractedQuestion {
  questionNumber: string;
  questionText: string;
  maxScore: number;
  parts: Array<{
    label: string;
    expectedAnswer: string;
    keyPoints: string[];
    marks: number;
  }>;
}

export interface ExtractedRubric {
  title: string;
  description?: string;
  courseCode?: string;
  examType?: string;
  questions: ExtractedQuestion[];
  totalMarks: number;
}

export interface AIQuestionResult {
  question: string;
  score: number;
  confidence: number;
  breakdown: number[];
}

export interface AIGradingResult {
  student_id: string;
  questions: AIQuestionResult[];
}

export interface ExtractionResult {
  success: boolean;
  rubric?: ExtractedRubric;
  error?: string;
  confidence?: number;
}

class AIClient {
  private baseUrl: string;

  constructor() {
    // Default to localhost for development, can be overridden by environment
    this.baseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    return fetch(url, defaultOptions);
  }

  async extractRubricFromDocument(file: File): Promise<ExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.makeRequest('/extract/from-document', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error extracting rubric from document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract rubric from document',
      };
    }
  }

  async extractRubricFromText(text: string): Promise<ExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('text', text);

      const response = await this.makeRequest('/extract/from-text', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error extracting rubric from text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract rubric from text',
      };
    }
  }

  async checkHealth(): Promise<{ status: string; service?: string }> {
    try {
      const response = await this.makeRequest('/');
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('AI service health check failed:', error);
      return { status: 'error' };
    }
  }

  async checkRubricExtractionHealth(): Promise<{ status: string; service: string }> {
    try {
      const response = await this.makeRequest('/extract/health');
      if (!response.ok) {
        throw new Error(`Rubric extraction health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Rubric extraction health check failed:', error);
      return { status: 'error', service: 'rubric-extraction' };
    }
  }

  // OCR functionality
  async extractTextFromImage(file: File): Promise<{
    extracted_text: string;
    extraction_method: string;
    confidence_flag: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.makeRequest('/ocr', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw error;
    }
  }

  // Similarity checking
  async calculateSimilarity(
    studentAnswer: string,
    rubric: string[]
  ): Promise<{ similarities: number[] }> {
    try {
      const response = await this.makeRequest('/similarity', {
        method: 'POST',
        body: JSON.stringify({
          student_answer: studentAnswer,
          rubric: rubric,
        }),
      });

      if (!response.ok) {
        throw new Error(`Similarity service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating similarity:', error);
      throw error;
    }
  }

  // Grading functionality
  async gradeScript(
    file: File,
    rubricStr: string
  ): Promise<AIGradingResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rubric_str', rubricStr);

      const response = await this.makeRequest('/grade', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`Grading service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error grading script:', error);
      throw error;
    }
  }

  // Batch grading
  async batchGradeScripts(
    files: File[],
    rubricStr: string
  ): Promise<{ job_id: string; message: string }> {
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('rubric_str', rubricStr);

      const response = await this.makeRequest('/batch-grade', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      });

      if (!response.ok) {
        throw new Error(`Batch grading service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting batch grading:', error);
      throw error;
    }
  }

  // Get batch grading status
  async getBatchGradingStatus(jobId: string): Promise<{
    job_id: string;
    status: string;
    results?: AIGradingResult[];
  }> {
    try {
      const response = await this.makeRequest(`/batch-status/${jobId}`);

      if (!response.ok) {
        throw new Error(`Batch status service error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting batch grading status:', error);
      throw error;
    }
  }
}

export const aiClient = new AIClient();
