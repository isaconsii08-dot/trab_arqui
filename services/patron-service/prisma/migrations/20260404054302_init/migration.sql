-- CreateEnum
CREATE TYPE "PatronStatus" AS ENUM ('active', 'suspended', 'expired', 'blocked');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('administrator', 'librarian', 'assistant');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('pending', 'paid', 'waived');

-- CreateTable
CREATE TABLE "patrons" (
    "id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "password_hash" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PatronStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL DEFAULT 'librarian',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fines" (
    "id" TEXT NOT NULL,
    "patron_id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "fines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patrons_card_number_key" ON "patrons"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "patrons_email_key" ON "patrons"("email");

-- CreateIndex
CREATE INDEX "patrons_library_id_idx" ON "patrons"("library_id");

-- CreateIndex
CREATE INDEX "patrons_email_idx" ON "patrons"("email");

-- CreateIndex
CREATE INDEX "patrons_card_number_idx" ON "patrons"("card_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE INDEX "staff_library_id_idx" ON "staff"("library_id");

-- CreateIndex
CREATE INDEX "staff_email_idx" ON "staff"("email");

-- CreateIndex
CREATE INDEX "fines_patron_id_idx" ON "fines"("patron_id");

-- CreateIndex
CREATE INDEX "fines_status_idx" ON "fines"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "fines" ADD CONSTRAINT "fines_patron_id_fkey" FOREIGN KEY ("patron_id") REFERENCES "patrons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
