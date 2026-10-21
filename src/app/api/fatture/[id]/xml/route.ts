// src/app/api/fatture/[id]/xml/route.ts
// Genera e scarica l'XML FatturaPA per una fattura emessa

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generaFatturaXML, validaFatturaXML } from '@/lib/xml/fattura-xml'
import type { DatiFattura, DatiEmittente, DatiCliente, RigaFattura } from '@/lib/xml/fattura-xml'

export async function GET(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        lines: { orderBy: { ordinamento: 'asc' } },
      },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    if (fattura.stato !== 'EMESSA') {
      return NextResponse.json(
        { error: 'L\'XML può essere generato solo per fatture emesse. Le bozze non possono essere trasmesse allo SdI.' },
        { status: 400 }
      )
    }

    const emittenteDb = await prisma.issuerProfile.findFirst()
    if (!emittenteDb) {
      return NextResponse.json({ error: 'Profilo emittente non configurato' }, { status: 400 })
    }

    // Usa snapshot se disponibile (fotografia al momento dell'emissione)
    const snapEmit = fattura.snapshotEmittente as any
    const snapCli = fattura.snapshotCliente as any

    const emittente: DatiEmittente = {
      denominazione: snapEmit?.denominazione ?? emittenteDb.denominazione,
      codiceFiscale: snapEmit?.codiceFiscale ?? emittenteDb.codiceFiscale,
      partitaIva: snapEmit?.partitaIva ?? emittenteDb.partitaIva,
      indirizzo: snapEmit?.indirizzo ?? emittenteDb.indirizzo,
      cap: snapEmit?.cap ?? emittenteDb.cap,
      comune: snapEmit?.comune ?? emittenteDb.comune,
      provincia: snapEmit?.provincia ?? emittenteDb.provincia,
      paese: snapEmit?.paese ?? emittenteDb.paese ?? 'IT',
      telefono: snapEmit?.telefono ?? emittenteDb.telefono,
      email: snapEmit?.email ?? emittenteDb.email,
      pec: snapEmit?.pec ?? emittenteDb.pec,
      regimeFiscale: snapEmit?.regimeFiscale ?? emittenteDb.regimeFiscale,
      cassaPrevidenziale: snapEmit?.cassaPrevidenziale ?? emittenteDb.cassaPrevidenziale,
      aliquotaCassa: Number(snapEmit?.aliquotaCassa ?? emittenteDb.aliquotaCassa),
      iban: snapEmit?.iban ?? emittenteDb.iban,
    }

    const cliente: DatiCliente = {
      ragioneSociale: snapCli?.ragioneSociale ?? fattura.company.ragioneSociale,
      tipoSoggetto: snapCli?.tipoSoggetto ?? fattura.company.tipoSoggetto,
      codiceFiscale: snapCli?.codiceFiscale ?? fattura.company.codiceFiscale,
      partitaIva: snapCli?.partitaIva ?? fattura.company.partitaIva,
      indirizzo: snapCli?.indirizzo ?? fattura.company.indirizzo,
      cap: snapCli?.cap ?? fattura.company.cap,
      comune: snapCli?.comune ?? fattura.company.comune,
      provincia: snapCli?.provincia ?? fattura.company.provincia,
      paese: snapCli?.paese ?? fattura.company.paese ?? 'IT',
      codiceDestinatarioSdi: snapCli?.codiceDestinatarioSdi ?? fattura.company.codiceDestinatarioSdi,
      pec: snapCli?.pec ?? fattura.company.pec,
    }

    const righe: RigaFattura[] = fattura.lines.map((l, i) => ({
      numero: i + 1,
      descrizione: l.descrizione,
      quantita: Number(l.quantita),
      prezzoUnitario: Number(l.prezzoUnitario),
      importo: Number(l.importo),
      aliquotaIva: l.aliquotaIva || '0',
      naturaIva: l.naturaIva || 'N2.2',
    }))

    const datiFattura: DatiFattura = {
      numeroCompleto: fattura.numeroCompleto!,
      numero: fattura.numero!,
      sezionale: fattura.sezionale ?? 'FT',
      anno: fattura.anno ?? new Date().getFullYear(),
      dataDocumento: fattura.dataDocumento!,
      dataScadenza: fattura.dataScadenza,
      modalitaPagamento: fattura.modalitaPagamento || 'MP05',
      terminiPagamento: fattura.terminiPagamento || 30,
      ibanDestinatario: fattura.ibanDestinatario ?? emittente.iban,
      imponibile: Number(fattura.imponibile),
      totaleCassa: Number(fattura.totaleCassa),
      totaleIva: Number(fattura.totaleIva),
      bollo: Number(fattura.bollo),
      totaleDocumento: Number(fattura.totaleDocumento),
      note: fattura.note,
      righe,
      emittente,
      cliente,
    }

    // Genera XML
    const xml = generaFatturaXML(datiFattura)

    // Valida struttura
    const erroriValidazione = validaFatturaXML(xml)
    if (erroriValidazione.length > 0) {
      console.error('Errori validazione XML:', erroriValidazione)
      // Non blocchiamo — restituiamo comunque il file ma logghiamo
    }

    // Nome file conforme allo standard SdI: {IdPaese}{IdCodice}_{Progressivo}.xml
    const pIva = (emittente.partitaIva || emittente.codiceFiscale).replace(/\s/g, '')
    const progFile = `FT${String(fattura.numero!).padStart(5, '0')}`
    const nomeFile = `IT${pIva}_${progFile}.xml`

    // Salva URL XML nel DB (per storico)
    await prisma.invoice.update({
      where: { id: params.id },
      data: { xmlUrl: `/api/fatture/${params.id}/xml` },
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Invoice',
        entityId: params.id,
        azione: 'XML_GENERATO',
        dettagli: { nomeFile, erroriValidazione },
      },
    })

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Content-Disposition': `attachment; filename="${nomeFile}"`,
        'X-Validation-Warnings': erroriValidazione.length > 0 ? erroriValidazione.join('; ') : 'none',
      },
    })
  } catch (error) {
    console.error('Errore generazione XML:', error)
    return NextResponse.json({ error: 'Errore interno nella generazione dell\'XML' }, { status: 500 })
  }
}
