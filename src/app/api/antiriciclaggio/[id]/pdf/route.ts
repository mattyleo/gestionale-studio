// src/app/api/antiriciclaggio/[id]/pdf/route.ts
// Download PDF per singolo cliente: Dichiarazione Antiriciclaggio, Privacy GDPR, o Scheda Valutazione Rischio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaAntiriciclaggioDichiarazionePDF } from '@/lib/pdf/antiriciclaggio-dichiarazione-pdf'
import { generaAntiriciclaggioPrivacyPDF } from '@/lib/pdf/antiriciclaggio-privacy-pdf'
import { generaAntiriciclaggioValutazionePDF } from '@/lib/pdf/antiriciclaggio-valutazione-pdf'
import { generaLetteraIncaricoMandatoPDF } from '@/lib/pdf/antiriciclaggio-mandato-pdf'

export async function GET(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo') || 'dichiarazione' // 'dichiarazione' | 'privacy' | 'valutazione' | 'mandato'
  const variante = searchParams.get('variante') || undefined // 'PAGHE' | 'CONTABILITA' | 'FORFETTARI'

  try {
    const [azienda, emittente] = await Promise.all([
      prisma.company.findUnique({
        where: { id },
        include: {
          documents: { orderBy: { createdAt: 'desc' } },
          invoices: {
            where: { stato: 'EMESSA' },
            include: { lines: true },
            orderBy: { dataDocumento: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.issuerProfile.findFirst(),
    ])

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    let buffer: Buffer
    let filename: string
    const safeRagSoc = azienda.ragioneSociale.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)

    if (tipo === 'mandato') {
      buffer = await generaLetteraIncaricoMandatoPDF(azienda, emittente, variante)
      filename = `Lettera_Incarico_Mandato_${safeRagSoc}.pdf`
    } else if (tipo === 'privacy') {
      buffer = await generaAntiriciclaggioPrivacyPDF(azienda, emittente)
      filename = `Privacy_GDPR_${safeRagSoc}.pdf`
    } else if (tipo === 'valutazione') {
      buffer = await generaAntiriciclaggioValutazionePDF(azienda, emittente)
      filename = `Valutazione_Rischio_Antiriciclaggio_${safeRagSoc}.pdf`
    } else {
      buffer = await generaAntiriciclaggioDichiarazionePDF(azienda, emittente)
      filename = `Dichiarazione_Antiriciclaggio_${safeRagSoc}.pdf`
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error('Errore generazione PDF antiriciclaggio:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
