// src/app/api/programmi/route.ts
// Gestione dei programmi e software ministeriali/esterni dello studio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEFAULT_PROGRAMMI } from '@/lib/programmi-default'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    let programmi = await prisma.studioProgram.findMany({
      orderBy: { ordinamento: 'asc' },
    })

    // Se la tabella è ancora vuota, inserisci automaticamente i software predefiniti
    if (programmi.length === 0) {
      for (const p of DEFAULT_PROGRAMMI) {
        await prisma.studioProgram.create({ data: p })
      }
      programmi = await prisma.studioProgram.findMany({
        orderBy: { ordinamento: 'asc' },
      })
    }

    return NextResponse.json({
      successo: true,
      programmi,
      sistemaOperativo: process.platform === 'win32' ? 'windows' : 'linux',
    })
  } catch (err: any) {
    console.warn('Tabella studio_programs non ancora presente o errore DB, fallback su programmi predefiniti:', err.message)
    // Fallback immediato: restituisce i programmi predefiniti con ID virtuali
    const fallbackList = DEFAULT_PROGRAMMI.map((p, idx) => ({
      id: `default-${idx}`,
      ...p,
      comandoLinux: p.comandoLinux || null,
      comandoWindows: p.comandoWindows || null,
      webUrl: p.webUrl || null,
      ordinamento: p.ordinamento,
      attivo: true,
    }))

    return NextResponse.json({
      successo: true,
      programmi: fallbackList,
      sistemaOperativo: process.platform === 'win32' ? 'windows' : 'linux',
      modalitaFallback: true,
    })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, nome, descrizione, categoria, icona, comandoLinux, comandoWindows, webUrl, ordinamento, attivo } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Il nome del programma è obbligatorio' }, { status: 400 })
    }

    let prog
    if (id) {
      prog = await prisma.studioProgram.update({
        where: { id },
        data: {
          nome: nome.trim(),
          descrizione: descrizione?.trim() || null,
          categoria: categoria || 'Fiscale',
          icona: icona || 'Monitor',
          comandoLinux: comandoLinux?.trim() || null,
          comandoWindows: comandoWindows?.trim() || null,
          webUrl: webUrl?.trim() || null,
          ordinamento: ordinamento !== undefined ? Number(ordinamento) : 0,
          attivo: attivo !== undefined ? Boolean(attivo) : true,
        },
      })
    } else {
      prog = await prisma.studioProgram.create({
        data: {
          nome: nome.trim(),
          descrizione: descrizione?.trim() || null,
          categoria: categoria || 'Fiscale',
          icona: icona || 'Monitor',
          comandoLinux: comandoLinux?.trim() || null,
          comandoWindows: comandoWindows?.trim() || null,
          webUrl: webUrl?.trim() || null,
          ordinamento: ordinamento !== undefined ? Number(ordinamento) : 0,
          attivo: attivo !== undefined ? Boolean(attivo) : true,
        },
      })
    }

    return NextResponse.json({ successo: true, programma: prog })
  } catch (err: any) {
    console.error('Errore POST /api/programmi:', err)
    return NextResponse.json({ error: 'Errore salvataggio programma' }, { status: 500 })
  }
}
