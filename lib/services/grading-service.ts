import { aiClient, type ExtractedRubric, type AIGradingResult, type AIQuestionResult } from './ai-client';
import { prisma } from '@/lib/prisma';

export interface GradingQuestion {
  question: string;
  score: number;
  maxScore: number;
  confidence: number;
  breakdown: Array<{
    point: string;
    similarity: number;
    weight: number;
  }>;
  feedback?: string;
}

export interface GradingResult {
  studentId: string;
  studentName?: string;
  totalScore: number;
  maxScore: number;
  overallConfidence: number;
  questions: GradingQuestion[];
  processingTime: number;
  extractionMethod: string;
  status: 'completed' | 'partial' | 'failed';
  errorMessage?: string;
}

export interface BatchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  results: GradingResult[];
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

class GradingService {
  async gradeScript(file: File, rubric: ExtractedRubric): Promise<GradingResult> {
    const startTime = Date.now();
    
    try {
      // Convert rubric to JSON string for AI service
      const rubricStr = JSON.stringify(rubric);
      
      // Call AI service for grading
      const result = await aiClient.gradeScript(file, rubricStr);
      
      // Build a lookup map: normalised question label → maxScore from the rubric
      const rubricMaxScoreMap = new Map<string, number>();
      for (const rq of rubric.questions) {
        rubricMaxScoreMap.set(rq.questionNumber.toLowerCase().trim(), rq.maxScore);
      }

      const questions = result.questions.map((q: AIQuestionResult) => {
        // Look up the declared max marks for this question from the rubric
        const rubricMax = rubricMaxScoreMap.get(q.question.toLowerCase().trim()) ?? 0;
        return {
          question: q.question,
          score: q.score,
          maxScore: rubricMax,
          confidence: q.confidence,
          breakdown: q.breakdown.map((similarity: number, index: number) => ({
            point: `Point ${index + 1}`,
            similarity,
            weight: 1.0
          }))
        };
      });

      const totalMax = rubric.questions.reduce((sum, rq) => sum + rq.maxScore, 0);

      // Transform AI service response to our format
      const gradingResult: GradingResult = {
        studentId: result.student_id,
        totalScore: result.questions.reduce((sum: number, q: AIQuestionResult) => sum + q.score, 0),
        maxScore: totalMax,
        overallConfidence: result.questions.length > 0
          ? result.questions.reduce((sum: number, q: AIQuestionResult) => sum + q.confidence, 0) / result.questions.length
          : 0,
        questions,
        processingTime: Date.now() - startTime,
        extractionMethod: 'ai-service',
        status: 'completed'
      };
      
      return gradingResult;
    } catch (error) {
      return {
        studentId: 'UNKNOWN',
        totalScore: 0,
        maxScore: 0,
        overallConfidence: 0,
        questions: [],
        processingTime: Date.now() - startTime,
        extractionMethod: 'ai-service',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async batchGradeScripts(files: File[], rubric: ExtractedRubric, userId?: string): Promise<BatchJob> {
    try {
      // Convert rubric to JSON string
      const rubricStr = JSON.stringify(rubric);
      
      // Start batch grading job
      const batchResult = await aiClient.batchGradeScripts(files, rubricStr);
      
      // Build rubricData: normalised questionNumber → maxScore
      const rubricData: Record<string, number> = {};
      for (const rq of rubric.questions) {
        rubricData[rq.questionNumber.toLowerCase().trim()] = rq.maxScore;
      }

      // Persist metadata to DB so any serverless instance can read it during polling
      await prisma.batchJobMeta.create({
        data: {
          jobId: batchResult.job_id,
          userId: userId ?? null,
          totalFiles: files.length,
          rubricData,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2-hour TTL
        },
      }).catch(err => console.error('[BatchJob] Failed to persist metadata:', err));

      const batchJob: BatchJob = {
        id: batchResult.job_id,
        status: 'pending',
        totalFiles: files.length,
        processedFiles: 0,
        failedFiles: 0,
        results: [],
        createdAt: new Date()
      };
      
      return batchJob;
    } catch (error) {
      throw new Error(`Failed to start batch grading: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getBatchJobStatus(jobId: string): Promise<BatchJob> {
    try {
      const status = await aiClient.getBatchGradingStatus(jobId);
      
      // Read metadata from DB — works across serverless instances
      const metaRow = await prisma.batchJobMeta.findUnique({ where: { jobId } }).catch(() => null);
      const rubricData = metaRow?.rubricData as Record<string, number> | null;
      const totalRubricMax = rubricData
        ? Object.values(rubricData).reduce((a, b) => a + b, 0)
        : 0;

      // Transform AI service response to our format
      const batchJob: BatchJob = {
        id: status.job_id,
        status: status.status as BatchJob['status'],
        totalFiles: metaRow?.totalFiles ?? status.results?.length ?? 0,
        processedFiles: status.results?.length || 0,
        failedFiles: 0,
        results: status.results?.map((r: AIGradingResult) => {
          const qs = r.questions.map((q: AIQuestionResult) => ({
            question: q.question,
            score: q.score,
            maxScore: rubricData?.[q.question.toLowerCase().trim()] ?? 0,
            confidence: q.confidence,
            breakdown: q.breakdown.map((similarity: number, index: number) => ({
              point: `Point ${index + 1}`,
              similarity,
              weight: 1.0
            }))
          }));
          return {
            studentId: r.student_id,
            totalScore: r.questions.reduce((sum: number, q: AIQuestionResult) => sum + q.score, 0),
            maxScore: totalRubricMax,
            overallConfidence: r.questions.length > 0
              ? r.questions.reduce((sum: number, q: AIQuestionResult) => sum + q.confidence, 0) / r.questions.length
              : 0,
            questions: qs,
            processingTime: metaRow ? Date.now() - metaRow.startedAt.getTime() : 0,
            extractionMethod: 'ai-service',
            status: 'completed' as const
          };
        }) || [],
        createdAt: new Date(),
        completedAt: status.status === 'completed' ? new Date() : undefined
      };
      
      return batchJob;
    } catch (error) {
      throw new Error(`Failed to get batch job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Poll batch job status until completion or timeout
  async pollBatchJob(
    jobId: string,
    onProgress?: (job: BatchJob) => void,
    maxAttempts: number = 60   // ~2 min at 2 s/poll before giving up
  ): Promise<BatchJob> {
    let job: BatchJob;
    let attempts = 0;

    do {
      if (attempts >= maxAttempts) {
        throw new Error(
          `Batch job ${jobId} did not complete after ${maxAttempts} polling attempts. ` +
          `Last status: ${job!.status}`
        );
      }

      job = await this.getBatchJobStatus(jobId);
      onProgress?.(job);
      attempts++;

      if (job.status === 'pending' || job.status === 'processing') {
        // Wait 2 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } while (job.status === 'pending' || job.status === 'processing');

    // Delete DB metadata once the job has settled
    await prisma.batchJobMeta.delete({ where: { jobId } }).catch(() => {});

    return job;
  }

  // Calculate class statistics from grading results
  calculateClassStats(results: GradingResult[]) {
    if (results.length === 0) {
      return {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        totalStudents: 0
      };
    }

    const scores = results.map(r => r.totalScore);
    const maxScores = results.map(r => r.maxScore);
    const averageMaxScore = maxScores.reduce((sum, max) => sum + max, 0) / maxScores.length;
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const passRate = results.filter(r => r.totalScore >= averageMaxScore * 0.5).length / results.length;
    
    return {
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100),
      totalStudents: results.length
    };
  }

  // Generate feedback for a student
  generateFeedback(result: GradingResult): string {
    const scorePercentage = (result.totalScore / result.maxScore) * 100;
    
    let feedback = `Overall Score: ${result.totalScore}/${result.maxScore} (${Math.round(scorePercentage)}%)\n\n`;
    
    feedback += "Performance by Question:\n";
    result.questions.forEach((q, index) => {
      const qPercentage = (q.score / q.maxScore) * 100;
      feedback += `Q${index + 1}: ${q.score}/${q.maxScore} (${Math.round(qPercentage)}%) - `;
      
      if (qPercentage >= 80) {
        feedback += "Excellent\n";
      } else if (qPercentage >= 60) {
        feedback += "Good\n";
      } else if (qPercentage >= 40) {
        feedback += "Needs Improvement\n";
      } else {
        feedback += "Poor\n";
      }
    });
    
    feedback += `\nOverall Confidence: ${Math.round(result.overallConfidence * 100)}%\n`;
    
    if (result.status === 'failed') {
      feedback += `\nNote: Grading encountered an error: ${result.errorMessage}`;
    }
    
    return feedback;
  }
}

export const gradingService = new GradingService();
