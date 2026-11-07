// src/app/api/programmi/[id]/avvia/route.ts
// Lancia l'esecuzione del software sul computer dell'operatore (Linux / Windows)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { spawn } from 'child_process'

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const prog = await prisma.studioProgram.findUnique({
      where: { id: params.id },
    })

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

    // Esegui comando desktop in background disaccoppiato
    try {
      let child
      if (isWindows) {
        // Su Windows usa start per non bloccare
        child = spawn('cmd.exe', ['/c', 'start', '""', cmd!], {
          detached: true,
          stdio: 'ignore',
        })
      } else {
        // Su Linux usa nohup o bash
        child = spawn('sh', ['-c', `${cmd} >/dev/null 2>&1 &`], {
          detached: true,
          stdio: 'ignore',
        })
      }
      child.unref()

      return NextResponse.json({
        successo: true,
        tipo: 'desktop',
        messaggio: `Comando di avvio inviato per: ${prog.nome}`,
      })
    } catch (launchErr: any) {
      return NextResponse.json({
        successo: false,
        errore: `Impossibile avviare '${cmd}': verificare che il percorso del programma sia corretto nel sistema.`,
      }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Errore avvio programma:', err)
    return NextResponse.json({ error: 'Errore durante l\'avvio del programma' }, { status: 500 })
  }
}
