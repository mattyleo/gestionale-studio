// src/app/api/antiriciclaggio/route.ts
// Elenco e statistiche Registro Antiriciclaggio & Privacy con Bot Classificazione ZONA 1, ZONA 2, ZONA 3

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eseguiRegolarizzazioneCNDCEC, calcolaZonaERischioBot } from '@/lib/antiriciclaggio-engine'
import { assureDbSchemaAligned } from '@/lib/db-align'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cerca = searchParams.get('cerca')?.trim() || ''
  const settore = searchParams.get('settore') || 'TUTTI'
  const statoFascicolo = searchParams.get('statoFascicolo') || 'TUTTI'
  const rischio = searchParams.get('rischio') || 'TUTTI'
  const filtroDoc = searchParams.get('statoDocumento') || 'TUTTI'
  const soloConPartitaIva = searchParams.get('soloPiva') === 'true'
  const zonaFiltro = searchParams.get('zona') || 'TUTTE' // 'TUTTE' | 'ZONA_1' | 'ZONA_2' | 'ZONA_3'

  try {
    await assureDbSchemaAligned()
    // Auto-regolarizzazione al primo accesso se nessun cliente ha ancora i tag di Zona
    try {
      const giaConZona = await prisma.company.count({
        where: {
          archiviata: false,
          antiriciclaggioPrestazione: { contains: 'ZONA' },
        },
      })
      if (giaConZona === 0) {
        await eseguiRegolarizzazioneCNDCEC()
      }
    } catch (regErr: any) {
      console.warn('Avviso auto-regolarizzazione CNDCEC saltata:', regErr?.message)
    }

    const oggi = new Date()
    const fra60Giorni = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    const where: any = {
      archiviata: false,
    }

    // Se l'utente filtra esplicitamente per ZONA_1 (Privati 730/CAF), mostriamo anche i senza P.IVA
    if (soloConPartitaIva && zonaFiltro !== 'ZONA_1') {
      where.OR = [
        { AND: [{ partitaIva: { not: null } }, { NOT: { partitaIva: '' } }] },
        { settoreAttivita: 'SUCCESSIONI' },
      ]
    }

    if (settore && settore !== 'TUTTI') {
      where.settoreAttivita = settore
    }

    if (statoFascicolo && statoFascicolo !== 'TUTTI') {
      where.antiriciclaggioStato = statoFascicolo
    }

    if (rischio && rischio !== 'TUTTI') {
      where.antiriciclaggioRischio = rischio
    }

    if (cerca) {
      where.AND = [
        {
          OR: [
            { ragioneSociale: { contains: cerca, mode: 'insensitive' } },
            { codiceFiscale: { contains: cerca, mode: 'insensitive' } },
            { partitaIva: { contains: cerca, mode: 'insensitive' } },
            { legaleRappresentante: { contains: cerca, mode: 'insensitive' } },
            { antiriciclaggioFascicolo: { contains: cerca, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (filtroDoc === 'SCADUTO') {
      where.documentoScadenza = { lt: oggi }
    } else if (filtroDoc === 'IN_SCADENZA') {
      where.documentoScadenza = { gte: oggi, lte: fra60Giorni }
    } else if (filtroDoc === 'MANCANTE') {
      where.documentoNumero = null
    } else if (filtroDoc === 'VALIDO') {
      where.documentoScadenza = { gt: fra60Giorni }
    }

    const [aziendeRaw, tutteAziendeStudio] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: [
          { antiriciclaggioFascicolo: 'asc' },
          { ragioneSociale: 'asc' },
        ],
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.company.findMany({
        where: { archiviata: false },
        select: {
          id: true,
          ragioneSociale: true,
          partitaIva: true,
          settoreAttivita: true,
          antiriciclaggioPep: true,
          antiriciclaggioPrestazione: true,
          antiriciclaggioNote: true,
          antiriciclaggioStato: true,
          documentoNumero: true,
          documentoScadenza: true,
          privacyFirmata: true,
        },
      }),
    ])

    // Calcola la valutazione Bot (Zona 1, 2, 3 + Matrice CNDCEC) per ogni cliente
    const defaultBotVal: any = {
      zona: 'ZONA_2',
      zonaLabel: 'ZONA 2',
      rischioInerente: 1.0,
      rischioSpecifico: 1.0,
      rischioEffettivo: 1.0,
      classeRischio: 'BASSO',
      obbligoSchedaAv2: false,
      obbligoTitolareEffettivo: false,
      periodicitaMesi: 36,
      motivoBot: 'Classificazione standard',
    }

    const aziendeConBot = aziendeRaw
      .map((az) => {
        let botValutazione = defaultBotVal
        try {
          botValutazione = calcolaZonaERischioBot(az)
        } catch {}
        return {
          ...az,
          botValutazione,
        }
      })
      .filter((az) => {
        if (zonaFiltro === 'TUTTE') return true
        return az.botValutazione.zona === zonaFiltro
      })

    // Statistiche globali dello studio divise per Zona 1, Zona 2, Zona 3
    let zona1Count = 0
    let zona2Count = 0
    let zona3Count = 0
    let totaleCensiti = 0
    let totaleRegolari = 0
    let totaleDaVerificare = 0
    let docScaduti = 0
    let docInScadenza = 0
    let docMancanti = 0
    let privacyMancante = 0

    for (const a of tutteAziendeStudio) {
      let val = defaultBotVal
      try {
        val = calcolaZonaERischioBot(a)
      } catch {}

      if (val.zona === 'ZONA_1') {
        zona1Count++
      } else {
        if (val.zona === 'ZONA_2') zona2Count++
        if (val.zona === 'ZONA_3') zona3Count++
        totaleCensiti++
        if (a.antiriciclaggioStato === 'REGOLARE') totaleRegolari++
        else totaleDaVerificare++

        if (!a.documentoNumero) {
          docMancanti++
        } else if (a.documentoScadenza) {
          const scad = new Date(a.documentoScadenza)
          if (!isNaN(scad.getTime())) {
            if (scad < oggi) docScaduti++
            else if (scad <= fra60Giorni) docInScadenza++
          }
        }
        if (!a.privacyFirmata) privacyMancante++
      }
    }

    return NextResponse.json({
      aziende: aziendeConBot,
      statistiche: {
        totaleCensiti,
        totaleRegolari,
        totaleDaVerificare,
        docScaduti,
        docInScadenza,
        docMancanti,
        privacyMancante,
        totalePrivatiCaf: zona1Count,
        zona1Count,
        zona2Count,
        zona3Count,
      },
    })
  } catch (error: any) {
    console.error('Errore GET /api/antiriciclaggio:', error)
    return NextResponse.json({ error: error.message || 'Errore server' }, { status: 500 })
  }
}
