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

  const prestTesto = String(az.antiriciclaggioPrestazione || '').toLowerCase()
  const isEsplicitaZona2 = prestTesto.includes('[zona 2') || prestTesto.includes('esente da avc')
  const isEsplicitaZona3 = prestTesto.includes('[zona 3') || prestTesto.includes('soggetta avc')

  // Verifica se rientra in ZONA 3 / GRUPPO B (Soggetta ad Adeguata Verifica Completa AVC — Grado 3 o Grado 2/3)
  // Nota: Le pratiche di Successione isolate / adempimenti telematici sono ESENTI / Regola di condotta (Mera dichiarazione tributaria -> ZONA 2)
  const isSoggettaAvc =
    Boolean(az.antiriciclaggioPep) ||
    isEsplicitaZona3 ||
    (!isEsplicitaZona2 &&
      !isSuccessione &&
      (prestTesto.includes('consulenza') ||
        prestTesto.includes('verbale ispettivo') ||
        prestTesto.includes('itl') ||
        prestTesto.includes('tenuta della contabilit') ||
        prestTesto.includes('tenuta contabilit') ||
        prestTesto.includes('bilancio') ||
        prestTesto.includes('registro imprese') ||
        (az.settoreAttivita === 'CONTABILITA' && !prestTesto.includes('caf nazionale'))))

  if (isSoggettaAvc) {
    const isConsulenzaLavoroStraord =
      noteTesto.includes('verbale ispettivo') || noteTesto.includes('itl')
    // Grado 3 (3.00) per Tenuta Contabilità e Consulenza Continuativa/Bilanci; Grado 2/3 (2.50) per Consulenza Lavoro Straordinaria
    const rischioInerente = isConsulenzaLavoroStraord ? 2.5 : 3.0
    // Semplificazione Contabile/Societaria CNDCEC: Somma punteggi Tabella A (A.1 + A.2 + A.3 + A.4) / 4
    // Società (A.1=2, A.2=1, A.3=1, A.4=1 -> 5/4 = 1.25); Ditta Individuale (1+1+1+1 = 4/4 = 1.00); PEP = 3.50
    const rischioSpecifico = az.antiriciclaggioPep ? 3.5 : isSrlSocieta ? 1.25 : 1.0
    const rischioEffettivo = +(rischioInerente * 0.3 + rischioSpecifico * 0.7).toFixed(2)
    const classeRischio: 'BASSO' | 'MEDIO' | 'ALTO' =
      rischioEffettivo >= 3.6 || az.antiriciclaggioPep
        ? 'ALTO'
        : rischioEffettivo >= 2.6
        ? 'MEDIO'
        : 'BASSO'

    return {
      zona: 'ZONA_3',
      zonaLabel: 'ZONA 3 (Gruppo B) · Soggetta AVC (Grado 3 / Mod. AV.1 + AV.4)',
      rischioInerente,
      rischioSpecifico,
      rischioEffettivo,
      classeRischio,
      obbligoSchedaAv2: true,
      obbligoTitolareEffettivo: isSrlSocieta,
      periodicitaMesi: classeRischio === 'ALTO' ? 12 : classeRischio === 'MEDIO' ? 24 : 36,
      motivoBot:
        isConsulenzaLavoroStraord
          ? 'Consulenza del lavoro straordinaria / contrattuale (Verbale Ispettivo ITL - Grado 2/3): Soggetta ad AVC con Mod. AV.1 e AV.4.'
          : 'Tenuta contabilità / Consulenza continuativa fiscale, societaria e bilanci (Grado 3): Obbligatoria AVC completa (Mod. AV.1, AV.4), Semplificazione Tabella A e fascicolo 10 anni.',
    }
  }

  // Altrimenti ZONA 2 (Gruppo A - Esenti da AVC ex art. 17 co. 7 / Regola di condotta):
  // - Elaborazione buste paga e adempimenti L. 12/1979
  // - Mera redazione/invio Mod. Redditi, IRAP, 770 (Forfettari senza contabilità)
  // - Pratiche Successione isolate / adempimenti telematici (Mera dichiarazione tributaria)
  const rischioInerente = 1.0
  const rischioSpecifico = isSrlSocieta ? 1.25 : 1.0
  const rischioEffettivo = +(rischioInerente * 0.3 + rischioSpecifico * 0.7).toFixed(2)

  return {
    zona: 'ZONA_2',
    zonaLabel: 'ZONA 2 (Gruppo A) · Esente AVC (Paghe / Redditi / Successioni isolate)',
    rischioInerente,
    rischioSpecifico,
    rischioEffettivo,
    classeRischio: 'BASSO',
    obbligoSchedaAv2: false,
    obbligoTitolareEffettivo: isSrlSocieta,
    periodicitaMesi: 36,
    motivoBot:
      isSuccessione
        ? 'Pratica Successione isolata / adempimento telematico: Esente da AVC / Regola di condotta (Mera dichiarazione tributaria o invio telematico).'
        : az.settoreAttivita === 'FORFETTARI'
        ? 'Mera redazione/invio Mod. Redditi (Regime Forfettario senza contabilità - art. 17 co. 7): Esente da fascicolo AVC, conservazione documenti fiscali e presidio SOS.'
        : 'Elaborazione buste paga e adempimenti L. 12/1979 (art. 17 co. 7 D.Lgs. 231/2007): Esente da AVC. Resta fermo l\'obbligo generale di SOS.',
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
      prestazione = '[ZONA 2 - ESENTE / REGOLA DI CONDOTTA] Pratica di Dichiarazione di Successione isolata e adempimento telematico'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 / GRUPPO A (ESENTE / REGOLA DI CONDOTTA ex Guida Operativa di Studio e Tab. 1 Regola Tecnica n. 2 CNDCEC): Pratica di successione isolata / mera dichiarazione tributaria o invio telematico. Conservata documentazione fiscale e documento d\'identità del dichiarante; resta fermo l\'obbligo generale di SOS.'
    } else if (haConsulenzaOStraordinaria) {
      settore = lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('cedolin') ? 'PAGHE' : 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('itl')
          ? '[ZONA 3 - SOGGETTA AVC Grado 2/3] Consulenza del lavoro straordinaria / contrattuale (Assistenza su verbale ispettivo ITL)'
          : '[ZONA 3 - SOGGETTA AVC Grado 3] Tenuta contabilità e consulenza continuativa fiscale, societaria e bilanci'
      punteggio = 2
      zona3Count++
      motivazione =
        'BOT ZONA 3 / GRUPPO B (SOGGETTA AD AVC - Regola Tecnica n. 2 CNDCEC / CNOCDL): Prestazione soggetta ad Adeguata Verifica (Mod. AV.1 e Mod. AV.4). Applicata Semplificazione Contabile/Societaria (Somma Tabella A / 4 = 1,25; Rischio Inerente 30% + Rischio Specifico 70% -> Rischio Effettivo Poco Significativo < 2,6). Tipologia AVC Semplificata con Controllo Costante (Mod. AV.7) ogni 36 mesi e conservazione fascicolo 10 anni.'
    } else if (isMeraPaghe) {
      settore = 'PAGHE'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        '[ZONA 2 - ESENTE da AVC art. 17 c. 7] Elaborazione buste paga e adempimenti L. 12/1979 (LUL, UNILAV, INAIL, Mod. 770)'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 / GRUPPO A (ESENTE DA AVC ex Art. 17, co. 7, D.Lgs. 231/2007): Elaborazione buste paga e adempimenti L. 12/1979. Nessun fascicolo AVC obbligatorio; resta fermo l\'obbligo generale di Segnalazione di Operazioni Sospette (SOS) e il passaggio automatico in ZONA 3 (Gruppo B) qualora subentrino consulenze del lavoro straordinarie/contrattuali o tenuta contabilità.'
    } else if (isForfettario && !isSrlSocieta) {
      settore = 'FORFETTARI'
      tipoSogg = 'DITTA_INDIVIDUALE'
      prestazione =
        '[ZONA 2 - ESENTE da AVC art. 17 c. 7] Mera redazione/invio Mod. Redditi PF per Ditta Individuale / Professionista in Regime Forfettario'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 / GRUPPO A (ESENTE DA AVC ex Art. 17, co. 7, D.Lgs. 231/2007 e Tab. 1 CNDCEC): Mera redazione e invio telematico Mod. Redditi senza tenuta contabilità. Nessun fascicolo AVC; conservazione dei documenti fiscali e presidio generale SOS.'
    } else if (isEntePaCaf) {
      settore = 'CONTABILITA'
      tipoSogg = 'PERSONA_GIURIDICA'
      prestazione = '[ZONA 2 - VERIFICA SEMPLIFICATA art. 23] Convenzione assistenza fiscale CAF Nazionale vigilato'
      punteggio = 1
      zona2Count++
      motivazione =
        'BOT ZONA 2 / GRUPPO A: Controparte istituzionale / CAF Nazionale (art. 23 D.Lgs. 231/2007 - Obblighi semplificati). Rischio Non Significativo (1,00/4,00).'
    } else {
      settore = 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione = isSrlSocieta
        ? '[ZONA 3 - SOGGETTA AVC Grado 3] Tenuta contabilità e consulenza continuativa fiscale, societaria e bilanci (S.r.l. / Società / Consorzio)'
        : '[ZONA 3 - SOGGETTA AVC Grado 3] Tenuta contabilità, pratiche Registro Imprese / Agenzia Entrate e consulenza continuativa (Ditta Individuale)'
      punteggio = 2
      zona3Count++
      motivazione =
        'BOT ZONA 3 / GRUPPO B (SOGGETTA AD AVC Grado 3 - Regola Tecnica n. 2 CNDCEC): Obbligatoria AVC completa (Mod. AV.1, AV.4) e fascicolo 10 anni. Applicata Semplificazione Contabile/Societaria (Somma Tabella A / 4): Rischio Effettivo Poco Significativo (1,60 - 1,78 su 4,00) -> Controllo Costante (Mod. AV.7) ogni 36 mesi.'
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
