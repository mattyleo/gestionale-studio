@echo off
chcp 65001 >nul
title Gestionale Studio - Dott. Antonio Tuzio
color 0A

cd /d "%~dp0"

echo =======================================================================
echo          AVVIO GESTIONALE STUDIO - DOTT. ANTONIO TUZIO
echo =======================================================================
echo.

echo [1/3] Verifica e avvio database PostgreSQL su Docker...
docker compose up -d postgres >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENZIONE] Docker Desktop non e' ancora in esecuzione.
    echo.
    echo 1. Apri l'applicazione "Docker Desktop" dal menu Start di Windows.
    echo 2. Attendi 15-20 secondi che Docker si avvii completamente.
    echo 3. Rilancia questo file avvia-windows.bat.
    echo.
    pause
    exit /b 1
)
echo [OK] Database attivo su porta 5432.

echo.
echo [2/3] Allineamento schema database...
call npx prisma db push --skip-generate >nul 2>&1

echo.
echo [3/3] Apertura del browser su http://localhost:3000...
start "" "http://localhost:3000"

echo.
echo =======================================================================
echo   Il gestionale e' in funzione!
echo   Indirizzo:  http://localhost:3000
echo.
echo   Login:  infooizut@gmail.com
echo.
echo   Per terminare il programma chiudi questa finestra.
echo =======================================================================
echo.

npm run dev
pause
