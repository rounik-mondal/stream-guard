/*
  Warnings:

  - You are about to drop the column `isLive` on the `Stream` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "StreamStatus" AS ENUM ('OFFLINE', 'LIVE', 'ENDED');

-- AlterTable
ALTER TABLE "Stream" DROP COLUMN "isLive",
ADD COLUMN     "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxViewerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "StreamStatus" NOT NULL DEFAULT 'OFFLINE',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "toxicFilterEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "viewerCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
