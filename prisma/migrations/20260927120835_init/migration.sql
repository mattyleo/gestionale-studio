-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'READONLY');

-- CreateEnum
CREATE TYPE "TipoSoggetto" AS ENUM ('PERSONA_GIURIDICA', 'PERSONA_FISICA', 'DITTA_INDIVIDUALE', 'ASSOCIAZIONE', 'PA');

-- CreateEnum
CREATE TYPE "FatturazFrequenza" AS ENUM ('MENSILE', 'BIMESTRALE', 'TRIMESTRALE', 'SEMESTRALE', 'ANNUALE', 'MANUALE');

-- CreateEnum
CREATE TYPE "UnitaServizio" AS ENUM ('ORA', 'PRATICA', 'CEDOLINO', 'DICHIARAZIONE', 'MESE', 'QUANTITA', 'BUSTA_PAGA_FASCIA');

-- CreateEnum
CREATE TYPE "ArrotondamentoOre" AS ENUM ('COMMERCIALE', 'SEMPRE_SU', 'SEMPRE_GIU', 'QUARTO_ORA');

-- CreateEnum
CREATE TYPE "WorkEntryStato" AS ENUM ('DA_CLASSIFICARE', 'DA_VERIFICARE', 'APPROVATA', 'IN_BOZZA_FATTURA', 'FATTURATA', 'ESCLUSA');

-- CreateEnum
CREATE TYPE "WorkEntryOrigine" AS ENUM ('MANUALE', 'GOOGLE_CALENDAR', 'IMPORTAZIONE');

-- CreateEnum
CREATE TYPE "InvoiceStato" AS ENUM ('BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE', 'EMESSA', 'ANNULLATA');

-- CreateEnum
CREATE TYPE "TransmissionTipo" AS ENUM ('INVIO', 'REINVIO', 'NOTIFICA_ESITO');

-- CreateEnum
CREATE TYPE "TransmissionStato" AS ENUM ('DA_INVIARE', 'INVIATA', 'CONSEGNATA', 'MANCATA_CONSEGNA', 'SCARTATA', 'DA_CORREGGERE', 'ERRORE_TECNICO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "issuer_profiles" (
    "id" TEXT NOT NULL,
    "denominazione" TEXT NOT NULL,
    "codiceFiscale" TEXT NOT NULL,
    "partitaIva" TEXT,
    "indirizzo" TEXT NOT NULL,
    "cap" TEXT NOT NULL,
    "comune" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "paese" TEXT NOT NULL DEFAULT 'IT',
    "telefono" TEXT,
    "email" TEXT,
    "pec" TEXT,
    "iban" TEXT,
    "regimeFiscale" TEXT NOT NULL DEFAULT 'RF19',
    "cassaPrevidenziale" TEXT DEFAULT 'TC02',
    "aliquotaCassa" DECIMAL(5,2) NOT NULL DEFAULT 4,
    "rivalsa" BOOLEAN NOT NULL DEFAULT true,
    "bolloVirtuale" BOOLEAN NOT NULL DEFAULT true,
    "importoBollo" DECIMAL(10,2) NOT NULL DEFAULT 2.00,
    "sogliaBollo" DECIMAL(10,2) NOT NULL DEFAULT 77.47,
    "aliquotaIva" TEXT NOT NULL DEFAULT '0',
    "naturaIva" TEXT NOT NULL DEFAULT 'N2.2',
    "logoUrl" TEXT,
    "templatePdf" TEXT NOT NULL DEFAULT 'default',
    "noteDefaultFattura" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_sequences" (
    "id" TEXT NOT NULL,
    "issuerId" TEXT NOT NULL,
    "sezionale" TEXT NOT NULL DEFAULT 'FT',
    "anno" INTEGER NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "ragioneSociale" TEXT NOT NULL,
    "tipoSoggetto" "TipoSoggetto" NOT NULL DEFAULT 'PERSONA_GIURIDICA',
    "codiceFiscale" TEXT,
    "partitaIva" TEXT,
    "indirizzo" TEXT,
    "cap" TEXT,
    "comune" TEXT,
    "provincia" TEXT,
    "paese" TEXT NOT NULL DEFAULT 'IT',
    "codiceDestinatarioSdi" TEXT,
    "pec" TEXT,
    "emailAmministrativa" TEXT,
    "referente" TEXT,
    "telefono" TEXT,
    "note" TEXT,
    "modalitaPagamento" TEXT DEFAULT 'MP05',
    "terminiPagamento" INTEGER DEFAULT 30,
    "ibanRiferimento" TEXT,
    "frequenzaFatturazione" "FatturazFrequenza" NOT NULL DEFAULT 'MENSILE',
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "archiviata" BOOLEAN NOT NULL DEFAULT false,
    "dataArchiviazione" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valore" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_history_snapshots" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "motivo" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "company_history_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "descrizione" TEXT NOT NULL,
    "unita" "UnitaServizio" NOT NULL,
    "prezzoBase" DECIMAL(10,2),
    "tariffaOraria" DECIMAL(10,2),
    "aliquotaIva" TEXT NOT NULL DEFAULT '0',
    "naturaIva" TEXT NOT NULL DEFAULT 'N2.2',
    "arrotondamento" "ArrotondamentoOre" NOT NULL DEFAULT 'COMMERCIALE',
    "validoDal" TIMESTAMP(3),
    "validoAl" TIMESTAMP(3),
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_rules" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "companyId" TEXT,
    "dipendentiMin" INTEGER,
    "dipendentiMax" INTEGER,
    "tipoDitta" TEXT,
    "prezzoUnitario" DECIMAL(10,2) NOT NULL,
    "validaDal" TIMESTAMP(3) NOT NULL,
    "validaAl" TIMESTAMP(3),
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "accountEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "syncToken" TEXT,
    "ultimaSync" TIMESTAMP(3),
    "ultimoErrore" TEXT,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "selected_calendars" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "colore" TEXT,
    "sincronizza" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "selected_calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "googleCalendarId" TEXT NOT NULL,
    "ricorrenzaId" TEXT,
    "titolo" TEXT NOT NULL,
    "descrizione" TEXT,
    "dataInizio" TIMESTAMP(3) NOT NULL,
    "dataFine" TIMESTAMP(3) NOT NULL,
    "fusoOrario" TEXT,
    "durataMinuti" INTEGER,
    "statoGoogle" TEXT,
    "rawData" JSONB,
    "importato" BOOLEAN NOT NULL DEFAULT false,
    "importatoAl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "serviceId" TEXT,
    "operatoreId" TEXT,
    "calendarEventId" TEXT,
    "data" DATE NOT NULL,
    "descrizione" TEXT,
    "note" TEXT,
    "durataMinutiLavorati" INTEGER,
    "durataMinutiFatturabili" INTEGER,
    "quantita" DECIMAL(10,4),
    "prezzoUnitario" DECIMAL(10,2),
    "priceRuleId" TEXT,
    "prezzoManuale" BOOLEAN NOT NULL DEFAULT false,
    "motivazionePrezzoManuale" TEXT,
    "importo" DECIMAL(10,2),
    "numeroDipendenti" INTEGER,
    "tipoDitta" TEXT,
    "stato" "WorkEntryStato" NOT NULL DEFAULT 'DA_CLASSIFICARE',
    "motivazioneEsclusa" TEXT,
    "origine" "WorkEntryOrigine" NOT NULL DEFAULT 'MANUALE',
    "invoiceLineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT,
    "numero" INTEGER,
    "sezionale" TEXT DEFAULT 'FT',
    "anno" INTEGER,
    "numeroCompleto" TEXT,
    "companyId" TEXT NOT NULL,
    "dataDocumento" TIMESTAMP(3),
    "dataScadenza" TIMESTAMP(3),
    "snapshotEmittente" JSONB,
    "snapshotCliente" JSONB,
    "imponibile" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totaleCassa" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totaleIva" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "bollo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totaleDocumento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "modalitaPagamento" TEXT,
    "terminiPagamento" INTEGER,
    "ibanDestinatario" TEXT,
    "stato" "InvoiceStato" NOT NULL DEFAULT 'BOZZA',
    "pdfUrl" TEXT,
    "xmlUrl" TEXT,
    "xmlHash" TEXT,
    "periodoDal" DATE,
    "periodoAl" DATE,
    "note" TEXT,
    "noteInterne" TEXT,
    "emessaAl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "descrizione" TEXT NOT NULL,
    "quantita" DECIMAL(10,4) NOT NULL,
    "prezzoUnitario" DECIMAL(10,2) NOT NULL,
    "importo" DECIMAL(10,2) NOT NULL,
    "aliquotaIva" TEXT NOT NULL DEFAULT '0',
    "naturaIva" TEXT NOT NULL DEFAULT 'N2.2',
    "serviceId" TEXT,
    "serviceCodice" TEXT,
    "serviceDescrizione" TEXT,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_transmissions" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tipo" "TransmissionTipo" NOT NULL DEFAULT 'INVIO',
    "stato" "TransmissionStato" NOT NULL DEFAULT 'DA_INVIARE',
    "arubaProtocollo" TEXT,
    "sdiFattura" TEXT,
    "sdiNotifica" TEXT,
    "tentativo" INTEGER NOT NULL DEFAULT 1,
    "ultimoTentativo" TIMESTAMP(3),
    "prossimoTentativo" TIMESTAMP(3),
    "errore" TEXT,
    "esitoRaw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_transmissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "importo" DECIMAL(10,2) NOT NULL,
    "dataValuta" DATE NOT NULL,
    "dataIncasso" DATE NOT NULL,
    "metodo" TEXT,
    "riferimento" TEXT,
    "note" TEXT,
    "registratoDa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "azione" TEXT NOT NULL,
    "dettagli" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "document_sequences_issuerId_sezionale_anno_key" ON "document_sequences"("issuerId", "sezionale", "anno");

-- CreateIndex
CREATE INDEX "companies_ragioneSociale_idx" ON "companies"("ragioneSociale");

-- CreateIndex
CREATE INDEX "companies_codiceFiscale_idx" ON "companies"("codiceFiscale");

-- CreateIndex
CREATE INDEX "companies_partitaIva_idx" ON "companies"("partitaIva");

-- CreateIndex
CREATE INDEX "company_history_snapshots_companyId_changedAt_idx" ON "company_history_snapshots"("companyId", "changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "services_codice_key" ON "services"("codice");

-- CreateIndex
CREATE INDEX "services_codice_idx" ON "services"("codice");

-- CreateIndex
CREATE INDEX "price_rules_serviceId_companyId_idx" ON "price_rules"("serviceId", "companyId");

-- CreateIndex
CREATE INDEX "price_rules_validaDal_validaAl_idx" ON "price_rules"("validaDal", "validaAl");

-- CreateIndex
CREATE UNIQUE INDEX "selected_calendars_connectionId_calendarId_key" ON "selected_calendars"("connectionId", "calendarId");

-- CreateIndex
CREATE INDEX "calendar_events_dataInizio_idx" ON "calendar_events"("dataInizio");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_googleEventId_googleCalendarId_key" ON "calendar_events"("googleEventId", "googleCalendarId");

-- CreateIndex
CREATE UNIQUE INDEX "work_entries_calendarEventId_key" ON "work_entries"("calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "work_entries_invoiceLineId_key" ON "work_entries"("invoiceLineId");

-- CreateIndex
CREATE INDEX "work_entries_data_idx" ON "work_entries"("data");

-- CreateIndex
CREATE INDEX "work_entries_companyId_data_idx" ON "work_entries"("companyId", "data");

-- CreateIndex
CREATE INDEX "work_entries_stato_idx" ON "work_entries"("stato");

-- CreateIndex
CREATE INDEX "invoices_companyId_stato_idx" ON "invoices"("companyId", "stato");

-- CreateIndex
CREATE INDEX "invoices_dataDocumento_idx" ON "invoices"("dataDocumento");

-- CreateIndex
CREATE INDEX "invoices_stato_idx" ON "invoices"("stato");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_numeroCompleto_key" ON "invoices"("numeroCompleto");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_transmissions_invoiceId_idx" ON "invoice_transmissions"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_dataIncasso_idx" ON "payments"("dataIncasso");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "issuer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_history_snapshots" ADD CONSTRAINT "company_history_snapshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "selected_calendars" ADD CONSTRAINT "selected_calendars_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "calendar_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_operatoreId_fkey" FOREIGN KEY ("operatoreId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "calendar_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_entries" ADD CONSTRAINT "work_entries_invoiceLineId_fkey" FOREIGN KEY ("invoiceLineId") REFERENCES "invoice_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "document_sequences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_transmissions" ADD CONSTRAINT "invoice_transmissions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_invoice_fk" FOREIGN KEY ("entityId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
