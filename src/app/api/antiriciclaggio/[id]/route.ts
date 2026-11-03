// src/app/api/antiriciclaggio/[id]/route.ts
// Gestione singolo fascicolo antiriciclaggio cliente

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const azienda = await prisma.company.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const emittente = await prisma.issuerProfile.findFirst()

    return NextResponse.json({ azienda, emittente })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const body = await req.json()
    const {
      settoreAttivita,
      legaleRappresentante,
      cfRappresentante,
      dataNascitaRappr,
      luogoNascitaRappr,
      documentoTipo,
      documentoNumero,
      documentoRilasciatoDa,
      documentoDataRilascio,
      documentoScadenza,
      documentoFileUrl,
      antiriciclaggioObbligo,
      antiriciclaggioFascicolo,
      antiriciclaggioDataVerifica,
      antiriciclaggioDataScadenza,
      antiriciclaggioRischio,
      antiriciclaggioPunteggio,
      antiriciclaggioTitolareEffettivo,
      antiriciclaggioCfTitolareEffettivo,
      antiriciclaggioPep,
      antiriciclaggioPrestazione,
      antiriciclaggioStato,
      antiriciclaggioNote,
      privacyFirmata,
      privacyData,
      privacyNote,
    } = body

    const azienda = await prisma.company.update({
      where: { id },
      data: {
        settoreAttivita: settoreAttivita || undefined,
        legaleRappresentante: legaleRappresentante !== undefined ? legaleRappresentante?.trim() || null : undefined,
        cfRappresentante: cfRappresentante !== undefined ? cfRappresentante?.trim().toUpperCase() || null : undefined,
        dataNascitaRappr: dataNascitaRappr ? new Date(dataNascitaRappr) : dataNascitaRappr === null ? null : undefined,
        luogoNascitaRappr: luogoNascitaRappr !== undefined ? luogoNascitaRappr?.trim() || null : undefined,
        documentoTipo: documentoTipo !== undefined ? documentoTipo : undefined,
        documentoNumero: documentoNumero !== undefined ? documentoNumero?.trim().toUpperCase() || null : undefined,
        documentoRilasciatoDa: documentoRilasciatoDa !== undefined ? documentoRilasciatoDa?.trim() || null : undefined,
        documentoDataRilascio: documentoDataRilascio ? new Date(documentoDataRilascio) : documentoDataRilascio === null ? null : undefined,
        documentoScadenza: documentoScadenza ? new Date(documentoScadenza) : documentoScadenza === null ? null : undefined,
        documentoFileUrl: documentoFileUrl !== undefined ? documentoFileUrl : undefined,
        antiriciclaggioObbligo: antiriciclaggioObbligo !== undefined ? Boolean(antiriciclaggioObbligo) : undefined,
        antiriciclaggioFascicolo: antiriciclaggioFascicolo !== undefined ? antiriciclaggioFascicolo?.trim() || null : undefined,
        antiriciclaggioDataVerifica: antiriciclaggioDataVerifica ? new Date(antiriciclaggioDataVerifica) : antiriciclaggioDataVerifica === null ? null : undefined,
        antiriciclaggioDataScadenza: antiriciclaggioDataScadenza ? new Date(antiriciclaggioDataScadenza) : antiriciclaggioDataScadenza === null ? null : undefined,
        antiriciclaggioRischio: antiriciclaggioRischio || undefined,
        antiriciclaggioPunteggio: antiriciclaggioPunteggio !== undefined ? Number(antiriciclaggioPunteggio) : undefined,
        antiriciclaggioTitolareEffettivo: antiriciclaggioTitolareEffettivo !== undefined ? antiriciclaggioTitolareEffettivo?.trim() || null : undefined,
        antiriciclaggioCfTitolareEffettivo: antiriciclaggioCfTitolareEffettivo !== undefined ? antiriciclaggioCfTitolareEffettivo?.trim().toUpperCase() || null : undefined,
        antiriciclaggioPep: antiriciclaggioPep !== undefined ? Boolean(antiriciclaggioPep) : undefined,
        antiriciclaggioPrestazione: antiriciclaggioPrestazione !== undefined ? antiriciclaggioPrestazione?.trim() || null : undefined,
        antiriciclaggioStato: antiriciclaggioStato || undefined,
        antiriciclaggioNote: antiriciclaggioNote !== undefined ? antiriciclaggioNote?.trim() || null : undefined,
        privacyFirmata: privacyFirmata !== undefined ? Boolean(privacyFirmata) : undefined,
        privacyData: privacyData ? new Date(privacyData) : privacyData === null ? null : undefined,
        privacyNote: privacyNote !== undefined ? privacyNote?.trim() || null : undefined,
      },
    })

    return NextResponse.json({ azienda })
  } catch (err: any) {
    console.error('Errore PUT /api/antiriciclaggio/[id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
