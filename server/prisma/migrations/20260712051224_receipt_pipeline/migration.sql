-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "category" TEXT,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "date" TEXT,
ADD COLUMN     "lineItems" JSONB,
ADD COLUMN     "merchantName" TEXT,
ADD COLUMN     "smartNotes" TEXT,
ADD COLUMN     "travelInfo" JSONB;
