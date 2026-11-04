// src/app/api/antiriciclaggio/export/autovalutazione-studio/route.ts
// Genera il PDF ufficiale "Modello AV1 - Autovalutazione del Rischio dello Studio" (Regola Tecnica n. 1 CNDCEC)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaAutovalutazioneStudioPDF } from '@/lib/pdf/antiriciclaggio-autovalutazione-studio-pdf'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const [emittente, aziende] = await Promise.all([
      prisma.issuerProfile.findFirst(),
      prisma.company.findMany({ where: { archiviata: false } }),
    ])

    const obbligati = aziende.filter(
      (a) => (a.partitaIva && a.partitaIva.trim() !== '') || a.antiriciclaggioObbligo
    )
    const esonerati = aziende.filter(
      (a) => (!a.partitaIva || a.partitaIva.trim() === '') && !a.antiriciclaggioObbligo
    )

    const stats = {
      totaleClienti: aziende.length,
      totaleObbligati: obbligati.length,
      totalePaghe: obbligati.filter((a) => a.settoreAttivita === 'PAGHE').length,
      totaleForfettari: obbligati.filter((a) => a.settoreAttivita === 'FORFETTARI').length,
      totaleContabilita: obbligati.filter(
        (a) => !a.settoreAttivita || a.settoreAttivita === 'CONTABILITA' || a.settoreAttivita === 'MISTO'
      ).length,
      totaleSuccessioni: obbligati.filter((a) => a.settoreAttivita === 'SUCCESSIONI').length,
      totaleEsoneratiCaf: esonerati.length,
    }

    const buffer = await generaAutovalutazioneStudioPDF(emittente, stats)
    const anno = new Date().getFullYear()

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Modello_AV1_Autovalutazione_Studio_${anno}.pdf"`,
      },
    })
  } catch (err: any) {
    console.error('Errore generazione Modello AV1 PDF:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
