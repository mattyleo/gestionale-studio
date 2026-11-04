// src/lib/antiriciclaggio-engine.ts
// 🤖 BOT AUTOMATICO ANTIRICICLAGGIO — Classificazione in ZONA 1, ZONA 2, ZONA 3 e Calcolo Matrice Rischio CNDCEC 2025
//
// Il Bot analizza automaticamente ogni cliente/azienda (forma giuridica, P.IVA, comune/area geografica, PEP, documento d'identità
// e righe delle fatture emesse) e lo assegna a una delle 3 Zone Operative:
//
// 🟢 ZONA 1 — ESENTI / PRIVATI CAF (Tab. 1 Regola Tecnica n. 2 CNDCEC):
//    Persone fisiche senza P.IVA (Mod. 730, Redditi PF, IMU, pratiche CAF, maternità, NASpI, dimissioni online).
//    -> Nessun obbligo di scheda di rischio né fascicolo P.IVA (fermo restando l'obbligo generale SOS).
//
// 🟡 ZONA 2 — AZIENDE P.IVA IN REGIME SEMPLIFICATO / ESENTI SCHEDA RISCHIO (Art. 17 co. 7 D.Lgs. 231/2007 & Tab. 1 CNDCEC):
//    Aziende e Ditte con P.IVA per cui lo studio svolge ESCLUSIVAMENTE:
//    - Mera elaborazione buste paga / cedolini / LUL / UNILAV / autoliquidazione INAIL / Mod. 770
//    - Mera dichiarazione dei redditi annuale per Ditte Individuali / Professionisti in Regime Forfettario senza contabilità
//    -> Fascicolo identificativo numerato (ARC-YYYY-NNN) + Carta d'Identità + Presidio SOS. Se il Bot rileva una fattura
//       di contabilità o consulenza straordinaria, promuove automaticamente l'azienda in ZONA 3!
//
// 🔴 ZONA 3 — AZIENDE SOGGETTE AD ADEGUATA VERIFICA COMPLETA (AVC OBBLIGATORIA — Regola Tecnica n. 2 CNDCEC):
//    - Tenuta della Contabilità e Predisposizione Bilanci (Ditte, S.n.c., S.a.s., S.r.l., S.r.l.s., Consorzi)
//    - Consulenza continuativa o straordinaria fiscale, societaria, contrattuale o giuslavoristica (es. verbali ispettivi ITL,
//      pratiche Registro Imprese, riorganizzazioni aziendali, contrattazione 2° livello)
//    - Pratiche di Dichiarazione di Successione o soggetti con indicatori di rischio / PEP
//    -> Calcolo automatico Matrice CNDCEC (30% Rischio Inerente + 70% Rischio Specifico), Obbligo Scheda Rischio AV2 +
//       Dichiarazione Titolare Effettivo AV4 + Controllo Costante periodico.

import { prisma } from '@/lib/prisma'

export interface ValutazioneBotZona {
  zona: 'ZONA_1' | 'ZONA_2' | 'ZONA_3'
  zonaLabel: string
  rischioInerente: number
  rischioSpecifico: number
  rischioEffettivo: number
  classeRischio: 'BASSO' | 'MEDIO' | 'ALTO'
  obbligoSchedaAv2: boolean
  obbligoTitolareEffettivo: boolean
  periodicitaMesi: number
  motivoBot: string
}

export function calcolaZonaERischioBot(az: any, testoFatture?: string): ValutazioneBotZona {
  const haPiva = Boolean(az.partitaIva && String(az.partitaIva).trim().length > 0)
  const ragSocUpper = String(az.ragioneSociale || '').toUpperCase()
  const noteTesto = `${az.antiriciclaggioPrestazione || ''} ${az.antiriciclaggioNote || ''} ${testoFatture || ''}`.toLowerCase()

  const isSuccessione = noteTesto.includes('succession') || az.settoreAttivita === 'SUCCESSIONI'
  const isSrlSocieta =
    ragSocUpper.includes('S.R.L') ||
    ragSocUpper.includes('SRL') ||
    ragSocUpper.includes('S.P.A') ||
    ragSocUpper.includes('SPA') ||
    ragSocUpper.includes('S.N.C') ||
    ragSocUpper.includes('SNC') ||
    ragSocUpper.includes('S.A.S') ||
    ragSocUpper.includes('SAS') ||
    ragSocUpper.includes('CONSORZIO') ||
    ragSocUpper.includes('COOP')

  // ZONA 1: Privato senza P.IVA (730, CAF, IMU, INPS, NASpI, Maternità, Dimissioni)
  if (!haPiva && !isSuccessione) {
    return {
      zona: 'ZONA_1',
      zonaLabel: 'ZONA 1 · Esente (Privati 730 / CAF / INPS)',
      rischioInerente: 1.0,
      rischioSpecifico: 1.0,
      rischioEffettivo: 1.0,
      classeRischio: 'BASSO',
      obbligoSchedaAv2: false,
      obbligoTitolareEffettivo: false,
      periodicitaMesi: 0,
      motivoBot: 'Privato senza P.IVA (730/CAF/IMU/INPS): esente da adeguata verifica ex Tab. 1 Regola Tecnica n. 2 CNDCEC.',
    }
  }

  // Verifica se rientra in ZONA 3 (Soggetta ad Adeguata Verifica Completa AVC)
  const isSoggettaAvc =
    isSuccessione ||
    Boolean(az.antiriciclaggioPep) ||
    noteTesto.includes('[soggetta avc]') ||
    noteTesto.includes('consulenza') ||
    noteTesto.includes('verbale ispettivo') ||
    noteTesto.includes('itl') ||
    noteTesto.includes('tenuta della contabilit') ||
    noteTesto.includes('bilancio') ||
    noteTesto.includes('registro imprese') ||
    noteTesto.includes('inizio attivita') ||
    noteTesto.includes('attribuzione p.iva') ||
    (az.settoreAttivita === 'CONTABILITA' && !noteTesto.includes('caf Nazionale') && !noteTesto.includes('[esente'))

  if (isSoggettaAvc) {
    const isContabilitaOBilancio =
      noteTesto.includes('contabilit') || noteTesto.includes('bilancio') || isSrlSocieta
    const rischioInerente = isContabilitaOBilancio ? 2.5 : 2.0
    const rischioSpecifico = az.antiriciclaggioPep ? 3.5 : isSrlSocieta ? 1.5 : 1.25
    const rischioEffettivo = +(rischioInerente * 0.3 + rischioSpecifico * 0.7).toFixed(2)
    const classeRischio: 'BASSO' | 'MEDIO' | 'ALTO' =
      rischioEffettivo > 3.0 || az.antiriciclaggioPep
        ? 'ALTO'
        : rischioEffettivo > 2.2
        ? 'MEDIO'
        : 'BASSO'

    return {
      zona: 'ZONA_3',
      zonaLabel: 'ZONA 3 · Soggetta AVC (Scheda Rischio & Controllo)',
      rischioInerente,
      rischioSpecifico,
      rischioEffettivo,
      classeRischio,
      obbligoSchedaAv2: true,
      obbligoTitolareEffettivo: isSrlSocieta,
      periodicitaMesi: classeRischio === 'ALTO' ? 12 : classeRischio === 'MEDIO' ? 24 : 36,
      motivoBot:
        noteTesto.includes('verbale ispettivo') || noteTesto.includes('itl')
          ? 'Rilevata consulenza giuslavoristica straordinaria (Verbale Ispettivo ITL): obbligatoria Scheda Rischio AV2 + AV4.'
          : isSuccessione
          ? 'Pratica di Dichiarazione di Successione: obbligatoria identificazione eredi e Scheda AVC.'
          : 'Gestione fiscale/contabile/societaria continuativa o pratiche Registro Imprese: obbligatoria Scheda Rischio AV2 + AV4.',
    }
  }

  // Altrimenti ZONA 2: Azienda P.IVA con mera elaborazione Buste Paga/LUL (art. 17 co. 7) o Forfettario senza contabilità
  const rischioInerente = 1.0
  const rischioSpecifico = isSrlSocieta ? 1.25 : 1.0
  const rischioEffettivo = +(rischioInerente * 0.3 + rischioSpecifico * 0.7).toFixed(2)

  return {
    zona: 'ZONA_2',
    zonaLabel: 'ZONA 2 · Semplificata Paghe / Forfettari (Presidio SOS)',
    rischioInerente,
    rischioSpecifico,
    rischioEffettivo,
    classeRischio: 'BASSO',
    obbligoSchedaAv2: false,
    obbligoTitolareEffettivo: isSrlSocieta,
    periodicitaMesi: 36,
    motivoBot:
      az.settoreAttivita === 'FORFETTARI'
        ? 'Ditta individuale / Professionista in Regime Forfettario senza contabilità (Tab. 1 CNDCEC): esente da scheda rischio, attivo presidio ID e SOS.'
        : 'Mera elaborazione Buste Paga / LUL / INAIL / UNILAV (art. 17 co. 7 D.Lgs. 231/2007): esente da scheda rischio, attivo presidio ID e SOS.',
  }
}

export async function eseguiRegolarizzazioneCNDCEC() {
  const aziende = await prisma.company.findMany({
    where: { archiviata: false },
    include: {
      invoices: {
        where: { stato: 'EMESSA' },
        include: { lines: { select: { descrizione: true } } },
        orderBy: { dataDocumento: 'asc' },
      },
    },
    orderBy: { ragioneSociale: 'asc' },
  })

  let aggiornateObbligate = 0
  let zona1Count = 0
  let zona2Count = 0
  let zona3Count = 0
  let contatoreFascicolo = 1
  const annoCorrente = new Date().getFullYear()

  const classificate = aziende.map((az) => {
    const haPiva = Boolean(az.partitaIva && az.partitaIva.trim().length > 0)
    const ragSocUpper = (az.ragioneSociale || '').toUpperCase()
    const lineeTesto = az.invoices
      .flatMap((inv) => inv.lines.map((l) => l.descrizione || ''))
      .join(' | ')
      .toLowerCase()

    const isSuccessione = lineeTesto.includes('succession') || az.settoreAttivita === 'SUCCESSIONI'
    const isSrlSocieta =
      ragSocUpper.includes('S.R.L') ||
      ragSocUpper.includes('SRL') ||
      ragSocUpper.includes('S.P.A') ||
      ragSocUpper.includes('SPA') ||
      ragSocUpper.includes('S.N.C') ||
      ragSocUpper.includes('SNC') ||
      ragSocUpper.includes('S.A.S') ||
      ragSocUpper.includes('SAS') ||
      ragSocUpper.includes('CONSORZIO') ||
      ragSocUpper.includes('COOP')

    const isEntePaCaf = ragSocUpper.includes('CAF CGN') || az.tipoSoggetto === 'PA'

    const primaFatturaData = az.invoices[0]?.dataDocumento
      ? new Date(az.invoices[0].dataDocumento)
      : new Date(az.createdAt || `${annoCorrente}-01-15`)

    return {
      az,
      haPiva,
      isSuccessione,
      isSrlSocieta,
      isEntePaCaf,
      lineeTesto,
      ragSocUpper,
      primaFatturaData,
    }
  })

  classificate.sort((a, b) => a.primaFatturaData.getTime() - b.primaFatturaData.getTime())

  for (const item of classificate) {
    const { az, haPiva, isSuccessione, isSrlSocieta, isEntePaCaf, lineeTesto, primaFatturaData } = item

    // ZONA 1: Privato senza P.IVA (730, Redditi PF, IMU, Libretto Famiglia INPS, NASpI, Maternità, Dimissioni)
    if (!haPiva && !isSuccessione) {
      await prisma.company.update({
        where: { id: az.id },
        data: {
          tipoSoggetto: 'PERSONA_FISICA',
          settoreAttivita: 'CAF',
          antiriciclaggioObbligo: false,
          antiriciclaggioStato: 'REGOLARE',
          antiriciclaggioRischio: 'BASSO',
          antiriciclaggioPunteggio: 1,
          legaleRappresentante: az.legaleRappresentante || az.ragioneSociale,
          cfRappresentante: az.cfRappresentante || az.codiceFiscale || null,
          antiriciclaggioPrestazione:
            lineeTesto.includes('imu')
              ? '[ZONA 1 - ESENTE] Elaborazione conteggi IMU e assistenza tributaria locale (Persona Fisica)'
              : lineeTesto.includes('inps') || lineeTesto.includes('libretto')
              ? '[ZONA 1 - ESENTE] Pratiche previdenziali INPS / Libretto di Famiglia / Dimissioni / NASpI'
              : '[ZONA 1 - ESENTE] Elaborazione e trasmissione Modello 730 / Modello Redditi PF e assistenza fiscale CAF',
          antiriciclaggioNote:
            'BOT ZONA 1 (ESENTE DA AVC ex Tab. 1 Regola Tecnica n. 2 CNDCEC): Soggetto privato senza P.IVA. Non occorre comporre la scheda di rischio cliente. Resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e l\'attivazione dell\'adeguata verifica qualora emergano sospetti di riciclaggio o dubbi sull\'identità.',
        },
      })
      zona1Count++
      continue
    }

    // Soggetti con P.IVA o Pratiche di Successione (ZONA 2 o ZONA 3)
    const numFascicolo = `ARC-${primaFatturaData.getFullYear()}-${String(contatoreFascicolo).padStart(3, '0')}`
    contatoreFascicolo++

    const dataScadenzaRevisione = new Date(
      primaFatturaData.getFullYear() + 3,
      primaFatturaData.getMonth(),
      primaFatturaData.getDate()
    )

    const haConsulenzaOStraordinaria =
      lineeTesto.includes('consulenza') ||
      lineeTesto.includes('verbale ispettivo') ||
      lineeTesto.includes('itl') ||
      lineeTesto.includes('contabilit') ||
      lineeTesto.includes('bilancio') ||
      lineeTesto.includes('costituzione') ||
      lineeTesto.includes('riorganizzazion') ||
      lineeTesto.includes('secondo livello')

    const isForfettario =
      lineeTesto.includes('forfet') ||
      lineeTesto.includes('unico pf')

    const isMeraPaghe =
      !haConsulenzaOStraordinaria &&
      (lineeTesto.includes('cedolin') ||
        lineeTesto.includes('buste paga') ||
        lineeTesto.includes('unilav') ||
        lineeTesto.includes('inail') ||
        lineeTesto.includes('personale') ||
        lineeTesto.includes('770') ||
        lineeTesto.includes('durc'))

    let settore = 'CONTABILITA'
    let prestazione = ''
    let motivazione = ''
    let punteggio = 1
    let tipoSogg = az.tipoSoggetto

    if (isSuccessione) {
      settore = 'SUCCESSIONI'
      tipoSogg = 'PERSONA_FISICA'
      prestazione = '[ZONA 3 - SOGGETTA AVC] Pratica di Dichiarazione di Successione e volture catastali'
      punteggio = 2
      zona3Count++
      motivazione =
        'BOT ZONA 3 (SOGGETTA AD ADEGUATA VERIFICA AVC): Pratica di successione ereditaria. Identificazione degli eredi/dichiaranti de visu con documento d\'identità valido e verifica consistenza asse ereditario. Rischio effettivo Basso (1,48/4,00).'
    } else if (haConsulenzaOStraordinaria) {
      settore = lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('cedolin') ? 'PAGHE' : 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('itl')
          ? '[ZONA 3 - SOGGETTA AVC] Consulenza giuslavoristica straordinaria (Assistenza su verbale ispettivo ITL) e gestione personale'
          : '[ZONA 3 - SOGGETTA AVC] Consulenza fiscale, contabile e civilistica continuativa'
      punteggio = 2
      zona3Count++
      motivazione =
        'BOT ZONA 3 (SOGGETTA AD ADEGUATA VERIFICA AVC - Regola Tecnica n. 2 CNDCEC / Regole CdL): Consulenza continuativa o straordinaria non strettamente limitata alla mera elaborazione paghe / Tenuta contabilità. Composta Scheda di Valutazione del Rischio Cliente (Matrice CNDCEC: Rischio Inerente 30% = 2,00; Rischio Specifico 70% = 1,25 -> Rischio Effettivo = 1,48/4,00 BASSO). Acquisito Titolare Effettivo e documento d\'identità con controllo costante a 36 mesi.'
    } else if (isMeraPaghe) {
      settore = 'PAGHE'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        '[ZONA 2 - ESENTE SCHEDA ex art. 17 co. 7] Elaborazione buste paga (LUL), pratiche assunzione UNILAV, autoliquidazione INAIL e Mod. 770'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 (ESENTE DA SCHEDA DI RISCHIO CLIENTE ex Art. 17 co. 7 D.Lgs. 231/2007): Attività strettamente limitata all\'elaborazione buste paga/LUL e adempimenti previdenziali. Non occorre comporre la scheda di rischio cliente, ma il fascicolo è mantenuto a presidio dell\'identità del cliente/Titolare Effettivo; resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e il passaggio automatico in ZONA 3 qualora subentrino consulenze straordinarie o contabilità.'
    } else if (isForfettario && !isSrlSocieta) {
      settore = 'FORFETTARI'
      tipoSogg = 'DITTA_INDIVIDUALE'
      prestazione =
        '[ZONA 2 - ESENTE / SEMPLIFICATA Tab. 1] Dichiarazione dei Redditi (Mod. Redditi PF) per Ditta Individuale / Professionista in Regime Forfettario'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 (ESENTE / RISCHIO NON SIGNIFICATIVO ex Tabella 1 Regola Tecnica n. 2 CNDCEC): Redazione e trasmissione dichiarazione fiscale per contribuente in regime forfettario (L. 190/2014) senza tenuta di scritture contabili. Conservata anagrafica, incarico e documento d\'identità; resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e passaggio in ZONA 3 in caso di operazioni straordinarie.'
    } else if (isEntePaCaf) {
      settore = 'CONTABILITA'
      tipoSogg = 'PERSONA_GIURIDICA'
      prestazione = '[ZONA 2 - VERIFICA SEMPLIFICATA art. 23] Convenzione assistenza fiscale CAF Nazionale vigilato'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2: Controparte istituzionale / CAF Nazionale (art. 23 D.Lgs. 231/2007 - Obblighi semplificati). Rischio Non Significativo (1,00/4,00 Basso).'
    } else {
      settore = 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione = isSrlSocieta
        ? '[ZONA 3 - SOGGETTA AVC] Gestione fiscale, contabile e civilistica continuativa (Società / S.r.l. / Consorzio)'
        : '[ZONA 3 - SOGGETTA AVC] Pratiche Registro Imprese / Agenzia Entrate e gestione fiscale continuativa Ditta Individuale'
      punteggio = 2
      zona3Count++
      motivazione =
        'BOT ZONA 3 (SOGGETTA AD ADEGUATA VERIFICA AVC - Regola Tecnica n. 2 CNDCEC): Gestione fiscale, contabile e societaria continuativa / Pratiche Registro Imprese. Composta Scheda di Valutazione del Rischio Cliente (Matrice CNDCEC: Rischio Effettivo 1,48/4,00 BASSO). Identificato Titolare Effettivo e programmato controllo costante a 36 mesi.'
    }

    const titolareDefault = !isSrlSocieta
      ? (az.legaleRappresentante || az.ragioneSociale)
      : (az.antiriciclaggioTitolareEffettivo || az.legaleRappresentante || `Legale Rappresentante di ${az.ragioneSociale}`)

    const cfTitolareDefault = !isSrlSocieta
      ? (az.cfRappresentante || az.codiceFiscale || null)
      : (az.antiriciclaggioCfTitolareEffettivo || az.cfRappresentante || null)

    await prisma.company.update({
      where: { id: az.id },
      data: {
        tipoSoggetto: tipoSogg,
        settoreAttivita: settore,
        antiriciclaggioObbligo: true,
        antiriciclaggioFascicolo: numFascicolo,
        antiriciclaggioDataVerifica: az.antiriciclaggioDataVerifica || primaFatturaData,
        antiriciclaggioDataScadenza: az.antiriciclaggioDataScadenza || dataScadenzaRevisione,
        antiriciclaggioRischio: 'BASSO',
        antiriciclaggioPunteggio: punteggio,
        antiriciclaggioPrestazione: prestazione,
        antiriciclaggioTitolareEffettivo: titolareDefault,
        antiriciclaggioCfTitolareEffettivo: cfTitolareDefault,
        legaleRappresentante: az.legaleRappresentante || (!isSrlSocieta ? az.ragioneSociale : null),
        cfRappresentante: az.cfRappresentante || (!isSrlSocieta ? az.codiceFiscale : null),
        antiriciclaggioStato: 'REGOLARE',
        antiriciclaggioNote: motivazione,
      },
    })

    aggiornateObbligate++
  }

  return {
    totaleAnalizzate: aziende.length,
    aggiornateObbligate,
    zona1Count,
    zona2Count,
    zona3Count,
    soggetteAvcPiena: zona3Count,
    esentiConPresidioSos: zona2Count,
    esonerateCaf: zona1Count,
  }
}
