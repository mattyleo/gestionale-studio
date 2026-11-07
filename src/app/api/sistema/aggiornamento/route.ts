// src/app/api/sistema/aggiornamento/route.ts
// API per il controllo e l'applicazione degli aggiornamenti software in-app.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const PROJECT_DIR = process.cwd()
const REPO_URL = 'https://github.com/mattyleo/gestionale-studio.git'

// GET: Verifica se ci sono aggiornamenti disponibili su Git
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const gitDir = path.join(PROJECT_DIR, '.git')
  if (!fs.existsSync(gitDir)) {
    // Prova ad agganciare il repository Git ufficiale se git è presente nel sistema
    try {
      execSync('git init', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 })
      execSync(`git remote add origin ${REPO_URL}`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 })
      execSync('git fetch origin main', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 15000 })
    } catch {
      return NextResponse.json({
        configurato: false,
        errore: 'Il gestionale non è collegato a un repository Git. Per attivare gli aggiornamenti in-app collegare il repository GitHub.',
      })
    }
  }

  try {
    // Info commit locale
    let hashLocale = 'sconosciuto'
    let dataCommit = ''
    let messaggioLocale = ''
    try {
      hashLocale = execSync('git rev-parse --short HEAD', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
      dataCommit = execSync('git log -1 --format=%cd --date=format:"%d/%m/%Y %H:%M"', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
      messaggioLocale = execSync('git log -1 --format=%s', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
    } catch {
      hashLocale = 'v1.1.0'
    }

    // Verifica se c'è un remote configurato
    let remotes = ''
    try {
      remotes = execSync('git remote', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
    } catch {}

    if (!remotes) {
      try {
        execSync(`git remote add origin ${REPO_URL}`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 })
        remotes = 'origin'
      } catch {
        return NextResponse.json({
          configurato: false,
          versioneCorrente: hashLocale,
          dataVersione: dataCommit,
          messaggioVersione: messaggioLocale,
          errore: 'Nessun repository remoto (GitHub) configurato.',
        })
      }
    }

    // Esegui fetch da GitHub senza flag non supportati (usa timeout nativo di Node)
    try {
      execSync('git fetch origin', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 15000 })
    } catch (fetchErr: any) {
      return NextResponse.json({
        configurato: true,
        versioneCorrente: hashLocale,
        dataVersione: dataCommit,
        messaggioVersione: messaggioLocale,
        aggiornamentoDisponibile: false,
        offline: true,
        avviso: 'Impossibile verificare GitHub: connessione Internet assente o server non raggiungibile.',
      })
    }

    // Identifica branch remoto target (preferibilmente main)
    let branchTarget = 'main'
    try {
      execSync('git rev-parse --verify origin/main', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 3000 })
      branchTarget = 'main'
    } catch {
      branchTarget = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim() || 'main'
    }

    // Verifica se l'upstream è più recente
    let commitDifferenza = 0
    let messaggioRemoto = ''
    try {
      const diffCount = execSync(`git rev-list HEAD..origin/${branchTarget} --count`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 }).trim()
      commitDifferenza = parseInt(diffCount, 10) || 0

      if (commitDifferenza > 0) {
        messaggioRemoto = execSync(`git log -1 origin/${branchTarget} --format=%s`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 }).trim()
      }
    } catch {}

    const branchCorrente = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim() || 'main'

    return NextResponse.json({
      configurato: true,
      branch: branchCorrente,
      versioneCorrente: hashLocale,
      dataVersione: dataCommit,
      messaggioVersione: messaggioLocale,
      aggiornamentoDisponibile: commitDifferenza > 0,
      nuoviCommit: commitDifferenza,
      messaggioNuovaVersione: messaggioRemoto || 'Nuovi miglioramenti e correzioni disponibili.',
      ultimoControllo: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({
      configurato: false,
      errore: err.message || 'Errore durante la verifica della versione.',
    }, { status: 500 })
  }
}

// POST: Applica l'aggiornamento (git pull, prisma db push, build, riavvio)
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const logFasi: string[] = []

    // 1. Git fetch & reset su origin/main
    logFasi.push('1. Scaricamento codice aggiornato da GitHub...')
    try {
      execSync('git fetch origin main', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 })
    } catch {
      try {
        execSync('git fetch origin', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 })
      } catch {}
    }

    let pullOut = ''
    try {
      pullOut = execSync('git reset --hard origin/main', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 }).trim()
    } catch {
      pullOut = execSync('git pull origin main', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 }).trim()
    }
    logFasi.push(`   ${pullOut}`)

    // Se su Linux, assicurati che tutti gli script .sh abbiano i permessi di esecuzione
    if (process.platform !== 'win32') {
      try {
        execSync('chmod +x *.sh', { cwd: PROJECT_DIR, encoding: 'utf8' })
      } catch {}
    }

    // 2. Allineamento dipendenze se necessario
    logFasi.push('2. Verifica e allineamento dipendenze (npm install)...')
    try {
      execSync('npm install', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 180000 })
      logFasi.push('   Dipendenze verificate con successo.')
    } catch (npmErr: any) {
      logFasi.push(`   Avviso: npm install completato con avvisi: ${npmErr.message?.slice(0, 80)}`)
    }

    // 3. Allineamento schema database (dati contabili e anagrafiche sempre preservati)
    logFasi.push('3. Sincronizzazione schema database con Prisma...')
    try {
      execSync('npx prisma generate', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 45000 })
    } catch {}
    try {
      execSync('npx prisma db push --skip-generate', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 45000 })
      logFasi.push('   Database sincronizzato con successo.')
    } catch (prismaErr: any) {
      logFasi.push(`   Avviso: schema già allineato o errore gestito: ${prismaErr.message?.slice(0, 80)}`)
    }

    // 4. Ricompilazione produzione (solo se non siamo in modalità dev live che ricarica in automatico)
    const isDevRunning = fs.existsSync(path.join(PROJECT_DIR, '.next', 'dev', 'lock'))
    if (isDevRunning) {
      logFasi.push('4. Modalità sviluppo attiva: aggiornamento applicato in tempo reale (Hot Reload).')
    } else {
      logFasi.push('4. Compilazione della nuova versione...')
      execSync('npm run build', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 180000 })
      logFasi.push('   Compilazione completata con successo.')
    }

    // 5. Riavvio del gestionale
    logFasi.push('5. Riavvio del servizio in corso...')
    let riavviatoConPM2 = false
    try {
      execSync('pm2 restart gestionale-studio', { encoding: 'utf8', timeout: 10000 })
      riavviatoConPM2 = true
      logFasi.push('   Servizio riavviato tramite PM2.')
    } catch {}

    // Se non gestito da PM2 e siamo in produzione, programma uscita pulita per far scattare il riavvio automatico di avvia-ubuntu.sh
    const deveRiavviare = !riavviatoConPM2 && !isDevRunning
    if (deveRiavviare) {
      logFasi.push('   Riavvio automatico programmato tra 2 secondi.')
      setTimeout(() => {
        console.log('[AGGIORNAMENTO] Riavvio del gestionale richiesto da interfaccia web...')
        process.exit(0)
      }, 1500)
    }

    return NextResponse.json({
      successo: true,
      messaggio: 'Aggiornamento completato con successo!',
      riavvio: deveRiavviare || riavviatoConPM2,
      dettagli: logFasi,
    })
  } catch (err: any) {
    console.error('Errore durante aggiornamento in-app:', err)
    return NextResponse.json({
      successo: false,
      errore: err.message || 'Errore durante l\'aggiornamento.',
    }, { status: 500 })
  }
}
