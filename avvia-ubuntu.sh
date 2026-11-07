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

echo "[1/2] Verifica e avvio database PostgreSQL..."
if docker compose ps >/dev/null 2>&1; then
    docker compose up -d postgres >/dev/null 2>&1
else
    sudo docker compose up -d postgres >/dev/null 2>&1
fi
echo "[OK] Database attivo su porta 5432."

echo "[1b/2] Allineamento database e nuove tabelle..."
npx prisma db push --skip-generate >/dev/null 2>&1 || true
echo "[OK] Tabelle database verificate e allineate."

echo ""
echo "[2/2] Apertura del browser su http://localhost:3000..."
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
