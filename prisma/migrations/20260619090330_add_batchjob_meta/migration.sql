-- CreateTable
CREATE TABLE "batch_job_meta" (
    "jobId" TEXT NOT NULL,
    "userId" TEXT,
    "totalFiles" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricData" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_job_meta_pkey" PRIMARY KEY ("jobId")
);

-- CreateIndex
CREATE INDEX "batch_job_meta_expiresAt_idx" ON "batch_job_meta"("expiresAt");
