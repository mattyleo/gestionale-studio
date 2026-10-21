@echo off
chcp 65001 >nul
title Backup Database Gestionale Studio
color 0E

cd /d "%~dp0"

if not exist "backups" mkdir backups

:: Ottieni timestamp YYYYMMDD_HHMM
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
set TIMESTAMP=%dt:~0,4%%dt:~4,2%%dt:~6,2%_%dt:~8,2%%dt:~10,2%

set BACKUP_FILE=backups\backup_fattura_studio_%TIMESTAMP%.sql

echo =======================================================================
echo          BACKUP DATABASE - GESTIONALE STUDIO PROFESSIONALE
echo =======================================================================
echo.
echo Salvataggio in corso su: %BACKUP_FILE% ...

docker exec -t fattura-studio-db pg_dump -U postgres -d fattura_studio -F p > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESSO] Copia di sicurezza creata con successo!
    echo File generato: %BACKUP_FILE%
    echo.
    echo Puoi copiare questo file su una chiavetta USB o su cloud per sicurezza.
) else (
    echo.
    echo [ERRORE] Impossibile creare il backup. Assicurati che il database sia attivo.
)

echo.
pause
