/*
  Warnings:

  - The values [UPLOADED] on the enum `ScriptStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ScriptStatus_new" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED', 'ARCHIVED');
ALTER TABLE "public"."scripts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "scripts" ALTER COLUMN "status" TYPE "ScriptStatus_new" USING ("status"::text::"ScriptStatus_new");
ALTER TYPE "ScriptStatus" RENAME TO "ScriptStatus_old";
ALTER TYPE "ScriptStatus_new" RENAME TO "ScriptStatus";
DROP TYPE "public"."ScriptStatus_old";
ALTER TABLE "scripts" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
COMMIT;

-- AlterTable
ALTER TABLE "batches" ADD COLUMN     "jobId" TEXT;
