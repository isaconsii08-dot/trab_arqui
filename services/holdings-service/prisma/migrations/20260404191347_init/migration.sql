-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('available', 'loaned', 'reserved', 'maintenance', 'lost');

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Sala General',
    "call_number" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'available',
    "condition" TEXT NOT NULL DEFAULT 'bueno',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_barcode_key" ON "items"("barcode");

-- CreateIndex
CREATE INDEX "items_record_id_idx" ON "items"("record_id");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");
