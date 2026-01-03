-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'PUBLIC';
