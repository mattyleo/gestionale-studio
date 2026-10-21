// src/app/api/aziende/route.ts
// CRUD aziende — GET (elenco con filtri) e POST (nuova azienda)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validaDatiFiscaliCliente } from '@/lib/fiscal-validators'

// Schema validazione nuova azienda
const nuovaAziendaSchema = z.object({
  ragioneSociale: z.string().min(1, 'La ragione sociale è obbligatoria'),
  tipoSoggetto: z.enum(['PERSONA_GIURIDICA', 'PERSONA_FISICA', 'DITTA_INDIVIDUALE', 'ASSOCIAZIONE', 'PA']).default('PERSONA_GIURIDICA'),
  codiceFiscale: z.string().optional(),
  partitaIva: z.string().optional(),
  indirizzo: z.string().optional(),
  cap: z.string().optional(),
  comune: z.string().optional(),
  provincia: z.string().optional(),
  paese: z.string().default('IT'),
  codiceDestinatarioSdi: z.string().optional(),
  pec: z.string().email().optional().or(z.literal('')),
  emailAmministrativa: z.string().email().optional().or(z.literal('')),
  referente: z.string().optional(),
  telefono: z.string().optional(),
  note: z.string().optional(),
  modalitaPagamento: z.string().default('MP05'),
  terminiPagamento: z.number().int().min(0).default(30),
  ibanRiferimento: z.string().optional(),
  frequenzaFatturazione: z.enum(['MENSILE', 'BIMESTRALE', 'TRIMESTRALE', 'SEMESTRALE', 'ANNUALE', 'MANUALE']).default('MENSILE'),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const cerca = searchParams.get('cerca') || ''
  const stato = searchParams.get('stato') || 'attive'
  const pagina = parseInt(searchParams.get('pagina') || '1')
  const perPagina = parseInt(searchParams.get('perPagina') || '25')

  try {
    const where = {
      ...(cerca && {
        OR: [
          { ragioneSociale: { contains: cerca, mode: 'insensitive' as const } },
          { codiceFiscale: { contains: cerca, mode: 'insensitive' as const } },
          { partitaIva: { contains: cerca, mode: 'insensitive' as const } },
          { comune: { contains: cerca, mode: 'insensitive' as const } },
        ],
      }),
      ...(stato === 'attive' && { archiviata: false, attivo: true }),
      ...(stato === 'archiviate' && { archiviata: true }),
    }

    const [aziende, totale] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { ragioneSociale: 'asc' },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
        include: {
          _count: {
            select: { workEntries: true, invoices: true },
          },
        },
      }),
      prisma.company.count({ where }),
    ])

    return NextResponse.json({
      aziende,
      paginazione: {
        totale,
        pagina,
        perPagina,
        totalePagine: Math.ceil(totale / perPagina),
      },
    })
  } catch (error) {
    console.error('Errore elenco aziende:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const dati = nuovaAziendaSchema.parse(body)

    // Validazione fiscale precisa: Privato (solo CF) vs Partita IVA (Aziende/Professionisti)
    if (dati.paese === 'IT') {
      const verificaFiscale = validaDatiFiscaliCliente({
        tipoSoggetto: dati.tipoSoggetto,
        codiceFiscale: dati.codiceFiscale,
        partitaIva: dati.partitaIva,
        codiceDestinatarioSdi: dati.codiceDestinatarioSdi,
        pec: dati.pec,
      })

      if (!verificaFiscale.valida) {
        return NextResponse.json(
          { error: verificaFiscale.errori.join('. ') },
          { status: 400 }
        )
      }
    }

    const azienda = await prisma.company.create({
      data: {
        ...dati,
        pec: dati.pec || null,
        emailAmministrativa: dati.emailAmministrativa || null,
        codiceFiscale: dati.codiceFiscale || null,
        partitaIva: dati.partitaIva || null,
      },
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Company',
        entityId: azienda.id,
        azione: 'CREATED',
        dettagli: { ragioneSociale: azienda.ragioneSociale },
      },
    })

    return NextResponse.json(azienda, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore creazione azienda:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
