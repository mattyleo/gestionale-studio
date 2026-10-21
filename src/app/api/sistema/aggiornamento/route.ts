// src/app/api/sistema/aggiornamento/route.ts
// API per il controllo e l'applicazione degli aggiornamenti software in-app.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const PROJECT_DIR = process.cwd()

// GET: Verifica se ci sono aggiornamenti disponibili su Git
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const gitDir = path.join(PROJECT_DIR, '.git')
  if (!fs.existsSync(gitDir)) {
    return NextResponse.json({
      configurato: false,
      errore: 'Il gestionale non è collegato a un repository Git.',
    })
  }

  try {
    // Info commit locale
    const hashLocale = execSync('git rev-parse --short HEAD', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
    const dataCommit = execSync('git log -1 --format=%cd --date=format:"%d/%m/%Y %H:%M"', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
    const messaggioLocale = execSync('git log -1 --format=%s', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()

    // Verifica se c'è un remote configurato
    let remotes = ''
    try {
      remotes = execSync('git remote', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim()
    } catch {}

    if (!remotes) {
      return NextResponse.json({
        configurato: false,
        versioneCorrente: hashLocale,
        dataVersione: dataCommit,
        messaggioVersione: messaggioLocale,
        errore: 'Nessun repository remoto (GitHub/GitLab) configurato.',
      })
    }

    // Tenta fetch con timeout di 6 secondi per non bloccare l'interfaccia se offline
    try {
      execSync('git fetch --timeout=6 origin', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 7000 })
    } catch {
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

    // Identifica branch corrente
    const branchCorrente = execSync('git rev-parse --abbrev-ref HEAD', { cwd: PROJECT_DIR, encoding: 'utf8' }).trim() || 'main'

    // Verifica se l'upstream è più recente
    let commitDifferenza = 0
    let messaggioRemoto = ''
    try {
      const diffCount = execSync(`git rev-list HEAD..origin/${branchCorrente} --count`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 }).trim()
      commitDifferenza = parseInt(diffCount, 10) || 0

      if (commitDifferenza > 0) {
        messaggioRemoto = execSync(`git log -1 origin/${branchCorrente} --format=%s`, { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 5000 }).trim()
      }
    } catch {}

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

// POST: Applica l'aggiornamento (git pull, prisma db push, build)
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const logFasi: string[] = []

    // 1. Git pull
    logFasi.push('1. Scaricamento codice aggiornato da GitHub...')
    const pullOut = execSync('git pull', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 }).trim()
    logFasi.push(`   ${pullOut}`)

    // 2. Allineamento dipendenze se necessario
    logFasi.push('2. Verifica dipendenze (npm install)...')
    execSync('npm install', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 120000 })

    // 3. Allineamento schema database (dati esistenti preservati)
    logFasi.push('3. Sincronizzazione database con Prisma...')
    execSync('npx prisma generate', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 })
    execSync('npx prisma db push', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 30000 })

    // 4. Ricompilazione produzione
    logFasi.push('4. Compilazione della nuova versione...')
    execSync('npm run build', { cwd: PROJECT_DIR, encoding: 'utf8', timeout: 120000 })

    // 5. Se PM2 è presente, riavvia
    try {
      execSync('pm2 restart gestionale-studio', { encoding: 'utf8', timeout: 10000 })
      logFasi.push('5. Servizio riavviato con PM2.')
    } catch {
      logFasi.push('5. Compilazione pronta.')
    }

    return NextResponse.json({
      successo: true,
      messaggio: 'Aggiornamento completato con successo!',
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
