// src/app/api/impostazioni/numerazione/route.ts
// Gestione contatori numerazione fatture (ultimo numero emesso, sezionali, anno)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const aggiornaNumerazioneSchema = z.object({
  anno: z.number().int().min(2000).max(2100),
  sezionale: z.string().min(1).max(10).default('FT'),
  ultimoNumero: z.number().int().min(0),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const emittente = await prisma.issuerProfile.findFirst()
  if (!emittente) return NextResponse.json({ error: 'Profilo emittente non trovato' }, { status: 404 })

  const annoCorrente = new Date().getFullYear()

  // Recupera tutte le sequenze dell'emittente
  const sequenze = await prisma.documentSequence.findMany({
    where: { issuerId: emittente.id },
    orderBy: [{ anno: 'desc' }, { sezionale: 'asc' }],
  })

  // Se non esiste ancora per l'anno corrente, creala
  let sequenzaCorrente = sequenze.find(s => s.anno === annoCorrente && s.sezionale === 'FT')
  if (!sequenzaCorrente) {
    sequenzaCorrente = await prisma.documentSequence.create({
      data: {
        issuerId: emittente.id,
        sezionale: 'FT',
        anno: annoCorrente,
        ultimoNumero: 0,
      },
    })
  }

  return NextResponse.json({
    sequenze: sequenze.map(s => ({
      id: s.id,
      sezionale: s.sezionale,
      anno: s.anno,
      ultimoNumero: s.ultimoNumero,
      prossimoNumero: s.ultimoNumero + 1,
      prossimoNumeroCompleto: `${s.sezionale} ${s.ultimoNumero + 1}/${s.anno}`,
    })),
    annoCorrente,
    corrente: {
      sezionale: sequenzaCorrente.sezionale,
      anno: sequenzaCorrente.anno,
      ultimoNumero: sequenzaCorrente.ultimoNumero,
      prossimoNumero: sequenzaCorrente.ultimoNumero + 1,
      prossimoNumeroCompleto: `${sequenzaCorrente.sezionale} ${sequenzaCorrente.ultimoNumero + 1}/${sequenzaCorrente.anno}`,
    },
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const userRole = (session.user as any).role
  if (userRole && userRole !== 'ADMIN' && userRole !== 'OPERATORE') {
    return NextResponse.json({ error: 'Accesso negato: permessi insufficienti per impostare la numerazione' }, { status: 403 })
  }

  const emittente = await prisma.issuerProfile.findFirst()
  if (!emittente) return NextResponse.json({ error: 'Profilo emittente non trovato' }, { status: 404 })

  try {
    const body = await request.json()
    const dati = aggiornaNumerazioneSchema.parse(body)

    const sequenza = await prisma.documentSequence.upsert({
      where: {
        issuerId_sezionale_anno: {
          issuerId: emittente.id,
          sezionale: dati.sezionale,
          anno: dati.anno,
        },
      },
      update: {
        ultimoNumero: dati.ultimoNumero,
      },
      create: {
        issuerId: emittente.id,
        sezionale: dati.sezionale,
        anno: dati.anno,
        ultimoNumero: dati.ultimoNumero,
      },
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'DocumentSequence',
        entityId: sequenza.id,
        azione: 'UPDATED',
        dettagli: {
          sezionale: sequenza.sezionale,
          anno: sequenza.anno,
          nuovoUltimoNumero: sequenza.ultimoNumero,
          prossimoNumero: sequenza.ultimoNumero + 1,
        },
      },
    })

    return NextResponse.json({
      messaggio: `Contatore aggiornato: la prossima fattura sarà ${sequenza.sezionale} ${sequenza.ultimoNumero + 1}/${sequenza.anno}`,
      sequenza,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento contatore numerazione:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
