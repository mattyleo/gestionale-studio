// src/app/api/report/route.ts
// Report: fatturato emesso, incassato, residuo per azienda e periodo

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dal = searchParams.get('dal')
  const al = searchParams.get('al')
  const companyId = searchParams.get('companyId')
  const tipo = searchParams.get('tipo') || 'riepilogo' // riepilogo | per-azienda | dettaglio

  try {
    const whereInvoice: any = {
      stato: 'EMESSA',
    }
    if (companyId) whereInvoice.companyId = companyId
    if (dal || al) {
      whereInvoice.emessaAl = {
        ...(dal && { gte: new Date(dal) }),
        ...(al && { lte: new Date(al) }),
      }
    }

    const fatture = await prisma.invoice.findMany({
      where: whereInvoice,
      include: {
        company: { select: { ragioneSociale: true, id: true } },
        payments: { select: { importo: true, dataIncasso: true } },
      },
      orderBy: { emessaAl: 'asc' },
    })

    // Calcola per ogni fattura
    const fattureCalcolate = fatture.map(f => {
      const totale = Number(f.totaleDocumento)
      const incassato = f.payments.reduce((sum, p) => sum + Number(p.importo), 0)
      return {
        id: f.id,
        numeroCompleto: f.numeroCompleto,
        companyId: f.companyId,
        ragioneSociale: f.company.ragioneSociale,
        dataDocumento: f.dataDocumento,
        dataScadenza: f.dataScadenza,
        imponibile: Number(f.imponibile),
        totaleDocumento: totale,
        incassato,
        residuo: totale - incassato,
        isScaduta: f.dataScadenza ? f.dataScadenza < new Date() && (totale - incassato) > 0 : false,
      }
    })

    // Raggruppa per azienda
    const perAzienda = new Map<string, {
      ragioneSociale: string
      fattureCount: number
      fatturatoEmesso: number
      fatturatoIncassato: number
      residuo: number
    }>()

    for (const f of fattureCalcolate) {
      if (!perAzienda.has(f.companyId)) {
        perAzienda.set(f.companyId, {
          ragioneSociale: f.ragioneSociale,
          fattureCount: 0,
          fatturatoEmesso: 0,
          fatturatoIncassato: 0,
          residuo: 0,
        })
      }
      const dati = perAzienda.get(f.companyId)!
      dati.fattureCount++
      dati.fatturatoEmesso += f.totaleDocumento
      dati.fatturatoIncassato += f.incassato
      dati.residuo += f.residuo
    }

    const totaliGlobali = {
      fattureCount: fattureCalcolate.length,
      fatturatoEmesso: fattureCalcolate.reduce((s, f) => s + f.totaleDocumento, 0),
      fatturatoIncassato: fattureCalcolate.reduce((s, f) => s + f.incassato, 0),
      residuo: fattureCalcolate.reduce((s, f) => s + f.residuo, 0),
    }

    return NextResponse.json({
      totali: totaliGlobali,
      perAzienda: Array.from(perAzienda.entries()).map(([id, dati]) => ({ id, ...dati }))
        .sort((a, b) => b.fatturatoEmesso - a.fatturatoEmesso),
      ...(tipo === 'dettaglio' ? { fatture: fattureCalcolate } : {}),
    })
  } catch (error) {
    console.error('Errore report:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
