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
  periodoDal: z.string().optional().nullable().transform(s => s ? new Date(s) : undefined),
  periodoAl: z.string().optional().nullable().transform(s => s ? new Date(s) : undefined),
  attivitaIds: z.array(z.string()).optional(),
  raggruppamento: z.enum(['per_servizio', 'dettagliato']).default('per_servizio'),
  noteInterne: z.string().optional(),
  righe: z.array(z.object({
    descrizione: z.string().min(1),
    quantita: z.number().positive().default(1),
    prezzoUnitario: z.number().min(0),
    aliquotaIva: z.string().default('0'),
    naturaIva: z.string().default('N2.2'),
    serviceId: z.string().optional().nullable(),
  })).optional(),
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

    // Calcola totali
    let imponibile = new Decimal(0)
    let periodoEffettivoDal = dati.periodoDal || new Date()
    let periodoEffettivoAl = dati.periodoAl || new Date()
    let attivitaCount = 0

    type GruppoServizio = {
      serviceId: string | null
      serviceCodice: string | null
      serviceDescrizione: string
      attivitaIds: string[]
      quantita: Decimal
      prezzoUnitario: Decimal | null
      importo: Decimal
      aliquotaIva?: string
      naturaIva?: string
    }

    const gruppi: GruppoServizio[] = []

    // CASO 1: Creazione manuale diretta con righe fornite (bypassa Attività)
    if (dati.righe && dati.righe.length > 0) {
      for (const r of dati.righe) {
        const q = new Decimal(r.quantita)
        const p = new Decimal(r.prezzoUnitario)
        const imp = q.mul(p).toDecimalPlaces(2)
        const nat = r.naturaIva || 'N2.2'
        gruppi.push({
          serviceId: r.serviceId || null,
          serviceCodice: null,
          serviceDescrizione: r.descrizione,
          attivitaIds: [],
          quantita: q,
          prezzoUnitario: p,
          importo: imp,
          aliquotaIva: r.aliquotaIva || '0',
          naturaIva: nat,
        })
        // Solo le righe imponibili (non N1 escluse art. 15) concorrono alla base per Cassa e Ricavi
        if (nat !== 'N1') {
          imponibile = imponibile.add(imp)
        }
      }
    } else {
      // CASO 2: Generazione da attività approvate
      const whereAttivita: any = {
        companyId: dati.companyId,
        stato: 'APPROVATA',
        invoiceLineId: null, // Non già collegate a una fattura
      }

      if (dati.attivitaIds && dati.attivitaIds.length > 0) {
        whereAttivita.id = { in: dati.attivitaIds }
      } else if (dati.periodoDal || dati.periodoAl) {
        whereAttivita.data = {
          ...(dati.periodoDal && { gte: dati.periodoDal }),
          ...(dati.periodoAl && { lte: dati.periodoAl }),
        }
      }

      // Carica le attività approvate selezionate
      const attivita = await prisma.workEntry.findMany({
        where: whereAttivita,
        include: {
          service: true,
        },
        orderBy: [{ data: 'asc' }, { serviceId: 'asc' }],
      })

      if (attivita.length === 0) {
        return NextResponse.json(
          { error: 'Nessuna attività approvata trovata per questa azienda con i filtri selezionati. Per creare una fattura al volo, usa "+ Nuova Fattura (Manuale)".' },
          { status: 400 }
        )
      }

      attivitaCount = attivita.length
      const dateAttivita = attivita.map(a => a.data.getTime())
      periodoEffettivoDal = dati.periodoDal || new Date(Math.min(...dateAttivita))
      periodoEffettivoAl = dati.periodoAl || new Date(Math.max(...dateAttivita))

      // Verifica se esiste già una bozza attiva per questa azienda con date sovrapposte
      if (dati.periodoDal && dati.periodoAl) {
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
      }

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
    }

    // Carica profilo emittente per configurazione fiscale
    const emittente = await prisma.issuerProfile.findFirst()

    // Calcola cassa previdenziale (esclusivamente su prestazioni soggette a rivalsa/N2.2)
    const aliquotaCassa = emittente ? new Decimal(emittente.aliquotaCassa.toString()) : new Decimal(4)
    const totaleCassa = emittente?.rivalsa
      ? imponibile.mul(aliquotaCassa).div(100).toDecimalPlaces(2)
      : new Decimal(0)

    // Calcola bollo: obbligatorio per legge se imponibile + cassa > 77,47 €
    const imponibileConCassa = imponibile.add(totaleCassa)
    const sogliaBollo = emittente ? new Decimal(emittente.sogliaBollo.toString()) : new Decimal(77.47)
    const importoBollo = emittente ? new Decimal(emittente.importoBollo.toString()) : new Decimal(2)
    const deveApplicareBollo = (emittente?.bolloVirtuale ?? true) && imponibileConCassa.gt(sogliaBollo)
    const bollo = deveApplicareBollo ? importoBollo : new Decimal(0)

    // Se il bollo è dovuto (> 77,47 €), inserisci la riga "Bolli" 2€ con Natura N1 (escluse art. 15 DPR 633/72)
    const haGiaRigaBollo = gruppi.some(g => g.naturaIva === 'N1' || g.serviceDescrizione.toLowerCase().trim() === 'bolli')
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
        naturaIva: 'N1',
      })
    }

    const totaleDocumento = imponibileConCassa.add(bollo)

    // TRANSAZIONE: crea fattura + righe + aggiorna stato attività
    const bozza = await prisma.$transaction(async (tx) => {
      const nuovaFattura = await tx.invoice.create({
        data: {
          companyId: dati.companyId,
          sezionale: 'FT',
          anno: new Date().getFullYear(),
          stato: 'BOZZA',
          periodoDal: periodoEffettivoDal,
          periodoAl: periodoEffettivoAl,
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
            aliquotaIva: g.aliquotaIva || '0',
            naturaIva: g.naturaIva || 'N2.2',
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
          periodoDal: periodoEffettivoDal,
          periodoAl: periodoEffettivoAl,
          attivitaCollegate: attivitaCount,
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
