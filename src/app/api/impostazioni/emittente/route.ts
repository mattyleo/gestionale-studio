// src/app/api/impostazioni/emittente/route.ts
// GET e PUT profilo emittente

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const aggiornaProfilo = z.object({
  denominazione: z.string().min(1),
  codiceFiscale: z.string().min(1),
  partitaIva: z.string().optional().nullable(),
  indirizzo: z.string().min(1),
  cap: z.string().min(5).max(5),
  comune: z.string().min(1),
  provincia: z.string().min(2).max(2),
  paese: z.string().default('IT'),
  telefono: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  pec: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  regimeFiscale: z.string().default('RF19'),
  cassaPrevidenziale: z.string().optional().nullable(),
  aliquotaCassa: z.number().min(0).max(100).default(4),
  rivalsa: z.boolean().default(true),
  bolloVirtuale: z.boolean().default(true),
  importoBollo: z.number().min(0).default(2),
  sogliaBollo: z.number().min(0).default(77.47),
  aliquotaIva: z.string().default('0'),
  naturaIva: z.string().default('N2.2'),
  noteDefaultFattura: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const emittente = await prisma.issuerProfile.findFirst()
  if (!emittente) {
    return NextResponse.json({ error: 'Profilo non configurato' }, { status: 404 })
  }
  return NextResponse.json(emittente)
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  // Solo admin
  const userRole = (session.user as any).role
  if (userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Accesso negato: solo gli amministratori possono modificare il profilo studio' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const dati = aggiornaProfilo.parse(body)

    let emittente = await prisma.issuerProfile.findFirst()

    if (emittente) {
      emittente = await prisma.issuerProfile.update({
        where: { id: emittente.id },
        data: dati,
      })
    } else {
      emittente = await prisma.issuerProfile.create({ data: dati })
    }

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'IssuerProfile',
        entityId: emittente.id,
        azione: 'UPDATED',
        dettagli: { denominazione: emittente.denominazione },
      },
    })

    return NextResponse.json(emittente)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento profilo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
