// src/lib/registri-iva.ts
// Modulo Registri IVA, Regole di Numerazione Protocolli e Scritture NO IVA (Contabilità Semplificata)
// Specifiche Dott. Antonio Tuzio & Normativa Fiscale DPR 633/1972 - DPR 600/1973

export interface RegistroIvaDef {
  codice: string
  nome: string
  tipo: 'ACQUISTI' | 'VENDITE' | 'CORRISPETTIVI' | 'RIEPILOGATIVO' | 'GENERALE'
  descrizione: string
  sezionaleDefault: string
  annotazioneAnnoSuccessivo?: boolean
  reverseCharge?: boolean
  intracomunitario?: boolean
  ventilazione?: boolean
  isAttivoDefault: boolean
}

// 1. Registri IVA Standard predisposti automaticamente per ogni azienda
export const REGISTRI_IVA_STANDARD: RegistroIvaDef[] = [
  // ── Registri Acquisti ──
  {
    codice: 'A1',
    nome: 'Registro Acquisti Ordinari',
    tipo: 'ACQUISTI',
    descrizione: 'Fatture di acquisto fornitori nazionali, prestazioni di servizi e spese generali',
    sezionaleDefault: 'A1',
    isAttivoDefault: true,
  },
  {
    codice: 'AS1',
    nome: 'Acquisti Annotati Anno Successivo',
    tipo: 'ACQUISTI',
    descrizione: 'Fatture passive a cavallo d\'anno registrate nell\'anno successivo con detrazione differita',
    sezionaleDefault: 'AS1',
    annotazioneAnnoSuccessivo: true,
    isAttivoDefault: true,
  },
  {
    codice: 'AI1',
    nome: 'Acquisti Intracomunitari',
    tipo: 'ACQUISTI',
    descrizione: 'Acquisti di beni da Paesi membri UE con integrazione d\'imposta (Autofattura TD18)',
    sezionaleDefault: 'AI1',
    intracomunitario: true,
    isAttivoDefault: true,
  },
  {
    codice: 'AR1',
    nome: 'Acquisti Reverse Charge',
    tipo: 'ACQUISTI',
    descrizione: 'Acquisti soggetti a inversione contabile interna (subappalto edile, pulizie, telefonia - TD16)',
    sezionaleDefault: 'AR1',
    reverseCharge: true,
    isAttivoDefault: true,
  },

  // ── Registri Vendite ──
  {
    codice: 'V1',
    nome: 'Registro Vendite Ordinario',
    tipo: 'VENDITE',
    descrizione: 'Fatture attive emesse nei confronti di clienti nazionali B2B e B2C',
    sezionaleDefault: 'V1',
    isAttivoDefault: true,
  },
  {
    codice: 'V2',
    nome: 'Vendite Intracomunitarie',
    tipo: 'VENDITE',
    descrizione: 'Cessioni di beni e servizi a soggetti passivi stabiliti in Stati membri UE (non imponibili art. 41)',
    sezionaleDefault: 'V2',
    intracomunitario: true,
    isAttivoDefault: true,
  },
  {
    codice: 'VS1',
    nome: 'Vendite per Acquisti Anno Successivo',
    tipo: 'VENDITE',
    descrizione: 'Annotazioni per autofatture o integrazioni con competenza differita',
    sezionaleDefault: 'VS1',
    annotazioneAnnoSuccessivo: true,
    isAttivoDefault: false,
  },

  // ── Registri Corrispettivi ──
  {
    codice: 'C1',
    nome: 'Corrispettivi a Scorporo',
    tipo: 'CORRISPETTIVI',
    descrizione: 'Corrispettivi giornalieri RT con scorporo analitico per aliquota IVA',
    sezionaleDefault: 'C1',
    isAttivoDefault: false,
  },
  {
    codice: 'CV1',
    nome: 'Corrispettivi a Ventilazione',
    tipo: 'CORRISPETTIVI',
    descrizione: 'Corrispettivi per commercio al minuto con metodo della ventilazione (D.M. 24/02/1973)',
    sezionaleDefault: 'CV1',
    ventilazione: true,
    isAttivoDefault: false,
  },

  // ── Riepilogativo ──
  {
    codice: 'R1',
    nome: 'Registro Riepilogativo IVA',
    tipo: 'RIEPILOGATIVO',
    descrizione: 'Riepilogo periodico delle liquidazioni IVA mensili o trimestrali',
    sezionaleDefault: 'R1',
    isAttivoDefault: true,
  },

  // ── Prima Nota Generale ──
  {
    codice: 'GEN',
    nome: 'Prima Nota Generale / Operazioni Libere',
    tipo: 'GENERALE',
    descrizione: 'Giroconti, prelievi, apporti soci e scritture di apertura/chiusura',
    sezionaleDefault: 'GEN',
    isAttivoDefault: true,
  },
]

export function trovaRegistroIva(codice: string): RegistroIvaDef {
  const reg = REGISTRI_IVA_STANDARD.find(r => r.codice.toUpperCase() === codice.toUpperCase())
  return reg || {
    codice: codice.toUpperCase(),
    nome: `Registro ${codice.toUpperCase()}`,
    tipo: 'ACQUISTI',
    descrizione: 'Registro IVA personalizzato',
    sezionaleDefault: codice.toUpperCase(),
    isAttivoDefault: true,
  }
}

// 2. Modello di Predisposizione Scrittura "NO IVA" per Contabilità Semplificata (Paghe, Assicurazioni, INAIL, ecc.)
export interface ScritturaNoIvaConfig {
  causaleCodice: string
  causaleDescrizione: string
  anagraficaFittizia: string
  registroDestinazione: string
  codiceCgn: string
  naturaSdi?: string
}

export const TIPI_SCRITTURE_NO_IVA: ScritturaNoIvaConfig[] = [
  {
    causaleCodice: '899',
    causaleDescrizione: 'Liquidazione Stipendi e Buste Paga del personale',
    anagraficaFittizia: 'Dipendenti Studio / Dipendenti Aziendali',
    registroDestinazione: 'A1',
    codiceCgn: 'NO_IVA',
  },
  {
    causaleCodice: '899-INPS',
    causaleDescrizione: 'Versamento Contributi Previdenziali INPS (Modello F24)',
    anagraficaFittizia: 'Fornitori Non IVA (INPS)',
    registroDestinazione: 'A1',
    codiceCgn: 'NO_IVA',
  },
  {
    causaleCodice: '899-INAIL',
    causaleDescrizione: 'Premio Assicurativo Obbligatorio INAIL',
    anagraficaFittizia: 'Fornitori Non IVA (INAIL)',
    registroDestinazione: 'A1',
    codiceCgn: 'NO_IVA',
  },
  {
    causaleCodice: '899-ASS',
    causaleDescrizione: 'Polizze Assicurative Incendio/Furto/RCT (Esenti Art. 10 n. 2)',
    anagraficaFittizia: 'Compagnia Assicurativa / Fornitori Non IVA',
    registroDestinazione: 'A1',
    codiceCgn: 'A1002',
    naturaSdi: 'N4',
  },
  {
    causaleCodice: '899-INT',
    causaleDescrizione: 'Interessi Passivi Bancari e Oneri Finanziari (Esenti Art. 10 n. 1)',
    anagraficaFittizia: 'Istituto Bancario / Fornitori Non IVA',
    registroDestinazione: 'A1',
    codiceCgn: 'A1001',
    naturaSdi: 'N4',
  },
  {
    causaleCodice: '899-GEN',
    causaleDescrizione: 'Operazione non soggetta ad IVA (Spese Generali / Fuori Campo)',
    anagraficaFittizia: 'Fornitori Non IVA',
    registroDestinazione: 'A1',
    codiceCgn: 'NO_IVA',
  },
]
