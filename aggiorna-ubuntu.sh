#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Aggiornamento Automatico Gestionale Studio per Ubuntu Linux
# ─────────────────────────────────────────────────────────────
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================="
echo "       AGGIORNAMENTO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO"
echo "======================================================================="
echo ""

# 1. Verifica presenza repository Git o aggiornamento da pacchetto ZIP
if [ -d ".git" ]; then
    echo "[1/4] Download delle ultime modifiche da GitHub..."
    git fetch origin main || git fetch origin master || true
    LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

    if [ "$LOCAL" = "$REMOTE" ] && [ -n "$LOCAL" ]; then
        echo "[OK] Il gestionale è già allineato con GitHub."
    else
        echo "Trovata nuova versione su Git! Applicazione delle modifiche..."
        git pull || true
    fi
else
    echo "[1/4] Modalità aggiornamento da file (ZIP). Nessun repository Git locale, proseguo con i file presenti."
fi

echo ""
echo "[2/4] Verifica e allineamento dipendenze..."
npm install

echo ""
echo "[3/4] Aggiornamento schema database (senza toccare i dati esistenti)..."
npx prisma generate
npx prisma db push

echo ""
echo "[4/4] Ricompilazione applicazione per la produzione..."
npm run build

echo ""
echo "======================================================================="
echo "             AGGIORNAMENTO COMPLETATO CON SUCCESSO!                   "
echo "======================================================================="
echo ""
echo "Riavvio del servizio in corso..."

# Riavvia il gestionale se è gestito da PM2 o Docker, altrimenti notifica l'utente
if command -v pm2 &> /dev/null && pm2 list | grep -q "gestionale-studio"; then
    pm2 restart gestionale-studio
    echo "[OK] Servizio riavviato con PM2."
else
    echo "Puoi riavviare il programma normalmente con ./avvia-ubuntu.sh"
fi

echo "======================================================================="
