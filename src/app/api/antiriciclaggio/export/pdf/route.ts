// src/app/api/antiriciclaggio/export/pdf/route.ts
// Esporta la stampa ufficiale del Registro Antiriciclaggio Clienti in formato PDF Landscape

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaAntiriciclaggioRegistroPDF } from '@/lib/pdf/antiriciclaggio-registro-pdf'

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

    const [aziende, emittente] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: [
          { antiriciclaggioFascicolo: 'asc' },
          { ragioneSociale: 'asc' },
        ],
      }),
      prisma.issuerProfile.findFirst(),
    ])

    const buffer = await generaAntiriciclaggioRegistroPDF(aziende, emittente)
    const filename = `Registro_Antiriciclaggio_Studio_${new Date().toISOString().split('T')[0]}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Errore export PDF registro antiriciclaggio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
