// src/app/api/tariffazione/calcola/route.ts
// API per calcolare il prezzo di una prestazione dati servizio, azienda, data, quantità

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { z } from 'zod'

const calcoloSchema = z.object({
  serviceId: z.string(),
  companyId: z.string().optional(),
  data: z.string().transform(s => new Date(s)),
  durataMinuti: z.number().int().min(0).optional(), // Per servizi a ora
  quantita: z.number().positive().optional(),        // Per altri servizi
  numeroDipendenti: z.number().int().min(1).optional(),
  tipoDitta: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = calcoloSchema.parse(body)

    const service = await prisma.service.findUnique({ where: { id: dati.serviceId } })
    if (!service) {
      return NextResponse.json({ error: 'Servizio non trovato' }, { status: 404 })
    }

    // 1. Cerca tariffa specifica per azienda
    let tariffa = null
    let sorgente = 'nessuna_tariffa'

    if (dati.companyId) {
      tariffa = await prisma.priceRule.findFirst({
        where: {
          serviceId: dati.serviceId,
          companyId: dati.companyId,
          attiva: true,
          validaDal: { lte: dati.data },
          OR: [{ validaAl: null }, { validaAl: { gte: dati.data } }],
        },
        orderBy: { validaDal: 'desc' },
      })
      if (tariffa) sorgente = 'tariffa_azienda'
    }

    // 2. Se non trovata, cerca tariffa generale (con eventuale fascia dipendenti)
    if (!tariffa) {
      const whereGenerale: any = {
        serviceId: dati.serviceId,
        companyId: null,
        attiva: true,
        validaDal: { lte: dati.data },
        OR: [{ validaAl: null }, { validaAl: { gte: dati.data } }],
      }

      if (dati.numeroDipendenti) {
        whereGenerale.dipendentiMin = { lte: dati.numeroDipendenti }
        whereGenerale.OR = [
          { dipendentiMax: null },
          { dipendentiMax: { gte: dati.numeroDipendenti } },
        ]
      }
      if (dati.tipoDitta) {
        whereGenerale.tipoDitta = dati.tipoDitta
      }

      tariffa = await prisma.priceRule.findFirst({
        where: whereGenerale,
        orderBy: { validaDal: 'desc' },
      })
      if (tariffa) sorgente = 'tariffa_generale'
    }

    // 3. Fallback al prezzo base del servizio
    let prezzoUnitario: Decimal | null = null
    if (tariffa) {
      prezzoUnitario = new Decimal(tariffa.prezzoUnitario.toString())
    } else if (service.prezzoBase) {
      prezzoUnitario = new Decimal(service.prezzoBase.toString())
      sorgente = 'prezzo_base_servizio'
    }

    // 4. Calcola quantità e importo
    let quantita: Decimal | null = null
    let importo: Decimal | null = null

    if (service.unita === 'ORA' && dati.durataMinuti !== undefined) {
      // Arrotondamento ore
      const ore = calcolaOre(dati.durataMinuti, service.arrotondamento)
      quantita = new Decimal(ore)
      if (prezzoUnitario) {
        importo = prezzoUnitario.mul(quantita).toDecimalPlaces(2)
      }
    } else if (dati.quantita !== undefined) {
      quantita = new Decimal(dati.quantita)
      if (prezzoUnitario) {
        importo = prezzoUnitario.mul(quantita).toDecimalPlaces(2)
      }
    }

    return NextResponse.json({
      service: {
        id: service.id,
        codice: service.codice,
        descrizione: service.descrizione,
        unita: service.unita,
        arrotondamento: service.arrotondamento,
      },
      tariffaApplicata: tariffa ? {
        id: tariffa.id,
        prezzoUnitario: Number(tariffa.prezzoUnitario),
        tipoDitta: tariffa.tipoDitta,
        dipendentiMin: tariffa.dipendentiMin,
        dipendentiMax: tariffa.dipendentiMax,
        validaDal: tariffa.validaDal,
        validaAl: tariffa.validaAl,
      } : null,
      sorgente,
      prezzoUnitario: prezzoUnitario ? prezzoUnitario.toNumber() : null,
      quantita: quantita ? quantita.toNumber() : null,
      importo: importo ? importo.toNumber() : null,
      hasTariffa: prezzoUnitario !== null,
      // Esempio: 90 min a 80€/ora → 1.5h → 120€
      esempio: dati.durataMinuti && prezzoUnitario
        ? `${dati.durataMinuti} min → ${quantita?.toFixed(2)} h → ${importo?.toFixed(2)} €`
        : null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore calcolo tariffa:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

function calcolaOre(minuti: number, arrotondamento: string): number {
  switch (arrotondamento) {
    case 'SEMPRE_SU':
      return Math.ceil(minuti / 60)
    case 'SEMPRE_GIU':
      return Math.floor(minuti / 60)
    case 'QUARTO_ORA':
      return Math.round(minuti / 15) * 15 / 60
    case 'COMMERCIALE':
    default:
      return Math.round(minuti / 60 * 100) / 100 // Arrotondamento commerciale a 2 decimali
  }
}
