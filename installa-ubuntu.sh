#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Installatore Gestionale Studio per Ubuntu Linux
# ─────────────────────────────────────────────────────────────

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================="
echo "       GESTIONALE ATTIVITÀ E FATTURAZIONE PROFESSIONALE"
echo "             Installatore Automatico per Ubuntu Linux"
echo "======================================================================="
echo ""

echo "[1/5] Verifica prerequisiti di sistema..."

# Controllo Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Docker non trovato. Installazione automatica con apt..."
    sudo apt update
    sudo apt install -y docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    echo "[OK] Docker installato. Potrebbe essere necessario riavviare la sessione per applicare i permessi utente."
else
    echo "[OK] Docker rilevato: $(docker --version)"
fi

# Controllo Node.js
if ! command -v node &> /dev/null; then
    echo "[!] Node.js non trovato. Installazione di Node.js v20 LTS..."
    sudo apt update
    sudo apt install -y curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "[OK] Node.js installato: $(node --version)"
else
    echo "[OK] Node.js rilevato: $(node --version)"
fi

echo ""
echo "[2/5] Configurazione file ambiente (.env)..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "[OK] File .env creato da .env.example"
    else
        echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/fattura_studio?schema=public"' > .env
        echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
        echo 'NEXTAUTH_SECRET="secret-tuzio-2026-prod-ubuntu"' >> .env
    fi
else
    echo "[OK] File .env già esistente."
fi

echo ""
echo "[3/5] Avvio database PostgreSQL tramite Docker..."
if docker compose ps >/dev/null 2>&1; then
    docker compose up -d postgres
else
    sudo docker compose up -d postgres
fi
echo "Attesa che PostgreSQL sia pronto ad accettare connessioni..."
for i in {1..30}; do
    if docker exec fattura-studio-db pg_isready -U postgres >/dev/null 2>&1 || sudo docker exec fattura-studio-db pg_isready -U postgres >/dev/null 2>&1; then
        echo "[OK] PostgreSQL è operativo!"
        break
    fi
    sleep 1
done

echo ""
echo "[4/5] Inizializzazione schema database e tariffario studio..."
# Se node_modules manca o proviene da copia Windows (mancano i binari nativi Linux), installa per Linux
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node" ]; then
    echo "Installazione/allineamento dipendenze per Ubuntu Linux (npm install)..."
    npm install
fi

echo "Generazione client Prisma..."
npx prisma generate
echo "Sincronizzazione tabelle database..."
npx prisma db push
echo "Inserimento dati iniziali (profilo Dott. Tuzio e tariffario)..."
npx tsx prisma/seed.ts

echo ""
echo "[5/5] Compilazione applicativa di produzione (npm run build)..."
npm run build

mkdir -p uploads backups

# Rendi eseguibili tutti gli script
chmod +x *.sh || true

# Crea icona lanciatore Desktop per Ubuntu
if [ -f "./crea-icona-desktop.sh" ]; then
    ./crea-icona-desktop.sh || true
fi

echo ""
echo "======================================================================="
echo "          INSTALLAZIONE COMPLETATA CON SUCCESSO!"
echo "======================================================================="
echo ""
echo "Credenziali di accesso predefinite:"
echo "  - URL:      http://localhost:3000"
echo "  - Email:    infooizut@gmail.com"
echo "  - Password: Admin1234!"
echo ""
read -p "Premi INVIO per avviare subito il gestionale..."
./avvia-ubuntu.sh
