import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generaFatturaPDF } from '@/lib/pdf/fattura-pdf';

export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;

    const fattura = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        lines: {
          orderBy: { ordinamento: 'asc' },
        },
      },
    });

    if (!fattura) {
      return new NextResponse('Fattura non trovata', { status: 404 });
    }

    const emittente = await prisma.issuerProfile.findFirst();

    const datiPDF = {
      ...fattura,
      imponibile: Number(fattura.imponibile),
      totaleCassa: Number(fattura.totaleCassa),
      totaleIva: Number(fattura.totaleIva),
      bollo: Number(fattura.bollo),
      totaleDocumento: Number(fattura.totaleDocumento),
      emittente: emittente,
      lines: fattura.lines.map(line => ({
        ...line,
        quantita: Number(line.quantita),
        prezzoUnitario: Number(line.prezzoUnitario),
        importo: Number(line.importo),
      })),
    };

    const buffer = await generaFatturaPDF(datiPDF);

    const filename = fattura.numeroCompleto
      ? `Fattura_${fattura.numeroCompleto.replace(/\//g, '-')}`
      : `Bozza_${fattura.id}`;

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    return new NextResponse('Errore interno del server', { status: 500 });
  }
}
