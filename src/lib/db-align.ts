// src/lib/db-align.ts
// Allineamento automatico delle colonne e tabelle aggiunte recentemente (senza perdita dati)

import { prisma } from '@/lib/prisma'

let isAligned = false

async function executeSingleStatement(sql: string) {
  const trimmed = sql.trim()
  if (!trimmed) return
  try {
    await prisma.$executeRawUnsafe(trimmed)
  } catch (err: any) {
    // Ignora errori normali di colonna o indice già esistente
    if (
      !err.message?.includes('already exists') &&
      !err.message?.includes('duplicate column') &&
      !err.message?.includes('duplicate key')
    ) {
      console.warn('Avviso esecuzione SQL schema:', err?.message?.slice(0, 150))
    }
  }
}

export async function assureDbSchemaAligned() {
  if (isAligned) return

  try {
    // 1. Colonne aggiunte a company_documents
    await executeSingleStatement(`ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "codiceUnivoco" TEXT`)
    await executeSingleStatement(`ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "cartella" TEXT DEFAULT 'Altro'`)
    await executeSingleStatement(`ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "percorsoRelativo" TEXT`)
    await executeSingleStatement(`ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "scadenza" DATE`)
    await executeSingleStatement(`ALTER TABLE "company_documents" ADD COLUMN IF NOT EXISTS "annoCompetenza" INTEGER`)
    await executeSingleStatement(`CREATE UNIQUE INDEX IF NOT EXISTS "company_documents_codiceUnivoco_key" ON "company_documents"("codiceUnivoco")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_documents_cartella_idx" ON "company_documents"("cartella")`)

    // 2. Tabella studio_programs (se mancante)
    await executeSingleStatement(`
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
      )
    `)

    // 3. Tabella suppliers (se mancante)
    await executeSingleStatement(`
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
      )
    `)

    // 4. Tabella purchase_invoices (se mancante)
    await executeSingleStatement(`
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
      )
    `)

    // 5. Colonne contabili e fiscali su companies
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "dataInizioAttivita" DATE`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "periodicitaIva" TEXT DEFAULT 'TRIMESTRALE'`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "codiceAteco" TEXT`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "descrizioneAteco" TEXT`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "regimeContabile" TEXT DEFAULT 'SEMPLIFICATO'`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "gruppoAmmortamenti" TEXT`)
    await executeSingleStatement(`ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "registriIva" JSONB`)

    // 6. Tabella company_accounting_entries (Prima Nota e Registrazioni)
    await executeSingleStatement(`
      CREATE TABLE IF NOT EXISTS "company_accounting_entries" (
        "id" TEXT PRIMARY KEY,
        "companyId" TEXT NOT NULL,
        "dataRegistrazione" DATE NOT NULL,
        "dataCompetenza" DATE,
        "numeroDocumento" TEXT,
        "dataDocumento" DATE,
        "descrizione" TEXT NOT NULL,
        "contoDareCodice" TEXT,
        "contoDareNome" TEXT,
        "contoAvereCodice" TEXT,
        "contoAvereNome" TEXT,
        "importoDare" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "importoAvere" DECIMAL(12, 2) NOT NULL DEFAULT 0,
        "tipoRegistro" TEXT DEFAULT 'GENERALE',
        "registroCodice" TEXT DEFAULT 'A1',
        "protocollo" INTEGER,
        "anno" INTEGER,
        "codiceIvaCgn" TEXT,
        "naturaSdi" TEXT,
        "anagraficaSoggetto" TEXT,
        "isScritturaNoIva" BOOLEAN NOT NULL DEFAULT false,
        "aliquotaIva" DECIMAL(5, 2),
        "impostaIva" DECIMAL(12, 2),
        "reverseCharge" BOOLEAN NOT NULL DEFAULT false,
        "note" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "company_accounting_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "registroCodice" TEXT DEFAULT 'A1'`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "protocollo" INTEGER`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "anno" INTEGER`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "codiceIvaCgn" TEXT`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "naturaSdi" TEXT`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "anagraficaSoggetto" TEXT`)
    await executeSingleStatement(`ALTER TABLE "company_accounting_entries" ADD COLUMN IF NOT EXISTS "isScritturaNoIva" BOOLEAN DEFAULT false`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_accounting_entries_companyId_idx" ON "company_accounting_entries"("companyId")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_accounting_entries_dataRegistrazione_idx" ON "company_accounting_entries"("dataRegistrazione")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_accounting_entries_tipoRegistro_idx" ON "company_accounting_entries"("tipoRegistro")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_accounting_entries_registroCodice_idx" ON "company_accounting_entries"("registroCodice")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "company_accounting_entries_anno_protocollo_idx" ON "company_accounting_entries"("anno", "protocollo")`)

    // 7. Tabella studio_ai_memories (Apprendimento continuo IA Studio)
    await executeSingleStatement(`
      CREATE TABLE IF NOT EXISTS "studio_ai_memories" (
        "id" TEXT PRIMARY KEY,
        "tipo" TEXT NOT NULL,
        "chiavePattern" TEXT NOT NULL,
        "valoreRegola" JSONB NOT NULL,
        "confermeConteggio" INTEGER NOT NULL DEFAULT 1,
        "accuratezzaScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "istruzioniCustom" TEXT,
        "creatoDa" TEXT DEFAULT 'Dott. Antonio Tuzio',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "studio_ai_memories_tipo_chiavePattern_idx" ON "studio_ai_memories"("tipo", "chiavePattern")`)

    // 8. Tabella studio_knowledge_documents (Biblioteca Normativa & Manuali PDF RAG)
    await executeSingleStatement(`
      CREATE TABLE IF NOT EXISTS "studio_knowledge_documents" (
        "id" TEXT PRIMARY KEY,
        "titolo" TEXT NOT NULL,
        "descrizione" TEXT,
        "categoria" TEXT NOT NULL DEFAULT 'IVA & Fatturazione',
        "nomeFile" TEXT NOT NULL,
        "dimensioneBytes" INTEGER NOT NULL DEFAULT 0,
        "testoEstratto" TEXT NOT NULL,
        "pagineConteggio" INTEGER NOT NULL DEFAULT 1,
        "annoRiferimento" TEXT DEFAULT '2025',
        "fonte" TEXT DEFAULT 'Studio Tuzio',
        "attivo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "studio_knowledge_documents_categoria_idx" ON "studio_knowledge_documents"("categoria")`)
    await executeSingleStatement(`CREATE INDEX IF NOT EXISTS "studio_knowledge_documents_attivo_idx" ON "studio_knowledge_documents"("attivo")`)

    isAligned = true
  } catch (err: any) {
    console.warn('Avviso allineamento schema runtime saltato o già presente:', err?.message)
  }
}
