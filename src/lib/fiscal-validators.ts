// src/lib/fiscal-validators.ts
// Validazione fiscale italiana per Codice Fiscale, Partita IVA e Codice Destinatario SDI

/**
 * Valida la Partita IVA italiana (11 cifre numeriche con algoritmo di controllo)
 */
export function validaPartitaIva(piva: string): { valida: boolean; errore?: string } {
  if (!piva) {
    return { valida: false, errore: 'Partita IVA non inserita' }
  }

  const pulita = piva.trim().toUpperCase()

  if (pulita.length !== 11) {
    return { valida: false, errore: 'La Partita IVA deve essere composta esattamente da 11 cifre' }
  }

  if (!/^\d{11}$/.test(pulita)) {
    return { valida: false, errore: 'La Partita IVA deve contenere solo numeri' }
  }

  // Verifica che i primi 7 non siano tutti zero
  if (pulita.slice(0, 7) === '0000000') {
    return { valida: false, errore: 'I primi 7 caratteri della Partita IVA non possono essere tutti zero' }
  }

  // Algoritmo di controllo (Luhn per P.IVA italiana)
  let s = 0
  for (let i = 0; i <= 9; i += 2) {
    s += parseInt(pulita.charAt(i), 10)
  }
  for (let i = 1; i <= 9; i += 2) {
    const c = 2 * parseInt(pulita.charAt(i), 10)
    s += c > 9 ? c - 9 : c
  }

  const checkDigitAtteso = (10 - (s % 10)) % 10
  const checkDigitReale = parseInt(pulita.charAt(10), 10)

  if (checkDigitAtteso !== checkDigitReale) {
    return { valida: false, errore: 'Carattere di controllo della Partita IVA errato (P.IVA formalmente non valida)' }
  }

  return { valida: true }
}

/**
 * Valida il Codice Fiscale italiano (16 caratteri alfanumerici per persone fisiche o 11 cifre per soggetti non persone fisiche)
 */
export function validaCodiceFiscale(cf: string): { valida: boolean; errore?: string } {
  if (!cf) {
    return { valida: false, errore: 'Codice Fiscale non inserito' }
  }

  const pulito = cf.trim().toUpperCase()

  // Caso 11 cifre (società/enti con CF numerico coincidente con P.IVA)
  if (/^\d{11}$/.test(pulito)) {
    return validaPartitaIva(pulito)
  }

  if (pulito.length !== 16) {
    return { valida: false, errore: 'Il Codice Fiscale di una persona fisica deve essere composto esattamente da 16 caratteri' }
  }

  const regexCF = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPR-T][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/
  if (!regexCF.test(pulito)) {
    return { valida: false, errore: 'Struttura del Codice Fiscale non valida' }
  }

  // Calcolo carattere di controllo (CIN)
  const mappaDispari: { [k: string]: number } = {
    '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
    'A': 1, 'B': 0, 'C': 5, 'D': 7, 'E': 9, 'F': 13, 'G': 15, 'H': 17, 'I': 19, 'J': 21,
    'K': 2, 'L': 4, 'M': 18, 'N': 20, 'O': 11, 'P': 3, 'Q': 6, 'R': 8, 'S': 12, 'T': 14,
    'U': 16, 'V': 10, 'W': 22, 'X': 25, 'Y': 24, 'Z': 23
  }

  const mappaPari: { [k: string]: number } = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9,
    'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15, 'Q': 16, 'R': 17, 'S': 18, 'T': 19,
    'U': 20, 'V': 21, 'W': 22, 'X': 23, 'Y': 24, 'Z': 25
  }

  let somma = 0
  for (let i = 0; i < 15; i++) {
    const char = pulito.charAt(i)
    if (i % 2 === 0) {
      somma += mappaDispari[char] ?? 0
    } else {
      somma += mappaPari[char] ?? 0
    }
  }

  const cinAtteso = String.fromCharCode(65 + (somma % 26))
  const cinReale = pulito.charAt(15)

  if (cinAtteso !== cinReale) {
    return { valida: false, errore: `Carattere di controllo del Codice Fiscale non valido (atteso: ${cinAtteso}, trovato: ${cinReale})` }
  }

  return { valida: true }
}

/**
 * Valida il Codice Destinatario SDI
 */
export function validaCodiceSdi(codice: string, isPA = false): { valida: boolean; errore?: string } {
  if (!codice) return { valida: true }
  const pulito = codice.trim().toUpperCase()

  if (isPA) {
    if (pulito.length !== 6 || !/^[A-Z0-9]{6}$/.test(pulito)) {
      return { valida: false, errore: 'Il Codice Destinatario per la Pubblica Amministrazione deve essere di 6 caratteri alfanumerici' }
    }
  } else {
    if (pulito.length !== 7 || !/^[A-Z0-9]{7}$/.test(pulito)) {
      return { valida: false, errore: 'Il Codice Destinatario SDI deve essere di 7 caratteri (es. 0000000)' }
    }
  }

  return { valida: true }
}

/**
 * Valida i dati fiscali completi di un cliente in base alla tipologia (Privato vs Partita IVA)
 */
export function validaDatiFiscaliCliente(cliente: {
  tipoSoggetto: string
  codiceFiscale?: string | null
  partitaIva?: string | null
  codiceDestinatarioSdi?: string | null
  pec?: string | null
}): { valida: boolean; errori: string[] } {
  const errori: string[] = []
  const isPrivato = cliente.tipoSoggetto === 'PERSONA_FISICA'
  const isPA = cliente.tipoSoggetto === 'PA'

  if (isPrivato) {
    // Per un privato (consumatore finale): il Codice Fiscale è OBBLIGATORIO
    if (!cliente.codiceFiscale) {
      errori.push('Per un cliente privato (persona fisica) il Codice Fiscale è obbligatorio')
    } else {
      const v = validaCodiceFiscale(cliente.codiceFiscale)
      if (!v.valida && v.errore) errori.push(v.errore)
    }
  } else {
    // Per aziende, ditte e professionisti: la Partita IVA è OBBLIGATORIA
    if (!cliente.partitaIva) {
      errori.push('Per aziende, professionisti e ditte la Partita IVA è obbligatoria')
    } else {
      const v = validaPartitaIva(cliente.partitaIva)
      if (!v.valida && v.errore) errori.push(v.errore)
    }

    // Se inserisce anche il Codice Fiscale, validalo
    if (cliente.codiceFiscale) {
      const v = validaCodiceFiscale(cliente.codiceFiscale)
      if (!v.valida && v.errore) errori.push(v.errore)
    }
  }

  // Valida codice SDI
  if (cliente.codiceDestinatarioSdi) {
    const v = validaCodiceSdi(cliente.codiceDestinatarioSdi, isPA)
    if (!v.valida && v.errore) errori.push(v.errore)
  }

  return {
    valida: errori.length === 0,
    errori,
  }
}
