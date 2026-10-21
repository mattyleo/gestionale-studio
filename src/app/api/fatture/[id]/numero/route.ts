// src/app/api/fatture/[id]/numero/route.ts
// Modifica o rettifica del numero e della data di una fattura

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays } from 'date-fns'

const modificaNumeroSchema = z.object({
  numero: z.number().int().positive('Il numero fattura deve essere un intero positivo'),
  sezionale: z.string().min(1).max(10).default('FT'),
  dataDocumento: z.string().optional(),
})

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = modificaNumeroSchema.parse(body)

    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { company: true },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    const dataDoc = dati.dataDocumento ? new Date(dati.dataDocumento) : (fattura.dataDocumento || new Date())
    const anno = dataDoc.getFullYear()
    const sezionale = dati.sezionale.toUpperCase()

    // Verifica unicità: non deve esistere un'altra fattura con lo stesso numero/sezionale/anno
    const duplicato = await prisma.invoice.findFirst({
      where: {
        id: { not: params.id },
        anno,
        sezionale,
        numero: dati.numero,
        stato: { not: 'ANNULLATA' },
      },
    })

    if (duplicato) {
      return NextResponse.json(
        { error: `Esiste già una fattura emessa con numero ${sezionale} ${dati.numero}/${anno}` },
        { status: 409 }
      )
    }

    const numeroCompleto = `${sezionale} ${dati.numero}/${anno}`

    // Calcola eventuale nuova scadenza se la data è cambiata
    const termini = fattura.terminiPagamento ?? fattura.company.terminiPagamento ?? 30
    const scadenza = addDays(dataDoc, termini)

    // Esegui in transazione e aggiorna la sequenza contatore se necessario
    const fatturaAggiornata = await prisma.$transaction(async (tx) => {
      // Aggiorna la fattura
      const agg = await tx.invoice.update({
        where: { id: params.id },
        data: {
          numero: dati.numero,
          sezionale,
          anno,
          numeroCompleto,
          dataDocumento: dataDoc,
          dataScadenza: scadenza,
        },
      })

      // Se il numero è maggiore dell'ultimo numero della sequenza, allinea il contatore
      const sequenza = await tx.documentSequence.findFirst({
        where: { sezionale, anno },
      })

      if (sequenza && dati.numero > sequenza.ultimoNumero) {
        await tx.documentSequence.update({
          where: { id: sequenza.id },
          data: { ultimoNumero: dati.numero },
        })
      }

      return agg
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Invoice',
        entityId: params.id,
        azione: 'UPDATED',
        dettagli: {
          vecchioNumero: fattura.numeroCompleto,
          nuovoNumero: numeroCompleto,
          motivo: 'Modifica manuale numero fattura',
        },
      },
    })

    return NextResponse.json({
      success: true,
      messaggio: `Numero fattura aggiornato a ${numeroCompleto}`,
      fattura: fatturaAggiornata,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dati non validi' }, { status: 400 })
    }
    console.error('Errore aggiornamento numero fattura:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
