// src/app/api/fatture/[id]/righe/route.ts
// Gestione completa righe fattura (modifica descrizione, quantità, prezzo, natura IVA, aggiunta ed eliminazione)
// con ricalcolo fiscale automatico conforme al Dott. Antonio Tuzio (regime forfettario, cassa 4%, bollo 2€ N2.2 oltre 77,47€)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { z } from 'zod'

const rigaSchema = z.object({
  id: z.string().optional(),
  descrizione: z.string().min(1, 'La descrizione è obbligatoria'),
  quantita: z.number().positive('La quantità deve essere positiva'),
  prezzoUnitario: z.number().min(0, 'Il prezzo unitario non può essere negativo'),
  naturaIva: z.string().default('N2.2'),
})

// Funzione helper di ricalcolo totali e quadratura bollo
async function ricalcolaTotaliFattura(tx: any, invoiceId: string) {
  const fattura = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: { orderBy: { ordinamento: 'asc' } } },
  })
  if (!fattura) return null

  const emittente = await tx.issuerProfile.findFirst()
  const aliquotaCassa = emittente ? new Decimal(emittente.aliquotaCassa.toString()) : new Decimal(4)

  // Separa righe escludendo l'eventuale riga automatica "addebito bolli" / "bolli"
  const righeUtente = fattura.lines.filter(
    (l: any) => !l.descrizione.toLowerCase().includes('bolli') && !l.descrizione.toLowerCase().includes('bollo')
  )

  let imponibile = new Decimal(0)
  let totArt15 = new Decimal(0)

  for (const r of righeUtente) {
    const q = new Decimal(r.quantita.toString())
    const p = new Decimal(r.prezzoUnitario.toString())
    const imp = q.mul(p).toDecimalPlaces(2)

    const isArt15 =
      r.naturaIva === 'N1' ||
      r.descrizione.toLowerCase().includes('art. 15') ||
      r.descrizione.toLowerCase().includes('art.15') ||
      r.descrizione.toLowerCase().includes('spese vive')

    if (isArt15) {
      totArt15 = totArt15.add(imp)
    } else {
      imponibile = imponibile.add(imp)
    }
  }

  const isSoloArt15 = imponibile.isZero() && totArt15.gt(0)
  const totaleCassa = !isSoloArt15 && emittente?.rivalsa !== false
    ? imponibile.mul(aliquotaCassa).div(100).toDecimalPlaces(2)
    : new Decimal(0)

  const imponibileConCassa = imponibile.add(totaleCassa)
  const deveApplicareBollo = !isSoloArt15 && imponibile.gt(0) && imponibileConCassa.gt(77.47)
  const importoBollo = deveApplicareBollo ? new Decimal(2) : new Decimal(0)

  // Gestione riga "addebito bolli"
  const rigaBolliEsistente = fattura.lines.find(
    (l: any) => l.descrizione.toLowerCase().includes('bolli') || l.descrizione.toLowerCase().includes('bollo')
  )

  if (deveApplicareBollo) {
    if (rigaBolliEsistente) {
      await tx.invoiceLine.update({
        where: { id: rigaBolliEsistente.id },
        data: {
          descrizione: 'addebito bolli',
          quantita: new Decimal(1),
          prezzoUnitario: importoBollo,
          importo: importoBollo,
          aliquotaIva: '0',
          naturaIva: 'N2.2',
        },
      })
    } else {
      const maxOrd = fattura.lines.reduce((m: number, l: any) => Math.max(m, l.ordinamento || 0), 0)
      await tx.invoiceLine.create({
        data: {
          invoiceId,
          ordinamento: maxOrd + 1,
          descrizione: 'addebito bolli',
          quantita: new Decimal(1),
          prezzoUnitario: importoBollo,
          importo: importoBollo,
          aliquotaIva: '0',
          naturaIva: 'N2.2',
        },
      })
    }
  } else if (rigaBolliEsistente) {
    await tx.invoiceLine.delete({ where: { id: rigaBolliEsistente.id } })
  }

  const totaleDocumento = imponibileConCassa.add(totArt15).add(importoBollo)

  return await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      imponibile,
      totaleCassa,
      bollo: importoBollo,
      totaleDocumento,
    },
    include: {
      lines: { orderBy: { ordinamento: 'asc' } },
      company: true,
      payments: true,
    },
  })
}

// PUT: Modifica di una riga esistente
export async function PUT(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({ where: { id: params.id } })
    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
    if (!isBozza) {
      return NextResponse.json({ error: 'Non è possibile modificare le righe di una fattura già emessa' }, { status: 400 })
    }

    const body = await request.json()
    const dati = rigaSchema.parse(body)
    if (!dati.id) {
      return NextResponse.json({ error: 'ID riga obbligatorio per la modifica' }, { status: 400 })
    }

    const q = new Decimal(dati.quantita)
    const p = new Decimal(dati.prezzoUnitario)
    const importo = q.mul(p).toDecimalPlaces(2)

    const aggiornata = await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.update({
        where: { id: dati.id },
        data: {
          descrizione: dati.descrizione,
          quantita: q,
          prezzoUnitario: p,
          importo,
          naturaIva: dati.naturaIva,
        },
      })

      return await ricalcolaTotaliFattura(tx, params.id)
    })

    return NextResponse.json(aggiornata)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dati non validi' }, { status: 400 })
    }
    console.error('Errore aggiornamento riga fattura:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}

// POST: Aggiunta di una nuova riga alla bozza
export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lines: true },
    })
    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
    if (!isBozza) {
      return NextResponse.json({ error: 'Non è possibile aggiungere righe a una fattura già emessa' }, { status: 400 })
    }

    const body = await request.json()
    const dati = rigaSchema.parse(body)

    const q = new Decimal(dati.quantita)
    const p = new Decimal(dati.prezzoUnitario)
    const importo = q.mul(p).toDecimalPlaces(2)

    const maxOrd = fattura.lines.reduce((m, l) => Math.max(m, l.ordinamento || 0), 0)

    const aggiornata = await prisma.$transaction(async (tx) => {
      await tx.invoiceLine.create({
        data: {
          invoiceId: params.id,
          ordinamento: maxOrd + 1,
          descrizione: dati.descrizione,
          quantita: q,
          prezzoUnitario: p,
          importo,
          aliquotaIva: '0',
          naturaIva: dati.naturaIva,
        },
      })

      return await ricalcolaTotaliFattura(tx, params.id)
    })

    return NextResponse.json(aggiornata, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Dati non validi' }, { status: 400 })
    }
    console.error('Errore creazione riga fattura:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}

// DELETE: Eliminazione di una riga dalla bozza
export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const lineId = searchParams.get('lineId')
    if (!lineId) return NextResponse.json({ error: 'ID riga obbligatorio' }, { status: 400 })

    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { lines: { include: { workEntries: true } } },
    })
    if (!fattura) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })

    const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
    if (!isBozza) {
      return NextResponse.json({ error: 'Non è possibile eliminare righe da una fattura già emessa' }, { status: 400 })
    }

    const riga = fattura.lines.find(l => l.id === lineId)
    if (!riga) return NextResponse.json({ error: 'Riga non trovata' }, { status: 404 })

    const aggiornata = await prisma.$transaction(async (tx) => {
      // Se la riga aveva attività collegate, liberale
      if (riga.workEntries && riga.workEntries.length > 0) {
        await tx.workEntry.updateMany({
          where: { invoiceLineId: lineId },
          data: { stato: 'APPROVATA', invoiceLineId: null },
        })
      }

      await tx.invoiceLine.delete({ where: { id: lineId } })

      return await ricalcolaTotaliFattura(tx, params.id)
    })

    return NextResponse.json(aggiornata)
  } catch (error: any) {
    console.error('Errore eliminazione riga fattura:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
