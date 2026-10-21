// src/app/api/aziende/[id]/route.ts
// GET, PUT, DELETE (soft) per singola azienda

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { validaDatiFiscaliCliente } from '@/lib/fiscal-validators'

const aggiornaAziendaSchema = z.object({
  ragioneSociale: z.string().min(1).optional(),
  tipoSoggetto: z.enum(['PERSONA_GIURIDICA', 'PERSONA_FISICA', 'DITTA_INDIVIDUALE', 'ASSOCIAZIONE', 'PA']).optional(),
  codiceFiscale: z.string().optional().nullable(),
  partitaIva: z.string().optional().nullable(),
  indirizzo: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  comune: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  paese: z.string().optional(),
  codiceDestinatarioSdi: z.string().optional().nullable(),
  pec: z.string().optional().nullable(),
  emailAmministrativa: z.string().optional().nullable(),
  referente: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  modalitaPagamento: z.string().optional(),
  terminiPagamento: z.number().int().min(0).optional(),
  ibanRiferimento: z.string().optional().nullable(),
  frequenzaFatturazione: z.enum(['MENSILE', 'BIMESTRALE', 'TRIMESTRALE', 'SEMESTRALE', 'ANNUALE', 'MANUALE']).optional(),
  attivo: z.boolean().optional(),
  motivo: z.string().optional(), // Motivo della modifica per storico
})

export async function GET(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const azienda = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        priceRules: {
          include: { service: true },
          orderBy: { validaDal: 'desc' },
        },
        _count: {
          select: { workEntries: true, invoices: true },
        },
        historySnapshots: {
          orderBy: { changedAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    return NextResponse.json(azienda)
  } catch (error) {
    console.error('Errore dettaglio azienda:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const body = await request.json()
    const { motivo, ...dati } = aggiornaAziendaSchema.parse(body)

    // Salva snapshot prima di modificare
    const aziendaCorrente = await prisma.company.findUnique({ where: { id: params.id } })
    if (!aziendaCorrente) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Validazione fiscale precisa: Privato vs Partita IVA
    const tipo = dati.tipoSoggetto ?? aziendaCorrente.tipoSoggetto
    const cf = dati.codiceFiscale !== undefined ? dati.codiceFiscale : aziendaCorrente.codiceFiscale
    const piva = dati.partitaIva !== undefined ? dati.partitaIva : aziendaCorrente.partitaIva
    const sdi = dati.codiceDestinatarioSdi !== undefined ? dati.codiceDestinatarioSdi : aziendaCorrente.codiceDestinatarioSdi
    const paese = dati.paese ?? aziendaCorrente.paese ?? 'IT'

    if (paese === 'IT') {
      const verifica = validaDatiFiscaliCliente({
        tipoSoggetto: tipo,
        codiceFiscale: cf,
        partitaIva: piva,
        codiceDestinatarioSdi: sdi,
        pec: dati.pec !== undefined ? dati.pec : aziendaCorrente.pec,
      })

      if (!verifica.valida) {
        return NextResponse.json({ error: verifica.errori.join('. ') }, { status: 400 })
      }
    }

    // Verifica se i dati anagrafici principali sono cambiati (richiede snapshot)
    const campiAnagrafici = ['ragioneSociale', 'codiceFiscale', 'partitaIva', 'indirizzo', 'cap', 'comune']
    const cambiato = campiAnagrafici.some(campo => {
      const vecchio = (aziendaCorrente as any)[campo]
      const nuovo = (dati as any)[campo]
      return nuovo !== undefined && nuovo !== vecchio
    })

    if (cambiato) {
      await prisma.companyHistorySnapshot.create({
        data: {
          companyId: params.id,
          changedBy: (session.user as any).id,
          motivo: motivo || 'Modifica anagrafica',
          snapshot: aziendaCorrente as any,
        },
      })
    }

    const aziendaAggiornata = await prisma.company.update({
      where: { id: params.id },
      data: dati,
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Company',
        entityId: params.id,
        azione: 'UPDATED',
        dettagli: { campiModificati: Object.keys(dati) },
      },
    })

    return NextResponse.json(aziendaAggiornata)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dati non validi', dettagli: error.issues }, { status: 400 })
    }
    console.error('Errore aggiornamento azienda:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    // Verifica se ha attività, fatture o pagamenti — in quel caso solo archivio
    const [countAttivita, countFatture] = await Promise.all([
      prisma.workEntry.count({ where: { companyId: params.id } }),
      prisma.invoice.count({ where: { companyId: params.id } }),
    ])

    if (countAttivita > 0 || countFatture > 0) {
      // Non si può cancellare — solo archiviare
      const azienda = await prisma.company.update({
        where: { id: params.id },
        data: {
          archiviata: true,
          attivo: false,
          dataArchiviazione: new Date(),
        },
      })

      await prisma.auditEvent.create({
        data: {
          userId: (session.user as any).id,
          entityType: 'Company',
          entityId: params.id,
          azione: 'ARCHIVED',
          dettagli: { motivo: 'Archiviata — ha dati collegati' },
        },
      })

      return NextResponse.json({
        messaggio: 'Azienda archiviata (ha attività o fatture collegate, non può essere eliminata)',
        azienda,
      })
    }

    // Nessun dato collegato — cancellazione fisica
    await prisma.company.delete({ where: { id: params.id } })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Company',
        entityId: params.id,
        azione: 'DELETED',
      },
    })

    return NextResponse.json({ messaggio: 'Azienda eliminata' })
  } catch (error) {
    console.error('Errore eliminazione azienda:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
