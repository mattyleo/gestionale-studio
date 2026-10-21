// src/app/api/attivita/[id]/approva/route.ts
// Approva un'attività (DA_VERIFICARE → APPROVATA)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const attivita = await prisma.workEntry.findUnique({ where: { id: params.id } })

    if (!attivita) {
      return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })
    }

    if (!['DA_CLASSIFICARE', 'DA_VERIFICARE'].includes(attivita.stato)) {
      return NextResponse.json(
        { error: `Impossibile approvare un\'attività in stato ${attivita.stato}` },
        { status: 400 }
      )
    }

    // Verifica dati minimi per approvazione
    if (!attivita.companyId || !attivita.serviceId) {
      return NextResponse.json(
        { error: 'Per approvare l\'attività è necessario specificare l\'azienda e il tipo di prestazione' },
        { status: 400 }
      )
    }

    if (!attivita.prezzoUnitario && !attivita.importo) {
      return NextResponse.json(
        { error: 'Per approvare l\'attività è necessario specificare il prezzo' },
        { status: 400 }
      )
    }

    const attivitaAggiornata = await prisma.workEntry.update({
      where: { id: params.id },
      data: { stato: 'APPROVATA' },
    })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'WorkEntry',
        entityId: params.id,
        azione: 'APPROVED',
        dettagli: { statoPrecedente: attivita.stato },
      },
    })

    return NextResponse.json(attivitaAggiornata)
  } catch (error) {
    console.error('Errore approvazione attività:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
