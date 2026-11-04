// src/app/api/fatture/route.ts
// GET elenco fatture con filtri e POST genera bozza di fattura

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

const generaBozzaSchema = z.object({
  companyId: z.string(),
  periodoDal: z.string().transform(s => new Date(s)),
  periodoAl: z.string().transform(s => new Date(s)),
  raggruppamento: z.enum(['per_servizio', 'dettagliato']).default('per_servizio'),
  noteInterne: z.string().optional(),
})

function isNotaCredito(f: { sezionale?: string | null, numeroCompleto?: string | null, note?: string | null }) {
  return f.sezionale?.toUpperCase() === 'NC' ||
         f.numeroCompleto?.toUpperCase().includes('NC') ||
         f.note?.toLowerCase().includes('credito') ||
         f.note?.toLowerCase().includes('storno')
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const stato = searchParams.get('stato')
  const companyId = searchParams.get('companyId')
  const dal = searchParams.get('dal')
  const al = searchParams.get('al')
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const perPagina = parseInt(searchParams.get('perPagina') || '25')

  try {
    // Gestione specifica per stati basati sul saldo incasso ("da-incassare" e "incassate")
    if (stato === 'da-incassare' || stato === 'incassate') {
      const where: any = { stato: 'EMESSA' }
      if (companyId) where.companyId = companyId
      if (dal || al) {
        where.dataDocumento = {
          ...(dal && { gte: new Date(dal) }),
          ...(al && { lte: new Date(al) }),
        }
      }

      const tutte = await prisma.invoice.findMany({
        where,
        orderBy: [{ dataDocumento: 'desc' }, { createdAt: 'desc' }],
        include: {
          company: { select: { ragioneSociale: true } },
          payments: { select: { importo: true, dataIncasso: true } },
          lines: { select: { importo: true, naturaIva: true, descrizione: true } },
          _count: { select: { lines: true } },
        },
      })

      const elaborate = tutte.map(f => {
        const isNC = isNotaCredito(f)
        const totaleDocumento = Number(f.totaleDocumento)
        const incassato = f.payments.reduce((sum, p) => sum + Number(p.importo), 0)
        const residuo = isNC ? 0 : Math.max(0, totaleDocumento - incassato)
        const ultimoPagamento = f.payments.length > 0
          ? f.payments.sort((a, b) => new Date(b.dataIncasso).getTime() - new Date(a.dataIncasso).getTime())[0].dataIncasso
          : null

        // Calcolo Art. 15 (spese anticipate / rimborsi non ricavi)
        let art15Importo = 0
        if (f.lines && !isNC) {
          for (const l of f.lines) {
            const imp = Number(l.importo || 0)
            const isArt15 =
              l.naturaIva === 'N1' ||
              l.descrizione?.toLowerCase().includes('art. 15') ||
              l.descrizione?.toLowerCase().includes('spese vive') ||
              l.descrizione?.toLowerCase().includes('sanzione amministrativa non dovuta')
            if (isArt15) art15Importo += imp
          }
        }

        const ricaviNetto = isNC ? -totaleDocumento : +(totaleDocumento - art15Importo).toFixed(2)

        return {
          ...f,
          incassato,
          residuo,
          ultimoPagamento,
          isNC,
          art15Importo: +art15Importo.toFixed(2),
          hasArt15: art15Importo > 0,
          ricaviNetto,
          isScaduta: !isNC && f.dataScadenza ? f.dataScadenza < new Date() && residuo > 0.05 : false,
          giorniRitardo: !isNC && f.dataScadenza && residuo > 0.05
            ? Math.floor((new Date().getTime() - new Date(f.dataScadenza).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        }
      })

      let filtrate = elaborate
      if (stato === 'da-incassare') {
        // Escludi Note di Credito e fatture con residuo <= 0.05 (arrotondamento centesimi)
        filtrate = elaborate.filter(f => !f.isNC && f.residuo > 0.05)
      } else if (stato === 'incassate') {
        // Include sia fatture saldate sia Note di Credito (storni)
        filtrate = elaborate.filter(f => f.isNC || f.residuo <= 0.05)
      }

      const totaleArt15Complessivo = filtrate.reduce((acc, f) => acc + (f.isNC ? 0 : f.art15Importo), 0)
      const totaleRicaviComplessivo = filtrate.reduce((acc, f) => acc + (f.isNC ? -Number(f.totaleDocumento) : f.ricaviNetto), 0)

      const totaleFiltrate = filtrate.length
      const paginated = (perPagina >= 100 && pagina === 1)
        ? filtrate
        : filtrate.slice((pagina - 1) * perPagina, pagina * perPagina)

      return NextResponse.json({
        fatture: paginated,
        riepilogoArt15: {
          totaleArt15: +totaleArt15Complessivo.toFixed(2),
          totaleRicavi: +totaleRicaviComplessivo.toFixed(2),
        },
        paginazione: {
          totale: totaleFiltrate,
          pagina,
          perPagina,
          totalePagine: Math.ceil(totaleFiltrate / perPagina) || 1,
        },
      })
    }

    const where: any = {}

    if (stato) {
      if (stato === 'bozze') {
        where.stato = { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] }
      } else if (stato === 'emesse') {
        where.stato = 'EMESSA'
      } else {
        where.stato = stato
      }
    }

    if (companyId) where.companyId = companyId

    if (dal || al) {
      where.dataDocumento = {
        ...(dal && { gte: new Date(dal) }),
        ...(al && { lte: new Date(al) }),
      }
    }

    const [fatture, totale] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: [{ dataDocumento: 'desc' }, { createdAt: 'desc' }],
        skip: (pagina - 1) * perPagina,
        take: perPagina,
        include: {
          company: { select: { ragioneSociale: true } },
          payments: { select: { importo: true, dataIncasso: true } },
          _count: { select: { lines: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ])

    // Calcola residuo per ogni fattura
    const fattureConResiduo = fatture.map(f => {
      const isNC = isNotaCredito(f)
      const totaleDocumento = Number(f.totaleDocumento)
      const incassato = f.payments.reduce((sum, p) => sum + Number(p.importo), 0)
      const residuo = isNC ? 0 : Math.max(0, totaleDocumento - incassato)
      const ultimoPagamento = f.payments.length > 0
        ? f.payments.sort((a, b) => new Date(b.dataIncasso).getTime() - new Date(a.dataIncasso).getTime())[0].dataIncasso
        : null

      return {
        ...f,
        incassato,
        residuo,
        ultimoPagamento,
        isNC,
        isScaduta: !isNC && f.dataScadenza ? f.dataScadenza < new Date() && residuo > 0.05 : false,
        giorniRitardo: !isNC && f.dataScadenza && residuo > 0.05
          ? Math.floor((new Date().getTime() - new Date(f.dataScadenza).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }
    })

    return NextResponse.json({
      fatture: fattureConResiduo,
      paginazione: {
        totale,
        pagina,
        perPagina,
        totalePagine: Math.ceil(totale / perPagina),
      },
    })
  } catch (error) {
    console.error('Errore elenco fatture:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = generaBozzaSchema.parse(body)

    // Verifica che l'azienda esista
    const azienda = await prisma.company.findUnique({
      where: { id: dati.companyId },
    })
    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Verifica che non esista già una bozza attiva per questa azienda/periodo
    const bozzaEsistente = await prisma.invoice.findFirst({
      where: {
        companyId: dati.companyId,
        stato: { in: ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'] },
        periodoDal: dati.periodoDal,
        periodoAl: dati.periodoAl,
      },
    })

    if (bozzaEsistente) {
      return NextResponse.json(
        { error: `Esiste già una bozza per questa azienda e periodo (ID: ${bozzaEsistente.id})` },
        { status: 409 }
      )
    }

    // Carica le attività approvate nel periodo, non già in un documento attivo
    const attivita = await prisma.workEntry.findMany({
      where: {
        companyId: dati.companyId,
        stato: 'APPROVATA',
        data: { gte: dati.periodoDal, lte: dati.periodoAl },
        invoiceLineId: null, // Non già collegate a una fattura
      },
      include: {
        service: true,
      },
      orderBy: [{ data: 'asc' }, { serviceId: 'asc' }],
    })

    if (attivita.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna attività approvata trovata per questa azienda nel periodo selezionato' },
        { status: 400 }
      )
    }

    // Calcola totali
    let imponibile = new Decimal(0)

    // Raggruppa per servizio se richiesto
    type GruppoServizio = {
      serviceId: string | null
      serviceCodice: string | null
      serviceDescrizione: string
      attivitaIds: string[]
      quantita: Decimal
      prezzoUnitario: Decimal | null
      importo: Decimal
    }

    const gruppi: GruppoServizio[] = []

    if (dati.raggruppamento === 'per_servizio') {
      const mappaServizi = new Map<string, GruppoServizio>()

      for (const att of attivita) {
        const chiave = att.serviceId || 'NESSUN_SERVIZIO'
        if (!mappaServizi.has(chiave)) {
          mappaServizi.set(chiave, {
            serviceId: att.serviceId,
            serviceCodice: att.service?.codice || null,
            serviceDescrizione: att.service?.descrizione || att.descrizione || 'Prestazione',
            attivitaIds: [],
            quantita: new Decimal(0),
            prezzoUnitario: att.prezzoUnitario ? new Decimal(att.prezzoUnitario.toString()) : null,
            importo: new Decimal(0),
          })
        }

        const gruppo = mappaServizi.get(chiave)!
        gruppo.attivitaIds.push(att.id)
        gruppo.quantita = gruppo.quantita.add(att.quantita ? new Decimal(att.quantita.toString()) : new Decimal(1))
        gruppo.importo = gruppo.importo.add(att.importo ? new Decimal(att.importo.toString()) : new Decimal(0))
      }

      gruppi.push(...mappaServizi.values())
    } else {
      // Righe dettagliate — una per attività
      for (const att of attivita) {
        gruppi.push({
          serviceId: att.serviceId,
          serviceCodice: att.service?.codice || null,
          serviceDescrizione: att.descrizione || att.service?.descrizione || 'Prestazione',
          attivitaIds: [att.id],
          quantita: att.quantita ? new Decimal(att.quantita.toString()) : new Decimal(1),
          prezzoUnitario: att.prezzoUnitario ? new Decimal(att.prezzoUnitario.toString()) : null,
          importo: att.importo ? new Decimal(att.importo.toString()) : new Decimal(0),
        })
      }
    }

    for (const g of gruppi) {
      imponibile = imponibile.add(g.importo)
    }

    // Carica profilo emittente per configurazione fiscale
    const emittente = await prisma.issuerProfile.findFirst()

    // Calcola cassa previdenziale
    const aliquotaCassa = emittente ? new Decimal(emittente.aliquotaCassa.toString()) : new Decimal(4)
    const totaleCassa = emittente?.rivalsa
      ? imponibile.mul(aliquotaCassa).div(100).toDecimalPlaces(2)
      : new Decimal(0)

    // Calcola bollo (se imponibile + cassa > soglia)
    const imponibileConCassa = imponibile.add(totaleCassa)
    const sogliaBollo = emittente ? new Decimal(emittente.sogliaBollo.toString()) : new Decimal(77.47)
    const importoBollo = emittente ? new Decimal(emittente.importoBollo.toString()) : new Decimal(2)
    const bollo = emittente?.bolloVirtuale && imponibileConCassa.gt(sogliaBollo)
      ? importoBollo
      : new Decimal(0)

    const totaleDocumento = imponibileConCassa.add(bollo)

    // TRANSAZIONE: crea fattura + righe + aggiorna stato attività
    const bozza = await prisma.$transaction(async (tx) => {
      const nuovaFattura = await tx.invoice.create({
        data: {
          companyId: dati.companyId,
          sezionale: 'FT',
          anno: new Date().getFullYear(),
          stato: 'BOZZA',
          periodoDal: dati.periodoDal,
          periodoAl: dati.periodoAl,
          imponibile,
          totaleCassa,
          totaleIva: new Decimal(0),
          bollo,
          totaleDocumento,
          modalitaPagamento: azienda.modalitaPagamento || 'MP05',
          terminiPagamento: azienda.terminiPagamento || 30,
          noteInterne: dati.noteInterne || `BOZZA — Generata il ${new Date().toLocaleDateString('it-IT')}`,
        },
      })

      // Crea righe e collega le attività
      for (let i = 0; i < gruppi.length; i++) {
        const g = gruppi[i]

        const riga = await tx.invoiceLine.create({
          data: {
            invoiceId: nuovaFattura.id,
            ordinamento: i + 1,
            descrizione: g.serviceDescrizione,
            quantita: g.quantita,
            prezzoUnitario: g.prezzoUnitario ?? g.importo.div(g.quantita).toDecimalPlaces(2),
            importo: g.importo,
            aliquotaIva: '0',
            naturaIva: 'N2.2',
            serviceId: g.serviceId,
            serviceCodice: g.serviceCodice,
            serviceDescrizione: g.serviceDescrizione,
          },
        })

        // Aggiorna stato attività e collegale alla riga
        await tx.workEntry.updateMany({
          where: { id: { in: g.attivitaIds } },
          data: {
            stato: 'IN_BOZZA_FATTURA',
            invoiceLineId: riga.id,
          },
        })
      }

      return nuovaFattura
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Invoice',
        entityId: bozza.id,
        azione: 'BOZZA_CREATA',
        dettagli: {
          companyId: dati.companyId,
          periodoDal: dati.periodoDal,
          periodoAl: dati.periodoAl,
          attivitaCollegate: attivita.length,
          totale: totaleDocumento.toNumber(),
        },
      },
    })

    return NextResponse.json(bozza, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore generazione bozza:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
