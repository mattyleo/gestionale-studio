// src/app/api/fatture/quadratura/route.ts
// API di analisi per la quadratura degli incassi con Aruba

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const targetAruba = parseFloat(searchParams.get('aruba') || '26194.40')

  try {
    const fatture = await prisma.invoice.findMany({
      where: { stato: 'EMESSA' },
      include: {
        company: { select: { id: true, ragioneSociale: true } },
        payments: true,
      },
      orderBy: { dataDocumento: 'desc' },
    })

    let totaleEmesse = 0
    let totaleIncassate = 0
    let totaleResiduo = 0

    const listaFatture = fatture.map((f) => {
      const totDoc = Number(f.totaleDocumento)
      const inc = f.payments.reduce((acc, p) => acc + Number(p.importo), 0)
      const res = Math.max(0, +(totDoc - inc).toFixed(2))

      totaleEmesse += totDoc
      totaleIncassate += inc
      totaleResiduo += res

      return {
        id: f.id,
        numero: f.numeroCompleto,
        data: f.dataDocumento,
        cliente: f.company?.ragioneSociale || 'Sconosciuto',
        totaleDocumento: totDoc,
        incassato: inc,
        residuo: res,
        saldata: res <= 0.005 && inc > 0,
        note: f.note,
        sezionale: f.sezionale,
        haPagamenti: f.payments.length > 0,
      }
    })

    const delta = +(totaleIncassate - targetAruba).toFixed(2)

    // Cerca fatture sospette (es. con totale esattamente pari al delta di 225.46 o vicino)
    const candidateDelta = listaFatture.filter(
      (f) => Math.abs(f.totaleDocumento - Math.abs(delta)) < 0.05 || Math.abs(f.incassato - Math.abs(delta)) < 0.05
    )

    // Cerca possibili note di credito (metà delta o sezionale NC)
    const possibiliNoteCredito = listaFatture.filter(
      (f) =>
        Math.abs(f.totaleDocumento - Math.abs(delta / 2)) < 0.05 ||
        f.sezionale?.toUpperCase().includes('NC') ||
        f.numero?.toUpperCase().includes('NC')
    )

    return NextResponse.json({
      targetAruba,
      totaleGestionaleIncassato: +totaleIncassate.toFixed(2),
      totaleGestionaleEmesso: +totaleEmesse.toFixed(2),
      delta,
      conteggioFatture: listaFatture.length,
      candidateDelta,
      possibiliNoteCredito,
      fatture: listaFatture,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST per rettificare/scollegare un pagamento da una fattura non saldata in Aruba
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { invoiceId, azione } = await req.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'ID fattura mancante' }, { status: 400 })
    }

    if (azione === 'segna_da_incassare') {
      // Rimuove i pagamenti registrati per riportarla tra le fatture aperte / da incassare
      await prisma.payment.deleteMany({
        where: { invoiceId },
      })
      return NextResponse.json({ success: true, messaggio: 'Fattura reimpostata come DA INCASSARE' })
    }

    if (azione === 'elimina_fattura') {
      // Elimina fattura se era uno scarto o duplicato
      await prisma.payment.deleteMany({ where: { invoiceId } })
      await prisma.invoiceLine.deleteMany({ where: { invoiceId } })
      await prisma.invoice.delete({ where: { id: invoiceId } })
      return NextResponse.json({ success: true, messaggio: 'Fattura eliminata con successo' })
    }

    return NextResponse.json({ error: 'Azione non riconosciuta' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
