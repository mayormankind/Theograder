-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GRADING_COMPLETE', 'SCRIPT_FLAGGED', 'SYSTEM_ERROR', 'RUBRIC_EXTRACTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "autoFlag" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "batchSize" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "confidenceThreshold" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "department" TEXT DEFAULT 'Computer Science',
ADD COLUMN     "emailNotif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "faculty" TEXT DEFAULT 'Science',
ADD COLUMN     "staffId" TEXT,
ADD COLUMN     "systemNotif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "title" TEXT DEFAULT 'Dr.';

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
