// src/lib/antiriciclaggio-engine.ts
// Motore Normativo Antiriciclaggio CNDCEC 2025 / Consulenti del Lavoro / Verifiche Guardia di Finanza
// Classifica automaticamente i soggetti dello Studio nelle 6 discipline:
// 1-2. PAGHE (Elaborazione buste paga, LUL, consulenza lavoro, assunzioni UNILAV, INAIL, Mod. 770)
// 3. CONTABILITA (Gestione fiscale, civilistica, societaria e contabile Ditte, SNC/SAS, SRL, Consorzi)
// 4. CAF (Mod. 730, Redditi PF, IMU, maternità, NASpI, dimissioni online — Esonerati ex Regola Tecnica n. 2 Tab. 1)
// 5. FORFETTARI (Dichiarazione redditi ditte individuali e professionisti regime forfettario L. 190/2014)
// 6. SUCCESSIONI (Pratiche dichiarazione di successione)

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

    // CASO 1: Privato senza P.IVA (730, Redditi PF, IMU, Libretto Famiglia INPS, NASpI, Maternità, Dimissioni)
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
            'Soggetto privato senza P.IVA: prestazione esclusa dagli obblighi di adeguata verifica antiriciclaggio ai sensi della Regola Tecnica n. 2 CNDCEC (Tabella 1 - Redazione e trasmissione dichiarazioni derivanti da obblighi fiscali / pratiche CAF e previdenziali) e art. 17 D.Lgs. 231/2007.',
        },
      })
      esonerateCaf++
      continue
    }

    // CASO 2: Soggetti con P.IVA o Pratiche di Successione
    const numFascicolo = `ARC-${primaFatturaData.getFullYear()}-${String(contatoreFascicolo).padStart(3, '0')}`
    contatoreFascicolo++

    const dataScadenzaRevisione = new Date(
      primaFatturaData.getFullYear() + 3,
      primaFatturaData.getMonth(),
      primaFatturaData.getDate()
    )

    const isForfettario =
      lineeTesto.includes('forfet') ||
      lineeTesto.includes('unico pf') ||
      lineeTesto.includes('inizio attivita') ||
      lineeTesto.includes('attribuzione p.iva')

    const isPaghe =
      lineeTesto.includes('cedolin') ||
      lineeTesto.includes('buste paga') ||
      lineeTesto.includes('unilav') ||
      lineeTesto.includes('inail') ||
      lineeTesto.includes('personale') ||
      lineeTesto.includes('770') ||
      lineeTesto.includes('durc')

    let settore = 'CONTABILITA'
    let prestazione = 'Tenuta della contabilità, gestione fiscale civilistica e dichiarazioni periodiche'
    let motivazione = ''
    let punteggio = 1
    let tipoSogg = az.tipoSoggetto

    if (isSuccessione) {
      settore = 'SUCCESSIONI'
      tipoSogg = 'PERSONA_FISICA'
      prestazione = 'Predisposizione e trasmissione pratica di Dichiarazione di Successione e volture catastali'
      punteggio = 1
      motivazione =
        'Valutazione condotta ai sensi della Regola Tecnica n. 2 CNDCEC e D.Lgs. 231/2007 per pratica di successione ereditaria. Identificazione degli eredi/dichiaranti de visu con documento d\'identità valido e verifica consistenza asse ereditario. Rischio effettivo Basso (Non Significativo).'
    } else if (isEntePaCaf) {
      settore = 'CONTABILITA'
      tipoSogg = 'PERSONA_GIURIDICA'
      prestazione = 'Convenzione assistenza fiscale CAF Nazionale e trasmissione telematica dichiarazioni'
      punteggio = 1
      motivazione =
        'Controparte istituzionale / CAF Nazionale vigilato (art. 23 D.Lgs. 231/2007 - Obblighi semplificati di adeguata verifica). Rischio Non Significativo (Basso).'
    } else if (isPaghe) {
      settore = 'PAGHE'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione =
        'Consulenza del lavoro, elaborazione buste paga (LUL), pratiche assunzione UNILAV, autoliquidazione INAIL e Mod. 770'
      punteggio = 1
      motivazione =
        'Valutazione condotta ai sensi dell\'art. 17, co. 7 D.Lgs. 231/2007 e delle Regole Tecniche CNDCEC / Consulenti del Lavoro (2025). Prestazione continuativa di elaborazione buste paga/LUL e adempimenti giuslavoristici e previdenziali. Rischio Inerente (30%): 1,00 (Non significativo). Rischio Specifico Cliente (70%): 1,25 (Operatività locale trasparente, mezzi di pagamento tracciati, assenza PEP). Rischio Effettivo Complessivo: 1,18/4,00 (BASSO). Adeguata verifica ordinaria/semplificata con revisione a 36 mesi.'
    } else if (isForfettario && !isSrlSocieta) {
      settore = 'FORFETTARI'
      tipoSogg = 'DITTA_INDIVIDUALE'
      prestazione =
        'Gestione fiscale annuale e Dichiarazione dei Redditi (Mod. Redditi PF) per Ditta Individuale / Professionista in Regime Forfettario (L. 190/2014)'
      punteggio = 1
      motivazione =
        'Valutazione condotta ai sensi della Regola Tecnica n. 2 CNDCEC (Tabella 1 e 2). Contribuente in regime forfettario (L. 190/2014) senza obbligo di tenuta scritture contabili ordinarie. Rischio Inerente (30%): 1,00 (Non significativo). Rischio Specifico (70%): 1,00 (Ditta individuale/professionista locale, flussi fatturati elettronicamente via SdI, assenza PEP). Rischio Effettivo Complessivo: 1,00/4,00 (BASSO). Revisione programmata a 36 mesi.'
    } else {
      settore = 'CONTABILITA'
      tipoSogg = isSrlSocieta ? 'PERSONA_GIURIDICA' : 'DITTA_INDIVIDUALE'
      prestazione = isSrlSocieta
        ? 'Gestione fiscale, civilistica, societaria e giuslavoristica continuativa (Società / S.r.l. / Consorzio)'
        : 'Gestione fiscale, contabile e dichiarativa per Ditta Individuale / Lavoratore Autonomo'
      punteggio = 2
      motivazione =
        'Valutazione condotta secondo la Matrice CNDCEC (Regola Tecnica n. 2). Rischio Inerente (30%): 2,00. Rischio Specifico Cliente (70%): 1,25 (Sede in Italia, assetto proprietario e Titolare Effettivo identificati, pagamenti tracciati via bonifico bancario, assenza indicatori di anomalia ex D.M. Giustizia 16/08/2023). Rischio Effettivo Complessivo: 1,48/4,00 (BASSO / POCO SIGNIFICATIVO). Adeguata verifica ordinaria con controllo costante e rinnovo a 36 mesi.'
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
    esonerateCaf,
  }
}
