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

echo ""
echo "[2/2] Apertura del browser su http://localhost:3000..."
sleep 2
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v sensible-browser &> /dev/null; then
    sensible-browser "http://localhost:3000" &
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

npm run start || npm run dev
