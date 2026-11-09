// src/app/api/programmi/[id]/avvia/route.ts
// Lancia l'esecuzione del software sul computer dell'operatore (Linux / Windows)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_PROGRAMMI } from '@/lib/programmi-default'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    let prog: {
      nome: string
      comandoWindows: string | null
      comandoLinux: string | null
      webUrl: string | null
    } | null = null

    if (params.id.startsWith('default-')) {
      const idx = parseInt(params.id.replace('default-', ''), 10)
      if (!isNaN(idx) && DEFAULT_PROGRAMMI[idx]) {
        prog = DEFAULT_PROGRAMMI[idx]
      }
    }

    if (!prog) {
      try {
        prog = await prisma.studioProgram.findUnique({
          where: { id: params.id },
        })
      } catch (dbErr) {
        // Ignora errore DB se tabella non pronta
      }
    }

    if (!prog) {
      return NextResponse.json({ error: 'Programma non trovato' }, { status: 404 })
    }

    const isWindows = process.platform === 'win32'
    const cmd = isWindows ? prog.comandoWindows : prog.comandoLinux

    if (!cmd && !prog.webUrl) {
      return NextResponse.json({
        error: `Nessun comando o percorso configurato per ${isWindows ? 'Windows' : 'Linux'}.`,
      }, { status: 400 })
    }

    // Se c'è solo URL o comando non impostato, notifica di aprire il web
    if (!cmd && prog.webUrl) {
      return NextResponse.json({
        successo: true,
        tipo: 'web',
        url: prog.webUrl,
        messaggio: `Apertura portale web per ${prog.nome}`,
      })
    }

    // Prepara comando ed espandi tilde (~) o variabili di ambiente
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    let finalCmd = cmd || ''
    if (finalCmd.startsWith('~/')) {
      finalCmd = path.join(homeDir, finalCmd.slice(2))
    }
    if (!isWindows && !fs.existsSync(finalCmd) && fs.existsSync('/home/antonio')) {
      const fallbackAntonio = finalCmd.replace(homeDir, '/home/antonio')
      if (fs.existsSync(fallbackAntonio)) {
        finalCmd = fallbackAntonio
      }
    }

    // Se su Linux e il file esiste, assicurati che abbia i permessi di esecuzione (chmod +x)
    if (!isWindows && fs.existsSync(finalCmd)) {
      try {
        fs.chmodSync(finalCmd, 0o755)
      } catch {}
    }

    // Se su Linux e il file termina in .desktop, usa gio launch o gtk-launch
    if (!isWindows && finalCmd.endsWith('.desktop')) {
      finalCmd = `gio launch "${finalCmd}" || gtk-launch "${path.basename(finalCmd, '.desktop')}"`
    }

    // Ambiente grafico per Linux
    const envVars = {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ':0',
      WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY || 'wayland-0',
      XAUTHORITY: process.env.XAUTHORITY || (homeDir ? path.join(homeDir, '.Xauthority') : undefined),
    }

    // Esegui comando desktop in background disaccoppiato
    try {
      let child
      if (isWindows) {
        // Su Windows usa start per non bloccare
        child = spawn('cmd.exe', ['/c', 'start', '""', finalCmd], {
          detached: true,
          stdio: 'ignore',
          env: envVars,
        })
      } else {
        // Su Linux usa bash con variabili grafiche per visualizzare la finestra sul desktop dell'operatore
        let bashCmd = finalCmd
        // Se il percorso contiene spazi ed è un file/eseguibile (senza pipe/operatori), racchiudilo tra virgolette
        if (bashCmd.includes(' ') && !bashCmd.startsWith('"') && !bashCmd.startsWith("'") && !bashCmd.includes('||') && !bashCmd.includes('&&')) {
          bashCmd = `"${bashCmd}"`
        }
        child = spawn('bash', ['-c', `${bashCmd} >/dev/null 2>&1 &`], {
          detached: true,
          stdio: 'ignore',
          env: envVars,
        })
      }
      child.unref()

      return NextResponse.json({
        successo: true,
        tipo: 'desktop',
        messaggio: `Software avviato con successo sul computer: ${prog.nome}`,
      })
    } catch (launchErr: any) {
      return NextResponse.json({
        successo: false,
        errore: `Impossibile avviare '${finalCmd}': verificare che il percorso del programma sia corretto nel sistema.`,
      }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Errore avvio programma:', err)
    return NextResponse.json({ error: 'Errore durante l\'avvio del programma' }, { status: 500 })
  }
}
