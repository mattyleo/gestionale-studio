#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Arresto Gestionale Studio per Ubuntu Linux
# ─────────────────────────────────────────────────────────────

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "Arresto dei container Docker (i dati rimangono salvati)..."
if docker compose ps >/dev/null 2>&1; then
    docker compose down
else
    sudo docker compose down
fi

echo "[OK] Servizi arrestati correttamente."
