// src/app/api/fatture/[id]/invia-email/route.ts
// Invio email proforma o fattura con PDF allegato

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaFatturaPDF } from '@/lib/pdf/fattura-pdf'
import { inviaDocumentoEmail, isSmtpConfigured } from '@/lib/email'

function formatData(d: Date | string | null | undefined): string {
  if (!d) return ''
  return new Intl.DateTimeFormat('it-IT').format(new Date(d))
}

function formatEuro(n: any): string {
  const num = Number(n) || 0
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(num)
}

export async function GET(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id },
      include: { company: true },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    const emittente = await prisma.issuerProfile.findFirst()
    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
    const emailDest = fattura.company?.emailAmministrativa || fattura.company?.pec || ''

    const docNome = isBozza ? 'Avviso di Parcella' : `Fattura Elettronica N° ${fattura.numeroCompleto || fattura.numero}`
    const oggetto = `${docNome} — Studio Dott. Antonio Tuzio`

    const studioIban = emittente?.iban || 'IT89E0303212804010000063104'
    const dataDoc = formatData(fattura.dataDocumento || fattura.createdAt)
    const dataScad = formatData(fattura.dataScadenza || new Date(Date.now() + 30 * 86400000))
    const totaleDoc = formatEuro(fattura.totaleDocumento)

    const testo = `Gentile ${fattura.company?.ragioneSociale || 'Cliente'},

in allegato trasmettiamo ${isBozza ? "l'Avviso di Parcella" : 'la copia di cortesia della Fattura Elettronica'} emesso dallo Studio Dott. Antonio Tuzio.

Riepilogo del documento:
- Documento: ${docNome}
- Data emissione: ${dataDoc}
- Importo totale: ${totaleDoc}
- Scadenza: ${dataScad}
- Coordinate per il bonifico (IBAN): ${studioIban}

Restiamo a disposizione per qualsiasi chiarimento.

Cordiali saluti,
Dott. Antonio Tuzio
Commercialista e Tributarista
Viale Risorgimento 70 - Reggio nell'Emilia (RE)
Tel. 0522 331628 - Email: infooizut@gmail.com`

    const mailtoUrl = `mailto:${encodeURIComponent(emailDest)}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`

    return NextResponse.json({
      emailDestinatario: emailDest,
      ragioneSociale: fattura.company?.ragioneSociale,
      oggetto,
      testo,
      isBozza,
      smtpConfigurato: isSmtpConfigured(),
      mailtoUrl,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const body = await req.json()
    const { to, subject, message } = body

    if (!to || !to.trim()) {
      return NextResponse.json({ error: 'Indirizzo email destinatario mancante' }, { status: 400 })
    }

    const fattura = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        lines: { orderBy: { ordinamento: 'asc' } },
      },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    const emittente = await prisma.issuerProfile.findFirst()

    // Genera PDF in memoria
    const datiPDF = {
      ...fattura,
      imponibile: Number(fattura.imponibile),
      totaleCassa: Number(fattura.totaleCassa),
      totaleIva: Number(fattura.totaleIva),
      bollo: Number(fattura.bollo),
      totaleDocumento: Number(fattura.totaleDocumento),
      emittente,
      lines: fattura.lines.map((l) => ({
        ...l,
        quantita: Number(l.quantita),
        prezzoUnitario: Number(l.prezzoUnitario),
        importo: Number(l.importo),
      })),
    }

    const pdfBuffer = await generaFatturaPDF(datiPDF)
    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
    const filename = isBozza
      ? `Avviso_Parcella_${fattura.id.slice(0, 8)}.pdf`
      : `Fattura_${(fattura.numeroCompleto || `FT_${fattura.numero}`).replace(/\//g, '-')}.pdf`

    const resEmail = await inviaDocumentoEmail({
      to: to.trim(),
      subject: subject || (isBozza ? 'Avviso di Parcella' : 'Fattura Elettronica'),
      text: message,
      pdfBuffer,
      filename,
    })

    return NextResponse.json(resEmail)
  } catch (err: any) {
    console.error('Errore invio email fattura:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
