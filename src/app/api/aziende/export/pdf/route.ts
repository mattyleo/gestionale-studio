// src/app/api/aziende/export/pdf/route.ts
// Esporta l'elenco anagrafico clienti in formato PDF professionale orizzontale (A4 Landscape)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaElencoClientiPDF } from '@/lib/pdf/elenco-clienti-pdf'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const [clienti, emittente] = await Promise.all([
      prisma.company.findMany({
        orderBy: { ragioneSociale: 'asc' },
      }),
      prisma.issuerProfile.findFirst(),
    ])

    const buffer = await generaElencoClientiPDF(clienti, emittente)
    const filename = `Elenco_Clienti_${new Date().toISOString().split('T')[0]}.pdf`

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Errore export PDF clienti:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
