// src/lib/cgn-tabelle-iva.ts
// Tavola di raccordo ufficiale Gestionale CGN Contabilità <-> Codici Natura Agenzia delle Entrate (SDI / LIPE / Dichiarazione IVA)
// Da documento di studio fornito dal Dott. Antonio Tuzio

export interface CodificaIvaCGN {
  codiceCgn: string
  naturaSdi?: string // es. N1, N2.1, N2.2, N3.1, N3.2, N4, N5, N6.1 - N6.9, N7
  tipoDocumentoAutofattura?: string // TD16, TD17, TD18, TD19
  norma: string
  descrizione: string
  ambito: 'ESCLUSO' | 'NON_SOGGETTO' | 'NON_IMPONIBILE' | 'ESENTE' | 'MARGINE' | 'REVERSE_CHARGE' | 'SPLIT_PAYMENT' | 'NO_IVA' | 'ORDINARIO'
  causalePrimaNota?: string
  aliquotaPredefinita?: number
}

export const TABELLA_IVA_CGN: CodificaIvaCGN[] = [
  // 1. Natura N1 — Operazioni Escluse ex Art. 15 DPR 633/1972
  {
    codiceCgn: 'A15',
    naturaSdi: 'N1',
    norma: 'Art. 15 DPR 633/72',
    descrizione: 'Escluso generico ex art. 15 (non concorre al volume d\'affari)',
    ambito: 'ESCLUSO',
  },
  {
    codiceCgn: 'A1501',
    naturaSdi: 'N1',
    norma: 'Art. 15, co. 1, n. 1',
    descrizione: 'Interessi di mora, penalità e indennità per inadempimento o ritardi',
    ambito: 'ESCLUSO',
  },
  {
    codiceCgn: 'A1502',
    naturaSdi: 'N1',
    norma: 'Art. 15, co. 1, n. 2',
    descrizione: 'Beni ceduti a titolo di sconto, premio o abbuono contrattuale a condizioni ordinarie',
    ambito: 'ESCLUSO',
  },
  {
    codiceCgn: 'A1503',
    naturaSdi: 'N1',
    norma: 'Art. 15, co. 1, n. 3',
    descrizione: 'Rimborsi spese anticipate in nome e per conto controparte, puntualmente documentate (es. marche da bollo / diritti)',
    ambito: 'ESCLUSO',
  },
  {
    codiceCgn: 'A1504',
    naturaSdi: 'N1',
    norma: 'Art. 15, co. 1, n. 4',
    descrizione: 'Valore normale di imballaggi, recipienti o cauzioni a rendere',
    ambito: 'ESCLUSO',
  },
  {
    codiceCgn: 'A1505',
    naturaSdi: 'N1',
    norma: 'Art. 15, co. 1, n. 5',
    descrizione: 'Rivalsa dell\'imposta sul valore aggiunto (quota IVA non addebitabile a base imponibile)',
    ambito: 'ESCLUSO',
  },

  // 2. Natura N2 — Operazioni Non Soggette ad IVA
  {
    codiceCgn: 'A07T',
    naturaSdi: 'N2.1',
    tipoDocumentoAutofattura: 'TD17',
    norma: 'Art. 7-ter DPR 633/72',
    descrizione: 'Servizi generici B2B resi a committenti esteri stabiliti fuori dall\'Unione Europea',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'A07T1',
    naturaSdi: 'N2.1',
    tipoDocumentoAutofattura: 'TD17',
    norma: 'Art. 7-ter DPR 633/72',
    descrizione: 'Servizi generici B2B resi a committenti comunitari UE (soggetti a reverse charge a destinazione)',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'A07B',
    naturaSdi: 'N2.1',
    norma: 'Art. 7-bis co. 1 DPR 633/72',
    descrizione: 'Cessioni extraterritoriali di beni e cessioni/lavori su immobili situati all\'estero',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'FORF',
    naturaSdi: 'N2.2',
    norma: 'L. 190/2014, art. 1 commi 54-89',
    descrizione: 'Regime Forfettario. Operazione senza addebito d\'imposta e senza detrazione. Vale anche per riaddebito bollo 2€ (Interpello 911-894/2022)',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'MIN',
    naturaSdi: 'N2.2',
    norma: 'D.L. 98/2011, art. 27 commi 1-2',
    descrizione: 'Regime fiscale di vantaggio per l\'imprenditoria giovanile e lavoratori in mobilità (ex minimi)',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'A7401A-E',
    naturaSdi: 'N2.2',
    norma: 'Art. 74, co. 1 lett. a-e',
    descrizione: 'Regimi monofase ad imposta assolta alla fonte: tabacchi, fiammiferi, editoria, telefonia, trasporti',
    ambito: 'NON_SOGGETTO',
  },
  {
    codiceCgn: 'FCI',
    naturaSdi: 'N2.2',
    norma: 'DPR 633/1972',
    descrizione: 'Operazioni generiche fuori campo IVA per difetto assoluto dei requisiti normativi',
    ambito: 'NON_SOGGETTO',
  },

  // 3. Natura N3 — Operazioni Non Imponibili (Esportazioni e Scambi Intracomunitari)
  {
    codiceCgn: 'A0801A',
    naturaSdi: 'N3.1',
    norma: 'Art. 8, co. 1, lett. a)',
    descrizione: 'Esportazioni dirette a cura del cedente o per suo conto verso Paesi Extra-UE',
    ambito: 'NON_IMPONIBILE',
  },
  {
    codiceCgn: 'A0801B',
    naturaSdi: 'N3.1',
    norma: 'Art. 8, co. 1, lett. b)',
    descrizione: 'Cessioni all\'esportazione a cura del cessionario non residente entro 90 giorni dalla consegna',
    ambito: 'NON_IMPONIBILE',
  },
  {
    codiceCgn: 'D41',
    naturaSdi: 'N3.2',
    tipoDocumentoAutofattura: 'TD18',
    norma: 'Art. 41 D.L. 331/1993',
    descrizione: 'Cessioni intracomunitarie onerose a soggetti passivi stabiliti in altro Stato membro UE',
    ambito: 'NON_IMPONIBILE',
  },
  {
    codiceCgn: 'A0801C',
    naturaSdi: 'N3.5',
    norma: 'Art. 8, co. 1, lett. c)',
    descrizione: 'Cessioni e prestazioni ad esportatori abituali muniti di dichiarazione d\'intento (plafond)',
    ambito: 'NON_IMPONIBILE',
  },

  // 4. Natura N4 — Operazioni Esenti ex Art. 10 DPR 633/1972
  {
    codiceCgn: 'A1001',
    naturaSdi: 'N4',
    norma: 'Art. 10, n. 1 DPR 633/72',
    descrizione: 'Prestazioni di servizi finanziari, crediti, concessione mutui e garanzie',
    ambito: 'ESENTE',
  },
  {
    codiceCgn: 'A1002',
    naturaSdi: 'N4',
    norma: 'Art. 10, n. 2 DPR 633/72',
    descrizione: 'Operazioni di assicurazione, riassicurazione e rendite vitalizie',
    ambito: 'ESENTE',
  },
  {
    codiceCgn: 'A1018',
    naturaSdi: 'N4',
    norma: 'Art. 10, n. 18 DPR 633/72',
    descrizione: 'Prestazioni sanitarie di diagnosi, cura e riabilitazione rese alla persona',
    ambito: 'ESENTE',
  },
  {
    codiceCgn: 'A1020',
    naturaSdi: 'N4',
    norma: 'Art. 10, n. 20 DPR 633/72',
    descrizione: 'Prestazioni educative, didattiche e di formazione o riqualificazione professionale',
    ambito: 'ESENTE',
  },
  {
    codiceCgn: 'A10F24',
    naturaSdi: 'N4',
    norma: 'Art. 10 DPR 633/72',
    descrizione: 'Compensi spettanti agli intermediari abilitati per la trasmissione dei modelli F24',
    ambito: 'ESENTE',
  },

  // 5. Natura N5 — Regime del Margine e Agenzie di Viaggio
  {
    codiceCgn: 'DL41A',
    naturaSdi: 'N5',
    norma: 'Art. 36 D.L. 41/1995',
    descrizione: 'Acquisto di beni usati, oggetti d\'arte o antiquariato rientranti nel regime del margine',
    ambito: 'MARGINE',
  },
  {
    codiceCgn: 'A74TER',
    naturaSdi: 'N5',
    norma: 'Art. 74-ter DPR 633/72',
    descrizione: 'Regime speciale agenzie di viaggio e turismo',
    ambito: 'MARGINE',
  },

  // 6. Natura N6 — Inversione Contabile (Reverse Charge Interno)
  {
    codiceCgn: 'A7407',
    naturaSdi: 'N6.1',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 74, commi 7 e 8',
    descrizione: 'Cessioni di rottami ferrosi e non ferrosi, cascami, carta da macero, stracci e pallet recuperati',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1705OI',
    naturaSdi: 'N6.2',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 5 DPR 633/72',
    descrizione: 'Cessioni di oro industriale e materiale d\'oro da investimento imponibile',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706A',
    naturaSdi: 'N6.3',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. a)',
    descrizione: 'Prestazioni di servizi di subappalto rese da imprese edili nel settore delle costruzioni',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706ABA',
    naturaSdi: 'N6.4',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. a-bis)',
    descrizione: 'Cessioni di fabbricati abitativi o strumentali con opzione per l\'imposizione',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706B',
    naturaSdi: 'N6.5',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. b)',
    descrizione: 'Cessioni di telefoni cellulari e dispositivi di telefonia mobile',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706C',
    naturaSdi: 'N6.6',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. c)',
    descrizione: 'Cessioni di console da gioco, tablet PC, laptop e dispositivi a circuito integrato (CPU)',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706AT',
    naturaSdi: 'N6.7',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. a-ter)',
    descrizione: 'Servizi di pulizia, demolizione, installazione impianti e completamento relativi ad edifici',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A1706DB',
    naturaSdi: 'N6.8',
    tipoDocumentoAutofattura: 'TD16',
    norma: 'Art. 17, co. 6, lett. d-bis)',
    descrizione: 'Trasferimento quote gas serra, certificati gas/energia e cessioni di energia/gas all\'ingrosso',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },
  {
    codiceCgn: 'A74TER08',
    naturaSdi: 'N6.9',
    norma: 'Art. 74-ter, co. 8',
    descrizione: 'Provvigioni corrisposte dagli intermediari di viaggio per mandati di vendita pacchetti',
    ambito: 'REVERSE_CHARGE',
    causalePrimaNota: '130IFR',
  },

  // 7. Split Payment & Operazioni Speciali
  {
    codiceCgn: 'A17T22',
    naturaSdi: 'N1', // Split payment vendite: espone aliquota 22% con scissione pagamenti
    norma: 'Art. 17-ter DPR 633/72',
    descrizione: 'Fatture emesse verso PA in Split Payment: IVA 22% esposta ma riscossa dall\'Erario',
    ambito: 'SPLIT_PAYMENT',
    aliquotaPredefinita: 22,
  },
  {
    codiceCgn: 'A17T22A',
    naturaSdi: 'N1',
    norma: 'Art. 17-ter DPR 633/72',
    descrizione: 'Acquisti in split payment (causale 130IFS / 130ISR): versamento dell\'imposta con F24',
    ambito: 'SPLIT_PAYMENT',
    causalePrimaNota: '130IFS',
    aliquotaPredefinita: 22,
  },
  {
    codiceCgn: 'NO_IVA',
    norma: 'DPR 633/1972',
    descrizione: 'Operazioni non rilevanti IVA (causale 899 su conto 25999.1): paghe, INAIL, assicurazioni, quote associative',
    ambito: 'NO_IVA',
    causalePrimaNota: '899',
  },
]

export function trovaCodificaCgn(codice: string): CodificaIvaCGN | undefined {
  const norm = codice.trim().toUpperCase()
  return TABELLA_IVA_CGN.find(c => c.codiceCgn.toUpperCase() === norm)
}
