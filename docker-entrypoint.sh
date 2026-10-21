#!/bin/sh
set -e

echo "=========================================="
echo " Avvio Gestionale Studio (Next.js)"
echo "=========================================="

# Attendi che PostgreSQL sia raggiungibile
echo "Verifica connessione al database..."
until nc -z -v -w30 postgres 5432 2>/dev/null || nc -z -v -w30 db 5432 2>/dev/null || true; do
  echo "In attesa di PostgreSQL..."
  sleep 2
done

# Esegui sincronizzazione schema Prisma se presente
if [ -f "./prisma/schema.prisma" ]; then
  echo "Aggiornamento schema database (Prisma db push)..."
  npx prisma db push --skip-generate || true
fi

echo "Avvio server applicativo su porta 3000..."
exec node server.js
