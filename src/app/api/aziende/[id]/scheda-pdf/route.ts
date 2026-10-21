// src/app/api/aziende/[id]/scheda-pdf/route.ts
// Genera e scarica il PDF Scheda Conto Cliente (Estratto Conto Dare/Avere)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaSchedaClientePDF, VoceScheda } from '@/lib/pdf/scheda-cliente-pdf'

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const params = await _params
  const aziendaId = params.id

  try {
    const azienda = await prisma.company.findUnique({
      where: { id: aziendaId },
      include: {
        invoices: {
          include: {
            payments: true,
            lines: { orderBy: { ordinamento: 'asc' } },
          },
          orderBy: { dataDocumento: 'asc' },
        },
        workEntries: {
          where: {
            stato: 'APPROVATA',
            invoiceLineId: null, // non ancora fatturate
          },
          include: {
            service: true,
          },
          orderBy: { data: 'asc' },
        },
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const emittenteDb = await prisma.issuerProfile.findFirst()
    if (!emittenteDb) {
      return NextResponse.json({ error: 'Profilo emittente non configurato' }, { status: 400 })
    }

    const vociIncassate: VoceScheda[] = []
    const vociDaIncassare: VoceScheda[] = []

    // 1. Elaborazione Fatture
    for (const inv of azienda.invoices) {
      if (inv.stato === 'ANNULLATA') continue

      const totDoc = Number(inv.totaleDocumento)
      const totPagato = inv.payments.reduce((acc, p) => acc + Number(p.importo), 0)
      const isSaldata = totPagato >= totDoc && totDoc > 0

      const dataStr = inv.dataDocumento
        ? new Date(inv.dataDocumento).toLocaleDateString('it-IT')
        : 'Data non def.'
      const numLabel = inv.numeroCompleto || `Fattura ${inv.numero || 'Bozza'}`

      // Se ha righe dettagliate, usiamo le descrizioni
      const descr = inv.lines.length > 0
        ? inv.lines.map((l) => l.descrizione).join(', ')
        : numLabel

      const voce: VoceScheda = {
        descrizione: `${numLabel} - ${descr}`,
        periodo: dataStr,
        imponibile: Number(inv.imponibile),
        cassa: Number(inv.totaleCassa),
        totale: totDoc,
      }

      if (isSaldata) {
        vociIncassate.push(voce)
      } else {
        vociDaIncassare.push(voce)
      }
    }

    // 2. Elaborazione Attività Approvate ma non ancora fatturate
    for (const we of (azienda as any).workEntries || []) {
      const imp = Number(we.importo || 0)
      const cassa = Math.round(imp * 4) / 100
      const tot = imp + cassa
      const desc = we.service?.descrizione || we.descrizione || 'Prestazione professionale'
      const dataStr = we.data ? new Date(we.data).toLocaleDateString('it-IT') : ''

      vociDaIncassare.push({
        descrizione: `Prestazione da fatturare: ${desc}`,
        periodo: dataStr,
        imponibile: imp,
        cassa,
        totale: tot,
      })
    }

    const pdfBuffer = await generaSchedaClientePDF({
      emittente: {
        denominazione: emittenteDb.denominazione,
        indirizzo: emittenteDb.indirizzo,
        cap: emittenteDb.cap,
        comune: emittenteDb.comune,
        provincia: emittenteDb.provincia,
        partitaIva: emittenteDb.partitaIva || '',
        codiceFiscale: emittenteDb.codiceFiscale,
        iban: emittenteDb.iban,
      },
      cliente: {
        ragioneSociale: azienda.ragioneSociale,
        partitaIva: azienda.partitaIva,
        codiceFiscale: azienda.codiceFiscale,
      },
      dataEstrazione: new Date(),
      vociIncassate,
      vociDaIncassare,
    })

    const safeName = azienda.ragioneSociale.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    const filename = `scheda_conto_${safeName}.pdf`

    return new Response(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Errore generazione scheda cliente PDF:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
