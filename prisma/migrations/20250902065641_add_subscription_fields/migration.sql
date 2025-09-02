-- AlterTable
ALTER TABLE "public"."Client" ADD COLUMN     "subscriptionEnd" TIMESTAMP(3),
ADD COLUMN     "subscriptionPlan" TEXT DEFAULT 'BASIC',
ADD COLUMN     "subscriptionStart" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'INACTIVE';
