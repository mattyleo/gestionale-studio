// src/app/api/aziende/[id]/contabilita/route.ts
// Gestione Contabilità, Prima Nota, Registri IVA con Protocolli e Scritture NO IVA dello studio
// Specifiche Dott. Antonio Tuzio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assureDbSchemaAligned } from '@/lib/db-align'
import { analizzaFiscaleCliente } from '@/lib/fiscal-intelligence'
import { REGISTRI_IVA_STANDARD, TIPI_SCRITTURE_NO_IVA, trovaRegistroIva } from '@/lib/registri-iva'
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

    const { searchParams } = new URL(request.url)
    const filtroRegistro = searchParams.get('registroCodice') // es. 'A1', 'V1', 'C1', 'AR1'
    const filtroAnno = searchParams.get('anno') ? parseInt(searchParams.get('anno')!) : null

    // Costruisci clausola where per le registrazioni contabili
    const whereEntries: any = { companyId: params.id }
    if (filtroRegistro && filtroRegistro !== 'TUTTI') {
      whereEntries.registroCodice = filtroRegistro
    }
    if (filtroAnno) {
      whereEntries.anno = filtroAnno
    }

    const [azienda, entries, maxProt] = await Promise.all([
      prisma.company.findUnique({
        where: { id: params.id },
        include: {
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
      }),
      prisma.companyAccountingEntry.findMany({
        where: whereEntries,
        orderBy: [
          { dataRegistrazione: 'desc' },
          { protocollo: 'desc' },
        ],
        take: 300,
      }),
      prisma.companyAccountingEntry.findFirst({
        where: {
          companyId: params.id,
          registroCodice: filtroRegistro && filtroRegistro !== 'TUTTI' ? filtroRegistro : 'A1',
          ...(filtroAnno ? { anno: filtroAnno } : {}),
        },
        orderBy: { protocollo: 'desc' },
      }),
    ])

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    // Auto-suggerimento fiscale assistente studio
    const suggerimento = analizzaFiscaleCliente(azienda)

    // Calcolo riassuntivo Liquidazione IVA
    let totaleIvaDebito = 0
    let totaleImponibileVendite = 0
    for (const inv of azienda.invoices) {
      totaleIvaDebito += Number(inv.totaleIva || 0)
      totaleImponibileVendite += Number(inv.imponibile || 0)
    }

    let totaleIvaCredito = 0
    let totaleImponibileAcquisti = 0
    for (const entry of entries) {
      if (entry.tipoRegistro === 'ACQUISTI' || entry.registroCodice?.startsWith('A')) {
        totaleIvaCredito += Number(entry.impostaIva || 0)
        totaleImponibileAcquisti += Number(entry.importoDare || 0)
      } else if (entry.tipoRegistro === 'VENDITE' || entry.registroCodice?.startsWith('V') || entry.registroCodice?.startsWith('C')) {
        totaleIvaDebito += Number(entry.impostaIva || 0)
        totaleImponibileVendite += Number(entry.importoAvere || 0)
      }
    }

    const saldoIva = totaleIvaDebito - totaleIvaCredito

    // Struttura Piano dei Conti in base al regime
    const regime = azienda.regimeContabile || suggerimento.regimeContabile || 'SEMPLIFICATO'
    const pianoConti = getPianoContiPerRegime(regime)

    // Conteggio per registro
    const conteggiPerRegistro: Record<string, number> = {}
    for (const r of REGISTRI_IVA_STANDARD) {
      conteggiPerRegistro[r.codice] = 0
    }
    for (const e of entries) {
      const reg = e.registroCodice || 'A1'
      conteggiPerRegistro[reg] = (conteggiPerRegistro[reg] || 0) + 1
    }

    return NextResponse.json({
      azienda: {
        id: azienda.id,
        ragioneSociale: azienda.ragioneSociale,
        partitaIva: azienda.partitaIva,
        codiceFiscale: azienda.codiceFiscale,
        tipoSoggetto: azienda.tipoSoggetto,
        dataInizioAttivita: azienda.dataInizioAttivita,
        periodicitaIva: azienda.periodicitaIva,
        codiceAteco: azienda.codiceAteco,
        descrizioneAteco: azienda.descrizioneAteco,
        regimeContabile: azienda.regimeContabile,
        gruppoAmmortamenti: azienda.gruppoAmmortamenti,
        ibanRiferimento: azienda.ibanRiferimento,
        registriIva: azienda.registriIva,
      },
      registriDisponibili: REGISTRI_IVA_STANDARD,
      tipiScrittureNoIva: TIPI_SCRITTURE_NO_IVA,
      conteggiPerRegistro,
      prossimoProtocollo: (maxProt?.protocollo || 0) + 1,
      primaNota: entries,
      quadraturaIva: {
        periodicitaIva: azienda.periodicitaIva || 'TRIMESTRALE',
        totaleImponibileVendite,
        totaleIvaDebito,
        totaleImponibileAcquisti,
        totaleIvaCredito,
        saldoIva,
        esito: saldoIva > 0 ? 'A_DEBITO' : saldoIva < 0 ? 'A_CREDITO' : 'A_PAREGGIO',
        fattureEmesseConteggio: azienda.invoices.length,
        registrazioniTotali: entries.length,
      },
      pianoConti,
      suggerimentoStudio: suggerimento,
    })
  } catch (error: any) {
    console.error('Errore get contabilità:', error)
    return NextResponse.json({ error: error.message || 'Errore recupero dati contabili' }, { status: 500 })
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

    // ── 1. AZIONE SPECIALE: RINUMERAZIONE / MODIFICA PROTOCOLLI ──
    if (body.action === 'rinumera-protocolli') {
      const registroCodice = (body.registroCodice || 'A1').toUpperCase()
      const anno = body.anno ? parseInt(body.anno) : new Date().getFullYear()

      // Recupera tutte le scritture del registro ordinati per data registrazione e creazione
      const scritture = await prisma.companyAccountingEntry.findMany({
        where: {
          companyId: params.id,
          registroCodice,
          anno,
        },
        orderBy: [
          { dataRegistrazione: 'asc' },
          { createdAt: 'asc' },
        ],
      })

      if (scritture.length === 0) {
        return NextResponse.json({
          successo: true,
          conteggioRinumerati: 0,
          messaggio: `Nessuna registrazione trovata per il registro ${registroCodice} nell'anno ${anno}.`,
        })
      }

      // Rinumerazione sequenziale 1..N senza buchi
      let progressive = 1
      for (const sc of scritture) {
        await prisma.companyAccountingEntry.update({
          where: { id: sc.id },
          data: { protocollo: progressive },
        })
        progressive++
      }

      return NextResponse.json({
        successo: true,
        conteggioRinumerati: scritture.length,
        registroCodice,
        anno,
        messaggio: `Rinumerazione completata: corretti e riordinati ${scritture.length} protocolli (da 1 a ${scritture.length}) sul registro ${registroCodice}/${anno}.`,
      })
    }

    // ── 2. INSERIMENTO REGISTRAZIONE PRIMA NOTA / IVA ──
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
      registroCodice,
      protocollo,
      anno,
      codiceIvaCgn,
      naturaSdi,
      anagraficaSoggetto,
      isScritturaNoIva,
      aliquotaIva,
      impostaIva,
      reverseCharge,
      note,
    } = body

    if (!descrizione || !descrizione.trim()) {
      return NextResponse.json({ error: 'La causale / descrizione operazione è obbligatoria' }, { status: 400 })
    }

    const dataReg = dataRegistrazione ? new Date(dataRegistrazione) : new Date()
    const annoFiscale = anno ? parseInt(anno) : dataReg.getFullYear()
    const codReg = (registroCodice || (tipoRegistro === 'VENDITE' ? 'V1' : tipoRegistro === 'CORRISPETTIVI' ? 'C1' : 'A1')).toUpperCase()

    // Calcolo Protocollo Automatico Progressivo
    let protocolloAssegnato = protocollo ? parseInt(protocollo) : null
    if (!protocolloAssegnato || isNaN(protocolloAssegnato)) {
      const ultimo = await prisma.companyAccountingEntry.findFirst({
        where: {
          companyId: params.id,
          registroCodice: codReg,
          anno: annoFiscale,
        },
        orderBy: { protocollo: 'desc' },
      })
      protocolloAssegnato = (ultimo?.protocollo ?? 0) + 1
    }

    // Determina tipo registro macro
    const regDef = trovaRegistroIva(codReg)
    const macroTipo = regDef.tipo || tipoRegistro || 'GENERALE'

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
        tipoRegistro: macroTipo,
        registroCodice: codReg,
        protocollo: protocolloAssegnato,
        anno: annoFiscale,
        codiceIvaCgn: codiceIvaCgn?.trim() || null,
        naturaSdi: naturaSdi?.trim() || null,
        anagraficaSoggetto: anagraficaSoggetto?.trim() || null,
        isScritturaNoIva: Boolean(isScritturaNoIva),
        aliquotaIva: aliquotaIva ? new Decimal(Number(aliquotaIva)) : null,
        impostaIva: impostaIva ? new Decimal(Number(impostaIva)) : null,
        reverseCharge: Boolean(reverseCharge),
        note: note?.trim() || null,
      },
    })

    return NextResponse.json({
      successo: true,
      registrazione: nuovaRegistrazione,
      messaggio: `Scrittura contabile salvata con Protocollo ${codReg}/${protocolloAssegnato} anno ${annoFiscale}`,
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
            { codice: '05.01.02', nome: 'Rimborsi spese forfettarie e marche bollo' },
          ],
        },
        {
          codice: '08',
          nome: 'Costi Operativi e Contributi Previdenziali (Quadro LM)',
          conti: [
            { codice: '08.01.01', nome: 'Contributi previdenziali INPS / Casse' },
            { codice: '08.02.01', nome: 'Spese gestione studio / Utenze' },
          ],
        },
      ],
    }
  }

  if (regime === 'PROFESSIONISTI') {
    return {
      tipo: 'PROFESSIONISTI',
      nome: 'Piano dei Conti Professionisti (Principio di Cassa - Quadro RE)',
      sezioni: [
        {
          codice: '10',
          nome: 'Attività Finanziarie e Disponibilità',
          conti: [
            { codice: '10.01.01', nome: 'Cassa contanti' },
            { codice: '10.02.01', nome: 'Banca c/c professionale' },
            { codice: '10.03.01', nome: 'Crediti v/clienti' },
          ],
        },
        {
          codice: '40',
          nome: 'Compensi Professionali (Quadro RE)',
          conti: [
            { codice: '40.01.01', nome: 'Compensi da clienti ordinari' },
            { codice: '40.01.02', nome: 'Compensi con Ritenuta d\'Acconto (20%)' },
            { codice: '40.01.03', nome: 'Rivalsa Cassa Previdenziale (4%)' },
          ],
        },
        {
          codice: '50',
          nome: 'Spese di Lavoro Autonomo Deducibili (Quadro RE)',
          conti: [
            { codice: '50.01.01', nome: 'Canoni di locazione studio' },
            { codice: '50.02.01', nome: 'Spese di telefonia ed energia' },
            { codice: '50.03.01', nome: 'Cancelleria e software professionale' },
            { codice: '50.04.01', nome: 'Spese di rappresentanza e convegni' },
          ],
        },
      ],
    }
  }

  // Imprese Semplificato o Ordinario
  return {
    tipo: 'IMPRESE',
    nome: 'Piano dei Conti Imprese (Merci, Acquisti, Vendite e Servizi)',
    sezioni: [
      {
        codice: '10',
        nome: 'Attivo Circolante e Disponibilità',
        conti: [
          { codice: '10.01.01', nome: 'Cassa contanti' },
          { codice: '10.02.01', nome: 'Banca c/c aziendale' },
          { codice: '10.03.01', nome: 'Crediti v/clienti' },
          { codice: '10.04.01', nome: 'Erario c/IVA a credito' },
        ],
      },
      {
        codice: '20',
        nome: 'Debiti di Funzionamento e Finanziari',
        conti: [
          { codice: '20.01.01', nome: 'Debiti v/fornitori merci e servizi' },
          { codice: '20.02.01', nome: 'Erario c/IVA a debito' },
          { codice: '20.03.01', nome: 'Debiti v/Istituti previdenziali (INPS/INAIL)' },
          { codice: '20.04.01', nome: 'Debiti v/personale per retribuzioni' },
        ],
      },
      {
        codice: '30',
        nome: 'Costi per Acquisti Merci e Servizi',
        conti: [
          { codice: '30.01.01', nome: 'Acquisti merci e materie prime' },
          { codice: '30.01.02', nome: 'Acquisti con Reverse Charge (Edilizia/Telefonia)' },
          { codice: '30.02.01', nome: 'Spese per utenze, locazioni e carburanti' },
          { codice: '30.03.01', nome: 'Salari e stipendi dipendenti (Causale 899 NO IVA)' },
          { codice: '30.03.02', nome: 'Oneri sociali e contributi INPS/INAIL' },
        ],
      },
      {
        codice: '40',
        nome: 'Ricavi delle Vendite e Prestazioni',
        conti: [
          { codice: '40.01.01', nome: 'Merci c/vendite' },
          { codice: '40.01.02', nome: 'Prestazioni di servizi' },
          { codice: '40.02.01', nome: 'Corrispettivi da cassa/RT' },
        ],
      },
    ],
  }
}
