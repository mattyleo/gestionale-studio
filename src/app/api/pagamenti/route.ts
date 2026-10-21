// src/app/api/pagamenti/route.ts
// Registra pagamenti per una fattura

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

const nuovoPagamentoSchema = z.object({
  invoiceId: z.string(),
  importo: z.number().positive('L\'importo deve essere maggiore di zero'),
  dataValuta: z.string().transform(s => new Date(s)),
  dataIncasso: z.string().transform(s => new Date(s)),
  metodo: z.string().default('bonifico'),
  riferimento: z.string().optional(),
  note: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoiceId')
  const companyId = searchParams.get('companyId')
  const dal = searchParams.get('dal')
  const al = searchParams.get('al')

  try {
    const where: any = {}
    if (invoiceId) where.invoiceId = invoiceId
    if (companyId) where.invoice = { companyId }
    if (dal || al) {
      where.dataIncasso = {
        ...(dal && { gte: new Date(dal) }),
        ...(al && { lte: new Date(al) }),
      }
    }

    const pagamenti = await prisma.payment.findMany({
      where,
      orderBy: { dataIncasso: 'desc' },
      include: {
        invoice: {
          select: {
            numeroCompleto: true,
            totaleDocumento: true,
            company: { select: { ragioneSociale: true } },
          },
        },
      },
    })

    return NextResponse.json({ pagamenti })
  } catch (error) {
    console.error('Errore elenco pagamenti:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = nuovoPagamentoSchema.parse(body)

    // Carica la fattura con i pagamenti esistenti
    const fattura = await prisma.invoice.findUnique({
      where: { id: dati.invoiceId },
      include: { payments: { select: { importo: true } } },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    if (fattura.stato !== 'EMESSA') {
      return NextResponse.json(
        { error: 'Si possono registrare pagamenti solo su fatture emesse' },
        { status: 400 }
      )
    }

    // Calcola residuo corrente
    const totaleDocumento = new Decimal(fattura.totaleDocumento.toString())
    const totaleGiaPagato = fattura.payments.reduce(
      (sum, p) => sum.add(new Decimal(p.importo.toString())),
      new Decimal(0)
    )
    const residuo = totaleDocumento.sub(totaleGiaPagato)

    // Blocca pagamenti superiori al residuo
    const importoPagamento = new Decimal(dati.importo)
    if (importoPagamento.gt(residuo)) {
      return NextResponse.json(
        {
          error: `Importo superiore al residuo. Residuo: ${residuo.toFixed(2)} €, Importo inserito: ${importoPagamento.toFixed(2)} €`,
        },
        { status: 400 }
      )
    }

    const pagamento = await prisma.payment.create({
      data: {
        invoiceId: dati.invoiceId,
        importo: importoPagamento,
        dataValuta: dati.dataValuta,
        dataIncasso: dati.dataIncasso,
        metodo: dati.metodo,
        riferimento: dati.riferimento || null,
        note: dati.note || null,
        registratoDa: (session.user as any).id,
      },
    })

    // Verifica se la fattura è completamente pagata
    const nuovoTotalePagato = totaleGiaPagato.add(importoPagamento)
    const nuovoResiduo = totaleDocumento.sub(nuovoTotalePagato)

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Payment',
        entityId: pagamento.id,
        azione: 'PAYMENT_REGISTERED',
        dettagli: {
          invoiceId: dati.invoiceId,
          importo: dati.importo,
          residuoDopoIlPagamento: nuovoResiduo.toNumber(),
          pagataCompletamente: nuovoResiduo.lte(0),
        },
      },
    })

    return NextResponse.json({
      pagamento,
      residuo: nuovoResiduo.toNumber(),
      pagataCompletamente: nuovoResiduo.lte(0),
      messaggio: nuovoResiduo.lte(0)
        ? 'Fattura saldataa completamente. Spostata in "Incassate".'
        : `Pagamento registrato. Residuo: ${nuovoResiduo.toFixed(2)} €`,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore registrazione pagamento:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
