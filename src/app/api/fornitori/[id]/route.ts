// src/app/api/fornitori/[id]/route.ts
// Modifica, recupero ed eliminazione/archiviazione singolo fornitore

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { id } = await _params

  try {
    const fornitore = await prisma.supplier.findUnique({
      where: { id },
    })

    if (!fornitore) {
      return NextResponse.json({ error: 'Fornitore non trovato' }, { status: 404 })
    }

    return NextResponse.json({ fornitore })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { id } = await _params

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
      attivo,
    } = body

    const fornitore = await prisma.supplier.update({
      where: { id },
      data: {
        ragioneSociale: ragioneSociale?.trim(),
        tipoSoggetto: tipoSoggetto,
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
        attivo: attivo !== undefined ? Boolean(attivo) : undefined,
      },
    })

    return NextResponse.json({ fornitore })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  const { id } = await _params

  try {
    await prisma.supplier.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
