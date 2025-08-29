-- CreateTable
CREATE TABLE "public"."ProgramDayAssignment" (
    "id" TEXT NOT NULL,
    "clientWorkoutProgramId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."WorkoutStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramDayAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramDayAssignment_clientWorkoutProgramId_dayNumber_key" ON "public"."ProgramDayAssignment"("clientWorkoutProgramId", "dayNumber");

-- AddForeignKey
ALTER TABLE "public"."ProgramDayAssignment" ADD CONSTRAINT "ProgramDayAssignment_clientWorkoutProgramId_fkey" FOREIGN KEY ("clientWorkoutProgramId") REFERENCES "public"."ClientWorkoutProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
