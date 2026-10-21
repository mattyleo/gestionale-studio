-- CreateTable
CREATE TABLE "company_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "nomeFile" TEXT NOT NULL,
    "nomeStorage" TEXT NOT NULL,
    "tipoDoc" TEXT NOT NULL DEFAULT 'altro',
    "mimeType" TEXT NOT NULL,
    "dimensione" INTEGER NOT NULL,
    "note" TEXT,
    "scadenza" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_documents_companyId_idx" ON "company_documents"("companyId");

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
