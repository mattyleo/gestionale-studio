// src/app/api/aziende/export/csv/route.ts
// Esporta l'elenco anagrafico clienti in formato CSV compatibile Excel (UTF-8 con BOM)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return ''
  const s = String(val).replace(/"/g, '""')
  return `"${s}"`
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const clienti = await prisma.company.findMany({
      orderBy: { ragioneSociale: 'asc' },
    })

    const headers = [
      'Ragione Sociale',
      'Tipo Soggetto',
      'Codice Fiscale',
      'Partita IVA',
      'Indirizzo',
      'CAP',
      'Comune',
      'Provincia',
      'Paese',
      'Codice SDI',
      'PEC',
      'Email Amministrativa',
      'Telefono',
      'Referente',
      'Modalità Pagamento',
      'Termini Pagamento (gg)',
      'IBAN Riferimento',
      'Stato',
    ]

    const rows = clienti.map((c) => [
      escapeCsv(c.ragioneSociale),
      escapeCsv(c.tipoSoggetto),
      escapeCsv(c.codiceFiscale),
      escapeCsv(c.partitaIva),
      escapeCsv(c.indirizzo),
      escapeCsv(c.cap),
      escapeCsv(c.comune),
      escapeCsv(c.provincia),
      escapeCsv(c.paese),
      escapeCsv(c.codiceDestinatarioSdi),
      escapeCsv(c.pec),
      escapeCsv(c.emailAmministrativa),
      escapeCsv(c.telefono),
      escapeCsv(c.referente),
      escapeCsv(c.modalitaPagamento),
      escapeCsv(c.terminiPagamento),
      escapeCsv(c.ibanRiferimento),
      escapeCsv(c.attivo ? 'Attivo' : 'Archiviato'),
    ])

    const csvContent =
      '\uFEFF' + // UTF-8 BOM per corretta visualizzazione degli accenti in Microsoft Excel
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')

    const filename = `Anagrafica_Clienti_${new Date().toISOString().split('T')[0]}.csv`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Errore export CSV clienti:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
