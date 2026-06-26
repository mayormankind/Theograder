-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "examInstructions" TEXT,
ADD COLUMN     "parsedInstruction" JSONB,
ADD COLUMN     "selectionStrategy" TEXT NOT NULL DEFAULT 'BEST_SCORE';

-- AlterTable
ALTER TABLE "question_results" ADD COLUMN     "countedInTotal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "excludedReason" TEXT;
