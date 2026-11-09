// src/lib/db-align.ts
// Allineamento automatico delle colonne e tabelle aggiunte recentemente (senza perdita dati)

import { prisma } from '@/lib/prisma'

let isAligned = false

export async function assureDbSchemaAligned() {
  if (isAligned) return

  try {
    // 1. Colonne aggiunte a company_documents
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "codiceUnivoco" TEXT;
      ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "cartella" TEXT DEFAULT 'Altro';
      ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "percorsoRelativo" TEXT;
      ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "scadenza" DATE;
      ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "annoCompetenza" INTEGER;
    `)

    // 2. Indici per company_documents
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "company_documents_codiceUnivoco_key" ON "company_documents"("codiceUnivoco");
      CREATE INDEX IF NOT EXISTS "company_documents_cartella_idx" ON "company_documents"("cartella");
    `)

    // 3. Tabella studio_programs (se mancante)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "studio_programs" (
        "id" TEXT PRIMARY KEY,
        "nome" TEXT NOT NULL,
        "descrizione" TEXT,
        "categoria" TEXT NOT NULL DEFAULT 'Fiscale',
        "icona" TEXT DEFAULT 'Monitor',
        "comandoLinux" TEXT,
        "comandoWindows" TEXT,
        "webUrl" TEXT,
        "ordinamento" INTEGER NOT NULL DEFAULT 0,
        "attivo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 4. Tabella suppliers (se mancante)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" TEXT PRIMARY KEY,
        "ragioneSociale" TEXT NOT NULL,
        "tipoSoggetto" TEXT NOT NULL DEFAULT 'PERSONA_GIURIDICA',
        "partitaIva" TEXT,
        "codiceFiscale" TEXT,
        "indirizzo" TEXT,
        "cap" TEXT,
        "comune" TEXT,
        "provincia" TEXT,
        "paese" TEXT NOT NULL DEFAULT 'IT',
        "email" TEXT,
        "pec" TEXT,
        "telefono" TEXT,
        "referente" TEXT,
        "codiceDestinatarioSdi" TEXT DEFAULT '0000000',
        "iban" TEXT,
        "categoria" TEXT DEFAULT 'Generale',
        "note" TEXT,
        "attivo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // 5. Tabella purchase_invoices (se mancante)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "purchase_invoices" (
        "id" TEXT PRIMARY KEY,
        "supplierId" TEXT NOT NULL,
        "numero" TEXT NOT NULL,
        "dataDocumento" TIMESTAMP(3) NOT NULL,
        "tipoDocumento" TEXT NOT NULL DEFAULT 'TD01',
        "imponibile" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "totaleIva" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "totaleDocumento" DECIMAL(65,30) NOT NULL DEFAULT 0,
        "nomeFileXml" TEXT,
        "note" TEXT,
        "saldata" BOOLEAN NOT NULL DEFAULT false,
        "dataPagamento" TIMESTAMP(3),
        "metodoPagamento" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "purchase_invoices_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `)

    isAligned = true
  } catch (err: any) {
    console.warn('Avviso allineamento schema runtime saltato o già presente:', err?.message)
  }
}
