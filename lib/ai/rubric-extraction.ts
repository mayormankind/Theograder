export interface ExtractedQuestion {
  questionNumber: string;
  questionText: string;
  maxScore: number;
  parts: ExtractedPart[];
}

export interface ExtractedPart {
  label: string;
  expectedAnswer: string;
  keyPoints: string[];
  marks: number;
}

export interface ExtractedRubric {
  title: string;
  description?: string;
  courseCode?: string;
  examType?: string;
  questions: ExtractedQuestion[];
  totalMarks: number;
}

export interface ExtractionResult {
  success: boolean;
  rubric?: ExtractedRubric;
  error?: string;
  confidence?: number;
}

class RubricExtractionService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || null;
  }

  async extractFromDocument(file: File): Promise<ExtractionResult> {
    try {
      if (!this.apiKey) {
        return this.mockExtraction(file.name);
      }

      // Convert file to base64 for API call
      const base64 = await this.fileToBase64(file);
      
      const prompt = `
Extract the questions, expected answer points, and marks allocation from this marking scheme document.
Return as structured JSON with the following format:

{
  "title": "Exam Title",
  "description": "Brief description",
  "courseCode": "Course Code (if available)",
  "examType": "Exam Type (if available)",
  "questions": [
    {
      "questionNumber": "Q1",
      "questionText": "Full question text",
      "maxScore": 20,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "Expected answer for this part",
          "keyPoints": ["key concept 1", "key concept 2"],
          "marks": 10
        }
      ]
    }
  ],
  "totalMarks": 100
}

Guidelines:
- Extract all questions and sub-parts
- Identify marks allocation for each part
- Extract key concepts/points that should be mentioned
- If marks aren't explicitly stated, estimate based on question complexity
- Include both the question text and expected answers
- Be thorough but don't invent information that's not clearly present
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${file.type};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from OpenAI response');
      }

      const rubric = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        rubric,
        confidence: 0.85, // Mock confidence score
      };

    } catch (error) {
      console.error('Error extracting rubric from document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract rubric from document',
      };
    }
  }

  async extractFromText(text: string): Promise<ExtractionResult> {
    try {
      if (!this.apiKey) {
        return this.mockExtractionFromText(text);
      }

      const prompt = `
Extract the questions, expected answer points, and marks allocation from this marking scheme text.
Return as structured JSON with the following format:

{
  "title": "Exam Title",
  "description": "Brief description",
  "courseCode": "Course Code (if available)",
  "examType": "Exam Type (if available)",
  "questions": [
    {
      "questionNumber": "Q1",
      "questionText": "Full question text",
      "maxScore": 20,
      "parts": [
        {
          "label": "a",
          "expectedAnswer": "Expected answer for this part",
          "keyPoints": ["key concept 1", "key concept 2"],
          "marks": 10
        }
      ]
    }
  ],
  "totalMarks": 100
}

Text to analyze:
${text}

Guidelines:
- Extract all questions and sub-parts
- Identify marks allocation for each part
- Extract key concepts/points that should be mentioned
- If marks aren't explicitly stated, estimate based on question complexity
- Include both the question text and expected answers
- Be thorough but don't invent information that's not clearly present
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from OpenAI response');
      }

      const rubric = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        rubric,
        confidence: 0.80, // Slightly lower confidence for text
      };

    } catch (error) {
      console.error('Error extracting rubric from text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract rubric from text',
      };
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Mock extraction for development/demo when OpenAI API is not available
  private mockExtraction(filename: string): ExtractionResult {
    const mockRubric: ExtractedRubric = {
      title: `Extracted from ${filename}`,
      description: 'Rubric automatically extracted from uploaded document',
      courseCode: 'CSC 401',
      examType: 'Final Examination',
      questions: [
        {
          questionNumber: 'Q1',
          questionText: 'Explain the concept of database transactions and ACID properties.',
          maxScore: 20,
          parts: [
            {
              label: 'a',
              expectedAnswer: 'A transaction is a sequence of operations performed as a single logical unit of work.',
              keyPoints: ['atomicity', 'consistency', 'isolation', 'durability'],
              marks: 8,
            },
            {
              label: 'b',
              expectedAnswer: 'ACID properties ensure reliable processing of database transactions.',
              keyPoints: ['all-or-nothing execution', 'state preservation', 'concurrent execution', 'permanent changes'],
              marks: 12,
            },
          ],
        },
        {
          questionNumber: 'Q2',
          questionText: 'Design a database schema for a university enrollment system.',
          maxScore: 30,
          parts: [
            {
              label: 'a',
              expectedAnswer: 'Entities: Students, Courses, Instructors, Departments, Enrollments',
              keyPoints: ['primary keys', 'foreign keys', 'relationships', 'normalization'],
              marks: 15,
            },
            {
              label: 'b',
              expectedAnswer: 'ER diagram showing relationships between entities',
              keyPoints: ['one-to-many', 'many-to-many', 'cardinality', 'attributes'],
              marks: 15,
            },
          ],
        },
      ],
      totalMarks: 50,
    };

    return {
      success: true,
      rubric: mockRubric,
      confidence: 0.75,
    };
  }

  private mockExtractionFromText(text: string): ExtractionResult {
    // Simple mock extraction based on text content
    const hasQuestions = /\b(q\d+|question\s*\d+|\d+\.)\b/i.test(text);
    
    if (!hasQuestions) {
      return {
        success: false,
        error: 'No questions found in the provided text',
      };
    }

    return this.mockExtraction('pasted text');
  }
}

export const rubricExtractionService = new RubricExtractionService();
