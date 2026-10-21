// src/app/api/servizi/route.ts
// CRUD servizi/tariffario

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const nuovoServizioSchema = z.object({
  codice: z.string().min(1).max(30),
  descrizione: z.string().min(1),
  unita: z.enum(['ORA', 'PRATICA', 'CEDOLINO', 'DICHIARAZIONE', 'MESE', 'QUANTITA', 'BUSTA_PAGA_FASCIA']),
  prezzoBase: z.number().positive().optional().nullable(),
  tariffaOraria: z.number().positive().optional().nullable(),
  aliquotaIva: z.string().default('0'),
  naturaIva: z.string().default('N2.2'),
  arrotondamento: z.enum(['COMMERCIALE', 'SEMPRE_SU', 'SEMPRE_GIU', 'QUARTO_ORA']).default('COMMERCIALE'),
  validoDal: z.string().optional().transform(s => s ? new Date(s) : undefined),
  validoAl: z.string().optional().nullable().transform(s => s ? new Date(s) : null),
  note: z.string().optional().nullable(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const soloAttivi = searchParams.get('soloAttivi') !== 'false'

  try {
    const servizi = await prisma.service.findMany({
      where: soloAttivi ? { attivo: true } : undefined,
      orderBy: { codice: 'asc' },
      include: {
        priceRules: {
          where: { attiva: true },
          include: {
            company: { select: { ragioneSociale: true } },
          },
          orderBy: [{ companyId: 'asc' }, { validaDal: 'desc' }],
        },
      },
    })

    return NextResponse.json({ servizi })
  } catch (error) {
    console.error('Errore elenco servizi:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = nuovoServizioSchema.parse(body)

    // Controlla se il codice esiste già
    const esistente = await prisma.service.findUnique({ where: { codice: dati.codice } })
    if (esistente) {
      return NextResponse.json(
        { error: `Esiste già un servizio con il codice "${dati.codice}"` },
        { status: 409 }
      )
    }

    const servizio = await prisma.service.create({
      data: {
        ...dati,
        prezzoBase: dati.prezzoBase ?? null,
        tariffaOraria: dati.tariffaOraria ?? null,
        note: dati.note ?? null,
      },
    })

    return NextResponse.json(servizio, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore creazione servizio:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
