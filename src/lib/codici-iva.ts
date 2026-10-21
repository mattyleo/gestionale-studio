// src/lib/codici-iva.ts
// Catalogo ufficiale dei Codici e Nature IVA conformi ad Aruba e Agenzia delle Entrate (FatturaPA v1.2)

export interface CodiceIva {
  codice: string        // es. "22%", "0% - N2.2"
  aliquota: number      // es. 22, 0
  aliquotaStr: string   // es. "22", "0"
  natura?: string       // es. "N2.2", "N1", "N4"
  titoloBreve: string   // es. "N2.2 - Non soggette"
  descrizione: string   // descrizione estesa
  normativa?: string    // riferimento normativo
}

export const CODICI_IVA: CodiceIva[] = [
  // ── Aliquote Ordinarie e Ridotte ──────────────────────────────────────
  {
    codice: '22%',
    aliquota: 22,
    aliquotaStr: '22',
    titoloBreve: '22% Ordinaria',
    descrizione: 'Aliquota ordinaria 22%',
  },
  {
    codice: '10%',
    aliquota: 10,
    aliquotaStr: '10',
    titoloBreve: '10% Ridotta',
    descrizione: 'Aliquota ridotta 10%',
  },
  {
    codice: '5%',
    aliquota: 5,
    aliquotaStr: '5',
    titoloBreve: '5% Ridotta',
    descrizione: 'Aliquota ridotta 5%',
  },
  {
    codice: '4%',
    aliquota: 4,
    aliquotaStr: '4',
    titoloBreve: '4% Minima',
    descrizione: 'Aliquota minima 4%',
  },

  // ── Escluse art. 15 (N1) ──────────────────────────────────────────────
  {
    codice: '0% - N1',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N1',
    titoloBreve: 'N1 - Escluse ex art. 15',
    descrizione: 'Escluso Art. 15 DPR 633/72 (anticipazioni in nome e per conto del cliente)',
    normativa: 'Art. 15 DPR 633/72',
  },

  // ── Non Soggette (N2) ─────────────────────────────────────────────────
  {
    codice: '0% - N2.1',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N2.1',
    titoloBreve: 'N2.1 - Non soggette (artt. 7 a 7-septies)',
    descrizione: 'Non soggette ad IVA ai sensi degli artt. Da 7 a 7-septies del DPR 633/72',
    normativa: 'Artt. 7 a 7-septies DPR 633/72',
  },
  {
    codice: '0% - N2.2',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N2.2',
    titoloBreve: 'N2.2 - Non soggette - altri casi (Regime Forfettario)',
    descrizione: 'Non soggette - altri casi (operazione effettuata in regime forfettario L. 190/2014)',
    normativa: 'Art. 1, commi 54-89, L. 190/2014',
  },

  // ── Non Imponibili (N3) ───────────────────────────────────────────────
  {
    codice: '0% - N3.1',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.1',
    titoloBreve: 'N3.1 - Non imponibili (esportazioni)',
    descrizione: 'Non Imponibile esportazioni art. 8, c. 1, Let. A) DPR 633/72',
    normativa: 'Art. 8, c. 1 DPR 633/72',
  },
  {
    codice: '0% - N3.2',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.2',
    titoloBreve: 'N3.2 - Non imponibili (cessioni intracomunitarie)',
    descrizione: 'Non Imponibile cessioni intracomunitarie Art. 41 DL 331/93',
    normativa: 'Art. 41 DL 331/93',
  },
  {
    codice: '0% - N3.3',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.3',
    titoloBreve: 'N3.3 - Cessioni verso San Marino e Città del Vaticano',
    descrizione: 'Non Imponibile cessioni verso San Marino e Città del Vaticano',
    normativa: 'Art. 71 DPR 633/72',
  },
  {
    codice: '0% - N3.4',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.4',
    titoloBreve: 'N3.4 - Operazioni assimilate alle cessioni all\'esportazione',
    descrizione: 'Non imponibile operazioni assimilate alle cessioni all\'esportazione',
    normativa: 'Art. 8-bis DPR 633/72',
  },
  {
    codice: '0% - N3.5',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.5',
    titoloBreve: 'N3.5 - Dichiarazioni d\'intento',
    descrizione: 'Non Imponibile a seguito di dichiarazioni d\'intento Art. 8, c. 1, lett. c)',
    normativa: 'Art. 8, c. 1, lett. c) DPR 633/72',
  },
  {
    codice: '0% - N3.6',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N3.6',
    titoloBreve: 'N3.6 - Altre operazioni non imponibili',
    descrizione: 'Non imponibile altre operazioni che non concorrono alla formazione del plafond',
  },

  // ── Esenti (N4) ───────────────────────────────────────────────────────
  {
    codice: '0% - N4',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N4',
    titoloBreve: 'N4 - Esente Art. 10 DPR 633/72',
    descrizione: 'Operazione esente Art. 10 DPR 633/72',
    normativa: 'Art. 10 DPR 633/72',
  },

  // ── Regime del Margine (N5) ───────────────────────────────────────────
  {
    codice: '0% - N5',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N5',
    titoloBreve: 'N5 - Regime del margine / IVA non esposta',
    descrizione: 'Regime del margine Art. 36 DL 41/95 - Escluso Art. 74 DPR 633/72',
    normativa: 'DL 41/95 art. 36',
  },

  // ── Reverse Charge (N6) ───────────────────────────────────────────────
  {
    codice: '0% - N6.1',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.1',
    titoloBreve: 'N6.1 - Inversione contabile (rottami)',
    descrizione: 'Reverse charge Art. 74 vendita rottami e materiali di recupero',
  },
  {
    codice: '0% - N6.2',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.2',
    titoloBreve: 'N6.2 - Inversione contabile (oro e argento puro)',
    descrizione: 'Reverse charge cessione di oro e argento puro Art. 17 c. 5',
  },
  {
    codice: '0% - N6.3',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.3',
    titoloBreve: 'N6.3 - Inversione contabile (subappalto edilizia)',
    descrizione: 'Reverse charge subappalto nel settore edile Art. 17, c. 6 lett. a)',
  },
  {
    codice: '0% - N6.4',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.4',
    titoloBreve: 'N6.4 - Inversione contabile (fabbricati)',
    descrizione: 'Reverse charge cessione di fabbricati Art. 17, c. 6 lett. a-bis)',
  },
  {
    codice: '0% - N6.5',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.5',
    titoloBreve: 'N6.5 - Inversione contabile (telefonia)',
    descrizione: 'Reverse charge cessione di telefoni cellulari Art. 17, c. 6 lett. b)',
  },
  {
    codice: '0% - N6.6',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.6',
    titoloBreve: 'N6.6 - Inversione contabile (prodotti elettronici)',
    descrizione: 'Reverse charge cessione di prodotti elettronici Art. 17, c. 6 lett. c)',
  },
  {
    codice: '0% - N6.7',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.7',
    titoloBreve: 'N6.7 - Inversione contabile (comparto edile)',
    descrizione: 'Reverse charge prestazioni comparto edile e settori connessi Art. 17, c. 6 lett. a-ter)',
  },
  {
    codice: '0% - N6.8',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.8',
    titoloBreve: 'N6.8 - Inversione contabile (settore energetico)',
    descrizione: 'Reverse charge operazioni settore energetico Art. 17, c. 6 lett. d-bis, d-ter, d-quater)',
  },
  {
    codice: '0% - N6.9',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N6.9',
    titoloBreve: 'N6.9 - Inversione contabile (altri casi)',
    descrizione: 'Reverse charge altri casi',
  },

  // ── IVA assolta in altro stato UE (N7) ────────────────────────────────
  {
    codice: '0% - N7',
    aliquota: 0,
    aliquotaStr: '0',
    natura: 'N7',
    titoloBreve: 'N7 - Vendite a distanza (IVA altro stato UE)',
    descrizione: 'Vendite a distanza Art. 40/41 DL 331/93 (prestazioni di servizi telecomunicazioni, teleradiodiffusione ed elettronici)',
  },
]

export const CODICE_IVA_DEFAULT = '0% - N2.2'
