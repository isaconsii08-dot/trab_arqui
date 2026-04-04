-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('pending', 'active', 'returned', 'overdue', 'lost');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('waiting', 'available', 'fulfilled', 'cancelled', 'expired');

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "patron_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "loan_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "return_date" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'pending',
    "renewed_count" INTEGER NOT NULL DEFAULT 0,
    "staff_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "patron_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "reserve_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'waiting',
    "position" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "patron_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_patron_id_idx" ON "loans"("patron_id");

-- CreateIndex
CREATE INDEX "loans_item_id_idx" ON "loans"("item_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_due_date_idx" ON "loans"("due_date");

-- CreateIndex
CREATE INDEX "reservations_item_id_status_idx" ON "reservations"("item_id", "status");

-- CreateIndex
CREATE INDEX "reservations_patron_id_idx" ON "reservations"("patron_id");

-- CreateIndex
CREATE INDEX "fines_patron_id_idx" ON "fines"("patron_id");

-- CreateIndex
CREATE INDEX "outbox_events_published_created_at_idx" ON "outbox_events"("published", "created_at");

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
