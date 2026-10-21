# 🍏 Guida Rapida di Installazione ed Esecuzione su MacBook Pro (macOS)

Questa guida ti permette di installare ed avviare l'intero gestionale sul tuo Mac in pochi minuti per la demo con il **Dott. Antonio Tuzio**.

---

## 1. Prerequisiti sul Mac

Assicurati di avere installato sul Mac:
1. **Node.js** (versione 18, 20 o 22 raccomandata):
   - Scaricabile da [nodejs.org](https://nodejs.org) (versione LTS) oppure con Homebrew:
     ```bash
     brew install node
     ```
2. **PostgreSQL** — puoi scegliere **Opzione A** (Docker) o **Opzione B** (Senza Docker, più leggero):
   - **Opzione A (Docker Desktop per Mac)**: [Scarica Docker Desktop per Mac](https://www.docker.com/products/docker-desktop/) (seleziona *Apple Silicon* per chip M1/M2/M3/M4 o *Intel*).
   - **Opzione B (Nativo con Homebrew - consigliato per batteria e velocità)**:
     ```bash
     brew install postgresql@16
     brew services start postgresql@16
     createdb fattura_studio
     ```

---

## 2. Come passare il progetto al Mac

Puoi trasferire la cartella `fattura-studio` dal tuo PC Windows al Mac con uno di questi metodi:
- **AirDrop / Chiavetta USB / Archivio ZIP**: comprimi la cartella `fattura-studio` (escludi `node_modules` e `.next` per fare in un attimo, peserà pochissimi MB).
- **Git** (se usi una repo privata su GitHub o GitLab):
  ```bash
  git clone <URL_DEL_TUO_REPO>
  cd fattura-studio
  ```

---

## 3. Installazione passo-passo sul Mac (Terminale)

Apri l'applicazione **Terminale** sul tuo Mac ed esegui:

### Passo 1: Entra nella cartella del progetto
```bash
cd percorso/della/cartella/fattura-studio
```

### Passo 2: Configura il file `.env`
Se non è già presente, copialo dall'esempio:
```bash
cp .env.example .env
```
*(Il file `.env` ha già la stringa di connessione preimpostata per il database locale).*

### Passo 3: Avvia il Database

- **Se usi Docker**:
  ```bash
  docker compose up -d
  ```
  *(Verifica che il container sia attivo con `docker ps`)*

- **Se usi PostgreSQL nativo Homebrew**:
  ```bash
  brew services start postgresql@16
  # Crea il database se non esiste:
  createdb fattura_studio 2>/dev/null || true
  ```
  *(Se usi Postgres nativo senza password, modifica nel file `.env` la riga `DATABASE_URL` con: `postgresql://localhost:5432/fattura_studio?schema=public`)*

### Passo 4: Installa le dipendenze
```bash
npm install
```

### Passo 5: Prepara il Database (Migrazioni + Dati Demo)
Esegui questi due comandi:
```bash
# 1. Crea le tabelle nel database
npx prisma migrate deploy

# 2. Carica i dati reali del Dott. Tuzio e le demo
npm run db:seed
```

Vedrai il messaggio:
```text
🌱 Avvio seed database...
✅ Utente admin creato: infooizut@gmail.com
✅ Profilo emittente creato: Dott. Antonio Tuzio
✅ Sequenza numerazione creata: FT/2026
✅ 35 Servizi e tariffe inseriti nel tariffario
✅ Fasce buste paga inserite
✅ 3 Aziende create con contratti e tariffe specifiche
✅ Attività demo e fattura FT 1/2026 create
🚀 Seed completato con successo!
```

### Passo 6: Avvia l'applicazione
```bash
npm run dev
```

Ora apri Safari o Chrome su:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 4. Credenziali di Accesso Demo

- **Email**: `infooizut@gmail.com`
- **Password**: `Admin1234!`

---

## 5. Scaletta consigliata per la Demo al Cliente

Per fare un figurone con il Dott. Tuzio, segui questo percorso:

1. **Login & Dashboard**:
   - Mostra i 4 KPI principali (Attività da verificare, Non fatturato, Bozze, Da incassare).
   - Mostra il grafico dell'andamento mensile e la tabella riepilogativa per azienda.
   - Sottolinea che **le bozze NON gonfiano il fatturato emesso**.

2. **Aziende & Documenti (Carta d'Identità)**:
   - Apri una scheda cliente (es. *Bianchi & Associati* o *Rossi S.r.l.*).
   - Mostra la tab **📎 Documenti & CI**: carica al volo una foto o PDF (fronte/retro carta d'identità o visura) con anteprima immediata e data di scadenza.

3. **Tariffario & Gestione Paghe**:
   - Mostra le 35 prestazioni precaricate dello studio.
   - Mostra il tab **Fasce Buste Paga** (Edilizia vs Ordinaria, scaglioni 1-20 dipendenti, oltre 20 dipendenti con prezzi differenziati).

4. **Attività & Calcolo Tariffario**:
   - Vai in **Attività** e clicca **Nuova Attività**:
     - Seleziona un'azienda e una prestazione (es. "Elaborazione cedolino").
     - Mostra come il prezzo unitario viene **autocalcolato al centesimo**.
     - Clicca **Approva** su un'attività in stato "Da verificare".

5. **Generazione Bozza Fattura Periodica**:
   - Vai in **Fatture → Bozze**.
   - Clicca **Genera bozze**: seleziona azienda e periodo.
   - Si crea la bozza con le attività approvate senza duplicati.
   - Apri il dettaglio bozza: evidenzia il banner *"Bozza — non emessa"*.

6. **Emissione & Documenti Fiscali**:
   - Clicca **Emetti fattura**:
     - Spiega che viene assegnato il progressivo ufficiale (es. `FT 2/2026`).
     - Viene applicata la **Cassa CNPADC 4%** e il **Bollo virtuale di € 2,00** (ex DPR 642/72).
   - Clicca sul pulsante **PDF**: genera e scarica il documento con intestazione Dott. Antonio Tuzio e Credem IBAN.
   - Clicca sul pulsante **XML FatturaPA**: genera il file XML v1.2 formattato secondo le specifiche dell'Agenzia delle Entrate pronto per lo SdI/Aruba.

7. **Incassi & Pagamenti**:
   - La fattura appare subito in **Da incassare** con evidenza dei giorni e dell'importo residuo.
   - Clicca **Registra pagamento**: inserisci un acconto (es. 500 €).
   - Mostra come il residuo scala in tempo reale.
   - Registra il saldo: la fattura scompare da *Da incassare* e passa automaticamente in **Incassate**!

8. **Report & Esportazione**:
   - Apri la sezione **Report**: visualizza i grafici a torta e a barre annuali e fai vedere il pulsante **Esporta CSV** per commercialisti/fogli di calcolo.

9. **Firma Sviluppatore**:
   - Mostra il footer nella sidebar e il tab **Impostazioni → Informazioni** con la tua firma professionale: **Leoni Mattia**, P.IVA, C.F., link al tuo sito [leonimattia.it](https://leonimattia.it) e recapiti.
