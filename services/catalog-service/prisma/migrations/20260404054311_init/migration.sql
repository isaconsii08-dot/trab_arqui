-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('book', 'journal', 'audiovisual', 'map', 'archive', 'digital');

-- CreateTable
CREATE TABLE "bibliographic_records" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "uniform_title" TEXT,
    "edition" TEXT,
    "publication_year" INTEGER,
    "publisher" TEXT,
    "isbn" TEXT,
    "issn" TEXT,
    "summary" TEXT,
    "cover_image_url" TEXT,
    "material_type" "MaterialType" NOT NULL DEFAULT 'book',
    "library_id" TEXT NOT NULL,
    "es_indexed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bibliographic_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dates" TEXT,
    "authority_id" TEXT,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "authority_id" TEXT,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "record_authors" (
    "record_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'author',

    CONSTRAINT "record_authors_pkey" PRIMARY KEY ("record_id","author_id")
);

-- CreateTable
CREATE TABLE "record_subjects" (
    "record_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,

    CONSTRAINT "record_subjects_pkey" PRIMARY KEY ("record_id","subject_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bibliographic_records_isbn_key" ON "bibliographic_records"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "bibliographic_records_issn_key" ON "bibliographic_records"("issn");

-- CreateIndex
CREATE INDEX "bibliographic_records_library_id_idx" ON "bibliographic_records"("library_id");

-- CreateIndex
CREATE INDEX "bibliographic_records_isbn_idx" ON "bibliographic_records"("isbn");

-- CreateIndex
CREATE INDEX "bibliographic_records_publication_year_idx" ON "bibliographic_records"("publication_year");

-- CreateIndex
CREATE UNIQUE INDEX "authors_authority_id_key" ON "authors"("authority_id");

-- CreateIndex
CREATE INDEX "authors_name_idx" ON "authors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_authority_id_key" ON "subjects"("authority_id");

-- CreateIndex
CREATE INDEX "subjects_term_idx" ON "subjects"("term");

-- AddForeignKey
ALTER TABLE "record_authors" ADD CONSTRAINT "record_authors_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "bibliographic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_authors" ADD CONSTRAINT "record_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_subjects" ADD CONSTRAINT "record_subjects_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "bibliographic_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "record_subjects" ADD CONSTRAINT "record_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
