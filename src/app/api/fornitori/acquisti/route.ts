// src/app/api/fornitori/acquisti/route.ts
// Elenco e statistiche fatture d'acquisto / passive

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cerca = searchParams.get('cerca')?.trim() || ''
  const supplierId = searchParams.get('supplierId') || undefined
  const anno = searchParams.get('anno') ? parseInt(searchParams.get('anno')!) : undefined

  try {
    const where: any = {}
    if (supplierId) where.supplierId = supplierId

    if (cerca) {
      where.OR = [
        { numero: { contains: cerca, mode: 'insensitive' } },
        { supplier: { ragioneSociale: { contains: cerca, mode: 'insensitive' } } },
        { supplier: { partitaIva: { contains: cerca, mode: 'insensitive' } } },
      ]
    }

    if (anno) {
      where.dataDocumento = {
        gte: new Date(`${anno}-01-01`),
        lte: new Date(`${anno}-12-31T23:59:59.999Z`),
      }
    }

    const fatture = await prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: true,
      },
      orderBy: { dataDocumento: 'desc' },
      take: 100,
    })

    const totaleImporto = fatture.reduce((acc, f) => acc + Number(f.totaleDocumento), 0)
    const totaleImponibile = fatture.reduce((acc, f) => acc + Number(f.imponibile), 0)
    const totaleIva = fatture.reduce((acc, f) => acc + Number(f.totaleIva), 0)

    return NextResponse.json({
      fatture,
      conteggio: fatture.length,
      statistiche: {
        totaleImporto,
        totaleImponibile,
        totaleIva,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
