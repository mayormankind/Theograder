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
  private defaultTimeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    // Default to localhost for development, can be overridden by environment
    this.baseUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';
    this.defaultTimeout = 60000; // 60 seconds default timeout
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second base delay
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequestWithRetry(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = this.defaultTimeout,
    retries: number = this.maxRetries
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const defaultOptions: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          ...options,
        };

        const response = await fetch(url, defaultOptions);
        clearTimeout(timeoutId);

        // Handle 5xx errors with retry
        if (response.status >= 500 && attempt < retries) {
          console.warn(`AI service returned ${response.status}, retrying... (${attempt + 1}/${retries})`);
          await this.sleep(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        return response;
      } catch (error) {
        // Check if it's a timeout error
        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < retries) {
            console.warn(`AI service timeout, retrying... (${attempt + 1}/${retries})`);
            await this.sleep(this.retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new Error('AI service request timed out. Please try again.');
        }

        // Check if it's a connection error
        if (error instanceof Error && 
            (error.message.includes('ECONNREFUSED') || 
             error.message.includes('fetch failed') ||
             error.message.includes('NetworkError'))) {
          if (attempt < retries) {
            console.warn(`AI service connection failed, retrying... (${attempt + 1}/${retries})`);
            await this.sleep(this.retryDelay * Math.pow(2, attempt));
            continue;
          }
          throw new Error('AI service is unavailable. Please check your connection and try again.');
        }

        // Other errors should be thrown immediately
        throw error;
      }
    }

    throw new Error('Failed to connect to AI service after multiple retries');
  }

  async extractRubricFromDocument(file: File): Promise<ExtractionResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.makeRequestWithRetry('/extract/from-document', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }, 120000); // 2 minute timeout for document extraction

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

      const response = await this.makeRequestWithRetry('/extract/from-text', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }, 60000);

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
      const response = await this.makeRequestWithRetry('/', {}, 10000, 1); // 10s timeout, 1 retry for health check
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
      const response = await this.makeRequestWithRetry('/extract/health', {}, 10000, 1);
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

      const response = await this.makeRequestWithRetry('/ocr', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }, 90000); // 90 second timeout for OCR

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
      const response = await this.makeRequestWithRetry('/similarity', {
        method: 'POST',
        body: JSON.stringify({
          student_answer: studentAnswer,
          rubric: rubric,
        }),
      }, 30000);

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

      const response = await this.makeRequestWithRetry('/grade', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }, 120000); // 2 minute timeout for grading

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

      const response = await this.makeRequestWithRetry('/batch-grade', {
        method: 'POST',
        body: formData,
        headers: {}, // Let browser set Content-Type for FormData
      }, 180000); // 3 minute timeout for batch grading

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
      const response = await this.makeRequestWithRetry(`/batch-status/${jobId}`, {}, 15000);

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
