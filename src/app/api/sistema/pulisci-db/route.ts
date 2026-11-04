// src/app/api/sistema/pulisci-db/route.ts
// Endpoint sicuro per ripulire il database e azzerare le fatture lasciando intatti utente e studio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    // 1. Pagamenti
    const p = await prisma.payment.deleteMany({})

    // 2. Trasmissioni SdI
    const t = await prisma.invoiceTransmission.deleteMany({})

    // 3. Righe fattura
    const l = await prisma.invoiceLine.deleteMany({})

    // 4. Fatture
    const inv = await prisma.invoice.deleteMany({})

    // 5. Attività (Work Entries)
    const w = await prisma.workEntry.deleteMany({})

    // 6. Eventi Calendario
    const ev = await prisma.calendarEvent.deleteMany({})

    // 7. Documenti allegati
    const doc = await prisma.companyDocument.deleteMany({})

    // 8. Contatti aziende
    const cont = await prisma.companyContact.deleteMany({})

    // 9. Storico modifiche
    const h = await prisma.companyHistorySnapshot.deleteMany({})

    // 10. Regole tariffarie custom clienti
    const pr = await prisma.priceRule.deleteMany({
      where: { companyId: { not: null } },
    })

    // 11. Aziende clienti
    const c = await prisma.company.deleteMany({})

    // 11b. Fatture acquisto e fornitori
    let purchCount = 0
    let suppCount = 0
    try {
      const purch = await (prisma as any).purchaseInvoice.deleteMany({})
      purchCount = purch.count
      const supp = await prisma.supplier.deleteMany({})
      suppCount = supp.count
    } catch {}

    // 12. Reset contatori numerazione sequenze
    const seq = await prisma.documentSequence.deleteMany({})

    // 13. Audit events
    const aud = await prisma.auditEvent.deleteMany({})

    return NextResponse.json({
      success: true,
      messaggio: 'Database ripulito con successo. Account e configurazione studio preservati.',
      eliminati: {
        fatture: inv.count,
        pagamenti: p.count,
        aziende: c.count,
        acquisti: purchCount,
        fornitori: suppCount,
        attivita: w.count,
      },
    })
  } catch (err: any) {
    console.error('Errore pulizia DB:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
