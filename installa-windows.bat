@echo off
chcp 65001 >nul
title Installatore Gestionale Studio - Dott. Antonio Tuzio
color 0B

echo =======================================================================
echo          GESTIONALE ATTIVITÀ E FATTURAZIONE PROFESSIONALE
echo             Installatore Automatico per Windows 11 Pro
echo =======================================================================
echo.

cd /d "%~dp0"

echo [1/5] Verifica prerequisiti di sistema...

:: Controlla se Docker è installato
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENZIONE] Docker non e' installato o non e' avviato.
    echo Per eseguire il database e' necessario Docker Desktop avviato.
    echo Scarica e installa Docker Desktop da: https://www.docker.com/products/docker-desktop/
    echo.
) else (
    echo [OK] Docker rilevato con successo.
)

:: Controlla se Node.js è installato
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENZIONE] Node.js non e' presente sul sistema.
    echo Scarica e installa Node.js v20 LTS da: https://nodejs.org/
    echo.
) else (
    echo [OK] Node.js rilevato con successo.
)

echo.
echo [2/5] Configurazione file ambiente (.env)...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] File .env creato da .env.example
    ) else (
        echo [!] File .env.example non trovato, creo .env base...
        echo DATABASE_URL="postgresql://postgres:password@localhost:5432/fattura_studio?schema=public" > .env
        echo NEXTAUTH_URL="http://localhost:3000" >> .env
        echo NEXTAUTH_SECRET="secret-tuzio-2026-prod-windows" >> .env
    )
) else (
    echo [OK] File .env gia' esistente.
)

echo.
echo [3/5] Avvio database PostgreSQL su Docker...
docker compose up -d postgres
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Impossibile avviare il container Docker PostgreSQL.
    echo Assicurati che Docker Desktop sia aperto e in esecuzione.
    pause
    exit /b 1
)

echo Attesa che PostgreSQL sia pronto (5 secondi)...
timeout /t 5 /nobreak >nul

echo.
echo [4/5] Inizializzazione schema database e tariffario studio...
if exist "node_modules" (
    echo Generazione client Prisma...
    call npx prisma generate
    echo Sincronizzazione tabelle database...
    call npx prisma db push
    echo Inserimento dati iniziali (profilo Dott. Tuzio e tariffario)...
    call npx tsx prisma/seed.ts
) else (
    echo Installazione dipendenze (npm install)...
    call npm install
    call npx prisma generate
    call npx prisma db push
    call npx tsx prisma/seed.ts
)

echo.
echo [5/5] Compilazione applicativa (npm run build)...
call npm run build

echo.
echo Creazione cartella upload documenti e cartella backup...
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

:: Creazione collegamento sul Desktop
set "DESKTOP_PATH=%USERPROFILE%\Desktop"
echo @echo off > "%DESKTOP_PATH%\Avvia Gestionale Studio.bat"
echo cd /d "%~dp0" >> "%DESKTOP_PATH%\Avvia Gestionale Studio.bat"
echo call avvia-windows.bat >> "%DESKTOP_PATH%\Avvia Gestionale Studio.bat"

echo.
echo =======================================================================
echo          INSTALLAZIONE COMPLETATA CON SUCCESSO!
echo =======================================================================
echo.
echo E' stato creato un collegamento sul Desktop: "Avvia Gestionale Studio"
echo.
echo Credenziali di accesso predefinite:
echo   - URL:      http://localhost:3000
echo   - Email:    infooizut@gmail.com
echo   - Password: Admin1234!
echo.
echo Per avviare subito il gestionale premi un tasto...
pause >nul

call avvia-windows.bat
