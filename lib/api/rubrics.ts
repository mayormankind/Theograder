import { ApiResponse } from '@/types';

export interface RubricPoint {
  id: string;
  point: string;
  weight: number;
  maxScore: number;
}

export interface RubricQuestion {
  id: string;
  questionId: string;
  question: string;
  maxScore: number;
  points: RubricPoint[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string | null;
  totalMarks: number;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  examId: string | null;
  questions: RubricQuestion[];
  exam?: {
    courseCode: string | null;
    courseName: string | null;
  };
}

export interface CreateRubricData {
  title: string;
  description?: string;
  examId?: string;
  questions: {
    questionId: string;
    question: string;
    maxScore: number;
    points: RubricPoint[];
  }[];
}

export interface UpdateRubricData extends Partial<CreateRubricData> {
  id: string;
}

class RubricsApi {
  private baseUrl = '/api/rubrics';

  async getAll(): Promise<ApiResponse<Rubric[]>> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data: data.rubrics || [] };
    } catch (error) {
      console.error('Error fetching rubrics:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch rubrics' };
    }
  }

  async getById(id: string): Promise<ApiResponse<Rubric>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching rubric:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch rubric' };
    }
  }

  async create(rubricData: CreateRubricData): Promise<ApiResponse<Rubric>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rubricData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating rubric:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create rubric' };
    }
  }

  async update(rubricData: UpdateRubricData): Promise<ApiResponse<Rubric>> {
    try {
      const response = await fetch(`${this.baseUrl}/${rubricData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rubricData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating rubric:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update rubric' };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting rubric:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete rubric' };
    }
  }

  async duplicate(id: string, newTitle?: string): Promise<ApiResponse<Rubric>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error duplicating rubric:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to duplicate rubric' };
    }
  }

  validateRubric(rubricData: CreateRubricData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rubricData.title?.trim()) {
      errors.push('Title is required');
    }

    if (!rubricData.questions || rubricData.questions.length === 0) {
      errors.push('At least one question is required');
    }

    // Validate questions structure
    if (rubricData.questions) {
      rubricData.questions.forEach((q, index) => {
        if (!q.question?.trim()) {
          errors.push(`Question ${index + 1}: Question text is required`);
        }
        if (typeof q.maxScore !== 'number' || q.maxScore <= 0) {
          errors.push(`Question ${index + 1}: Max score must be a positive number`);
        }
        if (!Array.isArray(q.points) || q.points.length === 0) {
          errors.push(`Question ${index + 1}: Must have at least one point`);
        }

        q.points.forEach((point, pointIndex) => {
          if (!point.point?.trim()) {
            errors.push(`Question ${index + 1}, point ${pointIndex + 1}: Description is required`);
          }
          if (typeof point.weight !== 'number' || point.weight < 0) {
            errors.push(`Question ${index + 1}, point ${pointIndex + 1}: Weight must be a positive number`);
          }
          if (typeof point.maxScore !== 'number' || point.maxScore <= 0) {
            errors.push(`Question ${index + 1}, point ${pointIndex + 1}: Max score must be a positive number`);
          }
        });
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const rubricsApi = new RubricsApi();
