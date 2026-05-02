import { ApiResponse } from '@/types';

export interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  mimeType: string;
  status: 'uploaded' | 'processing' | 'done' | 'error';
  progress: number;
  extractedText?: string;
  errorMessage?: string;
  examId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: UploadedFile['status'];
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class UploadApi {
  private baseUrl = '/api/upload';

  validateFiles(files: File[]): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`File ${file.name} exceeds maximum size of 20MB`);
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(extension)) {
          errors.push(`File ${file.name} is not a supported format. Only PDF, JPG, and PNG are allowed.`);
        }
      }

      // Warnings for large files
      if (file.size > 10 * 1024 * 1024) {
        warnings.push(`File ${file.name} is large (>10MB) and may take longer to process`);
      }

      // Check filename
      if (file.name.length > 255) {
        errors.push(`Filename ${file.name} is too long (max 255 characters)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async uploadFiles(files: File[], examId: string): Promise<ApiResponse<UploadedFile[]>> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('examId', examId);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error uploading files:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to upload files' };
    }
  }

  async getUploadedFiles(examId?: string): Promise<ApiResponse<UploadedFile[]>> {
    try {
      const url = examId ? `${this.baseUrl}?examId=${examId}` : this.baseUrl;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch uploaded files' };
    }
  }

  async deleteFile(fileId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete file' };
    }
  }

  async processFiles(fileIds: string[]): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error processing files:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to process files' };
    }
  }

  async getProcessingStatus(fileId: string): Promise<ApiResponse<UploadProgress>> {
    try {
      const response = await fetch(`${this.baseUrl}/${fileId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error getting processing status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get processing status' };
    }
  }

  // Simulate file processing for demo purposes
  simulateFileProcessing(fileId: string, onProgress: (progress: UploadProgress) => void): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onProgress({
          fileId,
          progress: 100,
          status: 'done',
        });
      } else {
        onProgress({
          fileId,
          progress: Math.round(progress),
          status: 'processing',
        });
      }
    }, 500);
  }
}

export const uploadApi = new UploadApi();
