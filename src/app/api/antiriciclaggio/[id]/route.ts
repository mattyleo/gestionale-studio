// src/app/api/antiriciclaggio/[id]/route.ts
// Gestione singolo fascicolo antiriciclaggio cliente

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const azienda = await prisma.company.findUnique({
      where: { id },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const emittente = await prisma.issuerProfile.findFirst()

    return NextResponse.json({ azienda, emittente })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    const body = await req.json()
    const {
      // Dati anagrafici aziendali
      ragioneSociale,
      tipoSoggetto,
      codiceFiscale,
      partitaIva,
      indirizzo,
      cap,
      comune,
      provincia,
      telefono,
      emailAmministrativa,
      pec,
      codiceDestinatarioSdi,

      // Dati antiriciclaggio & privacy
      settoreAttivita,
      legaleRappresentante,
      cfRappresentante,
      dataNascitaRappr,
      luogoNascitaRappr,
      documentoTipo,
      documentoNumero,
      documentoRilasciatoDa,
      documentoDataRilascio,
      documentoScadenza,
      documentoFileUrl,
      antiriciclaggioObbligo,
      antiriciclaggioFascicolo,
      antiriciclaggioDataVerifica,
      antiriciclaggioDataScadenza,
      antiriciclaggioRischio,
      antiriciclaggioPunteggio,
      antiriciclaggioTitolareEffettivo,
      antiriciclaggioCfTitolareEffettivo,
      antiriciclaggioPep,
      antiriciclaggioPrestazione,
      antiriciclaggioStato,
      antiriciclaggioNote,
      privacyFirmata,
      privacyData,
      privacyNote,
    } = body

    const azienda = await prisma.company.update({
      where: { id },
      data: {
        // Aggiornamento anagrafico se passato
        ragioneSociale: ragioneSociale !== undefined ? ragioneSociale?.trim() : undefined,
        tipoSoggetto: tipoSoggetto || undefined,
        codiceFiscale: codiceFiscale !== undefined ? (codiceFiscale?.trim().toUpperCase() || null) : undefined,
        partitaIva: partitaIva !== undefined ? (partitaIva?.trim() || null) : undefined,
        indirizzo: indirizzo !== undefined ? (indirizzo?.trim() || null) : undefined,
        cap: cap !== undefined ? (cap?.trim() || null) : undefined,
        comune: comune !== undefined ? (comune?.trim() || null) : undefined,
        provincia: provincia !== undefined ? (provincia?.trim().toUpperCase() || null) : undefined,
        telefono: telefono !== undefined ? (telefono?.trim() || null) : undefined,
        emailAmministrativa: emailAmministrativa !== undefined ? (emailAmministrativa?.trim() || null) : undefined,
        pec: pec !== undefined ? (pec?.trim() || null) : undefined,
        codiceDestinatarioSdi: codiceDestinatarioSdi !== undefined ? (codiceDestinatarioSdi?.trim().toUpperCase() || null) : undefined,

        // Antiriciclaggio & Privacy
        settoreAttivita: settoreAttivita || undefined,
        legaleRappresentante: legaleRappresentante !== undefined ? legaleRappresentante?.trim() || null : undefined,
        cfRappresentante: cfRappresentante !== undefined ? cfRappresentante?.trim().toUpperCase() || null : undefined,
        dataNascitaRappr: dataNascitaRappr ? new Date(dataNascitaRappr) : dataNascitaRappr === null ? null : undefined,
        luogoNascitaRappr: luogoNascitaRappr !== undefined ? luogoNascitaRappr?.trim() || null : undefined,
        documentoTipo: documentoTipo !== undefined ? documentoTipo : undefined,
        documentoNumero: documentoNumero !== undefined ? documentoNumero?.trim().toUpperCase() || null : undefined,
        documentoRilasciatoDa: documentoRilasciatoDa !== undefined ? documentoRilasciatoDa?.trim() || null : undefined,
        documentoDataRilascio: documentoDataRilascio ? new Date(documentoDataRilascio) : documentoDataRilascio === null ? null : undefined,
        documentoScadenza: documentoScadenza ? new Date(documentoScadenza) : documentoScadenza === null ? null : undefined,
        documentoFileUrl: documentoFileUrl !== undefined ? documentoFileUrl : undefined,
        antiriciclaggioObbligo: antiriciclaggioObbligo !== undefined ? Boolean(antiriciclaggioObbligo) : undefined,
        antiriciclaggioFascicolo: antiriciclaggioFascicolo !== undefined ? antiriciclaggioFascicolo?.trim() || null : undefined,
        antiriciclaggioDataVerifica: antiriciclaggioDataVerifica ? new Date(antiriciclaggioDataVerifica) : antiriciclaggioDataVerifica === null ? null : undefined,
        antiriciclaggioDataScadenza: antiriciclaggioDataScadenza ? new Date(antiriciclaggioDataScadenza) : antiriciclaggioDataScadenza === null ? null : undefined,
        antiriciclaggioRischio: antiriciclaggioRischio || undefined,
        antiriciclaggioPunteggio: antiriciclaggioPunteggio !== undefined ? Number(antiriciclaggioPunteggio) : undefined,
        antiriciclaggioTitolareEffettivo: antiriciclaggioTitolareEffettivo !== undefined ? antiriciclaggioTitolareEffettivo?.trim() || null : undefined,
        antiriciclaggioCfTitolareEffettivo: antiriciclaggioCfTitolareEffettivo !== undefined ? antiriciclaggioCfTitolareEffettivo?.trim().toUpperCase() || null : undefined,
        antiriciclaggioPep: antiriciclaggioPep !== undefined ? Boolean(antiriciclaggioPep) : undefined,
        antiriciclaggioPrestazione: antiriciclaggioPrestazione !== undefined ? antiriciclaggioPrestazione?.trim() || null : undefined,
        antiriciclaggioStato: antiriciclaggioStato || undefined,
        antiriciclaggioNote: antiriciclaggioNote !== undefined ? antiriciclaggioNote?.trim() || null : undefined,
        privacyFirmata: privacyFirmata !== undefined ? Boolean(privacyFirmata) : undefined,
        privacyData: privacyData ? new Date(privacyData) : privacyData === null ? null : undefined,
        privacyNote: privacyNote !== undefined ? privacyNote?.trim() || null : undefined,
      },
    })

    return NextResponse.json({ azienda })
  } catch (err: any) {
    console.error('Errore PUT /api/antiriciclaggio/[id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { id } = await _params

  try {
    // Verifica se ha attività o fatture collegate
    const [countAttivita, countFatture] = await Promise.all([
      prisma.workEntry.count({ where: { companyId: id } }),
      prisma.invoice.count({ where: { companyId: id } }),
    ])

    if (countAttivita > 0 || countFatture > 0) {
      // Non si può cancellare fisicamente per integrità contabile e fiscale: solo archivio
      const azienda = await prisma.company.update({
        where: { id },
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
          entityId: id,
          azione: 'ARCHIVED',
          dettagli: { motivo: 'Archiviata da antiriciclaggio — ha documenti contabili collegati' },
        },
      })

      return NextResponse.json({
        archiviato: true,
        messaggio: 'Cliente archiviato con successo (ha attività o fatture collegate, conservato per obblighi fiscali)',
        azienda,
      })
    }

    // Nessun dato contabile collegato: cancellazione fisica sicura
    await prisma.company.delete({ where: { id } })

    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Company',
        entityId: id,
        azione: 'DELETED',
        dettagli: { origine: 'Registro Antiriciclaggio' },
      },
    })

    return NextResponse.json({
      eliminato: true,
      messaggio: 'Cliente eliminato definitivamente',
    })
  } catch (err: any) {
    console.error('Errore DELETE /api/antiriciclaggio/[id]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
