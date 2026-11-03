// src/app/api/antiriciclaggio/export/csv/route.ts
// Esportazione del Registro Clienti Antiriciclaggio in formato CSV / Excel

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  return `"${s}"`
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const settore = searchParams.get('settore')

  try {
    const where: any = {
      archiviata: false,
      OR: [
        { partitaIva: { not: null } },
        { antiriciclaggioObbligo: true },
      ],
    }

    if (settore && settore !== 'TUTTI') {
      where.settoreAttivita = settore
    }

    const aziende = await prisma.company.findMany({
      where,
      orderBy: [
        { antiriciclaggioFascicolo: 'asc' },
        { ragioneSociale: 'asc' },
      ],
    })

    const headers = [
      'N. Fascicolo',
      'Ragione Sociale',
      'Partita IVA',
      'Codice Fiscale',
      'Settore Studio',
      'Sede Legale',
      'Comune',
      'Provincia',
      'Legale Rappresentante',
      'C.F. Rappresentante',
      'Tipo Documento',
      'Numero Documento',
      'Rilasciato Da',
      'Scadenza Documento',
      'Titolare Effettivo',
      'Persona Esposta Politicamente (PEP)',
      'Classe Rischio',
      'Punteggio Rischio',
      'Data Verifica',
      'Scadenza Verifica',
      'Stato Fascicolo',
      'Privacy Firmata',
      'Data Privacy',
      'Note',
    ]

    const rows = aziende.map((az, idx) => [
      escapeCsv(az.antiriciclaggioFascicolo || `ARC-${String(idx + 1).padStart(3, '0')}`),
      escapeCsv(az.ragioneSociale),
      escapeCsv(az.partitaIva),
      escapeCsv(az.codiceFiscale),
      escapeCsv(az.settoreAttivita || 'CONTABILITA'),
      escapeCsv(az.indirizzo),
      escapeCsv(az.comune),
      escapeCsv(az.provincia),
      escapeCsv(az.legaleRappresentante),
      escapeCsv(az.cfRappresentante),
      escapeCsv(az.documentoTipo),
      escapeCsv(az.documentoNumero),
      escapeCsv(az.documentoRilasciatoDa),
      escapeCsv(az.documentoScadenza ? new Date(az.documentoScadenza).toISOString().split('T')[0] : ''),
      escapeCsv(az.antiriciclaggioTitolareEffettivo),
      escapeCsv(az.antiriciclaggioPep ? 'SÌ' : 'NO'),
      escapeCsv(az.antiriciclaggioRischio || 'BASSO'),
      escapeCsv(az.antiriciclaggioPunteggio || 1),
      escapeCsv(az.antiriciclaggioDataVerifica ? new Date(az.antiriciclaggioDataVerifica).toISOString().split('T')[0] : ''),
      escapeCsv(az.antiriciclaggioDataScadenza ? new Date(az.antiriciclaggioDataScadenza).toISOString().split('T')[0] : ''),
      escapeCsv(az.antiriciclaggioStato || 'DA_VERIFICARE'),
      escapeCsv(az.privacyFirmata ? 'SÌ' : 'NO'),
      escapeCsv(az.privacyData ? new Date(az.privacyData).toISOString().split('T')[0] : ''),
      escapeCsv(az.antiriciclaggioNote),
    ])

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

    const filename = `Registro_Antiriciclaggio_${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Errore export CSV antiriciclaggio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
