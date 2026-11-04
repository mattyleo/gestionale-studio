// src/app/api/dashboard/route.ts
// API Dashboard — dati aggregati per KPI e grafici

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from 'date-fns'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') || 'mese-corrente'

  // Calcola intervallo date
  const oggi = new Date()
  let dal: Date, al: Date

  switch (periodo) {
    case 'mese-precedente':
      const mesePrecedente = subMonths(oggi, 1)
      dal = startOfMonth(mesePrecedente)
      al = endOfMonth(mesePrecedente)
      break
    case 'trimestre':
      dal = startOfMonth(subMonths(oggi, 2))
      al = endOfMonth(oggi)
      break
    case 'anno':
      dal = startOfYear(oggi)
      al = endOfYear(oggi)
      break
    default: // mese-corrente
      dal = startOfMonth(oggi)
      al = endOfMonth(oggi)
  }

  try {
    // 1. Attività da verificare
    const attivitaDaVerificare = await prisma.workEntry.count({
      where: {
        stato: { in: ['DA_CLASSIFICARE', 'DA_VERIFICARE'] },
        data: { gte: dal, lte: al },
      },
    })

    // 2. Valore attività non fatturate (approvate ma non ancora in fattura)
    const attivitaApprovate = await prisma.workEntry.aggregate({
      where: {
        stato: 'APPROVATA',
        data: { gte: dal, lte: al },
      },
      _sum: { importo: true },
    })
    const valoreNonFatturato = attivitaApprovate._sum.importo ?? 0

    // 3. Fatture in bozza (contiamo solo le bozze, escluse da fatturato emesso)
    const [bozzeCount, bozzeImporto] = await Promise.all([
      prisma.invoice.count({ where: { stato: { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] } } }),
      prisma.invoice.aggregate({
        where: { stato: { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] } },
        _sum: { totaleDocumento: true },
      }),
    ])

    // 4. Fatture emesse non saldate (da incassare)
    const fattureEmesse = await prisma.invoice.findMany({
      where: { stato: 'EMESSA' },
      include: {
        payments: { select: { importo: true } },
        company: { select: { ragioneSociale: true } },
        lines: { select: { importo: true, naturaIva: true, descrizione: true } },
      },
    })

    let totaleEmesso = 0
    let totaleIncassato = 0
    let totaleScaduto = 0
    let totaleArt15 = 0
    const aziendaMap = new Map<string, { ragioneSociale: string; emesso: number; incassato: number; ultimoPagamento: Date | null }>()

    for (const fattura of fattureEmesse) {
      const isNotaCredito =
        fattura.sezionale?.toUpperCase() === 'NC' ||
        fattura.numeroCompleto?.toUpperCase().includes('NC') ||
        fattura.note?.toLowerCase().includes('credito') ||
        fattura.note?.toLowerCase().includes('storno')

      const totale = Number(fattura.totaleDocumento)
      const incassatoFattura = fattura.payments.reduce((sum, p) => sum + Number(p.importo), 0)
      const residuo = totale - incassatoFattura

      let art15Fattura = 0
      if (!isNotaCredito && fattura.lines) {
        for (const l of fattura.lines) {
          const imp = Number(l.importo || 0)
          const isArt15 =
            l.naturaIva === 'N1' ||
            l.descrizione?.toLowerCase().includes('art. 15') ||
            l.descrizione?.toLowerCase().includes('spese vive') ||
            l.descrizione?.toLowerCase().includes('sanzione amministrativa non dovuta')
          if (isArt15) art15Fattura += imp
        }
      }

      if (isNotaCredito) {
        totaleEmesso -= totale
        totaleIncassato -= incassatoFattura
      } else {
        totaleEmesso += totale
        totaleIncassato += incassatoFattura
        totaleArt15 += art15Fattura
      }

      if (!isNotaCredito && residuo > 0 && fattura.dataScadenza && fattura.dataScadenza < oggi) {
        totaleScaduto += residuo
      }

      // Aggrega per azienda
      const aziendaId = fattura.companyId
      if (!aziendaMap.has(aziendaId)) {
        aziendaMap.set(aziendaId, {
          ragioneSociale: fattura.company.ragioneSociale,
          emesso: 0,
          incassato: 0,
          ultimoPagamento: null,
        })
      }
      const aziendaData = aziendaMap.get(aziendaId)!
      if (isNotaCredito) {
        aziendaData.emesso -= totale
        aziendaData.incassato -= incassatoFattura
      } else {
        aziendaData.emesso += (totale - art15Fattura)
        aziendaData.incassato += (incassatoFattura - art15Fattura)
      }
    }

    // 5. Grafico andamento mensile ultimi 6 mesi
    const mesi: { label: string; emesso: number; incassato: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const mese = subMonths(oggi, i)
      const meseStart = startOfMonth(mese)
      const meseEnd = endOfMonth(mese)

      const [fattureEmesseMese, pagamentiMese] = await Promise.all([
        prisma.invoice.aggregate({
          where: {
            stato: 'EMESSA',
            emessaAl: { gte: meseStart, lte: meseEnd },
          },
          _sum: { totaleDocumento: true },
        }),
        prisma.payment.aggregate({
          where: {
            dataIncasso: { gte: meseStart, lte: meseEnd },
          },
          _sum: { importo: true },
        }),
      ])

      mesi.push({
        label: format(mese, 'MMM yyyy'),
        emesso: Number(fattureEmesseMese._sum.totaleDocumento ?? 0),
        incassato: Number(pagamentiMese._sum.importo ?? 0),
      })
    }

    return NextResponse.json({
      kpi: {
        attivitaDaVerificare,
        valoreNonFatturato: Number(valoreNonFatturato),
        bozzeCount,
        bozzeImporto: Number(bozzeImporto._sum.totaleDocumento ?? 0),
        daIncassare: +(totaleEmesso - totaleIncassato).toFixed(2),
        scaduto: +totaleScaduto.toFixed(2),
        fatturatoEmesso: +(totaleEmesso - totaleArt15).toFixed(2),
        fatturatoEmessoLordo: +totaleEmesso.toFixed(2),
        fatturatoIncassato: +(totaleIncassato - totaleArt15).toFixed(2),
        fatturatoIncassatoLordo: +totaleIncassato.toFixed(2),
        speseArt15: +totaleArt15.toFixed(2),
        ricaviCompensi: +(totaleIncassato - totaleArt15).toFixed(2),
      },
      grafico: mesi,
      aziende: Array.from(aziendaMap.entries()).map(([id, data]) => ({
        id,
        ...data,
        residuo: data.emesso - data.incassato,
      })),
    })
  } catch (error) {
    console.error('Errore dashboard:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
