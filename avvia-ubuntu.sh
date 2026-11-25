#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Avvio Gestionale Studio per Ubuntu Linux
# ─────────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================="
echo "       AVVIO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO"
echo "======================================================================="
echo ""

# ─────────────────────────────────────────────────────────────
# 1. Verifica e Avvio Automatico del Servizio Docker di Sistema
# ─────────────────────────────────────────────────────────────
echo "[1/3] Verifica del servizio Docker di sistema..."

# Se il servizio Docker è spento o inattivo, avvialo automaticamente
if ! systemctl is-active --quiet docker 2>/dev/null && ! service docker status >/dev/null 2>&1; then
    echo "[INFO] Il servizio Docker è spento. Avvio automatico del servizio..."
    sudo systemctl start docker 2>/dev/null || sudo service docker start 2>/dev/null || true
    # Abilita Docker all'avvio del sistema così parte da solo all'accensione del PC
    sudo systemctl enable docker >/dev/null 2>&1 || true
    sleep 3
fi

# Aggiungi l'utente corrente al gruppo docker se non presente (evita richieste di password future)
if ! groups 2>/dev/null | grep -q '\bdocker\b'; then
    sudo usermod -aG docker "$USER" 2>/dev/null || true
fi

# ─────────────────────────────────────────────────────────────
# 2. Avvio Container PostgreSQL
# ─────────────────────────────────────────────────────────────
echo "[2/3] Verifica e avvio container PostgreSQL..."
if docker compose ps >/dev/null 2>&1; then
    docker compose up -d postgres >/dev/null 2>&1
elif sudo docker compose ps >/dev/null 2>&1; then
    sudo docker compose up -d postgres >/dev/null 2>&1
elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d postgres 2>/dev/null || sudo docker-compose up -d postgres 2>/dev/null || true
fi

# Attesa attiva disponibilità PostgreSQL sulla porta 5432 (fino a 20 secondi)
DB_PRONTO=false
for i in {1..20}; do
    if timeout 1 bash -c "</dev/tcp/localhost/5432" >/dev/null 2>&1 || nc -z localhost 5432 >/dev/null 2>&1; then
        DB_PRONTO=true
        break
    fi
    sleep 1
done

if [ "$DB_PRONTO" = true ]; then
    echo "[OK] Database PostgreSQL attivo su porta 5432."
else
    echo "[AVVISO] Tentativo di riavvio container PostgreSQL..."
    sudo docker compose restart postgres 2>/dev/null || docker compose restart postgres 2>/dev/null || true
    sleep 2
fi

echo "[2b/3] Allineamento database e nuove colonne/tabelle..."
npx prisma db push --accept-data-loss >/dev/null 2>&1 || true
echo "[OK] Schema database allineato."

echo ""
echo "[3/3] Apertura del browser su http://localhost:3000..."
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 &
elif command -v sensible-browser &> /dev/null; then
    sensible-browser "http://localhost:3000" >/dev/null 2>&1 &
fi

echo ""
echo "======================================================================="
echo "   Il gestionale è in funzione!"
echo "   Indirizzo Locale:  http://localhost:3000"
echo ""
echo "   Per accedere dagli altri PC dello studio collegati alla stessa"
echo "   rete Wi-Fi/LAN, apri il browser e digita l'IP di questo PC:"
echo "   http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "   Per terminare il programma premi CTRL + C."
echo "======================================================================="
echo ""

# ─────────────────────────────────────────────────────────────
# Ciclo di esecuzione continuo:
# Se il server viene riavviato (es. dopo aver cliccato "Aggiorna" dal gestionale),
# il ciclo riavvia automaticamente l'applicazione con la nuova versione aggiornata.
# ─────────────────────────────────────────────────────────────
while true; do
    # Verifica che le dipendenze di build esistano
    if [ ! -d "node_modules/@tailwindcss/postcss" ]; then
        echo "[INFO] Moduli di compilazione mancanti. Installazione in corso..."
        npm install --include=dev
    fi

    # Verifica se c'e' una nuova versione di codice da compilare
    CURRENT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo 'none')"
    LAST_BUILT_COMMIT=""
    if [ -f ".next/last_built_commit" ]; then
        LAST_BUILT_COMMIT="$(cat .next/last_built_commit 2>/dev/null)"
    fi

    if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ] || [ "$CURRENT_COMMIT" != "$LAST_BUILT_COMMIT" ]; then
        echo ""
        echo "[INFO] Aggiornamento codice rilevato (commit: $CURRENT_COMMIT). Compilazione in corso..."
        npm run build
        mkdir -p .next
        echo "$CURRENT_COMMIT" > .next/last_built_commit 2>/dev/null || true
        echo "[OK] Compilazione completata con successo."
        echo ""
    fi

    echo "[INFO] Avvio server Gestionale Studio in produzione..."
    if [ -f ".next/standalone/server.js" ]; then
        NODE_ENV=production node .next/standalone/server.js
    else
        npm run start
    fi
    EXIT_CODE=$?
    
    # Se interrotto dall'utente con CTRL+C (exit code 130), esci definitivamente
    if [ $EXIT_CODE -eq 130 ]; then
        echo ""
        echo "======================================================================="
        echo "          Gestionale terminato dall'utente (CTRL+C)."
        echo "======================================================================="
        break
    fi

    echo ""
    echo "======================================================================="
    echo "  Riavvio del gestionale in corso (nuova versione applicata)..."
    echo "======================================================================="
    sleep 2
done
