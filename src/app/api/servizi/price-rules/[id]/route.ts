// src/app/api/servizi/price-rules/[id]/route.ts
// Modifica ed eliminazione singola regola di prezzo (fascia o tariffa cliente)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const modificaRegolaSchema = z.object({
  prezzoUnitario: z.number().positive().optional(),
  tipoDitta: z.string().nullable().optional(),
  dipendentiMin: z.number().int().min(0).nullable().optional(),
  dipendentiMax: z.number().int().min(0).nullable().optional(),
  validaDal: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
  validaAl: z.string().nullable().optional().transform((s) => (s ? new Date(s) : null)),
  attiva: z.boolean().optional(),
  note: z.string().nullable().optional(),
})

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = modificaRegolaSchema.parse(body)

    const esistente = await prisma.priceRule.findUnique({ where: { id: params.id } })
    if (!esistente) {
      return NextResponse.json({ error: 'Regola di prezzo non trovata' }, { status: 404 })
    }

    const aggiornata = await prisma.priceRule.update({
      where: { id: params.id },
      data: {
        ...dati,
        prezzoUnitario: dati.prezzoUnitario !== undefined ? dati.prezzoUnitario : undefined,
        tipoDitta: dati.tipoDitta !== undefined ? dati.tipoDitta : undefined,
        dipendentiMin: dati.dipendentiMin !== undefined ? dati.dipendentiMin : undefined,
        dipendentiMax: dati.dipendentiMax !== undefined ? dati.dipendentiMax : undefined,
        note: dati.note !== undefined ? dati.note : undefined,
      },
      include: {
        service: { select: { codice: true, descrizione: true } },
        company: { select: { ragioneSociale: true } },
      },
    })

    return NextResponse.json(aggiornata)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento regola prezzo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const esistente = await prisma.priceRule.findUnique({ where: { id: params.id } })
    if (!esistente) {
      return NextResponse.json({ error: 'Regola di prezzo non trovata' }, { status: 404 })
    }

    await prisma.priceRule.delete({ where: { id: params.id } })

    return NextResponse.json({ eliminata: true, messaggio: 'Regola di prezzo eliminata con successo' })
  } catch (error) {
    console.error('Errore eliminazione regola prezzo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
