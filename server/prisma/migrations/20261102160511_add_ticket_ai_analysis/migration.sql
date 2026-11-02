-- CreateTable
CREATE TABLE "TicketAIAnalysis" (
    "id" SERIAL NOT NULL,
    "categorySuggested" "TicketCategory" NOT NULL,
    "categoryConfidence" DOUBLE PRECISION NOT NULL,
    "prioritySuggested" "TicketPriority" NOT NULL,
    "priorityConfidence" DOUBLE PRECISION NOT NULL,
    "prioritySource" TEXT NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "ticketId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TicketAIAnalysis_ticketId_key" ON "TicketAIAnalysis"("ticketId");

-- AddForeignKey
ALTER TABLE "TicketAIAnalysis" ADD CONSTRAINT "TicketAIAnalysis_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
