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
        lines: true,
      },
      orderBy: { dataDocumento: 'desc' },
    })

    let totaleEmesse = 0
    let totaleIncassate = 0
    let totaleResiduo = 0
    let totaleArt15 = 0

    const fattureConArt15: any[] = []

    const listaFatture = fatture.map((f) => {
      const isNC =
        f.sezionale?.toUpperCase() === 'NC' ||
        f.numeroCompleto?.toUpperCase().includes('NC') ||
        f.note?.toLowerCase().includes('credito') ||
        f.note?.toLowerCase().includes('storno')

      const totDoc = Number(f.totaleDocumento)
      const inc = f.payments.reduce((acc, p) => acc + Number(p.importo), 0)
      const res = Math.max(0, +(totDoc - inc).toFixed(2))

      // Calcola importo Art. 15 nelle righe
      let art15Doc = 0
      const righeArt15: any[] = []
      for (const l of f.lines) {
        const imp = Number(l.importo || 0)
        const isArt15 =
          l.naturaIva === 'N1' ||
          l.descrizione?.toLowerCase().includes('art. 15') ||
          l.descrizione?.toLowerCase().includes('spese vive') ||
          l.descrizione?.toLowerCase().includes('sanzione amministrativa non dovuta')

        if (isArt15) {
          art15Doc += imp
          righeArt15.push({
            descrizione: l.descrizione,
            importo: imp,
            naturaIva: l.naturaIva || 'N1',
          })
        }
      }

      if (isNC) {
        totaleEmesse -= totDoc
        totaleIncassate -= totDoc
      } else {
        totaleEmesse += totDoc
        totaleIncassate += inc
        totaleArt15 += art15Doc
      }
      totaleResiduo += (isNC ? 0 : res)

      if (art15Doc > 0 && !isNC) {
        fattureConArt15.push({
          id: f.id,
          numero: f.numeroCompleto,
          data: f.dataDocumento,
          cliente: f.company?.ragioneSociale || 'Sconosciuto',
          totaleDocumento: totDoc,
          importoArt15: +art15Doc.toFixed(2),
          ricaviCompensi: +(totDoc - art15Doc).toFixed(2),
          righe: righeArt15,
        })
      }

      return {
        id: f.id,
        numero: f.numeroCompleto,
        data: f.dataDocumento,
        cliente: f.company?.ragioneSociale || 'Sconosciuto',
        totaleDocumento: isNC ? -totDoc : totDoc,
        incassato: isNC ? -totDoc : inc,
        residuo: isNC ? 0 : res,
        saldata: isNC ? true : (res <= 0.05 && inc > 0),
        isNotaCredito: isNC,
        art15Importo: isNC ? 0 : +art15Doc.toFixed(2),
        ricaviCompensi: isNC ? -totDoc : +(inc - art15Doc).toFixed(2),
        note: f.note,
        sezionale: f.sezionale,
        haPagamenti: f.payments.length > 0 || isNC,
      }
    })

    const totaleRicaviGestionale = +(totaleIncassate - totaleArt15).toFixed(2)
    const deltaLordo = +(totaleIncassate - targetAruba).toFixed(2)
    const deltaRicavi = +(totaleRicaviGestionale - targetAruba).toFixed(2)

    // Cerca fatture sospette (es. con totale esattamente pari al delta di 225.46 o vicino)
    const candidateDelta = listaFatture.filter(
      (f) => Math.abs(f.totaleDocumento - Math.abs(deltaLordo)) < 0.05 || Math.abs(f.incassato - Math.abs(deltaLordo)) < 0.05
    )

    // Cerca possibili note di credito (metà delta o sezionale NC)
    const possibiliNoteCredito = listaFatture.filter(
      (f) =>
        Math.abs(f.totaleDocumento - Math.abs(deltaLordo / 2)) < 0.05 ||
        f.sezionale?.toUpperCase().includes('NC') ||
        f.numero?.toUpperCase().includes('NC')
    )

    return NextResponse.json({
      targetAruba,
      totaleGestionaleIncassato: +totaleIncassate.toFixed(2),
      totaleGestionaleArt15: +totaleArt15.toFixed(2),
      totaleGestionaleRicavi: totaleRicaviGestionale,
      totaleGestionaleEmesso: +totaleEmesse.toFixed(2),
      deltaLordo,
      deltaRicavi,
      delta: deltaRicavi, // Di default quadra con i ricavi escluso Art. 15
      isQuadraturaPerfetta: Math.abs(deltaRicavi) <= 0.05,
      conteggioFatture: listaFatture.length,
      fattureConArt15,
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
