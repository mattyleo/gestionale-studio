// src/app/api/dashboard/route.ts
// API Dashboard — dati aggregati per KPI e grafici (12 mesi Gen-Dic allineati ad Aruba)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns'

const MESI_NOMI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get('periodo') || 'anno'

  // Calcola intervallo date
  const oggi = new Date()
  let dal: Date, al: Date

  switch (periodo) {
    case 'mese-corrente':
      dal = startOfMonth(oggi)
      al = endOfMonth(oggi)
      break
    case 'mese-precedente': {
      const mesePrecedente = subMonths(oggi, 1)
      dal = startOfMonth(mesePrecedente)
      al = endOfMonth(mesePrecedente)
      break
    }
    case 'trimestre':
      dal = startOfMonth(subMonths(oggi, 2))
      al = endOfMonth(oggi)
      break
    case 'anno':
    default:
      dal = startOfYear(oggi)
      al = endOfYear(oggi)
      break
  }

  try {
    // 1. Attività da verificare
    const attivitaDaVerificare = await prisma.workEntry.count({
      where: {
        stato: { in: ['DA_CLASSIFICARE', 'DA_VERIFICARE'] },
        ...(periodo !== 'anno' ? { data: { gte: dal, lte: al } } : {}),
      },
    })

    // 2. Valore attività non fatturate (approvate ma non ancora in fattura)
    const attivitaApprovate = await prisma.workEntry.aggregate({
      where: {
        stato: 'APPROVATA',
        ...(periodo !== 'anno' ? { data: { gte: dal, lte: al } } : {}),
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

    // 4. Fatture emesse
    const fattureEmesse = await prisma.invoice.findMany({
      where: { stato: 'EMESSA' },
      include: {
        payments: { select: { importo: true, dataIncasso: true } },
        company: { select: { ragioneSociale: true } },
        lines: { select: { importo: true, naturaIva: true, descrizione: true } },
      },
      orderBy: { dataDocumento: 'asc' },
    })

    // Determina l'anno di riferimento per il grafico 12 mesi (Gen - Dic)
    const annoCorrente = oggi.getFullYear()
    const haFattureAnnoCorrente = fattureEmesse.some(f => {
      const d = f.dataDocumento || f.emessaAl || f.createdAt
      return d && new Date(d).getFullYear() === annoCorrente
    })
    const annoGrafico = haFattureAnnoCorrente
      ? annoCorrente
      : (fattureEmesse.length > 0
          ? new Date(
              fattureEmesse[fattureEmesse.length - 1].dataDocumento ||
              fattureEmesse[fattureEmesse.length - 1].emessaAl ||
              fattureEmesse[fattureEmesse.length - 1].createdAt
            ).getFullYear()
          : annoCorrente)

    // Inizializza sempre tutti i 12 mesi da Gennaio a Dicembre
    const mesi: { label: string; emesso: number; incassato: number }[] = MESI_NOMI.map((nome) => ({
      label: nome,
      emesso: 0,
      incassato: 0,
    }))

    let totaleEmesso = 0
    let totaleIncassato = 0
    let totaleDaIncassare = 0
    let totaleScaduto = 0
    let totaleArt15 = 0
    const aziendaMap = new Map<string, { ragioneSociale: string; emesso: number; incassato: number; residuo: number; ultimoPagamento: Date | null }>()

    for (const fattura of fattureEmesse) {
      const dataRif = new Date(fattura.dataDocumento || fattura.emessaAl || fattura.createdAt)
      const isNotaCredito =
        fattura.sezionale?.toUpperCase() === 'NC' ||
        fattura.numeroCompleto?.toUpperCase().includes('NC') ||
        fattura.note?.toLowerCase().includes('credito') ||
        fattura.note?.toLowerCase().includes('storno')

      const totale = Number(fattura.totaleDocumento)
      const incassatoFattura = fattura.payments.reduce((sum, p) => sum + Number(p.importo), 0)
      const residuoRaw = totale - incassatoFattura
      const residuo = !isNotaCredito && residuoRaw > 0.05 ? residuoRaw : 0

      // Il "Da incassare" e lo "Scaduto" sono sempre globali su tutte le fatture aperte
      if (!isNotaCredito) {
        totaleDaIncassare += residuo
        if (residuo > 0 && fattura.dataScadenza && fattura.dataScadenza < oggi) {
          totaleScaduto += residuo
        }
      }

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

      const ricavoNetto = isNotaCredito ? -totale : (totale - art15Fattura)
      const incassatoNetto = isNotaCredito
        ? -(incassatoFattura > 0 ? incassatoFattura : totale)
        : (incassatoFattura - art15Fattura)

      // Popola il grafico mensile (Gen - Dic dell'anno di riferimento)
      if (dataRif.getFullYear() === annoGrafico) {
        const meseIdx = dataRif.getMonth() // 0 = Gen, 11 = Dic
        if (meseIdx >= 0 && meseIdx < 12) {
          mesi[meseIdx].emesso = +(mesi[meseIdx].emesso + ricavoNetto).toFixed(2)
          mesi[meseIdx].incassato = +(mesi[meseIdx].incassato + incassatoNetto).toFixed(2)
        }
      }

      // Filtra tabella e totali di periodo se l'utente ha scelto mese/trimestre specifico
      const nelPeriodo =
        periodo === 'anno'
          ? dataRif.getFullYear() === annoGrafico
          : (dataRif >= dal && dataRif <= al)

      if (!nelPeriodo) continue

      if (isNotaCredito) {
        const stornoIncassato = incassatoFattura > 0 ? incassatoFattura : totale
        totaleEmesso -= totale
        totaleIncassato -= stornoIncassato
      } else {
        totaleEmesso += totale
        totaleIncassato += incassatoFattura
        totaleArt15 += art15Fattura
      }

      // Aggrega per azienda
      const aziendaId = fattura.companyId
      if (!aziendaMap.has(aziendaId)) {
        aziendaMap.set(aziendaId, {
          ragioneSociale: fattura.company.ragioneSociale,
          emesso: 0,
          incassato: 0,
          residuo: 0,
          ultimoPagamento: null,
        })
      }
      const aziendaData = aziendaMap.get(aziendaId)!
      if (isNotaCredito) {
        const stornoIncassato = incassatoFattura > 0 ? incassatoFattura : totale
        aziendaData.emesso -= totale
        aziendaData.incassato -= stornoIncassato
      } else {
        aziendaData.emesso += (totale - art15Fattura)
        aziendaData.incassato += (incassatoFattura - art15Fattura)
        aziendaData.residuo += residuo
      }
    }

    return NextResponse.json({
      annoGrafico,
      kpi: {
        attivitaDaVerificare,
        valoreNonFatturato: Number(valoreNonFatturato),
        bozzeCount,
        bozzeImporto: Number(bozzeImporto._sum.totaleDocumento ?? 0),
        daIncassare: +totaleDaIncassare.toFixed(2),
        scaduto: +totaleScaduto.toFixed(2),
        fatturatoEmesso: +(totaleEmesso - totaleArt15).toFixed(2),
        fatturatoEmessoLordo: +totaleEmesso.toFixed(2),
        fatturatoIncassato: +(totaleIncassato - totaleArt15).toFixed(2),
        fatturatoIncassatoLordo: +totaleIncassato.toFixed(2),
        speseArt15: +totaleArt15.toFixed(2),
        ricaviCompensi: +(totaleEmesso - totaleArt15).toFixed(2),
      },
      grafico: mesi,
      aziende: Array.from(aziendaMap.entries())
        .map(([id, data]) => ({
          id,
          ...data,
          emesso: +data.emesso.toFixed(2),
          incassato: +data.incassato.toFixed(2),
          residuo: +data.residuo.toFixed(2),
        }))
        .sort((a, b) => b.emesso - a.emesso),
    })
  } catch (error) {
    console.error('Errore dashboard:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
