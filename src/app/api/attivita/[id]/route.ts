// src/app/api/attivita/[id]/route.ts
// GET, PUT, DELETE singola attività

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

const aggiornaAttivitaSchema = z.object({
  companyId: z.string().optional().nullable(),
  serviceId: z.string().optional().nullable(),
  data: z.string().transform(s => new Date(s)).optional(),
  descrizione: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  durataMinutiLavorati: z.number().int().min(0).optional().nullable(),
  durataMinutiFatturabili: z.number().int().min(0).optional().nullable(),
  quantita: z.number().positive().optional().nullable(),
  prezzoUnitario: z.number().min(0).optional().nullable(),
  prezzoManuale: z.boolean().optional(),
  motivazionePrezzoManuale: z.string().optional().nullable(),
  numeroDipendenti: z.number().int().min(1).optional().nullable(),
  tipoDitta: z.string().optional().nullable(),
  stato: z.enum(['DA_CLASSIFICARE', 'DA_VERIFICARE', 'APPROVATA', 'ESCLUSA']).optional(),
  motivazioneEsclusa: z.string().optional().nullable(),
})

export async function GET(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const attivita = await prisma.workEntry.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { ragioneSociale: true } },
      service: true,
      operatore: { select: { name: true } },
      calendarEvent: true,
      invoiceLine: { include: { invoice: { select: { numeroCompleto: true, stato: true } } } },
    },
  })

  if (!attivita) return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })
  return NextResponse.json(attivita)
}

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const attivita = await prisma.workEntry.findUnique({ where: { id: params.id } })
    if (!attivita) return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })

    if (['FATTURATA'].includes(attivita.stato)) {
      return NextResponse.json(
        { error: 'Le attività già fatturate non possono essere modificate' },
        { status: 400 }
      )
    }

    if (['IN_BOZZA_FATTURA'].includes(attivita.stato)) {
      return NextResponse.json(
        { error: 'L\'attività è già inclusa in una bozza di fattura. Annulla la bozza prima di modificarla.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const dati = aggiornaAttivitaSchema.parse(body)

    // Ricalcola importo se cambiano quantità o prezzo
    let importo = attivita.importo
    if (dati.quantita !== undefined || dati.prezzoUnitario !== undefined) {
      const q = dati.quantita ?? (attivita.quantita ? Number(attivita.quantita) : null)
      const p = dati.prezzoUnitario ?? (attivita.prezzoUnitario ? Number(attivita.prezzoUnitario) : null)
      if (q && p) {
        importo = new Decimal(q).mul(new Decimal(p))
      }
    }

    const aggiornata = await prisma.workEntry.update({
      where: { id: params.id },
      data: {
        ...dati,
        importo,
        quantita: dati.quantita !== undefined ? (dati.quantita ? new Decimal(dati.quantita) : null) : undefined,
        prezzoUnitario: dati.prezzoUnitario !== undefined ? (dati.prezzoUnitario ? new Decimal(dati.prezzoUnitario) : null) : undefined,
      },
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'WorkEntry',
        entityId: params.id,
        azione: 'UPDATED',
        dettagli: { campiModificati: Object.keys(dati) },
      },
    })

    return NextResponse.json(aggiornata)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento attività:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const attivita = await prisma.workEntry.findUnique({ where: { id: params.id } })
    if (!attivita) return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })

    if (['FATTURATA', 'IN_BOZZA_FATTURA'].includes(attivita.stato)) {
      return NextResponse.json(
        { error: 'Non è possibile eliminare attività fatturate o incluse in bozze' },
        { status: 400 }
      )
    }

    // Soft delete → ESCLUSA
    await prisma.workEntry.update({
      where: { id: params.id },
      data: {
        stato: 'ESCLUSA',
        motivazioneEsclusa: 'Eliminata manualmente',
      },
    })

    return NextResponse.json({ messaggio: 'Attività esclusa' })
  } catch (error) {
    console.error('Errore eliminazione attività:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
