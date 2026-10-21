// src/app/api/fornitori/route.ts
// Gestione Fornitori: Elenco e creazione

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const cerca = searchParams.get('cerca')?.trim() || ''
  const stato = searchParams.get('stato') || 'attivi'
  const categoria = searchParams.get('categoria') || 'TUTTE'
  const pagina = Math.max(1, parseInt(searchParams.get('pagina') || '1', 10))
  const perPagina = Math.min(100, Math.max(1, parseInt(searchParams.get('perPagina') || '20', 10)))

  const where: any = {}

  if (stato === 'attivi') {
    where.attivo = true
  } else if (stato === 'archiviati') {
    where.attivo = false
  }

  if (categoria && categoria !== 'TUTTE') {
    where.categoria = categoria
  }

  if (cerca) {
    where.OR = [
      { ragioneSociale: { contains: cerca, mode: 'insensitive' } },
      { partitaIva: { contains: cerca, mode: 'insensitive' } },
      { codiceFiscale: { contains: cerca, mode: 'insensitive' } },
      { comune: { contains: cerca, mode: 'insensitive' } },
      { referente: { contains: cerca, mode: 'insensitive' } },
    ]
  }

  try {
    const [totale, fornitori, categorieRaw] = await Promise.all([
      prisma.supplier.count({ where }),
      prisma.supplier.findMany({
        where,
        orderBy: { ragioneSociale: 'asc' },
        skip: (pagina - 1) * perPagina,
        take: perPagina,
      }),
      prisma.supplier.findMany({
        select: { categoria: true },
        distinct: ['categoria'],
      }),
    ])

    const categorie = categorieRaw.map((c) => c.categoria).filter(Boolean) as string[]

    return NextResponse.json({
      fornitori,
      categorie,
      paginazione: {
        totale,
        pagina,
        perPagina,
        totalePagine: Math.ceil(totale / perPagina) || 1,
      },
    })
  } catch (error: any) {
    console.error('Errore GET /api/fornitori:', error)
    return NextResponse.json({ error: error.message || 'Errore server' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      ragioneSociale,
      tipoSoggetto,
      partitaIva,
      codiceFiscale,
      indirizzo,
      cap,
      comune,
      provincia,
      paese,
      email,
      pec,
      telefono,
      referente,
      codiceDestinatarioSdi,
      iban,
      categoria,
      note,
    } = body

    if (!ragioneSociale || !ragioneSociale.trim()) {
      return NextResponse.json({ error: 'La ragione sociale è obbligatoria' }, { status: 400 })
    }

    const fornitore = await prisma.supplier.create({
      data: {
        ragioneSociale: ragioneSociale.trim(),
        tipoSoggetto: tipoSoggetto || 'PERSONA_GIURIDICA',
        partitaIva: partitaIva?.trim() || null,
        codiceFiscale: codiceFiscale?.trim().toUpperCase() || null,
        indirizzo: indirizzo?.trim() || null,
        cap: cap?.trim() || null,
        comune: comune?.trim() || null,
        provincia: provincia?.trim().toUpperCase() || null,
        paese: paese?.trim().toUpperCase() || 'IT',
        email: email?.trim() || null,
        pec: pec?.trim() || null,
        telefono: telefono?.trim() || null,
        referente: referente?.trim() || null,
        codiceDestinatarioSdi: codiceDestinatarioSdi?.trim() || '0000000',
        iban: iban?.trim().replace(/\s/g, '').toUpperCase() || null,
        categoria: categoria?.trim() || 'Generale',
        note: note?.trim() || null,
        attivo: true,
      },
    })

    return NextResponse.json({ fornitore }, { status: 201 })
  } catch (error: any) {
    console.error('Errore POST /api/fornitori:', error)
    return NextResponse.json({ error: error.message || 'Errore creazione fornitore' }, { status: 500 })
  }
}
