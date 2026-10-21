# crea-pacchetto-usb.ps1
# Prepara il file ZIP compatto pronto da copiare sulla chiavetta USB

$sourceDir = $PSScriptRoot
$destZip = Join-Path (Split-Path $sourceDir -Parent) "fattura-studio-installazione.zip"

Write-Host "Creazione del pacchetto di installazione..." -ForegroundColor Cyan

$excludeNames = @('node_modules', '.next', '.git')
$itemsToZip = Get-ChildItem -Path $sourceDir -Force | Where-Object { $excludeNames -notcontains $_.Name } | ForEach-Object { $_.FullName }

if (Test-Path $destZip) {
    Remove-Item $destZip -Force
}

Compress-Archive -Path $itemsToZip -DestinationPath $destZip -Force

$zipSizeMb = [Math]::Round((Get-Item $destZip).Length / 1MB, 2)
Write-Host "=======================================================================" -ForegroundColor Green
Write-Host "  PACCHETTO ZIP CREATO CON SUCCESSO!" -ForegroundColor Green
Write-Host "  Percorso:  $destZip" -ForegroundColor Yellow
Write-Host "  Peso:      $zipSizeMb MB (leggerissimo, si copia in 2 secondi sulla chiavetta)" -ForegroundColor Yellow
Write-Host "=======================================================================" -ForegroundColor Green
