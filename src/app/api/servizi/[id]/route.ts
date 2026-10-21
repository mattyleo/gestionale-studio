// src/app/api/servizi/[id]/route.ts
// Modifica, recupero ed eliminazione singola voce di tariffario

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const aggiornaServizioSchema = z.object({
  descrizione: z.string().min(1).optional(),
  unita: z.enum(['ORA', 'PRATICA', 'CEDOLINO', 'DICHIARAZIONE', 'MESE', 'QUANTITA', 'BUSTA_PAGA_FASCIA']).optional(),
  prezzoBase: z.number().positive().optional().nullable(),
  tariffaOraria: z.number().positive().optional().nullable(),
  aliquotaIva: z.string().optional(),
  naturaIva: z.string().optional(),
  arrotondamento: z.enum(['COMMERCIALE', 'SEMPRE_SU', 'SEMPRE_GIU', 'QUARTO_ORA']).optional(),
  attivo: z.boolean().optional(),
  note: z.string().optional().nullable(),
})

export async function GET(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const servizio = await prisma.service.findUnique({
      where: { id: params.id },
      include: {
        priceRules: {
          include: {
            company: { select: { id: true, ragioneSociale: true } },
          },
          orderBy: { validaDal: 'desc' },
        },
        _count: {
          select: { workEntries: true },
        },
      },
    })

    if (!servizio) {
      return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })
    }

    return NextResponse.json(servizio)
  } catch (error) {
    console.error('Errore recupero servizio:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = aggiornaServizioSchema.parse(body)

    const esistente = await prisma.service.findUnique({ where: { id: params.id } })
    if (!esistente) {
      return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })
    }

    const servizioAggiornato = await prisma.service.update({
      where: { id: params.id },
      data: {
        ...dati,
        prezzoBase: dati.prezzoBase !== undefined ? dati.prezzoBase : undefined,
        tariffaOraria: dati.tariffaOraria !== undefined ? dati.tariffaOraria : undefined,
        note: dati.note !== undefined ? dati.note : undefined,
      },
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Service',
        entityId: params.id,
        azione: 'UPDATED',
        dettagli: { campiModificati: Object.keys(dati) },
      },
    })

    return NextResponse.json(servizioAggiornato)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento servizio:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const countWorkEntries = await prisma.workEntry.count({
      where: { serviceId: params.id },
    })

    if (countWorkEntries > 0) {
      // Ha attività collegate: disattiva invece di eliminare per integrità contabile
      const disattivato = await prisma.service.update({
        where: { id: params.id },
        data: { attivo: false },
      })

      await prisma.auditEvent.create({
        data: {
          userId: (session.user as any).id,
          entityType: 'Service',
          entityId: params.id,
          azione: 'DEACTIVATED',
          dettagli: { motivo: `Ha ${countWorkEntries} attività collegate, disattivato anziché eliminato` },
        },
      })

      return NextResponse.json({
        disattivato: true,
        messaggio: `Il servizio ha ${countWorkEntries} prestazioni registrate ed è stato disattivato invece di essere eliminato.`,
        servizio: disattivato,
      })
    }

    // Se non ha attività collegate, elimina eventuali price rules orfane e poi il servizio
    await prisma.priceRule.deleteMany({
      where: { serviceId: params.id },
    })

    await prisma.service.delete({
      where: { id: params.id },
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Service',
        entityId: params.id,
        azione: 'DELETED',
      },
    })

    return NextResponse.json({
      eliminato: true,
      messaggio: 'Servizio eliminato definitivamente dal tariffario.',
    })
  } catch (error) {
    console.error('Errore eliminazione servizio:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
