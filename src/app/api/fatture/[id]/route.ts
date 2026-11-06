// src/app/api/fatture/[id]/route.ts
// GET dettaglio fattura, PUT modifica bozza, DELETE annulla bozza

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        lines: {
          include: {
            workEntries: {
              include: {
                service: { select: { codice: true, descrizione: true } },
              },
            },
          },
          orderBy: { ordinamento: 'asc' },
        },
        payments: { orderBy: { dataIncasso: 'desc' } },
        transmissions: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    // Calcola residuo
    const incassato = fattura.payments.reduce((sum: number, p: any) => sum + Number(p.importo), 0)
    const residuo = Number(fattura.totaleDocumento) - incassato


    return NextResponse.json({ ...fattura, incassato, residuo })
  } catch (error) {
    console.error('Errore dettaglio fattura:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

const aggiornaFatturaSchema = z.object({
  note: z.string().optional().nullable(),
  noteInterne: z.string().optional().nullable(),
  modalitaPagamento: z.string().optional().nullable(),
  terminiPagamento: z.number().int().min(0).optional().nullable(),
  ibanDestinatario: z.string().optional().nullable(),
  dataScadenza: z.string().optional().nullable(),
  stato: z.enum(['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE']).optional(),
})

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({ where: { id: params.id } })
    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)

    const body = await request.json()
    const dati = aggiornaFatturaSchema.parse(body)

    // Se la fattura è già emessa/saldata, impedisci di retrocederla a bozza
    if (!isBozza && dati.stato && dati.stato !== fattura.stato) {
      return NextResponse.json(
        { error: 'Non è possibile retrocedere una fattura emessa allo stato di bozza' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (dati.note !== undefined) updateData.note = dati.note
    if (dati.noteInterne !== undefined) updateData.noteInterne = dati.noteInterne
    if (dati.modalitaPagamento !== undefined) updateData.modalitaPagamento = dati.modalitaPagamento
    if (dati.terminiPagamento !== undefined) updateData.terminiPagamento = dati.terminiPagamento
    if (dati.ibanDestinatario !== undefined) updateData.ibanDestinatario = dati.ibanDestinatario
    if (isBozza && dati.stato !== undefined) updateData.stato = dati.stato

    if (dati.dataScadenza !== undefined) {
      if (!dati.dataScadenza || dati.dataScadenza.trim() === '') {
        updateData.dataScadenza = null
      } else {
        const d = new Date(dati.dataScadenza)
        updateData.dataScadenza = isNaN(d.getTime()) ? null : d
      }
    }

    const aggiornata = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({
      ...aggiornata,
      messaggio: 'Fattura aggiornata con successo',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento fattura:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lines: { include: { workEntries: true } } },
    })

    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

    if (fattura.stato === 'EMESSA') {
      return NextResponse.json(
        { error: 'Le fatture emesse non possono essere annullate da qui. Contattare il supporto.' },
        { status: 400 }
      )
    }

    // Libera le attività collegate
    await prisma.$transaction(async (tx) => {
      // Riporta le attività ad APPROVATA
      for (const riga of fattura.lines) {
        if (riga.workEntries.length > 0) {
          await tx.workEntry.updateMany({
            where: { invoiceLineId: riga.id },
            data: { stato: 'APPROVATA', invoiceLineId: null },
          })
        }
      }

      // Annulla la fattura (soft delete)
      await tx.invoice.update({
        where: { id: params.id },
        data: { stato: 'ANNULLATA' },
      })
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Invoice',
        entityId: params.id,
        azione: 'ANNULLATA',
        dettagli: { attivitaLiberate: fattura.lines.flatMap(l => l.workEntries).length },
      },
    })

    return NextResponse.json({ messaggio: 'Bozza annullata. Le attività collegate sono state liberate per una nuova fatturazione.' })
  } catch (error) {
    console.error('Errore annullamento fattura:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
