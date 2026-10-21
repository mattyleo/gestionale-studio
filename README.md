# Gestionale Fatturazione Studio Professionale

Applicazione web per la gestione di attività professionali, fatturazione elettronica e pagamenti.

## Stack Tecnologico

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL con Prisma ORM v5
- **Auth**: NextAuth.js v4
- **UI**: Tailwind CSS 4 + Radix UI + Recharts
- **PDF/XML**: Librerie da aggiungere nella fase 2

---

## Prerequisiti

- Node.js v18 o superiore
- PostgreSQL 14 o superiore in esecuzione in locale

---

## Installazione rapida

```bash
# 1. Installa le dipendenze
npm install

# 2. Crea il database PostgreSQL (con Docker — il più semplice)
docker run -d --name postgres-fattura -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fattura_studio -p 5432:5432 postgres:16

# 3. Configura l'ambiente (già preconfigurato per sviluppo locale)
copy .env.example .env

# 4. Crea le tabelle nel database
npm run db:migrate

# 5. Carica i dati demo
npm run db:seed

# 6. Avvia l'applicazione
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000)

**Credenziali demo:**
- Email: `infooizut@gmail.com`
- Password: `Admin1234!`

---

## Struttura del Progetto

```
fattura-studio/
├── prisma/
│   ├── schema.prisma      # Schema database completo
│   └── seed.ts            # Dati demo (tariffario Tuzio, aziende, fattura esempio)
├── src/
│   ├── app/
│   │   ├── api/           # Route API REST
│   │   │   ├── auth/      # NextAuth
│   │   │   ├── aziende/   # CRUD aziende (con storico modifiche)
│   │   │   ├── attivita/  # CRUD attività + approvazione
│   │   │   ├── fatture/   # Bozze + emissione + numerazione atomica
│   │   │   ├── pagamenti/ # Registrazione con controllo residuo
│   │   │   ├── servizi/   # Tariffario + fasce buste paga
│   │   │   └── dashboard/ # KPI aggregati + grafico mensile
│   │   ├── (dashboard)/   # Pagine protette (layout con sidebar)
│   │   └── login/         # Pagina di accesso
│   ├── components/
│   │   ├── ui/            # Button, Card, Dialog, Table, Toast, ecc.
│   │   └── layout/        # Sidebar, Header
│   ├── lib/
│   │   ├── prisma.ts      # Client Prisma singleton
│   │   ├── auth.ts        # Configurazione NextAuth
│   │   └── utils.ts       # formatEuro, formatData, calcoli tariffazione
│   └── middleware.ts      # Protezione automatica tutte le route
└── .env.example
```

---

## Configurazioni pre-produzione

> ⚠️ Validare con il commercialista prima dell'uso in produzione

In **Impostazioni → Studio**:
| Parametro | Valore preconfigurato | Da verificare |
|---|---|---|
| Regime fiscale | RF19 (Forfetario L.190/2014) | ✅ |
| Cassa previdenziale | TC02 - CNPADC 4% | ✅ |
| IVA | N2.2 (Non soggette) | ✅ |
| Bollo virtuale | €2,00 oltre €77,47 | ✅ |
| IBAN | IT89E0303212804010000063104 | Da verificare |

### Google Calendar
1. Crea progetto su [Google Cloud Console](https://console.cloud.google.com/)
2. Abilita Google Calendar API
3. Crea OAuth 2.0 Client ID (Web app)
4. Redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Inserisci le credenziali nel `.env`

### Aruba Fatturazione Elettronica
- Verifica con Aruba che il contratto includa accesso API
- [Documentazione API Aruba](https://fatturazioneelettronica.aruba.it/apidoc/docs.html)
- Se API non disponibili: download XML + upload manuale sul portale Aruba

---

## Comandi

```bash
npm run dev           # Sviluppo con hot-reload
npm run build         # Build produzione
npm run start         # Avvia in produzione

npm run db:generate   # Rigenera client Prisma (dopo modifiche schema)
npm run db:migrate    # Esegui migrazioni
npm run db:seed       # Dati demo
npm run db:studio     # GUI database (Prisma Studio)
npm run db:reset      # ⚠️ RESET COMPLETO (cancella tutto)
```

---

## Backup

```bash
# Backup
pg_dump -U postgres fattura_studio > backup_$(date +%Y%m%d_%H%M%S).sql

# Ripristino
psql -U postgres fattura_studio < backup_20261001_120000.sql
```

---

## Flusso di Lavoro

1. **Configurazione**: Impostazioni → verifica dati studio e tariffario
2. **Attività**: inserimento manuale o importazione da Google Calendar
3. **Approvazione**: classifica e approva le attività
4. **Bozza fattura**: Fatture → Bozze → Genera (seleziona azienda + periodo)
5. **Revisione**: controlla importi, IVA, cassa, bollo
6. **Emissione**: conferma → PDF + XML FatturaPA generati
7. **Invio SdI**: tramite Aruba o upload manuale
8. **Pagamenti**: registra incassi → fattura va in "Incassate" automaticamente

---

## Sviluppatore

**Leoni Mattia**  
P.IVA IT02801150356 · C.F. LNEMTT75D13H223Z  
Via Città di Pemba, 21 — 42100 Reggio Emilia (RE)  
Tel: [3770933621](tel:3770933621) · [leonimattia.it](https://leonimattia.it) · [info@leonimattia.it](mailto:info@leonimattia.it)

Software sviluppato su misura per studio professionale.  
© 2026 Leoni Mattia — Tutti i diritti riservati.

---

*Fatturazione elettronica conforme FatturaPA — Regime RF19 — Cassa CNPADC TC02*
