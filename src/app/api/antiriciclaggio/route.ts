// src/app/api/antiriciclaggio/route.ts
// Elenco e statistiche Registro Antiriciclaggio & Privacy (D.Lgs. 231/2007 & GDPR)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cerca = searchParams.get('cerca')?.trim() || ''
  const settore = searchParams.get('settore') || 'TUTTI' // 'CONTABILITA' | 'PAGHE' | 'CAF' | 'TUTTI'
  const statoFascicolo = searchParams.get('statoFascicolo') || 'TUTTI' // 'REGOLARE' | 'DA_VERIFICARE' | 'TUTTI'
  const rischio = searchParams.get('rischio') || 'TUTTI' // 'BASSO' | 'MEDIO' | 'ALTO' | 'TUTTI'
  const filtroDoc = searchParams.get('statoDocumento') || 'TUTTI' // 'SCADUTO' | 'IN_SCADENZA' | 'MANCANTE' | 'VALIDO' | 'TUTTI'
  const soloConPartitaIva = searchParams.get('soloPiva') !== 'false' // default: escludi soggetti senza P.IVA (CAF privati)

  try {
    const oggi = new Date()
    const fra60Giorni = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

    // Costruisci filtro
    const where: any = {
      archiviata: false,
    }

    if (soloConPartitaIva) {
      where.OR = [
        { partitaIva: { not: null } },
        { antiriciclaggioObbligo: true },
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

    // Filtro documento speciale
    if (filtroDoc === 'SCADUTO') {
      where.documentoScadenza = { lt: oggi }
    } else if (filtroDoc === 'IN_SCADENZA') {
      where.documentoScadenza = { gte: oggi, lte: fra60Giorni }
    } else if (filtroDoc === 'MANCANTE') {
      where.documentoNumero = null
    } else if (filtroDoc === 'VALIDO') {
      where.documentoScadenza = { gt: fra60Giorni }
    }

    // Carica aziende e documenti collegati
    const aziende = await prisma.company.findMany({
      where,
      orderBy: [
        { antiriciclaggioFascicolo: 'asc' },
        { ragioneSociale: 'asc' },
      ],
      include: {
        documents: {
          where: {
            tipoDoc: { in: ['carta_identita', 'passaporto', 'patente', 'tessera_sanitaria'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
    })

    // Statistiche generali dello studio (sempre calcolate su tutti i soggetti obbligati)
    const baseObbligatiWhere: any = {
      archiviata: false,
      OR: [
        { partitaIva: { not: null } },
        { antiriciclaggioObbligo: true },
      ],
    }

    const [
      totaleCensiti,
      totaleRegolari,
      totaleDaVerificare,
      docScaduti,
      docInScadenza,
      docMancanti,
      privacyMancante,
      totalePrivatiCaf,
    ] = await Promise.all([
      prisma.company.count({ where: baseObbligatiWhere }),
      prisma.company.count({ where: { ...baseObbligatiWhere, antiriciclaggioStato: 'REGOLARE' } }),
      prisma.company.count({ where: { ...baseObbligatiWhere, antiriciclaggioStato: 'DA_VERIFICARE' } }),
      prisma.company.count({
        where: {
          ...baseObbligatiWhere,
          documentoScadenza: { lt: oggi },
        },
      }),
      prisma.company.count({
        where: {
          ...baseObbligatiWhere,
          documentoScadenza: { gte: oggi, lte: fra60Giorni },
        },
      }),
      prisma.company.count({
        where: {
          ...baseObbligatiWhere,
          documentoNumero: null,
        },
      }),
      prisma.company.count({
        where: {
          ...baseObbligatiWhere,
          privacyFirmata: false,
        },
      }),
      prisma.company.count({
        where: {
          archiviata: false,
          partitaIva: null,
          antiriciclaggioObbligo: false,
        },
      }),
    ])

    return NextResponse.json({
      aziende,
      statistiche: {
        totaleCensiti,
        totaleRegolari,
        totaleDaVerificare,
        docScaduti,
        docInScadenza,
        docMancanti,
        privacyMancante,
        totalePrivatiCaf,
      },
    })
  } catch (error: any) {
    console.error('Errore GET /api/antiriciclaggio:', error)
    return NextResponse.json({ error: error.message || 'Errore server' }, { status: 500 })
  }
}
