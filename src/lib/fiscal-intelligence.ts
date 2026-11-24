// src/lib/fiscal-intelligence.ts
// Assistente Fiscale & Contabile per Studio Professionale: Auto-classificazione Regime, ATECO, IVA e Piani dei Conti

export interface AtecoInfo {
  codice: string
  descrizione: string
  settore: 'PROFESSIONISTI' | 'COMMERCIO' | 'SERVIZI' | 'ARTIGIANATO' | 'EDILIZIA' | 'AUTOTRASPORTI' | 'SANITÀ' | 'AGRICOLTURA'
  gruppoAmmortamentoDefault: string
}

export const LISTA_ATECO_COMUNI: AtecoInfo[] = [
  // Professionisti / Lavoro Autonomo
  { codice: '69.20.11', descrizione: 'Attività degli studi commerciali, tributari e contabili', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '69.20.12', descrizione: 'Attività dei revisori contabili, periti, consulenti fiscali', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '69.20.13', descrizione: 'Servizi di tenuta contabilità e elaborazione dati contabili', settore: 'SERVIZI', gruppoAmmortamentoDefault: 'Gruppo XVII - Servizi (Coeff. 12%)' },
  { codice: '69.10.10', descrizione: 'Attività degli studi legali e avvocati', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '71.11.00', descrizione: 'Attività degli studi di architettura', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '71.12.10', descrizione: 'Attività degli studi di ingegneria', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '71.12.20', descrizione: 'Attività di studi di geologia e prospezione', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '71.12.30', descrizione: 'Attività tecniche di geometri', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '70.22.09', descrizione: 'Altre attività di consulenza imprenditoriale e gestionale', settore: 'PROFESSIONISTI', gruppoAmmortamentoDefault: 'Gruppo XVII - Attività Professionali (Coeff. 12%)' },
  { codice: '73.11.02', descrizione: 'Conduzione di campagne pubblicitarie e marketing', settore: 'SERVIZI', gruppoAmmortamentoDefault: 'Gruppo XVII - Servizi e Comunicazione (Coeff. 12%)' },
  { codice: '62.02.00', descrizione: 'Consulenza informatica e gestione strutture informatiche', settore: 'SERVIZI', gruppoAmmortamentoDefault: 'Gruppo XVII - IT e Software (Coeff. 20%)' },
  { codice: '62.01.00', descrizione: 'Produzione di software non connesso all\'edizione', settore: 'SERVIZI', gruppoAmmortamentoDefault: 'Gruppo XVII - IT e Software (Coeff. 20%)' },
  { codice: '86.21.00', descrizione: 'Attività dei medici generici', settore: 'SANITÀ', gruppoAmmortamentoDefault: 'Gruppo XVIII - Sanità e Cure Mediche (Coeff. 12%)' },
  { codice: '86.22.09', descrizione: 'Altri studi medici specialistici e odontoiatrici', settore: 'SANITÀ', gruppoAmmortamentoDefault: 'Gruppo XVIII - Sanità e Cure Mediche (Coeff. 12%)' },
  { codice: '86.90.21', descrizione: 'Attività dei fisioterapisti', settore: 'SANITÀ', gruppoAmmortamentoDefault: 'Gruppo XVIII - Sanità e Riabilitazione (Coeff. 12%)' },
  { codice: '86.90.30', descrizione: 'Attività delle psicologhe e psicologi', settore: 'SANITÀ', gruppoAmmortamentoDefault: 'Gruppo XVIII - Sanità e Assistenza (Coeff. 12%)' },

  // Autotrasporti (IVA speciale)
  { codice: '49.41.00', descrizione: 'Trasporto di merci su strada (Autotrasportatori c/terzi)', settore: 'AUTOTRASPORTI', gruppoAmmortamentoDefault: 'Gruppo VI - Trasporti e Comunicazioni (Coeff. Automezzi 20%)' },
  { codice: '49.32.10', descrizione: 'Trasporto con taxi e noleggio con conducente (NCC)', settore: 'AUTOTRASPORTI', gruppoAmmortamentoDefault: 'Gruppo VI - Trasporti Persone (Coeff. Autovetture 25%)' },

  // Commercio e Ristorazione
  { codice: '47.11.40', descrizione: 'Minimercati ed altri esercizi non specializzati di alimentari', settore: 'COMMERCIO', gruppoAmmortamentoDefault: 'Gruppo XXII - Commercio al Dettaglio (Coeff. 10%)' },
  { codice: '47.71.10', descrizione: 'Commercio al dettaglio di abbigliamento per adulti', settore: 'COMMERCIO', gruppoAmmortamentoDefault: 'Gruppo XXII - Commercio Abbigliamento (Coeff. 10%)' },
  { codice: '47.91.10', descrizione: 'Commercio al dettaglio di prodotti via Internet (E-commerce)', settore: 'COMMERCIO', gruppoAmmortamentoDefault: 'Gruppo XXII - Commercio Elettronico (Coeff. 15%)' },
  { codice: '56.10.11', descrizione: 'Ristorazione con somministrazione', settore: 'COMMERCIO', gruppoAmmortamentoDefault: 'Gruppo XXIII - Pubblici Esercizi (Coeff. 15%)' },
  { codice: '56.30.00', descrizione: 'Bar e altri esercizi simili senza cucina', settore: 'COMMERCIO', gruppoAmmortamentoDefault: 'Gruppo XXIII - Pubblici Esercizi (Coeff. 15%)' },

  // Artigianato ed Edilizia
  { codice: '41.20.00', descrizione: 'Costruzione di edifici residenziali e non residenziali', settore: 'EDILIZIA', gruppoAmmortamentoDefault: 'Gruppo XVII - Edilizia e Costruzioni (Coeff. 15%)' },
  { codice: '43.21.01', descrizione: 'Installazione di impianti elettrici in edifici', settore: 'EDILIZIA', gruppoAmmortamentoDefault: 'Gruppo XVII - Impiantistica (Coeff. 15%)' },
  { codice: '43.22.01', descrizione: 'Installazione di impianti idraulici, di riscaldamento e condizionamento', settore: 'EDILIZIA', gruppoAmmortamentoDefault: 'Gruppo XVII - Impiantistica (Coeff. 15%)' },
  { codice: '96.02.01', descrizione: 'Servizi dei saloni di barbiere e parrucchiere', settore: 'ARTIGIANATO', gruppoAmmortamentoDefault: 'Gruppo XXIV - Servizi alla Persona (Coeff. 15%)' },
  { codice: '96.02.02', descrizione: 'Servizi degli istituti di bellezza e centri estetici', settore: 'ARTIGIANATO', gruppoAmmortamentoDefault: 'Gruppo XXIV - Servizi alla Persona (Coeff. 15%)' },
  { codice: '45.20.10', descrizione: 'Riparazioni meccaniche di autoveicoli (Meccanico)', settore: 'ARTIGIANATO', gruppoAmmortamentoDefault: 'Gruppo XVII - Meccanica e Autoriparazioni (Coeff. 15%)' },
]

export interface SuggerimentoFiscale {
  regimeContabile: 'FORFETTARIO' | 'PROFESSIONISTI' | 'SEMPLIFICATO' | 'ORDINARIO'
  regimeEtichetta: string
  periodicitaIva: 'MENSILE' | 'TRIMESTRALE' | 'SPECIALE_TRIMESTRALE' | 'TRIMESTRALE_AUTOTRASPORTATORI'
  periodicitaEtichetta: string
  codiceAteco?: string
  descrizioneAteco?: string
  gruppoAmmortamenti: string
  registriIvaConsigliati: {
    vendite: boolean
    corrispettivi: boolean
    acquisti: boolean
    reverseCharge: boolean
  }
  motivazione: string
}

export function analizzaFiscaleCliente(azienda: {
  tipoSoggetto?: string | null
  ragioneSociale?: string | null
  codiceFiscale?: string | null
  partitaIva?: string | null
  codiceAteco?: string | null
  settoreAttivita?: string | null
  invoices?: any[]
}): SuggerimentoFiscale {
  const tipo = azienda.tipoSoggetto || 'PERSONA_GIURIDICA'
  const ragSoc = (azienda.ragioneSociale || '').toUpperCase()
  const cf = (azienda.codiceFiscale || '').trim().toUpperCase()
  const piva = (azienda.partitaIva || '').trim()
  const ateco = (azienda.codiceAteco || '').trim()

  const isPersonaFisica = tipo === 'PERSONA_FISICA' || tipo === 'DITTA_INDIVIDUALE' || (cf.length === 16 && !/^[0-9]+$/.test(cf))
  const isSocietaCap = ragSoc.includes('S.R.L') || ragSoc.includes('SRL') || ragSoc.includes('S.P.A') || ragSoc.includes('SPA')
  const isSocietaPers = ragSoc.includes('S.N.C') || ragSoc.includes('SNC') || ragSoc.includes('S.A.S') || ragSoc.includes('SAS')

  // Cerca corrispondenza ATECO
  const atecoMatch = LISTA_ATECO_COMUNI.find(a => a.codice === ateco || ateco.startsWith(a.codice.slice(0, 5)))

  // Autotrasportatori
  if (ateco.startsWith('49.41') || ragSoc.includes('AUTOTRASPORT') || ragSoc.includes('TRASPORTI')) {
    return {
      regimeContabile: isSocietaCap ? 'ORDINARIO' : 'SEMPLIFICATO',
      regimeEtichetta: isSocietaCap ? 'Imprese in Contabilità Ordinaria' : 'Imprese in Contabilità Semplificata',
      periodicitaIva: 'TRIMESTRALE_AUTOTRASPORTATORI',
      periodicitaEtichetta: 'Trimestrale Autotrasportatori (art. 74 co. 4)',
      codiceAteco: ateco || '49.41.00',
      descrizioneAteco: atecoMatch?.descrizione || 'Trasporto merci su strada c/terzi',
      gruppoAmmortamenti: 'Gruppo VI - Automezzi e Trasporti (Coeff. 20%)',
      registriIvaConsigliati: { vendite: true, corrispettivi: false, acquisti: true, reverseCharge: true },
      motivazione: 'Autotrasportatore: regime IVA speciale Trimestrale per Autotrasportatori (art. 74 co. 4 D.P.R. 633/72).',
    }
  }

  // Società di capitali (SRL, SPA) -> Ordinario d'obbligo
  if (isSocietaCap) {
    return {
      regimeContabile: 'ORDINARIO',
      regimeEtichetta: 'Imprese in Contabilità Ordinaria (Obbligo civilistico e fiscale)',
      periodicitaIva: 'MENSILE',
      periodicitaEtichetta: 'IVA Mensile (art. 1 D.P.R. 100/1998)',
      codiceAteco: ateco,
      descrizioneAteco: atecoMatch?.descrizione,
      gruppoAmmortamenti: atecoMatch?.gruppoAmmortamentoDefault || 'Gruppo XVII - Attività Imprenditoriali Ordinarie',
      registriIvaConsigliati: { vendite: true, corrispettivi: ragSoc.includes('BAR') || ragSoc.includes('RISTOR'), acquisti: true, reverseCharge: true },
      motivazione: 'Società di Capitali (S.r.l. / S.p.A.): regime naturale Contabilità Ordinaria con libro giornale, inventari e IVA mensile/trimestrale.',
    }
  }

  // Persona Fisica / Ditta Individuale con Partita IVA
  if (isPersonaFisica) {
    // Se ha codice ATECO tipico di professionista (69, 70, 71, 72, 73, 74, 86...)
    const isCodiceProf = ateco.startsWith('69') || ateco.startsWith('70') || ateco.startsWith('71') || ateco.startsWith('72') || ateco.startsWith('73') || ateco.startsWith('74') || ateco.startsWith('86')

    // Controlla se le fatture dello studio o le note indicano forfettario
    const isForfettario =
      (azienda.settoreAttivita === 'FORFETTARI') ||
      ragSoc.includes('FORFETT') ||
      (azienda.invoices && azienda.invoices.some((inv: any) =>
        inv.lines?.some((l: any) => (l.naturaIva === 'N2.2' || (l.descrizione || '').toLowerCase().includes('forfet')))
      ))

    if (isForfettario) {
      return {
        regimeContabile: 'FORFETTARIO',
        regimeEtichetta: 'Regime Forfettario (Legge 190/2014)',
        periodicitaIva: 'TRIMESTRALE',
        periodicitaEtichetta: 'Esente IVA (Franchigia ex L. 190/2014)',
        codiceAteco: ateco || (isCodiceProf ? '69.20.11' : undefined),
        descrizioneAteco: atecoMatch?.descrizione,
        gruppoAmmortamenti: 'Spese forfettizzate (Coefficiente di redditività ATECO)',
        registriIvaConsigliati: { vendite: true, corrispettivi: false, acquisti: true, reverseCharge: false },
        motivazione: 'Persona fisica in Regime Forfettario: franchigia IVA, esonero registri IVA e calcolo reddito con coefficiente di redditività ATECO.',
      }
    }

    if (isCodiceProf) {
      return {
        regimeContabile: 'PROFESSIONISTI',
        regimeEtichetta: 'Professionisti / Lavoratori Autonomi (Art. 54 TUIR)',
        periodicitaIva: 'TRIMESTRALE',
        periodicitaEtichetta: 'IVA Trimestrale (art. 7 D.P.R. 542/1999)',
        codiceAteco: ateco,
        descrizioneAteco: atecoMatch?.descrizione,
        gruppoAmmortamenti: atecoMatch?.gruppoAmmortamentoDefault || 'Gruppo XVII - Attività Professionali (Coeff. 12%)',
        registriIvaConsigliati: { vendite: true, corrispettivi: false, acquisti: true, reverseCharge: true },
        motivazione: 'Esercente arti e professioni (principio di cassa ex art. 54 TUIR): registro cronologico incassi/pagamenti e IVA trimestrale.',
      }
    }

    // Commercio / Pubblici Esercizi (Corrispettivi)
    const isCommercio = ateco.startsWith('47') || ateco.startsWith('56') || ragSoc.includes('BAR') || ragSoc.includes('RISTOR') || ragSoc.includes('NEGOZIO')
    return {
      regimeContabile: 'SEMPLIFICATO',
      regimeEtichetta: 'Imprese in Contabilità Semplificata (Art. 18 D.P.R. 600/73)',
      periodicitaIva: 'TRIMESTRALE',
      periodicitaEtichetta: 'IVA Trimestrale (art. 7 D.P.R. 542/1999)',
      codiceAteco: ateco,
      descrizioneAteco: atecoMatch?.descrizione,
      gruppoAmmortamenti: atecoMatch?.gruppoAmmortamentoDefault || 'Gruppo XXII - Commercio e Imprese (Coeff. 15%)',
      registriIvaConsigliati: { vendite: true, corrispettivi: isCommercio, acquisti: true, reverseCharge: true },
      motivazione: 'Ditta Individuale / Impresa Commerciale: Contabilità Semplificata con opzione cassa o registri IVA integrati.',
    }
  }

  // Società di persone (SNC, SAS)
  if (isSocietaPers) {
    return {
      regimeContabile: 'SEMPLIFICATO',
      regimeEtichetta: 'Imprese in Contabilità Semplificata (Art. 18 D.P.R. 600/73)',
      periodicitaIva: 'TRIMESTRALE',
      periodicitaEtichetta: 'IVA Trimestrale (art. 7 D.P.R. 542/1999)',
      codiceAteco: ateco,
      descrizioneAteco: atecoMatch?.descrizione,
      gruppoAmmortamenti: atecoMatch?.gruppoAmmortamentoDefault || 'Gruppo XVII - Attività Imprenditoriali (Coeff. 15%)',
      registriIvaConsigliati: { vendite: true, corrispettivi: ragSoc.includes('BAR') || ragSoc.includes('RISTOR'), acquisti: true, reverseCharge: true },
      motivazione: 'Società di Persone (S.n.c. / S.a.s.): Contabilità Semplificata naturale fino a 500k/800k € di ricavi, con IVA trimestrale.',
    }
  }

  // Default Standard
  return {
    regimeContabile: 'SEMPLIFICATO',
    regimeEtichetta: 'Imprese in Contabilità Semplificata',
    periodicitaIva: 'TRIMESTRALE',
    periodicitaEtichetta: 'IVA Trimestrale',
    codiceAteco: ateco,
    descrizioneAteco: atecoMatch?.descrizione,
    gruppoAmmortamenti: 'Gruppo XVII - Coefficienti Ministeriali Ordinari',
    registriIvaConsigliati: { vendite: true, corrispettivi: false, acquisti: true, reverseCharge: false },
    motivazione: 'Classificazione standard per cliente con Partita IVA.',
  }
}
