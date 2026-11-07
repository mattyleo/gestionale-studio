// src/app/api/fatture/promemoria-trimestrale/route.ts
// Rileva le aziende con frequenza TRIMESTRALE che hanno attività approvate non ancora fatturate,
// raggruppate per trimestre di competenza. Permette anche la generazione batch con 1 clic.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'

export interface TrimestrePromemoriaItem {
  companyId: string
  ragioneSociale: string
  frequenzaFatturazione: string
  anno: number
  trimestre: number // 1, 2, 3, 4
  trimestreLabel: string // "1° Trimestre 2026 (Gen - Mar)"
  periodoDal: string // YYYY-MM-DD
  periodoAl: string // YYYY-MM-DD
  numeroAttivita: number
  totaleImporto: number
  attivitaIds: string[]
  dettaglioServizi: { descrizione: string; quantita: number; importo: number }[]
  haBozzaAperta: boolean
  bozzaId?: string
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    // 1. Trova tutte le aziende con frequenza TRIMESTRALE
    const aziendeTrimestrali = await prisma.company.findMany({
      where: {
        attivo: true,
        frequenzaFatturazione: 'TRIMESTRALE',
      },
      select: {
        id: true,
        ragioneSociale: true,
        frequenzaFatturazione: true,
      },
    })

    if (aziendeTrimestrali.length === 0) {
      return NextResponse.json({
        totaleClientiTrimestrali: 0,
        promemoria: [],
        totaleAttivitaPronte: 0,
        totaleValorePronto: 0,
      })
    }

    const companyIds = aziendeTrimestrali.map((a) => a.id)

    // 2. Trova tutte le attività APPROVATE di queste aziende non ancora collegate a fatture
    const attivita = await prisma.workEntry.findMany({
      where: {
        companyId: { in: companyIds },
        stato: 'APPROVATA',
        invoiceLineId: null,
      },
      include: {
        service: true,
        company: { select: { ragioneSociale: true } },
      },
      orderBy: { data: 'asc' },
    })

    // 3. Verifica anche le bozze aperte per associare l'ID della bozza già generata
    const bozzeAperte = await prisma.invoice.findMany({
      where: {
        companyId: { in: companyIds },
        stato: { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] },
      },
      select: {
        id: true,
        companyId: true,
        periodoDal: true,
        periodoAl: true,
      },
    })

    // Raggruppa per companyId + Anno + Trimestre
    const mappa = new Map<string, TrimestrePromemoriaItem>()

    for (const att of attivita) {
      if (!att.companyId || !att.company) continue

      const dt = new Date(att.data)
      const anno = dt.getFullYear()
      const mese = dt.getMonth() // 0-11
      const q = Math.floor(mese / 3) + 1 // 1, 2, 3, 4

      // Date esatte del trimestre
      const qStartMonth = (q - 1) * 3
      const qEndMonth = qStartMonth + 2
      const qStart = new Date(anno, qStartMonth, 1)
      const qEnd = new Date(anno, qEndMonth + 1, 0) // ultimo giorno del mese

      const dalStr = qStart.toISOString().split('T')[0]
      const alStr = qEnd.toISOString().split('T')[0]

      const qLabelMap: Record<number, string> = {
        1: `1° Trimestre ${anno} (Gen - Mar)`,
        2: `2° Trimestre ${anno} (Apr - Giu)`,
        3: `3° Trimestre ${anno} (Lug - Set)`,
        4: `4° Trimestre ${anno} (Ott - Dic)`,
      }

      const key = `${att.companyId}_${anno}_Q${q}`

      if (!mappa.has(key)) {
        // Controlla se c'è una bozza per questo range
        const bozzaMatch = bozzeAperte.find((b) => {
          if (b.companyId !== att.companyId) return false
          const bDal = b.periodoDal ? new Date(b.periodoDal).toISOString().split('T')[0] : ''
          const bAl = b.periodoAl ? new Date(b.periodoAl).toISOString().split('T')[0] : ''
          return bDal === dalStr || bAl === alStr
        })

        mappa.set(key, {
          companyId: att.companyId,
          ragioneSociale: att.company.ragioneSociale,
          frequenzaFatturazione: 'TRIMESTRALE',
          anno,
          trimestre: q,
          trimestreLabel: qLabelMap[q],
          periodoDal: dalStr,
          periodoAl: alStr,
          numeroAttivita: 0,
          totaleImporto: 0,
          attivitaIds: [],
          dettaglioServizi: [],
          haBozzaAperta: !!bozzaMatch,
          bozzaId: bozzaMatch?.id,
        })
      }

      const item = mappa.get(key)!
      item.numeroAttivita += 1
      const imp = Number(att.importo || 0)
      item.totaleImporto = +(item.totaleImporto + imp).toFixed(2)
      item.attivitaIds.push(att.id)

      const sDesc = att.service?.descrizione || att.descrizione || 'Prestazione'
      const existingServ = item.dettaglioServizi.find((s) => s.descrizione === sDesc)
      if (existingServ) {
        existingServ.quantita += Number(att.quantita || 1)
        existingServ.importo = +(existingServ.importo + imp).toFixed(2)
      } else {
        item.dettaglioServizi.push({
          descrizione: sDesc,
          quantita: Number(att.quantita || 1),
          importo: imp,
        })
      }
    }

    const promemoria = Array.from(mappa.values()).sort((a, b) => {
      if (a.anno !== b.anno) return b.anno - a.anno
      if (a.trimestre !== b.trimestre) return b.trimestre - a.trimestre
      return a.ragioneSociale.localeCompare(b.ragioneSociale)
    })

    const totaleAttivitaPronte = promemoria.reduce((s, p) => s + p.numeroAttivita, 0)
    const totaleValorePronto = +promemoria.reduce((s, p) => s + p.totaleImporto, 0).toFixed(2)

    return NextResponse.json({
      totaleClientiTrimestrali: aziendeTrimestrali.length,
      promemoria,
      totaleAttivitaPronte,
      totaleValorePronto,
    })
  } catch (error) {
    console.error('Errore promemoria trimestrale:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

// POST: Genera automaticamente bozze per i trimestri selezionati
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const items = (body.items || []) as {
      companyId: string
      periodoDal: string
      periodoAl: string
      attivitaIds: string[]
    }[]

    if (items.length === 0) {
      return NextResponse.json({ error: 'Nessun trimestre selezionato' }, { status: 400 })
    }

    const emittente = await prisma.issuerProfile.findFirst()
    const createResults: any[] = []

    for (const it of items) {
      const azienda = await prisma.company.findUnique({
        where: { id: it.companyId },
      })
      if (!azienda) continue

      // Trova le attività
      const attivita = await prisma.workEntry.findMany({
        where: {
          id: { in: it.attivitaIds },
          companyId: it.companyId,
          stato: 'APPROVATA',
          invoiceLineId: null,
        },
        include: { service: true },
        orderBy: [{ data: 'asc' }, { serviceId: 'asc' }],
      })

      if (attivita.length === 0) continue

      // Raggruppa dettagliate o per prestazione
      let imponibile = new Decimal(0)
      type Gruppo = {
        serviceId: string | null
        serviceCodice: string | null
        serviceDescrizione: string
        attivitaIds: string[]
        quantita: Decimal
        prezzoUnitario: Decimal
        importo: Decimal
        aliquotaIva: string
        naturaIva: string
      }
      const gruppi: Gruppo[] = []

      for (const a of attivita) {
        const imp = new Decimal(a.importo ? a.importo.toString() : '0')
        const q = new Decimal(a.quantita ? a.quantita.toString() : '1')
        const pu = a.prezzoUnitario ? new Decimal(a.prezzoUnitario.toString()) : imp.div(q).toDecimalPlaces(2)
        const dtStr = new Date(a.data).toLocaleDateString('it-IT')
        const srvNome = a.service?.descrizione || a.descrizione || 'Prestazione'
        const descCompleta = `${dtStr} — ${srvNome}${a.descrizione && a.descrizione !== srvNome ? ` (${a.descrizione})` : ''}`

        const isAttArt15 =
          a.service?.naturaIva === 'N1' ||
          a.service?.codice === 'SPESE_VIVE' ||
          descCompleta.toLowerCase().includes('art. 15') ||
          descCompleta.toLowerCase().includes('art.15') ||
          descCompleta.toLowerCase().includes('spese vive')
        const natAtt = isAttArt15 ? 'N1' : (a.service?.naturaIva || 'N2.2')

        if (natAtt !== 'N1') {
          imponibile = imponibile.add(imp)
        }

        gruppi.push({
          serviceId: a.serviceId,
          serviceCodice: a.service?.codice || null,
          serviceDescrizione: descCompleta,
          attivitaIds: [a.id],
          quantita: q,
          prezzoUnitario: pu,
          importo: imp,
          aliquotaIva: a.service?.aliquotaIva || '0',
          naturaIva: natAtt,
        })
      }

      const totaleArt15 = gruppi
        .filter(g => g.naturaIva === 'N1')
        .reduce((acc, g) => acc.add(g.importo), new Decimal(0))
      const isFatturaSoloArt15 = imponibile.isZero() && totaleArt15.gt(0)

      const aliquotaCassa = emittente ? new Decimal(emittente.aliquotaCassa.toString()) : new Decimal(4)
      const totaleCassa = (!isFatturaSoloArt15 && emittente?.rivalsa)
        ? imponibile.mul(aliquotaCassa).div(100).toDecimalPlaces(2)
        : new Decimal(0)
      const imponibileConCassa = imponibile.add(totaleCassa)
      const sogliaBollo = emittente ? new Decimal(emittente.sogliaBollo.toString()) : new Decimal(77.47)
      const importoBollo = emittente ? new Decimal(emittente.importoBollo.toString()) : new Decimal(2)
      const deveApplicareBollo =
        !isFatturaSoloArt15 &&
        imponibile.gt(0) &&
        (emittente?.bolloVirtuale ?? true) &&
        imponibileConCassa.gt(sogliaBollo)
      const bollo = deveApplicareBollo ? importoBollo : new Decimal(0)

      // Inserisci riga Bolli 2€ N2 (N2.2) solo se dovuto (e mai su sole spese Art. 15)
      const haGiaRigaBollo = gruppi.some(g => g.serviceCodice === 'BOLLI' || g.serviceDescrizione.toLowerCase().trim() === 'bolli')
      if (deveApplicareBollo && !haGiaRigaBollo) {
        gruppi.push({
          serviceId: null,
          serviceCodice: 'BOLLI',
          serviceDescrizione: 'Bolli',
          attivitaIds: [],
          quantita: new Decimal(1),
          prezzoUnitario: importoBollo,
          importo: importoBollo,
          aliquotaIva: '0',
          naturaIva: 'N2.2',
        })
      }

      const totaleDocumento = imponibileConCassa.add(totaleArt15).add(bollo)

      const bozza = await prisma.$transaction(async (tx) => {
        const nuova = await tx.invoice.create({
          data: {
            companyId: it.companyId,
            sezionale: 'FT',
            anno: new Date().getFullYear(),
            stato: 'BOZZA',
            periodoDal: new Date(it.periodoDal),
            periodoAl: new Date(it.periodoAl),
            imponibile,
            totaleCassa,
            totaleIva: new Decimal(0),
            bollo,
            totaleDocumento,
            modalitaPagamento: azienda.modalitaPagamento || 'MP05',
            terminiPagamento: azienda.terminiPagamento || 30,
            noteInterne: `Bozza Trimestrale (${it.periodoDal} - ${it.periodoAl}) generata il ${new Date().toLocaleDateString('it-IT')}`,
          },
        })

        for (let i = 0; i < gruppi.length; i++) {
          const g = gruppi[i]
          const riga = await tx.invoiceLine.create({
            data: {
              invoiceId: nuova.id,
              ordinamento: i + 1,
              descrizione: g.serviceDescrizione,
              quantita: g.quantita,
              prezzoUnitario: g.prezzoUnitario,
              importo: g.importo,
              aliquotaIva: g.aliquotaIva,
              naturaIva: g.naturaIva,
              serviceId: g.serviceId,
              serviceCodice: g.serviceCodice,
              serviceDescrizione: g.serviceDescrizione,
            },
          })
          await tx.workEntry.updateMany({
            where: { id: { in: g.attivitaIds } },
            data: { stato: 'IN_BOZZA_FATTURA', invoiceLineId: riga.id },
          })
        }

        return nuova
      })

      createResults.push({
        companyId: it.companyId,
        ragioneSociale: azienda.ragioneSociale,
        bozzaId: bozza.id,
        totaleDocumento: totaleDocumento.toNumber(),
      })
    }

    return NextResponse.json({
      success: true,
      createCount: createResults.length,
      bozze: createResults,
    })
  } catch (error: any) {
    console.error('Errore generazione trimestrale:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
