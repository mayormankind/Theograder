-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "exams_createdById_idx" ON "exams"("createdById");

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "question_results_resultId_idx" ON "question_results"("resultId");

-- CreateIndex
CREATE INDEX "question_results_rubricQuestionId_idx" ON "question_results"("rubricQuestionId");

-- CreateIndex
CREATE INDEX "results_examId_idx" ON "results"("examId");

-- CreateIndex
CREATE INDEX "results_scriptId_idx" ON "results"("scriptId");

-- CreateIndex
CREATE INDEX "results_gradedById_idx" ON "results"("gradedById");

-- CreateIndex
CREATE INDEX "results_status_idx" ON "results"("status");

-- CreateIndex
CREATE INDEX "rubrics_createdById_idx" ON "rubrics"("createdById");

-- CreateIndex
CREATE INDEX "rubrics_examId_idx" ON "rubrics"("examId");

-- CreateIndex
CREATE INDEX "scripts_examId_idx" ON "scripts"("examId");

-- CreateIndex
CREATE INDEX "scripts_status_idx" ON "scripts"("status");

-- CreateIndex
CREATE INDEX "scripts_studentId_idx" ON "scripts"("studentId");
