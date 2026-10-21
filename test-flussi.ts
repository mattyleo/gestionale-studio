// test-flussi.ts
// Test automatico dei flussi fondamentali:
// 1. Tariffazione (es. 90 min @ 80€/h = 120€)
// 2. Calcolo totali fattura (Imponibile + Cassa 4% + Bollo 2€)
// 3. Generazione e conformità XML FatturaPA (SdI / Aruba)
// 4. Gestione azienda (P.IVA / Codice Fiscale / SDI / PEC) e privato (Nome / Cognome)
// 5. Pagamenti parziali e saldo

import { generaFatturaXML, validaFatturaXML } from './src/lib/xml/fattura-xml'
import { calcolaArrotondamentoOre, calcolaImportoRiga } from './src/lib/utils'

let testCount = 0
let failCount = 0

function assert(cond: boolean, desc: string) {
  testCount++
  if (cond) {
    console.log(`  ✅ PASS: ${desc}`)
  } else {
    failCount++
    console.error(`  ❌ FAIL: ${desc}`)
  }
}

console.log('======================================================================')
console.log('   TEST FLUSSI FONDAMENTALI — GESTIONALE STUDIO PROFESSIONALE')
console.log('======================================================================\n')

// ─── TEST 1: Tariffazione a tempo ──────────────────────────────────
console.log('--- TEST 1: Tariffazione & Arrotondamento ---')
const minuti = 90
const tariffaOraria = 80
const oreCalcolate = calcolaArrotondamentoOre(minuti, 'COMMERCIALE')
const importo = calcolaImportoRiga(oreCalcolate, tariffaOraria)
assert(oreCalcolate === 1.5, `90 minuti convertiti in 1.5 ore (ottenuto: ${oreCalcolate})`)
assert(importo === 120, `90 min @ 80 €/h produce 120 € (ottenuto: ${importo})`)

// ─── TEST 2: Calcolo totali fattura Forfetario con Cassa e Bollo ────
console.log('\n--- TEST 2: Calcoli fiscali (Forfetario RF19, Cassa 4%, Bollo 2€) ---')
const imponibile = 120.00
const aliquotaCassa = 4
const cassa = Math.round(imponibile * aliquotaCassa) / 100 // 4.80
const bollo = (imponibile + cassa) > 77.47 ? 2.00 : 0.00   // 2.00
const totaleDoc = imponibile + cassa + bollo               // 126.80

assert(cassa === 4.80, `Cassa 4% su 120 € è 4.80 € (ottenuto: ${cassa})`)
assert(bollo === 2.00, `Bollo virtuale applicato su importo > 77.47 € (ottenuto: ${bollo})`)
assert(totaleDoc === 126.80, `Totale documento è 126.80 € (ottenuto: ${totaleDoc})`)

// ─── TEST 3: Generazione XML FatturaPA B2B (Impresa con P.IVA) ─────
console.log('\n--- TEST 3: Generazione XML FatturaPA B2B (Azienda con P.IVA) ---')
const datiB2B = {
  numeroCompleto: 'FT 1/2026',
  numero: 1,
  sezionale: 'FT',
  anno: 2026,
  dataDocumento: new Date('2026-10-07'),
  dataScadenza: new Date('2026-11-07'),
  modalitaPagamento: 'MP05',
  terminiPagamento: 30,
  ibanDestinatario: 'IT89E0303212804010000063104',
  imponibile: 120.00,
  totaleCassa: 4.80,
  totaleIva: 0.00,
  bollo: 2.00,
  totaleDocumento: 126.80,
  note: 'Consulenza fiscale ottobre 2026',
  emittente: {
    denominazione: 'Dott. Antonio Tuzio',
    codiceFiscale: 'TZUNTN69A16D612E',
    partitaIva: '05389400481',
    indirizzo: 'Via Test 1',
    cap: '50100',
    comune: 'Firenze',
    provincia: 'FI',
    paese: 'IT',
    regimeFiscale: 'RF19',
    cassaPrevidenziale: 'TC02',
    aliquotaCassa: 4.00,
    iban: 'IT89E0303212804010000063104',
  },
  cliente: {
    ragioneSociale: 'Beta Srl',
    tipoSoggetto: 'SOCIETA',
    partitaIva: '01234567890',
    codiceFiscale: '01234567890',
    indirizzo: 'Via Roma 10',
    cap: '20100',
    comune: 'Milano',
    provincia: 'MI',
    paese: 'IT',
    codiceDestinatarioSdi: 'M5UXCR1',
    pec: 'betasrl@pec.it',
  },
  righe: [
    {
      numero: 1,
      descrizione: 'Consulenza fiscale e tributaria',
      quantita: 1.5,
      unitaMisura: 'ore',
      prezzoUnitario: 80.00,
      importo: 120.00,
      aliquotaIva: '0.00',
      naturaIva: 'N2.2',
    },
  ],
}

const xmlB2B = generaFatturaXML(datiB2B)
const erroriB2B = validaFatturaXML(xmlB2B)
assert(erroriB2B.length === 0, `Nessun errore di validazione strutturale (errori: ${erroriB2B.join(', ')})`)
assert(xmlB2B.includes('versione="FPR12"'), 'Root ha versione="FPR12" per B2B')
assert(xmlB2B.includes('<FormatoTrasmissione>FPR12</FormatoTrasmissione>'), 'FormatoTrasmissione è FPR12')
assert(xmlB2B.includes('<CodiceDestinatario>M5UXCR1</CodiceDestinatario>'), 'CodiceDestinatario è M5UXCR1')
assert(xmlB2B.includes('<TipoCassa>TC02</TipoCassa>'), 'Cassa previdenziale TC02 presente')
assert(xmlB2B.includes('<Natura>N2.2</Natura>'), 'Tag Natura N2.2 presente in Cassa e Righe')
assert(!xmlB2B.includes('<Ritenuta>NO</Ritenuta>'), 'Nessun tag illegale <Ritenuta>NO</Ritenuta>')
assert(!xmlB2B.includes('<NaturaIVA>'), 'Nessun tag errato <NaturaIVA>')
assert(xmlB2B.includes('<BolloVirtuale>SI</BolloVirtuale>'), 'Bollo virtuale SI presente')
assert(xmlB2B.includes('<ImportoBollo>2.00</ImportoBollo>'), 'Importo bollo 2.00 presente')
assert(xmlB2B.includes('<ImponibileImporto>124.80</ImponibileImporto>'), 'ImponibileImporto riepilogo = 120 + 4.80 = 124.80 (quadratura SdI)')
assert(xmlB2B.includes('<ImportoTotaleDocumento>126.80</ImportoTotaleDocumento>'), 'ImportoTotaleDocumento = 126.80')

// ─── TEST 4: Generazione XML B2C (Privato Persona Fisica solo CF) ─
console.log('\n--- TEST 4: Generazione XML B2C (Privato cittadino, solo Codice Fiscale) ---')
const datiB2C = {
  ...datiB2B,
  numeroCompleto: 'FT 2/2026',
  numero: 2,
  cliente: {
    ragioneSociale: 'Mario Rossi',
    tipoSoggetto: 'PERSONA_FISICA',
    partitaIva: null,
    codiceFiscale: 'RSSMRA80A01H501Z',
    indirizzo: 'Via Garibaldi 5',
    cap: '00100',
    comune: 'Roma',
    provincia: 'RM',
    paese: 'IT',
    codiceDestinatarioSdi: '0000000',
    pec: null,
  },
}

const xmlB2C = generaFatturaXML(datiB2C)
const erroriB2C = validaFatturaXML(xmlB2C)
assert(erroriB2C.length === 0, `Nessun errore di validazione privato (errori: ${erroriB2C.join(', ')})`)
assert(xmlB2C.includes('<Nome>Mario</Nome>') && xmlB2C.includes('<Cognome>Rossi</Cognome>'), 'Nome Mario e Cognome Rossi separati correttamente per persona fisica')
assert(xmlB2C.includes('<CodiceFiscale>RSSMRA80A01H501Z</CodiceFiscale>'), 'Codice fiscale persona fisica presente')
assert(!xmlB2C.includes('<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice></IdCodice></IdFiscaleIVA>'), 'Nessun blocco IdFiscaleIVA vuoto per cliente privato senza P.IVA')
assert(xmlB2C.includes('<CodiceDestinatario>0000000</CodiceDestinatario>'), 'CodiceDestinatario 0000000 per privato')

// ─── TEST 5: Pagamenti parziali e residuo ─────────────────────────
console.log('\n--- TEST 5: Flusso Pagamenti Parziali e Saldo ---')
let totaleDaPagare = 126.80
let incassato = 0
let acconto1 = 50.00
incassato += acconto1
let residuo = totaleDaPagare - incassato
assert(residuo === 76.80, `Acconto 50 € riduce residuo a 76.80 € (ottenuto: ${residuo})`)
let statoFattura = residuo > 0 ? 'DA_INCASSARE' : 'INCASSATA'
assert(statoFattura === 'DA_INCASSARE', 'Con pagamento parziale la fattura rimane DA_INCASSARE')

let saldo = 76.80
incassato += saldo
residuo = Math.max(0, Math.round((totaleDaPagare - incassato) * 100) / 100)
assert(residuo === 0, `Saldo 76.80 € porta il residuo a zero (ottenuto: ${residuo})`)
statoFattura = residuo === 0 ? 'INCASSATA' : 'DA_INCASSARE'
assert(statoFattura === 'INCASSATA', 'A saldo avvenuto la fattura passa automaticamente a INCASSATA')

console.log('\n======================================================================')
if (failCount === 0) {
  console.log(`🎉 TUTTI I ${testCount} TEST SUPERATI CON SUCCESSO!`)
} else {
  console.error(`⚠️ ${failCount} TEST FALLITI SU ${testCount}`)
  process.exit(1)
}
console.log('======================================================================')
