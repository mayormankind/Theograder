"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

type GradingStatus =
  | "queued"
  | "ocr"
  | "segmenting"
  | "grading"
  | "done"
  | "error";

interface ScriptGradingEntry {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  status: GradingStatus;
  score: number | null;
  totalMarks: number | null;
  error: string | null;
}

interface Exam {
  id: string;
  title: string;
  description?: string;
  courseCode?: string;
  courseName?: string;
  totalMarks: number;
  duration?: number;
  examDate?: string;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: string;
  examInstructions?: string;
  selectionStrategy?: string;
  rubrics?: Array<{
    id: string;
    title: string;
  }>;
}

interface BackendScript {
  id: string;
  studentId: string;
  fileName: string;
  fileUrl: string;
  status: "PROCESSED" | "PROCESSING" | "FAILED" | "QUEUED";
  score: number | null;
  totalMarks: number | null;
}

function ExamDetailPage() {
  const params = useParams();
  const examId = params.id as string;

  const [, setExam] = useState<Exam | null>(null);
  const [, setScripts] = useState<ScriptGradingEntry[]>([]);
  const [, setLoading] = useState(true);
  const [, setHasRubric] = useState(false);

  const fetchExam = useCallback(async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam");
      }
      const data = await response.json();
      setExam(data);
      setHasRubric(data.rubrics && data.rubrics.length > 0);
    } catch (error) {
      console.error("Error fetching exam:", error);
      toast.error("Failed to load exam details");
    }
  }, [examId]);

  const fetchScripts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams/${examId}/scripts`);
      if (!response.ok) {
        throw new Error("Failed to fetch scripts");
      }
      const data = await response.json();

      // Map backend status to frontend grading status
      const mappedScripts = data.scripts.map((s: BackendScript) => {
        let status: GradingStatus = "queued";
        if (s.status === "PROCESSED") {
          status = "done";
        } else if (s.status === "PROCESSING") {
          status = "grading";
        } else if (s.status === "FAILED") {
          status = "error";
        } else {
          status = "queued";
        }

        return {
          ...s,
          status,
          error: s.status === "FAILED" ? "Processing failed" : null,
        };
      });

      setScripts(mappedScripts);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast.error("Failed to load scripts");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchExam();
    fetchScripts();
  }, [fetchExam, fetchScripts]);



  return (
    <div>test</div>
  );
}

export default ExamDetailPage;
