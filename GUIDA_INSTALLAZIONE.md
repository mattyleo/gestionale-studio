# 📦 Guida Installazione e Distribuzione Gestionale Studio
### Per Dott. Antonio Tuzio (Windows 11 Pro e Ubuntu Linux)

---

## 💡 Consiglio Architetturale per lo Studio (Importante!)

Il Dott. Tuzio ha due PC nello studio:
- **PC 1:** Windows 11 Pro
- **PC 2:** Ubuntu Linux

> [!IMPORTANT]
> **Non installare due database separati su entrambi i PC!**  
> Se installassi il programma come due istanze indipendenti, le fatture e le attività inserite su Windows non si vedrebbero su Ubuntu.  
> 
> **La configurazione ideale e professionale:**
> 1. Installa il gestionale sul **PC principale dello studio** (es. Windows 11 Pro o Ubuntu).
> 2. Dal **secondo PC** (e da qualsiasi Mac, portatile o tablet collegato alla stessa rete Wi-Fi/LAN dello studio), basta aprire Chrome o Firefox e digitare:  
>    `http://[INDIRIZZO-IP-DEL-PC-PRINCIPALE]:3000` (es. `http://192.168.1.50:3000`).
> 
> In questo modo **entrambi i PC lavorano simultaneamente sullo stesso database sincronizzato**, le fatture mantengono la numerazione univoca e i backup sono centralizzati.

---

## 🚀 Come preparare il pacchetto sulla Chiavetta USB

1. Copia l'intera cartella `fattura-studio` su una chiavetta USB (o hard disk esterno).
2. La cartella include già:
   - Tutto il codice sorgente
   - Gli script di installazione automatica:
     - `installa-windows.bat` e `avvia-windows.bat` (per Windows)
     - `installa-ubuntu.sh` e `avvia-ubuntu.sh` (per Ubuntu)
     - `docker-compose.yml` e `Dockerfile`
     - Il database schema e il tariffario iniziale dello studio
3. Porta la chiavetta sul PC del Dott. Tuzio e copia la cartella ad esempio in `C:\GestionaleStudio` (su Windows) o in `/home/utente/GestionaleStudio` (su Ubuntu).

---

## 🪟 Installazione su Windows 11 Pro

### Prerequisiti
1. **Docker Desktop**: installato e avviato (scaricabile da [docker.com](https://www.docker.com/products/docker-desktop/)).
2. **Node.js v20 LTS** (scaricabile da [nodejs.org](https://nodejs.org/)).

### Procedura con 1 Clic
1. Entra nella cartella `fattura-studio`.
2. Fai doppio clic su **`installa-windows.bat`**.
3. Lo script in automatico:
   - Configura il file `.env`
   - Avvia il database PostgreSQL su Docker
   - Inizializza le tabelle con lo schema Prisma e il tariffario
   - Compila l'applicazione di produzione
   - **Crea l'icona sul Desktop: "Avvia Gestionale Studio"**
   - Apre il browser su `http://localhost:3000`

### Uso Quotidiano su Windows
- Per avviare: fai doppio clic sull'icona sul Desktop **"Avvia Gestionale Studio"**.
- Per fare un backup di sicurezza: fai doppio clic su **`backup-database-windows.bat`** (crea un file `.sql` con data e ora nella cartella `backups/`).
- Per fermare: esegui **`ferma-windows.bat`** o chiudi la finestra del terminale.

---

## 🐧 Installazione su Ubuntu Linux

### Procedura con 1 Clic
1. Apri il terminale ed entra nella cartella:
   ```bash
   cd ~/GestionaleStudio
   ```
2. Rendi eseguibile ed avvia l'installatore:
   ```bash
   chmod +x installa-ubuntu.sh
   ./installa-ubuntu.sh
   ```
3. Lo script in automatico:
   - Installa Docker e Node.js se non sono già presenti sul sistema
   - Avvia PostgreSQL e configura il database
   - Crea l'icona lanciatore sulla Scrivania: **"Gestionale Studio"**
   - Apre il browser su `http://localhost:3000`

### Uso Quotidiano su Ubuntu
- Per avviare: doppio clic sull'icona **"Gestionale Studio"** sulla Scrivania (oppure `./avvia-ubuntu.sh` da terminale).
- Per fare un backup: esegui `./backup-database-ubuntu.sh`.
- Per fermare: esegui `./ferma-ubuntu.sh`.

---

## 🔑 Credenziali di Accesso Predefinite

- **Indirizzo:** `http://localhost:3000` (o `http://[IP-LAN]:3000`)
- **Email:** `infooizut@gmail.com`
- **Password:** `Admin1234!`
