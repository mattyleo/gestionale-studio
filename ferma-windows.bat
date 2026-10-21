@echo off
chcp 65001 >nul
title Arresto Gestionale Studio
color 0C

cd /d "%~dp0"

echo =======================================================================
echo          ARRESTO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

echo Arresto del database PostgreSQL (i dati rimangono salvati)...
docker compose down

echo.
echo [OK] Servizi arrestati correttamente.
echo I dati contabili sono preservati in sicurezza.
echo.
pause
