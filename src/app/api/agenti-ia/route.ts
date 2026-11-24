// src/app/api/agenti-ia/route.ts
// API di controllo e interrogazione Hub Agenti IA Locali dello Studio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assureDbSchemaAligned } from '@/lib/db-align'
import {
  SQUADRA_AGENTI_STUDIO,
  elencoMemorieStudio,
  registraApprendimentoDottore,
  interrogaIaLocale,
} from '@/lib/ai/local-agent-hub'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()

    const { searchParams } = new URL(request.url)
    const filtroTipo = searchParams.get('tipo') || 'TUTTI'

    const memorie = await elencoMemorieStudio(filtroTipo)

    return NextResponse.json({
      successo: true,
      agenti: SQUADRA_AGENTI_STUDIO,
      memorieApprese: memorie,
      statistiche: {
        totaleRegoleApprese: memorie.length,
        agentiAttivi: SQUADRA_AGENTI_STUDIO.filter(a => a.stato === 'ATTIVO').length,
        motorePredefinito: 'IA Locale On-Premise (Zero Dati su Cloud)',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()
    const body = await request.json()

    // Azione 1: Registra nuova regola / apprendimento impartito dal Dottore
    if (body.action === 'apprendi') {
      const { tipo, chiavePattern, valoreRegola, istruzioniCustom } = body
      if (!tipo || !chiavePattern || !valoreRegola) {
        return NextResponse.json({ error: 'Parametri incompleti per l\'apprendimento' }, { status: 400 })
      }

      const memorizzato = await registraApprendimentoDottore({
        tipo,
        chiavePattern,
        valoreRegola,
        istruzioniCustom,
        creatoDa: session.user?.name || 'Dott. Antonio Tuzio',
      })

      return NextResponse.json({
        successo: true,
        messaggio: `Regola appresa con successo per "${chiavePattern}". L'IA ne terrà conto nelle prossime registrazioni.`,
        regola: memorizzato,
      })
    }

    // Azione 2: Interroga Agente Mastro / Sub-Agenti
    const { prompt, contesto } = body
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt mancante' }, { status: 400 })
    }

    const risultato = await interrogaIaLocale(prompt, contesto)

    return NextResponse.json({
      successo: true,
      quesito: prompt,
      risposta: risultato.risposta,
      motore: risultato.motore,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
