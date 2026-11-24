// src/app/api/aziende/[id]/contabilita/route.ts
// Gestione Contabilità, Prima Nota, Liquidazione IVA e Piano dei Conti del singolo cliente

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assureDbSchemaAligned } from '@/lib/db-align'
import { analizzaFiscaleCliente } from '@/lib/fiscal-intelligence'
import { Decimal } from 'decimal.js'

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()

    const azienda = await prisma.company.findUnique({
      where: { id: params.id },
      include: {
        accountingEntries: {
          orderBy: { dataRegistrazione: 'desc' },
          take: 100,
        },
        invoices: {
          where: { stato: 'EMESSA' },
          select: {
            id: true,
            numero: true,
            sezionale: true,
            dataDocumento: true,
            totaleDocumento: true,
            imponibile: true,
            totaleIva: true,
          },
          orderBy: { dataDocumento: 'desc' },
          take: 50,
        },
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Calcolo auto-suggerimento fiscale dell'assistente studio
    const suggerimento = analizzaFiscaleCliente(azienda)

    // Calcolo riassuntivo Liquidazione IVA
    // Somma IVA a debito (da fatture emesse e corrispettivi) e IVA a credito (da acquisti registrati)
    let totaleIvaDebito = 0
    let totaleImponibileVendite = 0
    for (const inv of azienda.invoices) {
      totaleIvaDebito += Number(inv.totaleIva || 0)
      totaleImponibileVendite += Number(inv.imponibile || 0)
    }

    let totaleIvaCredito = 0
    let totaleImponibileAcquisti = 0
    for (const entry of azienda.accountingEntries) {
      if (entry.tipoRegistro === 'ACQUISTI' && entry.impostaIva) {
        totaleIvaCredito += Number(entry.impostaIva || 0)
        totaleImponibileAcquisti += Number(entry.importoDare || 0)
      } else if (entry.tipoRegistro === 'VENDITE' && entry.impostaIva) {
        totaleIvaDebito += Number(entry.impostaIva || 0)
      }
    }

    const saldoIva = totaleIvaDebito - totaleIvaCredito

    // Piano dei conti modello in base al regime contabile
    const regime = azienda.regimeContabile || suggerimento.regimeContabile
    const pianoContiModello = getPianoContiPerRegime(regime)

    return NextResponse.json({
      successo: true,
      azienda: {
        id: azienda.id,
        ragioneSociale: azienda.ragioneSociale,
        partitaIva: azienda.partitaIva,
        codiceFiscale: azienda.codiceFiscale,
        dataInizioAttivita: azienda.dataInizioAttivita,
        periodicitaIva: azienda.periodicitaIva || suggerimento.periodicitaIva,
        codiceAteco: azienda.codiceAteco || suggerimento.codiceAteco,
        descrizioneAteco: azienda.descrizioneAteco || suggerimento.descrizioneAteco,
        regimeContabile: regime,
        gruppoAmmortamenti: azienda.gruppoAmmortamenti || suggerimento.gruppoAmmortamenti,
        ibanRiferimento: azienda.ibanRiferimento,
        registriIva: azienda.registriIva || suggerimento.registriIvaConsigliati,
      },
      suggerimentoBot: suggerimento,
      primaNota: azienda.accountingEntries,
      liquidazioneIva: {
        periodicita: azienda.periodicitaIva || 'TRIMESTRALE',
        totaleImponibileVendite,
        totaleIvaDebito,
        totaleImponibileAcquisti,
        totaleIvaCredito,
        saldoIva,
        statoSaldo: saldoIva > 0 ? 'A_DEBITO' : saldoIva < 0 ? 'A_CREDITO' : 'A_PAREGGIO',
      },
      pianoConti: pianoContiModello,
    })
  } catch (error: any) {
    console.error('Errore contabilità cliente:', error)
    return NextResponse.json({ error: error.message || 'Errore server contabilità' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()
    const body = await request.json()

    const {
      dataRegistrazione,
      dataCompetenza,
      numeroDocumento,
      dataDocumento,
      descrizione,
      contoDareCodice,
      contoDareNome,
      contoAvereCodice,
      contoAvereNome,
      importoDare,
      importoAvere,
      tipoRegistro,
      aliquotaIva,
      impostaIva,
      reverseCharge,
      note,
    } = body

    if (!descrizione || !descrizione.trim()) {
      return NextResponse.json({ error: 'La causale / descrizione operazione è obbligatoria' }, { status: 400 })
    }

    const dataReg = dataRegistrazione ? new Date(dataRegistrazione) : new Date()

    const nuovaRegistrazione = await prisma.companyAccountingEntry.create({
      data: {
        companyId: params.id,
        dataRegistrazione: dataReg,
        dataCompetenza: dataCompetenza ? new Date(dataCompetenza) : dataReg,
        numeroDocumento: numeroDocumento?.trim() || null,
        dataDocumento: dataDocumento ? new Date(dataDocumento) : null,
        descrizione: descrizione.trim(),
        contoDareCodice: contoDareCodice?.trim() || null,
        contoDareNome: contoDareNome?.trim() || null,
        contoAvereCodice: contoAvereCodice?.trim() || null,
        contoAvereNome: contoAvereNome?.trim() || null,
        importoDare: new Decimal(Number(importoDare) || 0),
        importoAvere: new Decimal(Number(importoAvere) || 0),
        tipoRegistro: tipoRegistro || 'GENERALE',
        aliquotaIva: aliquotaIva ? new Decimal(Number(aliquotaIva)) : null,
        impostaIva: impostaIva ? new Decimal(Number(impostaIva)) : null,
        reverseCharge: Boolean(reverseCharge),
        note: note?.trim() || null,
      },
    })

    return NextResponse.json({
      successo: true,
      registrazione: nuovaRegistrazione,
      messaggio: 'Registrazione di Prima Nota salvata con successo',
    })
  } catch (error: any) {
    console.error('Errore salvataggio prima nota:', error)
    return NextResponse.json({ error: error.message || 'Errore salvataggio registrazione' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'ID registrazione mancante' }, { status: 400 })
    }

    await prisma.companyAccountingEntry.delete({
      where: { id: entryId, companyId: params.id },
    })

    return NextResponse.json({ successo: true, messaggio: 'Registrazione eliminata' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getPianoContiPerRegime(regime: string) {
  if (regime === 'FORFETTARIO') {
    return {
      tipo: 'FORFETTARIO',
      nome: 'Piano dei Conti Forfettari (L. 190/2014)',
      sezioni: [
        {
          codice: '01',
          nome: 'Cassa e Banche',
          conti: [
            { codice: '01.01.01', nome: 'Cassa contanti' },
            { codice: '01.02.01', nome: 'Banca c/c ordinario' },
            { codice: '01.03.01', nome: 'Carte di credito / POS' },
          ],
        },
        {
          codice: '05',
          nome: 'Ricavi e Compensi Professionali (Quadro LM)',
          conti: [
            { codice: '05.01.01', nome: 'Compensi professionali forfettari' },
            { codice: '05.01.02', nome: 'Ricavi vendita merci / prestazioni' },
            { codice: '05.02.01', nome: 'Rimborsi spese forfettari' },
          ],
        },
        {
          codice: '06',
          nome: 'Costi Operativi e Contributi INPS',
          conti: [
            { codice: '06.01.01', nome: 'Contributi previdenziali INPS Gestione Separata (Deduzioni LM34)' },
            { codice: '06.01.02', nome: 'Contributi cassa di previdenza professionale' },
            { codice: '06.02.01', nome: 'Acquisti merci e beni strumentali' },
            { codice: '06.03.01', nome: 'Spese telefonia e software' },
          ],
        },
      ],
    }
  }

  if (regime === 'PROFESSIONISTI') {
    return {
      tipo: 'PROFESSIONISTI',
      nome: 'Piano dei Conti Professionisti / Lavoratori Autonomi (Quadro RE)',
      sezioni: [
        {
          codice: '10',
          nome: 'Attivo Circolante e Disponibilità',
          conti: [
            { codice: '10.01.01', nome: 'Cassa professionale' },
            { codice: '10.02.01', nome: 'Banca c/c professionale' },
            { codice: '10.10.01', nome: 'Crediti v/clienti per parcelle da incassare' },
          ],
        },
        {
          codice: '20',
          nome: 'Debiti Tributari e Previdenziali',
          conti: [
            { codice: '20.01.01', nome: 'Erario c/IVA vendite' },
            { codice: '20.01.02', nome: 'Erario c/IVA acquisti' },
            { codice: '20.02.01', nome: 'Erario c/Ritenute d\'acconto subite (Quadro RE)' },
            { codice: '20.03.01', nome: 'Debiti v/Cassa Previdenza' },
          ],
        },
        {
          codice: '40',
          nome: 'Compensi Professionali (RE2)',
          conti: [
            { codice: '40.01.01', nome: 'Compensi professionali ordinari (art. 54 TUIR)' },
            { codice: '40.02.01', nome: 'Rimborsi spese a piè di lista / anticipate' },
            { codice: '40.03.01', nome: 'Maggiorazione rivalsa cassa previdenziale 4%' },
          ],
        },
        {
          codice: '50',
          nome: 'Spese di Studio e Costi Deducibili (RE7-RE19)',
          conti: [
            { codice: '50.01.01', nome: 'Quote ammortamento beni strumentali studio' },
            { codice: '50.02.01', nome: 'Canoni locazione e spese condominio studio' },
            { codice: '50.03.01', nome: 'Utenze luce, gas, telefonia studio (Deducibilità art. 54)' },
            { codice: '50.04.01', nome: 'Spese per convegni, corsi formazione e congressi (100% fino a 10k)' },
            { codice: '50.05.01', nome: 'Spese di rappresentanza e prestazioni alberghiere/ristoranti' },
          ],
        },
      ],
    }
  }

  // Imprese Semplificato o Ordinario
  return {
    tipo: 'IMPRESE',
    nome: 'Piano dei Conti Imprese CNDCEC (Quadro RG / Bilancio CEE)',
    sezioni: [
      {
        codice: '01',
        nome: 'Immobilizzazioni Materiali e Finanziarie',
        conti: [
          { codice: '01.01.01', nome: 'Impianti e macchinari' },
          { codice: '01.02.01', nome: 'Attrezzature industriali e commerciali' },
          { codice: '01.03.01', nome: 'Automezzi e furgoni di trasporto' },
          { codice: '01.04.01', nome: 'Mobili e macchine d\'ufficio elettroniche' },
          { codice: '01.09.01', nome: 'Fondo ammortamento ordinario beni' },
        ],
      },
      {
        codice: '10',
        nome: 'Crediti, Banche e Liquidità',
        conti: [
          { codice: '10.01.01', nome: 'Crediti verso clienti Italia' },
          { codice: '10.02.01', nome: 'Banca c/c attivo' },
          { codice: '10.03.01', nome: 'Cassa contanti' },
          { codice: '10.05.01', nome: 'Erario c/IVA a credito' },
        ],
      },
      {
        codice: '20',
        nome: 'Debiti Commerciali e Finanziari',
        conti: [
          { codice: '20.01.01', nome: 'Debiti verso fornitori Italia' },
          { codice: '20.02.01', nome: 'Erario c/IVA a debito' },
          { codice: '20.03.01', nome: 'Erario c/Ritenute da versare' },
          { codice: '20.04.01', nome: 'Istituti previdenziali INPS / INAIL' },
        ],
      },
      {
        codice: '30',
        nome: 'Valore della Produzione (Ricavi)',
        conti: [
          { codice: '30.01.01', nome: 'Ricavi delle vendite di merci e prodotti finiti' },
          { codice: '30.02.01', nome: 'Ricavi delle prestazioni di servizi' },
          { codice: '30.03.01', nome: 'Corrispettivi lordi da scorporare' },
        ],
      },
      {
        codice: '40',
        nome: 'Costi della Produzione (Acquisti & Servizi)',
        conti: [
          { codice: '40.01.01', nome: 'Acquisti di merci destinate alla rivendita' },
          { codice: '40.01.02', nome: 'Acquisti di materie prime e semilavorati' },
          { codice: '40.02.01', nome: 'Costi per lavorazioni e servizi di terzi' },
          { codice: '40.03.01', nome: 'Consulenze tecniche e legali' },
          { codice: '40.04.01', nome: 'Godimento beni di terzi / Locazioni' },
          { codice: '40.05.01', nome: 'Quote ammortamento d\'esercizio' },
        ],
      },
    ],
  }
}
