-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WorkoutLibraryStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Add status column to Workout and WorkoutProgram with default DRAFT
ALTER TABLE "Workout" ADD COLUMN IF NOT EXISTS "status" "WorkoutLibraryStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "WorkoutProgram" ADD COLUMN IF NOT EXISTS "status" "WorkoutLibraryStatus" NOT NULL DEFAULT 'DRAFT';

-- Migrate existing data: isPublic=true -> ACTIVE, isPublic=false -> DRAFT
UPDATE "Workout" SET "status" = 'ACTIVE' WHERE "isPublic" = true;
UPDATE "Workout" SET "status" = 'DRAFT' WHERE "isPublic" = false;
UPDATE "WorkoutProgram" SET "status" = 'ACTIVE' WHERE "isPublic" = true;
UPDATE "WorkoutProgram" SET "status" = 'DRAFT' WHERE "isPublic" = false;

-- Drop old isPublic columns
ALTER TABLE "Workout" DROP COLUMN IF EXISTS "isPublic";
ALTER TABLE "WorkoutProgram" DROP COLUMN IF EXISTS "isPublic";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_clientId_trainerId_key" ON "Conversation"("clientId", "trainerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_clientId_fkey'
    ) THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Conversation_trainerId_fkey'
    ) THEN
        ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Message_conversationId_fkey'
    ) THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Message_senderId_fkey'
    ) THEN
        ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

