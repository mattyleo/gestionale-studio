// src/app/api/servizi/price-rules/route.ts
// Creazione e lista regole di prezzo (fasce CCNL/paghe e tariffe specifiche per cliente)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const nuovaRegolaSchema = z.object({
  serviceId: z.string().min(1),
  companyId: z.string().nullable().optional(),
  tipoDitta: z.string().nullable().optional(),
  dipendentiMin: z.number().int().min(0).nullable().optional(),
  dipendentiMax: z.number().int().min(0).nullable().optional(),
  prezzoUnitario: z.number().positive(),
  validaDal: z.string().optional().transform((s) => (s ? new Date(s) : new Date('2025-01-01'))),
  validaAl: z.string().nullable().optional().transform((s) => (s ? new Date(s) : null)),
  note: z.string().nullable().optional(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId')
  const serviceId = searchParams.get('serviceId')

  try {
    const where: any = {}
    if (companyId !== null && companyId !== undefined) {
      where.companyId = companyId === 'null' ? null : companyId
    }
    if (serviceId) {
      where.serviceId = serviceId
    }

    const priceRules = await prisma.priceRule.findMany({
      where,
      include: {
        service: { select: { codice: true, descrizione: true, unita: true } },
        company: { select: { id: true, ragioneSociale: true } },
      },
      orderBy: [{ serviceId: 'asc' }, { validaDal: 'desc' }],
    })

    return NextResponse.json({ priceRules })
  } catch (error) {
    console.error('Errore recupero regole prezzo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = nuovaRegolaSchema.parse(body)

    const service = await prisma.service.findUnique({ where: { id: dati.serviceId } })
    if (!service) {
      return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })
    }

    if (dati.companyId) {
      const company = await prisma.company.findUnique({ where: { id: dati.companyId } })
      if (!company) {
        return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 })
      }
    }

    const priceRule = await prisma.priceRule.create({
      data: {
        serviceId: dati.serviceId,
        companyId: dati.companyId ?? null,
        tipoDitta: dati.tipoDitta ?? null,
        dipendentiMin: dati.dipendentiMin ?? null,
        dipendentiMax: dati.dipendentiMax ?? null,
        prezzoUnitario: dati.prezzoUnitario,
        validaDal: dati.validaDal ?? new Date('2025-01-01'),
        validaAl: dati.validaAl ?? null,
        attiva: true,
        note: dati.note ?? null,
      },
      include: {
        service: { select: { codice: true, descrizione: true } },
        company: { select: { ragioneSociale: true } },
      },
    })

    return NextResponse.json(priceRule, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore creazione regola prezzo:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
