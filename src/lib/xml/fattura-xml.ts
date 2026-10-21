// src/lib/xml/fattura-xml.ts
// Generatore XML FatturaPA v1.2 conforme allo schema ufficiale AdE
// Riferimento: https://www.agenziaentrate.gov.it/portale/web/english/electronic-invoicing

import { create } from 'xmlbuilder2'

export interface DatiEmittente {
  denominazione: string
  codiceFiscale: string
  partitaIva?: string | null
  indirizzo: string
  cap: string
  comune: string
  provincia: string
  paese: string
  telefono?: string | null
  email?: string | null
  pec?: string | null
  regimeFiscale: string     // es. RF19
  cassaPrevidenziale?: string | null // es. TC02
  aliquotaCassa: number     // es. 4
  iban?: string | null
}

export interface DatiCliente {
  ragioneSociale: string
  tipoSoggetto: string
  codiceFiscale?: string | null
  partitaIva?: string | null
  indirizzo?: string | null
  cap?: string | null
  comune?: string | null
  provincia?: string | null
  paese?: string | null
  codiceDestinatarioSdi?: string | null
  pec?: string | null
}

export interface RigaFattura {
  numero: number
  descrizione: string
  quantita: number
  unitaMisura?: string
  prezzoUnitario: number
  importo: number
  aliquotaIva: string   // es. "0.00"
  naturaIva?: string    // es. "N2.2"
}

export interface DatiFattura {
  numeroCompleto: string  // es. "FT 1/2026"
  numero: number          // es. 1
  sezionale: string       // es. "FT"
  anno: number            // es. 2026
  dataDocumento: Date
  dataScadenza?: Date | null
  modalitaPagamento: string   // es. "MP05"
  terminiPagamento: number    // giorni
  ibanDestinatario?: string | null
  imponibile: number
  totaleCassa: number
  totaleIva: number
  bollo: number
  totaleDocumento: number
  note?: string | null
  righe: RigaFattura[]
  emittente: DatiEmittente
  cliente: DatiCliente
}

/**
 * Formatta una data in formato FatturaPA: YYYY-MM-DD
 */
function formatDataXml(d: Date): string {
  return d.toISOString().split('T')[0]
}

/**
 * Formatta un numero in formato FatturaPA: decimale con punto, 2 cifre
 */
function formatImporto(n: number): string {
  return n.toFixed(2)
}

/**
 * Ricava l'ID fiscale del cliente per l'XML
 */
function getIdFiscaleCliente(cliente: DatiCliente): { idPaese: string; idCodice: string } | null {
  if (cliente.partitaIva) {
    return { idPaese: cliente.paese || 'IT', idCodice: cliente.partitaIva }
  }
  return null
}

/**
 * Genera l'XML FatturaPA v1.2 conforme allo schema ufficiale
 * Restituisce la stringa XML completa
 */
export function generaFatturaXML(dati: DatiFattura): string {
  const { emittente, cliente, righe } = dati

  // Numero progressivo per il file (es. "IT05389400481_FT00001.xml")
  const pIva = emittente.partitaIva || emittente.codiceFiscale
  const progFile = `FT${String(dati.numero).padStart(5, '0')}`
  const nomeFile = `${pIva}_${progFile}`

  // FormatoTrasmissione: FPA12 per PA (6 caratteri), FPR12 per privati/imprese (7 caratteri)
  const codDestRaw = (cliente.codiceDestinatarioSdi || '').trim().toUpperCase()
  const isPA = codDestRaw.length === 6
  const formatoTrasmissione = isPA ? 'FPA12' : 'FPR12'
  const codDest = codDestRaw || (isPA ? '000000' : '0000000')

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('p:FatturaElettronica', {
      'versione': formatoTrasmissione,
      'xmlns:p': 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': 'http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd',
    })

  // ─── FatturaElettronicaHeader ───────────────────────────────────────
  const header = root.ele('FatturaElettronicaHeader')

  // DatiTrasmissione
  const datiTrasmissione = header.ele('DatiTrasmissione')
  datiTrasmissione.ele('IdTrasmittente')
    .ele('IdPaese').txt('IT').up()
    .ele('IdCodice').txt((emittente.partitaIva || emittente.codiceFiscale).replace(/\s/g, '')).up()
    .up()
  datiTrasmissione.ele('ProgressivoInvio').txt(progFile)
  datiTrasmissione.ele('FormatoTrasmissione').txt(formatoTrasmissione)
  datiTrasmissione.ele('CodiceDestinatario').txt(codDest)

  // ContattiTrasmittente (opzionale)
  if (emittente.email || emittente.pec) {
    const contatti = datiTrasmissione.ele('ContattiTrasmittente')
    if (emittente.telefono) contatti.ele('Telefono').txt(emittente.telefono)
    if (emittente.email) contatti.ele('Email').txt(emittente.email)
  }

  // Se c'è PEC del destinatario, usarla
  if (cliente.pec && (!cliente.codiceDestinatarioSdi || codDest === '0000000')) {
    datiTrasmissione.ele('PECDestinatario').txt(cliente.pec.trim())
  }

  // CedentePrestatore (emittente)
  const cedente = header.ele('CedentePrestatore')
  const datiAnagCedente = cedente.ele('DatiAnagrafici')
  const idFiscaleCedente = datiAnagCedente.ele('IdFiscaleIVA')
  idFiscaleCedente.ele('IdPaese').txt('IT')
  idFiscaleCedente.ele('IdCodice').txt((emittente.partitaIva || emittente.codiceFiscale).replace(/\s/g, ''))

  if (emittente.codiceFiscale && emittente.partitaIva) {
    datiAnagCedente.ele('CodiceFiscale').txt(emittente.codiceFiscale.replace(/\s/g, '').toUpperCase())
  }

  datiAnagCedente.ele('Anagrafica').ele('Denominazione').txt(emittente.denominazione)
  datiAnagCedente.ele('RegimeFiscale').txt(emittente.regimeFiscale || 'RF19')

  const sedeCedente = cedente.ele('Sede')
  sedeCedente.ele('Indirizzo').txt(emittente.indirizzo)
  sedeCedente.ele('CAP').txt(emittente.cap)
  sedeCedente.ele('Comune').txt(emittente.comune)
  if (emittente.provincia) sedeCedente.ele('Provincia').txt(emittente.provincia)
  sedeCedente.ele('Nazione').txt(emittente.paese || 'IT')

  if (emittente.telefono || emittente.email) {
    const contattiCedente = cedente.ele('Contatti')
    if (emittente.telefono) contattiCedente.ele('Telefono').txt(emittente.telefono)
    if (emittente.email) contattiCedente.ele('Email').txt(emittente.email)
  }

  // CessionarioCommittente (cliente)
  const cessionario = header.ele('CessionarioCommittente')
  const datiAnagCess = cessionario.ele('DatiAnagrafici')

  const idFiscaleCliente = getIdFiscaleCliente(cliente)
  if (idFiscaleCliente && idFiscaleCliente.idCodice.trim()) {
    const idFisc = datiAnagCess.ele('IdFiscaleIVA')
    idFisc.ele('IdPaese').txt(idFiscaleCliente.idPaese)
    idFisc.ele('IdCodice').txt(idFiscaleCliente.idCodice.replace(/\s/g, ''))
  }

  if (cliente.codiceFiscale && cliente.codiceFiscale.trim()) {
    datiAnagCess.ele('CodiceFiscale').txt(cliente.codiceFiscale.replace(/\s/g, '').toUpperCase())
  }

  // Anagrafica cliente: Persona fisica usa Nome/Cognome, altri Denominazione
  const anagCess = datiAnagCess.ele('Anagrafica')
  if (cliente.tipoSoggetto === 'PERSONA_FISICA' && cliente.ragioneSociale.trim().includes(' ')) {
    const parti = cliente.ragioneSociale.trim().split(/\s+/)
    anagCess.ele('Nome').txt(parti[0])
    anagCess.ele('Cognome').txt(parti.slice(1).join(' '))
  } else {
    anagCess.ele('Denominazione').txt(cliente.ragioneSociale)
  }

  // Sede cliente
  const sedeCess = cessionario.ele('Sede')
  sedeCess.ele('Indirizzo').txt(cliente.indirizzo || 'N/D')
  sedeCess.ele('CAP').txt(cliente.cap || '00000')
  sedeCess.ele('Comune').txt(cliente.comune || 'N/D')
  if (cliente.provincia) sedeCess.ele('Provincia').txt(cliente.provincia)
  sedeCess.ele('Nazione').txt(cliente.paese || 'IT')

  // ─── FatturaElettronicaBody ─────────────────────────────────────────
  const body = root.ele('FatturaElettronicaBody')

  // DatiGenerali
  const datiGen = body.ele('DatiGenerali')
  const datiGenDoc = datiGen.ele('DatiGeneraliDocumento')
  datiGenDoc.ele('TipoDocumento').txt('TD01') // Fattura ordinaria
  datiGenDoc.ele('Divisa').txt('EUR')
  datiGenDoc.ele('Data').txt(formatDataXml(dati.dataDocumento))
  datiGenDoc.ele('Numero').txt(String(dati.numero))
  datiGenDoc.ele('ImportoTotaleDocumento').txt(formatImporto(dati.totaleDocumento))

  if (dati.note) {
    datiGenDoc.ele('Causale').txt(dati.note.substring(0, 200))
  }

  // Bollo virtuale
  if (dati.bollo > 0) {
    const bolloEle = datiGenDoc.ele('DatiBollo')
    bolloEle.ele('BolloVirtuale').txt('SI')
    bolloEle.ele('ImportoBollo').txt(formatImporto(dati.bollo))
  }

  // Cassa previdenziale (CNPADC TC02 4%)
  if (dati.totaleCassa > 0 && emittente.cassaPrevidenziale) {
    const cassa = datiGenDoc.ele('DatiCassaPrevidenziale')
    cassa.ele('TipoCassa').txt(emittente.cassaPrevidenziale) // TC02
    cassa.ele('AlCassa').txt(formatImporto(emittente.aliquotaCassa)) // 4.00
    cassa.ele('ImportoContributoCassa').txt(formatImporto(dati.totaleCassa))
    cassa.ele('ImponibileCassa').txt(formatImporto(dati.imponibile))
    cassa.ele('AliquotaIVA').txt('0.00')
    cassa.ele('Natura').txt('N2.2')
  }

  // DatiBeniServizi — righe prestazioni
  const datiBeni = body.ele('DatiBeniServizi')

  for (const riga of righe) {
    const dettaglio = datiBeni.ele('DettaglioLinee')
    dettaglio.ele('NumeroLinea').txt(String(riga.numero))
    dettaglio.ele('Descrizione').txt(riga.descrizione.substring(0, 1000))
    dettaglio.ele('Quantita').txt(formatImporto(riga.quantita))
    if (riga.unitaMisura) dettaglio.ele('UnitaMisura').txt(riga.unitaMisura)
    dettaglio.ele('PrezzoUnitario').txt(formatImporto(riga.prezzoUnitario))
    dettaglio.ele('PrezzoTotale').txt(formatImporto(riga.importo))
    dettaglio.ele('AliquotaIVA').txt(formatImporto(parseFloat(riga.aliquotaIva || '0')))
    if (riga.naturaIva) dettaglio.ele('Natura').txt(riga.naturaIva)
  }

  // DatiRiepilogo IVA
  // SdI calcola: ImponibileImporto = Σ(PrezzoTotale righe) + Σ(ImportoContributoCassa)
  const riepilogo = datiBeni.ele('DatiRiepilogo')
  riepilogo.ele('AliquotaIVA').txt('0.00')
  riepilogo.ele('Natura').txt('N2.2')
  riepilogo.ele('ImponibileImporto').txt(formatImporto(dati.imponibile + dati.totaleCassa))
  riepilogo.ele('Imposta').txt('0.00')
  riepilogo.ele('RiferimentoNormativo').txt('Art. 1 c. 58 L. 190/2014 — Regime forfetario')

  // DatiPagamento
  const datiPagamento = body.ele('DatiPagamento')
  datiPagamento.ele('CondizioniPagamento').txt('TP02') // Pagamento completo

  const dettaglioPag = datiPagamento.ele('DettaglioPagamento')
  dettaglioPag.ele('ModalitaPagamento').txt(dati.modalitaPagamento || 'MP05')
  if (dati.dataScadenza) {
    dettaglioPag.ele('DataScadenzaPagamento').txt(formatDataXml(dati.dataScadenza))
  }
  dettaglioPag.ele('ImportoPagamento').txt(formatImporto(dati.totaleDocumento))
  if (dati.ibanDestinatario) {
    dettaglioPag.ele('IBAN').txt(dati.ibanDestinatario)
  }

  // Genera XML come stringa
  return root.end({ prettyPrint: true })
}

/**
 * Valida l'XML generato (verifica struttura minima)
 * Ritorna lista di errori trovati (array vuoto = valido)
 */
export function validaFatturaXML(xml: string): string[] {
  const errori: string[] = []

  const campiObbligatori = [
    'FatturaElettronica',
    'FatturaElettronicaHeader',
    'FatturaElettronicaBody',
    'DatiTrasmissione',
    'CedentePrestatore',
    'CessionarioCommittente',
    'DatiGenerali',
    'DatiBeniServizi',
    'DatiPagamento',
    'TipoDocumento',
    'Data',
    'Numero',
    'ImportoTotaleDocumento',
    'AliquotaIVA',
    'ModalitaPagamento',
  ]

  for (const campo of campiObbligatori) {
    const regex = new RegExp(`<(?:[a-zA-Z0-9_]+:)?${campo}[\\s>]`)
    if (!regex.test(xml)) {
      errori.push(`Campo obbligatorio mancante: <${campo}>`)
    }
  }

  // Verifica che il totale non sia zero
  const matchTotale = xml.match(/<ImportoTotaleDocumento>([\d.]+)<\/ImportoTotaleDocumento>/)
  if (matchTotale && parseFloat(matchTotale[1]) === 0) {
    errori.push('ImportoTotaleDocumento è zero')
  }

  return errori
}
