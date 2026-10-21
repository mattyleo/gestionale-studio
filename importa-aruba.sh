#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Importatore massivo fatture e anagrafiche Aruba XML/ZIP
# ─────────────────────────────────────────────────────────────
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ -z "$1" ]; then
    echo "======================================================================="
    echo "     IMPORTAZIONE MASSIVA FATTURE E ANAGRAFICHE ARUBA"
    echo "======================================================================="
    echo "Uso:"
    echo "  ./importa-aruba.sh <percorso_file_zip_o_cartella>"
    echo ""
    echo "Esempio:"
    echo "  ./importa-aruba.sh ~/Scaricati/fatture-aruba.zip"
    echo "  ./importa-aruba.sh ~/Documenti/fatture.zip"
    echo "======================================================================="
    exit 1
fi

npx tsx importa-aruba.ts "$@"
