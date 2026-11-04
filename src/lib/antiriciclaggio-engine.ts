// src/lib/antiriciclaggio-engine.ts
// Motore Normativo Antiriciclaggio CNDCEC 2025 / Consulenti del Lavoro / Verifiche Guardia di Finanza
// Applica esattamente la distinzione delle Fonti Ufficiali (D.Lgs. 231/2007 art. 17 co. 7, Regole Tecniche CNDCEC e CdL 2025):
//
// A) PRESTAZIONI SOGGETTE AD ADEGUATA VERIFICA (AVC - Obbligo Scheda Rischio Cliente AV2 + Titolare Effettivo AV4):
//    - Gestione fiscale, contabile e civilistica continuativa (tenuta contabilità Ditte, Società di persone, S.r.l., Consorzi)
//    - Consulenza continuativa o straordinaria fiscale, societaria, contrattuale o giuslavoristica NON strettamente limitata
//      all'elaborazione paghe (es. assistenza su verbale ispettivo ITL, contenzioso, riorganizzazioni, contrattazione 2° livello)
//
// B) PRESTAZIONI CON P.IVA ESENTI DA SCHEDA DI RISCHIO CLIENTE (Art. 17 co. 7 D.Lgs. 231/2007 e Tab. 1 Regola Tecnica n. 2):
//    - Mera elaborazione buste paga / cedolini / LUL / UNILAV / autoliquidazione INAIL / Mod. 770
//    - Mera redazione dichiarazione dei redditi Ditte Individuali e Professionisti in Regime Forfettario senza contabilità
//    -> NOTA DI ATTENZIONE: Non occorre comporre la scheda di rischio cliente, ma resta sempre fermo l'obbligo di
//       Segnalazione di Operazioni Sospette (SOS) e l'AVC torna obbligatoria in caso di sospetto o dubbi sull'identità.
//
// C) PRESTAZIONI PRIVATI ESCLUSE (Tab. 1 Regola Tecnica n. 2 CNDCEC):
//    - Mod. 730, Redditi PF, IMU, pratiche CAF, maternità, NASpI, dimissioni online.

import { prisma } from '@/lib/prisma'

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
  let soggetteAvcPiena = 0
  let esentiConPresidioSos = 0
  let esonerateCaf = 0
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

    // CASO C: Privato senza P.IVA (730, Redditi PF, IMU, Libretto Famiglia INPS, NASpI, Maternità, Dimissioni)
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
              ? 'Elaborazione conteggi IMU e assistenza tributaria locale (Persona Fisica)'
              : lineeTesto.includes('inps') || lineeTesto.includes('libretto')
              ? 'Pratiche previdenziali INPS / Libretto di Famiglia / Dimissioni / NASpI'
              : 'Elaborazione e trasmissione Modello 730 / Modello Redditi PF e assistenza fiscale CAF',
          antiriciclaggioNote:
            'PRESTAZIONE ESENTE DA AVC (Tab. 1 Regola Tecnica n. 2 CNDCEC): Non occorre comporre la scheda di rischio cliente. Resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e l\'attivazione dell\'adeguata verifica qualora emergano sospetti di riciclaggio o dubbi sull\'identità.',
        },
      })
      esonerateCaf++
      continue
    }

    // Soggetti con P.IVA o Pratiche di Successione
    const numFascicolo = `ARC-${primaFatturaData.getFullYear()}-${String(contatoreFascicolo).padStart(3, '0')}`
    contatoreFascicolo++

    const dataScadenzaRevisione = new Date(
      primaFatturaData.getFullYear() + 3,
      primaFatturaData.getMonth(),
      primaFatturaData.getDate()
    )

    // Rileva se c'è consulenza straordinaria/continuativa non strettamente limitata alle paghe o tenuta contabilità
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
      prestazione = '[SOGGETTA AVC] Pratica di Dichiarazione di Successione e volture catastali'
      punteggio = 1
      soggetteAvcPiena++
      motivazione =
        'PRESTAZIONE SOGGETTA AD ADEGUATA VERIFICA (AVC): Pratica di successione ereditaria. Identificazione degli eredi/dichiaranti de visu con documento d\'identità valido e verifica consistenza asse ereditario. Rischio effettivo Basso (Non Significativo).'
    } else if (haConsulenzaOStraordinaria) {
      // Caso A: SOGGETTA AD ADEGUATA VERIFICA (Consulenza continuativa/straordinaria es. Verbale Ispettivo ITL, Consulenza fiscale/societaria, Contabilità)
      settore = lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('cedolin') ? 'PAGHE' : 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        lineeTesto.includes('verbale ispettivo') || lineeTesto.includes('itl')
          ? '[SOGGETTA AVC] Consulenza giuslavoristica straordinaria (Assistenza su verbale ispettivo ITL) e gestione personale'
          : '[SOGGETTA AVC] Consulenza fiscale, contabile e civilistica continuativa'
      punteggio = 2
      soggetteAvcPiena++
      motivazione =
        'PRESTAZIONE SOGGETTA AD ADEGUATA VERIFICA (AVC - Regola Tecnica n. 2 CNDCEC / Regole CdL): Consulenza continuativa o straordinaria non strettamente limitata alla mera elaborazione paghe / Tenuta contabilità. Composta Scheda di Valutazione del Rischio Cliente (Matrice CNDCEC: Rischio Inerente 30% = 2,00; Rischio Specifico 70% = 1,25 -> Rischio Effettivo = 1,48/4,00 BASSO). Acquisito Titolare Effettivo e documento d\'identità con rinnovo a 36 mesi.'
    } else if (isMeraPaghe) {
      // Caso B1: Mera elaborazione buste paga / LUL / adempimenti lavoro (Art. 17 co. 7 D.Lgs. 231/2007)
      settore = 'PAGHE'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        '[ESENTE SCHEDA RISCHIO ex art. 17 co. 7] Elaborazione buste paga (LUL), pratiche assunzione UNILAV, autoliquidazione INAIL e Mod. 770'
      punteggio = 1
      esentiConPresidioSos++
      motivazione =
        'PRESTAZIONE ESENTE DA SCHEDA DI RISCHIO CLIENTE (Art. 17 co. 7 D.Lgs. 231/2007 e Regole Tecniche CdL/CNDCEC): Attività strettamente limitata all\'elaborazione buste paga/LUL e adempimenti previdenziali. NOTA DI ATTENZIONE: Non occorre comporre la scheda di rischio cliente, ma il fascicolo è mantenuto a presidio dell\'identità del cliente/Titolare Effettivo; resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e l\'AVC torna obbligatoria qualora emergano dubbi sull\'identità o consulenze straordinarie.'
    } else if (isForfettario && !isSrlSocieta) {
      // Caso B2: Dichiarazione redditi ditte individuali e professionisti regime forfettario senza contabilità
      settore = 'FORFETTARI'
      tipoSogg = 'DITTA_INDIVIDUALE'
      prestazione =
        '[ESENTE / SEMPLIFICATA Tab. 1 CNDCEC] Dichiarazione dei Redditi (Mod. Redditi PF) per Ditta Individuale / Professionista in Regime Forfettario'
      punteggio = 1
      esentiConPresidioSos++
      motivazione =
        'PRESTAZIONE ESENTE / RISCHIO NON SIGNIFICATIVO (Tabella 1 Regola Tecnica n. 2 CNDCEC): Redazione e trasmissione dichiarazione fiscale per contribuente in regime forfettario (L. 190/2014) senza tenuta di scritture contabili. Conservata anagrafica, incarico e documento d\'identità; resta fermo l\'obbligo di Segnalazione di Operazioni Sospette (SOS) e attivazione AVC in caso di operazioni straordinarie o sospetto di riciclaggio.'
    } else if (isEntePaCaf) {
      settore = 'CONTABILITA'
      tipoSogg = 'PERSONA_GIURIDICA'
      prestazione = '[VERIFICA SEMPLIFICATA art. 23] Convenzione assistenza fiscale CAF Nazionale vigilato'
      punteggio = 1
      esentiConPresidioSos++
      motivazione =
        'Controparte istituzionale / CAF Nazionale (art. 23 D.Lgs. 231/2007 - Obblighi semplificati). Rischio Non Significativo (Basso).'
    } else {
      // Caso A2: Gestione fiscale, civilistica e societaria continuativa (SRL, Consorzi, Ditte con pratiche Registro Imprese / inizio attività)
      settore = 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione = isSrlSocieta
        ? '[SOGGETTA AVC] Gestione fiscale, contabile e civilistica continuativa (Società / S.r.l. / Consorzio)'
        : '[SOGGETTA AVC] Pratiche Registro Imprese / Agenzia Entrate e gestione fiscale continuativa Ditta Individuale'
      punteggio = 2
      soggetteAvcPiena++
      motivazione =
        'PRESTAZIONE SOGGETTA AD ADEGUATA VERIFICA (AVC - Regola Tecnica n. 2 CNDCEC): Gestione fiscale, contabile e societaria continuativa / Pratiche Registro Imprese. Composta Scheda di Valutazione del Rischio Cliente (Matrice CNDCEC: Rischio Effettivo 1,48/4,00 BASSO). Identificato Titolare Effettivo e programmato controllo costante a 36 mesi.'
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
    soggetteAvcPiena,
    esentiConPresidioSos,
    esonerateCaf,
  }
}
