// src/app/api/attivita/route.ts
// CRUD attività/prestazioni — GET con filtri e POST nuova attività

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from 'decimal.js'

const nuovaAttivitaSchema = z.object({
  companyId: z.string().optional(),
  serviceId: z.string().optional(),
  data: z.string().transform(s => new Date(s)),
  descrizione: z.string().optional(),
  note: z.string().optional(),
  durataMinutiLavorati: z.number().int().min(0).optional(),
  durataMinutiFatturabili: z.number().int().min(0).optional(),
  quantita: z.number().positive().optional(),
  prezzoUnitario: z.number().min(0).optional(),
  prezzoManuale: z.boolean().default(false),
  motivazionePrezzoManuale: z.string().optional(),
  numeroDipendenti: z.number().int().min(1).optional(),
  tipoDitta: z.string().optional(),
  stato: z.enum(['DA_CLASSIFICARE', 'DA_VERIFICARE', 'APPROVATA', 'ESCLUSA']).default('DA_VERIFICARE'),
  motivazioneEsclusa: z.string().optional(),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const stato = searchParams.get('stato')
  const companyId = searchParams.get('companyId')
  const dal = searchParams.get('dal')
  const al = searchParams.get('al')
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const perPagina = parseInt(searchParams.get('perPagina') || '50')

  try {
    const where: any = {}

    if (stato) {
      where.stato = stato
    }
    if (companyId) {
      where.companyId = companyId
    }
    if (dal || al) {
      where.data = {
        ...(dal && { gte: new Date(dal) }),
        ...(al && { lte: new Date(al) }),
      }
    }

    const [attivita, totale] = await Promise.all([
      prisma.workEntry.findMany({
        where,
        orderBy: [{ data: 'desc' }, { createdAt: 'desc' }],
        skip: (pagina - 1) * perPagina,
        take: perPagina,
        include: {
          company: { select: { ragioneSociale: true } },
          service: { select: { codice: true, descrizione: true, unita: true } },
          operatore: { select: { name: true } },
        },
      }),
      prisma.workEntry.count({ where }),
    ])

    return NextResponse.json({
      attivita,
      paginazione: {
        totale,
        pagina,
        perPagina,
        totalePagine: Math.ceil(totale / perPagina),
      },
    })
  } catch (error) {
    console.error('Errore elenco attività:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = nuovaAttivitaSchema.parse(body)

    // Se non ha azienda o servizio → DA_CLASSIFICARE
    const statoEffettivo = !dati.companyId || !dati.serviceId
      ? 'DA_CLASSIFICARE'
      : dati.stato

    // Calcola prezzo automatico se non manuale
    let prezzoUnitario = dati.prezzoUnitario
    let importo: number | undefined

    if (!dati.prezzoManuale && dati.serviceId && dati.companyId) {
      // Cerca tariffa specifica per azienda, poi generale
      const tariffaSpecifica = await prisma.priceRule.findFirst({
        where: {
          serviceId: dati.serviceId,
          companyId: dati.companyId,
          attiva: true,
          validaDal: { lte: dati.data },
          OR: [{ validaAl: null }, { validaAl: { gte: dati.data } }],
        },
        orderBy: { validaDal: 'desc' },
      })

      if (tariffaSpecifica) {
        prezzoUnitario = Number(tariffaSpecifica.prezzoUnitario)
      } else {
        // Tariffa generale (con eventuale fascia dipendenti)
        const tariffaGenerale = await prisma.priceRule.findFirst({
          where: {
            serviceId: dati.serviceId,
            companyId: null,
            attiva: true,
            validaDal: { lte: dati.data },
            OR: [{ validaAl: null }, { validaAl: { gte: dati.data } }],
            ...(dati.numeroDipendenti && {
              dipendentiMin: { lte: dati.numeroDipendenti },
              OR: [
                { dipendentiMax: null },
                { dipendentiMax: { gte: dati.numeroDipendenti } },
              ],
            }),
            ...(dati.tipoDitta && { tipoDitta: dati.tipoDitta }),
          },
          orderBy: { validaDal: 'desc' },
        })

        if (tariffaGenerale) {
          prezzoUnitario = Number(tariffaGenerale.prezzoUnitario)
        } else {
          // Nessuna tariffa trovata → servizio senza prezzo
          const service = await prisma.service.findUnique({
            where: { id: dati.serviceId },
          })
          prezzoUnitario = service?.prezzoBase ? Number(service.prezzoBase) : undefined
        }
      }
    }

    // Calcola importo riga
    if (prezzoUnitario !== undefined && dati.quantita !== undefined) {
      importo = new Decimal(prezzoUnitario).mul(dati.quantita).toNumber()
    }

    const attivita = await prisma.workEntry.create({
      data: {
        companyId: dati.companyId || null,
        serviceId: dati.serviceId || null,
        operatoreId: (session.user as any).id,
        data: dati.data,
        descrizione: dati.descrizione || null,
        note: dati.note || null,
        durataMinutiLavorati: dati.durataMinutiLavorati || null,
        durataMinutiFatturabili: dati.durataMinutiFatturabili || null,
        quantita: dati.quantita ? new Decimal(dati.quantita) : null,
        prezzoUnitario: prezzoUnitario ? new Decimal(prezzoUnitario) : null,
        prezzoManuale: dati.prezzoManuale,
        motivazionePrezzoManuale: dati.motivazionePrezzoManuale || null,
        importo: importo ? new Decimal(importo) : null,
        numeroDipendenti: dati.numeroDipendenti || null,
        tipoDitta: dati.tipoDitta || null,
        stato: statoEffettivo,
        motivazioneEsclusa: dati.motivazioneEsclusa || null,
        origine: 'MANUALE',
      },
      include: {
        company: { select: { ragioneSociale: true } },
        service: { select: { codice: true, descrizione: true } },
      },
    })

    return NextResponse.json(attivita, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore creazione attività:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
