// src/app/api/fatture/[id]/emetti/route.ts
// Conferma emissione di una bozza — assegna numero definitivo, salva snapshot anagrafici

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function POST(request: Request, { params: _params }: { params: Promise<{ id: string }> }) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const fattura = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        lines: { include: { workEntries: true } },
      },
    })

    if (!fattura) {
      return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 })
    }

    if (!['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)) {
      return NextResponse.json(
        { error: `Impossibile emettere una fattura in stato ${fattura.stato}` },
        { status: 400 }
      )
    }

    // Carica emittente
    const emittente = await prisma.issuerProfile.findFirst()
    if (!emittente) {
      return NextResponse.json({ error: 'Profilo emittente non configurato' }, { status: 400 })
    }

    let numeroPersonalizzato: number | undefined
    let dataDocumentoCustom: Date | undefined
    let incassataContestualmente = false
    let metodoPagamento = 'bonifico'
    let riferimentoPagamento = ''
    try {
      const body = await request.json()
      if (body?.numeroPersonalizzato != null && !isNaN(parseInt(body.numeroPersonalizzato))) {
        numeroPersonalizzato = parseInt(body.numeroPersonalizzato)
      }
      if (body?.dataDocumento) {
        dataDocumentoCustom = new Date(body.dataDocumento)
      }
      if (body?.incassataContestualmente) {
        incassataContestualmente = true
      }
      if (body?.metodoPagamento) {
        metodoPagamento = body.metodoPagamento
      }
      if (body?.riferimentoPagamento) {
        riferimentoPagamento = body.riferimentoPagamento
      }
    } catch {
      // Body vuoto o non json — procedi con sequenza automatica
    }

    const oggi = new Date()
    const dataDoc = dataDocumentoCustom && !isNaN(dataDocumentoCustom.getTime()) ? dataDocumentoCustom : oggi
    const anno = dataDoc.getFullYear()

    // TRANSAZIONE ATOMICA per assegnare numero univoco
    const fatturaEmessa = await prisma.$transaction(async (tx) => {
      // Blocca e ottieni la sequenza con FOR UPDATE
      const sequenza = await tx.documentSequence.findUnique({
        where: {
          issuerId_sezionale_anno: {
            issuerId: emittente.id,
            sezionale: 'FT',
            anno,
          },
        },
      })

      let seqId: string
      let nuovoNumero: number

      if (numeroPersonalizzato && numeroPersonalizzato > 0) {
        // Verifica che il numero personalizzato non sia già in uso
        const esiste = await tx.invoice.findFirst({
          where: {
            anno,
            sezionale: 'FT',
            numero: numeroPersonalizzato,
            stato: 'EMESSA',
          },
        })
        if (esiste) {
          throw new Error(`La fattura FT ${numeroPersonalizzato}/${anno} è già stata emessa`)
        }
        nuovoNumero = numeroPersonalizzato

        if (sequenza) {
          await tx.documentSequence.update({
            where: { id: sequenza.id },
            data: { ultimoNumero: Math.max(sequenza.ultimoNumero, nuovoNumero) },
          })
          seqId = sequenza.id
        } else {
          const nuovaSeq = await tx.documentSequence.create({
            data: {
              issuerId: emittente.id,
              sezionale: 'FT',
              anno,
              ultimoNumero: nuovoNumero,
            },
          })
          seqId = nuovaSeq.id
        }
      } else {
        if (sequenza) {
          nuovoNumero = sequenza.ultimoNumero + 1
          await tx.documentSequence.update({
            where: { id: sequenza.id },
            data: { ultimoNumero: nuovoNumero },
          })
          seqId = sequenza.id
        } else {
          // Crea la sequenza per questo anno
          const nuovaSeq = await tx.documentSequence.create({
            data: {
              issuerId: emittente.id,
              sezionale: 'FT',
              anno,
              ultimoNumero: 1,
            },
          })
          nuovoNumero = 1
          seqId = nuovaSeq.id
        }
      }

      const numeroCompleto = `FT ${nuovoNumero}/${anno}`

      // Calcola scadenza
      const termini = fattura.terminiPagamento ?? fattura.company.terminiPagamento ?? 30
      const scadenza = addDays(dataDoc, termini)

      // Snapshot anagrafici (fotografia immodificabile)
      const snapshotEmittente = {
        denominazione: emittente.denominazione,
        codiceFiscale: emittente.codiceFiscale,
        partitaIva: emittente.partitaIva,
        indirizzo: emittente.indirizzo,
        cap: emittente.cap,
        comune: emittente.comune,
        provincia: emittente.provincia,
        paese: emittente.paese,
        telefono: emittente.telefono,
        email: emittente.email,
        pec: emittente.pec,
        iban: emittente.iban,
        regimeFiscale: emittente.regimeFiscale,
        cassaPrevidenziale: emittente.cassaPrevidenziale,
        aliquotaCassa: Number(emittente.aliquotaCassa),
      }

      const snapshotCliente = {
        ragioneSociale: fattura.company.ragioneSociale,
        tipoSoggetto: fattura.company.tipoSoggetto,
        codiceFiscale: fattura.company.codiceFiscale,
        partitaIva: fattura.company.partitaIva,
        indirizzo: fattura.company.indirizzo,
        cap: fattura.company.cap,
        comune: fattura.company.comune,
        provincia: fattura.company.provincia,
        paese: fattura.company.paese,
        codiceDestinatarioSdi: fattura.company.codiceDestinatarioSdi,
        pec: fattura.company.pec,
      }

      // Emetti la fattura
      const fatturaAggiornata = await tx.invoice.update({
        where: { id: params.id },
        data: {
          sequenceId: seqId,
          numero: nuovoNumero,
          sezionale: 'FT',
          anno,
          numeroCompleto,
          stato: 'EMESSA',
          dataDocumento: dataDoc,
          dataScadenza: scadenza,
          ibanDestinatario: emittente.iban || fattura.company.ibanRiferimento,
          snapshotEmittente,
          snapshotCliente,
          emessaAl: oggi,
        },
        include: {
          company: { select: { ragioneSociale: true } },
          lines: true,
        },
      })

      // Aggiorna stato attività collegate → FATTURATA
      for (const riga of fattura.lines) {
        if (riga.workEntries.length > 0) {
          await tx.workEntry.updateMany({
            where: { invoiceLineId: riga.id },
            data: { stato: 'FATTURATA' },
          })
        }
      }

      // Se l'utente ha indicato che la fattura è già stata incassata (es. saldo da avviso di parcella)
      if (incassataContestualmente) {
        await tx.payment.create({
          data: {
            invoiceId: params.id,
            importo: fatturaAggiornata.totaleDocumento,
            dataValuta: dataDoc,
            dataIncasso: dataDoc,
            metodo: metodoPagamento,
            riferimento: riferimentoPagamento || 'Saldo all\'emissione (incasso avviso parcella)',
            registratoDa: (session.user as any).id,
          },
        })
      }

      return fatturaAggiornata
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'Invoice',
        entityId: params.id,
        azione: 'EMESSA',
        dettagli: {
          numeroCompleto: fatturaEmessa.numeroCompleto,
          totale: Number(fatturaEmessa.totaleDocumento),
        },
      },
    })

    return NextResponse.json({
      fattura: fatturaEmessa,
      messaggio: `Fattura ${fatturaEmessa.numeroCompleto} emessa con successo. Genera ora il PDF e l\'XML per l\'invio allo SdI.`,
    })
  } catch (error: any) {
    if (error?.message && !error?.code) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    // Gestisci errore di unicità numero fattura (race condition)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflitto numerazione: il numero fattura è già in uso' },
        { status: 409 }
      )
    }
    console.error('Errore emissione fattura:', error)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}
