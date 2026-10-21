#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Script per ripulire il database e prepararlo all'importazione
# ─────────────────────────────────────────────────────────────
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "======================================================================="
echo "   PULIZIA DATABASE GESTIONALE STUDIO - DOTT. ANTONIO TUZIO"
echo "======================================================================="
echo ""
echo "Questo comando rimuoverà tutte le aziende demo, le fatture di test,"
echo "le attività e i pagamenti, lasciando intatti il tuo account e il tariffario."
echo ""
read -p "Sei sicuro di voler procedere con la pulizia? (s/N): " CONFERMA

if [[ ! "$CONFERMA" =~ ^[sSyY]$ ]]; then
    echo "Operazione annullata."
    exit 0
fi

echo ""
npx tsx pulisci-db.ts

echo ""
echo "Operazione completata. Ora puoi importare il file ZIP di Aruba con:"
echo "  ./importa-aruba.sh <percorso-file-aruba.zip>"
echo ""
