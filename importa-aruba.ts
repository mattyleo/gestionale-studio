// importa-aruba.ts
// Script per l'importazione massiva dei file XML / ZIP delle fatture esportate da Aruba.
// Uso:
//   npx tsx importa-aruba.ts [file.zip | cartella_xml] [--non-saldate]
//
// Esempio:
//   npx tsx importa-aruba.ts ~/Downloads/fatture-aruba.zip
//   npx tsx importa-aruba.ts ./cartella-xml

import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { XMLParser } from 'fast-xml-parser'
import { prisma } from './src/lib/prisma'

function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function cleanStr(val: any): string | null {
  if (val === undefined || val === null) return null
  const s = String(val).trim()
  return s.length > 0 ? s : null
}

function parseNum(val: any, fallback = 0): number {
  if (val === undefined || val === null) return fallback
  const n = parseFloat(String(val).replace(',', '.'))
  return isNaN(n) ? fallback : n
}

// Estrae l'XML pulito anche se il file è un .p7m (firma digitale CMS)
function extractXmlContent(buffer: Buffer): string {
  const content = buffer.toString('utf8')
  const startMatch = content.match(/<([a-zA-Z0-9_]+:)?FatturaElettronica[\s>]/)
  const endMatch = content.match(/<\/([a-zA-Z0-9_]+:)?FatturaElettronica>/)

  if (startMatch && endMatch && startMatch.index !== undefined && endMatch.index !== undefined) {
    const startIdx = startMatch.index
    const endIdx = endMatch.index + endMatch[0].length
    return content.substring(startIdx, endIdx)
  }

  // Se non ha i tag, restituisci così com'è (potrebbe essere XML puro)
  return content
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0) {
    console.log('======================================================================')
    console.log('      IMPORTATORE MASSIVO FATTURE & ANAGRAFICHE ARUBA (XML / ZIP)')
    console.log('======================================================================')
    console.log('Uso:')
    console.log('  npx tsx importa-aruba.ts <percorso_file.zip | cartella_xml> [--non-saldate]\n')
    console.log('Esempio:')
    console.log('  npx tsx importa-aruba.ts ./fatture.zip')
    console.log('  npx tsx importa-aruba.ts /home/antonio/Scaricati/fatture.zip')
    console.log('======================================================================')
    process.exit(1)
  }

  const inputPath = path.resolve(args[0])
  const segnaComeSaldate = !args.includes('--non-saldate')

  if (!fs.existsSync(inputPath)) {
    console.error(`[ERRORE] Il file o percorso indicato non esiste: ${inputPath}`)
    process.exit(1)
  }

  let workDir = inputPath
  let isTemp = false

  // Se è un archivio ZIP, estrailo in una cartella temporanea
  if (inputPath.toLowerCase().endsWith('.zip')) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aruba-import-'))
    console.log(`[1/4] Estrazione archivio ZIP in corso: ${path.basename(inputPath)} ...`)

    try {
      if (process.platform === 'win32') {
        execSync(`tar -xf "${inputPath}" -C "${tempDir}"`, { stdio: 'ignore' })
      } else {
        execSync(`unzip -q -o "${inputPath}" -d "${tempDir}"`, { stdio: 'ignore' })
      }
    } catch {
      // Fallback python se presente
      try {
        execSync(`python3 -m zipfile -e "${inputPath}" "${tempDir}"`, { stdio: 'ignore' })
      } catch (err2: any) {
        console.error('[ERRORE] Impossibile estrarre lo zip. Assicurati che unzip o tar siano installati.')
        process.exit(1)
      }
    }

    workDir = tempDir
    isTemp = true
    console.log(`[OK] File estratti temporaneamente.`)
  }

  // Cerca tutti i file .xml o .p7m ricorsivamente
  function findXmlFiles(dir: string): string[] {
    let results: string[] = []
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const full = path.join(dir, file)
      const stat = fs.statSync(full)
      if (stat.isDirectory()) {
        results = results.concat(findXmlFiles(full))
      } else {
        const lower = file.toLowerCase()
        if (lower.endsWith('.xml') || lower.endsWith('.xml.p7m') || lower.endsWith('.p7m')) {
          results.push(full)
        }
      }
    }
    return results
  }

  const files = findXmlFiles(workDir)
  console.log(`\n[2/4] Trovati ${files.length} file di fattura elettronica da elaborare.`)

  if (files.length === 0) {
    console.log('[!] Nessun file XML trovato nell\'archivio.')
    if (isTemp) fs.rmSync(workDir, { recursive: true, force: true })
    process.exit(0)
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
  })

  // Recupera profilo emittente per snapshot e sequenze
  const emittenteDb = await prisma.issuerProfile.findFirst()
  if (!emittenteDb) {
    console.error('[ERRORE] Profilo emittente dello studio non trovato nel database.')
    process.exit(1)
  }

  let clientiCreati = 0
  let clientiAggiornati = 0
  let fattureImportate = 0
  let fattureSaltate = 0
  const maxNumeriPerSezionale: Record<string, number> = {}

  console.log('\n[3/4] Inizio importazione anagrafiche e fatture nel database...\n')

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]
    try {
      const rawBuf = fs.readFileSync(filePath)
      const xmlStr = extractXmlContent(rawBuf)
      const parsed = parser.parse(xmlStr)

      const root = parsed.FatturaElettronica
      if (!root) {
        continue
      }

      const header = root.FatturaElettronicaHeader
      const trasm = header?.DatiTrasmissione
      const cess = header?.CessionarioCommittente

      if (!cess) continue

      // ─── 1. ANAGRAFICA CLIENTE ──────────────────────────────────────────
      const anag = cess.DatiAnagrafici?.Anagrafica
      let ragioneSociale = cleanStr(anag?.Denominazione)
      if (!ragioneSociale) {
        const nome = cleanStr(anag?.Nome) || ''
        const cognome = cleanStr(anag?.Cognome) || ''
        ragioneSociale = `${nome} ${cognome}`.trim()
      }
      if (!ragioneSociale) {
        ragioneSociale = `Cliente ${files[i]}`
      }

      const pIva = cleanStr(cess.DatiAnagrafici?.IdFiscaleIVA?.IdCodice)?.replace(/\s/g, '') || null
      const cf = cleanStr(cess.DatiAnagrafici?.CodiceFiscale)?.replace(/\s/g, '').toUpperCase() || null
      const sede = cess.Sede || {}
      const indirizzo = cleanStr(sede.Indirizzo)
      const cap = cleanStr(sede.CAP)
      const comune = cleanStr(sede.Comune)
      const prov = cleanStr(sede.Provincia)
      const nazione = cleanStr(sede.Nazione) || 'IT'
      const codDest = cleanStr(trasm?.CodiceDestinatario) || '0000000'
      const pec = cleanStr(trasm?.PECDestinatario)

      // Tipo soggetto
      let tipoSoggetto: 'PERSONA_GIURIDICA' | 'PERSONA_FISICA' | 'PA' = 'PERSONA_GIURIDICA'
      if (trasm?.FormatoTrasmissione === 'FPA12' || codDest.length === 6) {
        tipoSoggetto = 'PA'
      } else if (cf && !pIva) {
        tipoSoggetto = 'PERSONA_FISICA'
      }

      // Ricerca o creazione Company
      let company = await prisma.company.findFirst({
        where: {
          OR: [
            ...(pIva ? [{ partitaIva: pIva }] : []),
            ...(cf ? [{ codiceFiscale: cf }] : []),
            { ragioneSociale: { equals: ragioneSociale, mode: 'insensitive' as const } },
          ],
        },
      })

      if (!company) {
        company = await prisma.company.create({
          data: {
            ragioneSociale,
            tipoSoggetto,
            partitaIva: pIva,
            codiceFiscale: cf,
            indirizzo,
            cap,
            comune,
            provincia: prov,
            paese: nazione,
            codiceDestinatarioSdi: codDest,
            pec,
            frequenzaFatturazione: 'MENSILE',
          },
        })
        clientiCreati++
      } else {
        // Aggiorna eventuali dati mancanti
        await prisma.company.update({
          where: { id: company.id },
          data: {
            partitaIva: company.partitaIva || pIva,
            codiceFiscale: company.codiceFiscale || cf,
            indirizzo: company.indirizzo || indirizzo,
            cap: company.cap || cap,
            comune: company.comune || comune,
            provincia: company.provincia || prov,
            codiceDestinatarioSdi: company.codiceDestinatarioSdi === '0000000' && codDest !== '0000000' ? codDest : company.codiceDestinatarioSdi,
            pec: company.pec || pec,
          },
        })
        clientiAggiornati++
      }

      // ─── 2. FATTURE CONTENUTE NEL FILE (Bodies) ─────────────────────────
      const bodies = toArray(root.FatturaElettronicaBody)

      for (const body of bodies) {
        const datiGenDoc = body.DatiGenerali?.DatiGeneraliDocumento
        if (!datiGenDoc) continue

        const numeroRaw = cleanStr(datiGenDoc.Numero) || `FATT_${Date.now()}`
        const dataDocStr = cleanStr(datiGenDoc.Data)
        const dataDoc = dataDocStr ? new Date(dataDocStr) : new Date()
        const anno = dataDoc.getFullYear()

        // Estrazione numero intero e sezionale
        // Es. "FPR 1/26", "1/26", "1", "FPA 2/26"
        const matchNum = numeroRaw.match(/(\d+)/)
        const numero = matchNum ? parseInt(matchNum[1], 10) : fattureImportate + 1

        let sezionale = 'FT'
        const upRaw = numeroRaw.toUpperCase()
        if (upRaw.includes('FPA') || trasm?.FormatoTrasmissione === 'FPA12') {
          sezionale = 'FPA'
        } else if (upRaw.includes('FPR') || trasm?.FormatoTrasmissione === 'FPR12') {
          sezionale = 'FPR'
        }

        const sezKey = `${sezionale}_${anno}`
        maxNumeriPerSezionale[sezKey] = Math.max(maxNumeriPerSezionale[sezKey] || 0, numero)

        // Verifica se la fattura esiste già (idempotenza)
        const esiste = await prisma.invoice.findFirst({
          where: {
            OR: [
              { numeroCompleto: numeroRaw },
              { AND: [{ numero }, { sezionale }, { anno }] },
            ],
          },
        })

        if (esiste) {
          fattureSaltate++
          continue
        }

        // Totali documento
        const totDoc = parseNum(datiGenDoc.ImportoTotaleDocumento)
        const bollo = parseNum(datiGenDoc.DatiBollo?.ImportoBollo)
        const cassaObj = datiGenDoc.DatiCassaPrevidenziale
        const totCassa = cassaObj ? parseNum(cassaObj.ImportoContributoCassa) : 0

        // Righe beni/servizi
        const lineeRaw = toArray(body.DatiBeniServizi?.DettaglioLinee)
        let calcImponibile = 0

        const invoiceLinesData = lineeRaw.map((l: any, idx: number) => {
          const qta = parseNum(l.Quantita, 1)
          const pu = parseNum(l.PrezzoUnitario, 0)
          const pt = parseNum(l.PrezzoTotale, qta * pu)
          calcImponibile += pt

          return {
            ordinamento: idx + 1,
            descrizione: cleanStr(l.Descrizione) || `Prestazione ${idx + 1}`,
            quantita: qta,
            unitaMisura: cleanStr(l.UnitaMisura) || undefined,
            prezzoUnitario: pu,
            importo: pt,
            aliquotaIva: cleanStr(l.AliquotaIVA) || '0.00',
            naturaIva: cleanStr(l.Natura) || 'N2.2',
          }
        })

        const imponibileFinale = calcImponibile > 0 ? calcImponibile : Math.max(0, totDoc - totCassa - bollo)

        // Dati pagamento
        const modPag = cleanStr(body.DatiPagamento?.DettaglioPagamento?.ModalitaPagamento) || 'MP05'
        const iban = cleanStr(body.DatiPagamento?.DettaglioPagamento?.IBAN) || emittenteDb.iban

        // Creazione fattura nel database
        const newInvoice = await prisma.invoice.create({
          data: {
            companyId: company.id,
            numero,
            sezionale,
            anno,
            numeroCompleto: numeroRaw,
            dataDocumento: dataDoc,
            dataScadenza: new Date(dataDoc.getTime() + 30 * 24 * 60 * 60 * 1000),
            imponibile: imponibileFinale,
            totaleCassa: totCassa,
            totaleIva: 0,
            bollo,
            totaleDocumento: totDoc > 0 ? totDoc : imponibileFinale + totCassa + bollo,
            stato: 'EMESSA',
            modalitaPagamento: modPag,
            ibanDestinatario: iban,
            emessaAl: dataDoc,
            snapshotEmittente: emittenteDb as any,
            snapshotCliente: company as any,
            lines: {
              create: invoiceLinesData,
            },
          },
        })

        // Se richiesto, crea il record di incasso a saldo (così finisce in "Incassate")
        if (segnaComeSaldate && (totDoc > 0 || imponibileFinale > 0)) {
          const saldoImporto = totDoc > 0 ? totDoc : imponibileFinale + totCassa + bollo
          await prisma.payment.create({
            data: {
              invoiceId: newInvoice.id,
              importo: saldoImporto,
              dataValuta: dataDoc,
              dataIncasso: dataDoc,
              metodo: 'bonifico',
              riferimento: `Incasso fattura ${numeroRaw} (da storico Aruba)`,
            },
          })
        }

        fattureImportate++
        process.stdout.write(`  [${fattureImportate}] Importata fattura: ${numeroRaw} (${company.ragioneSociale.substring(0, 30)}) - € ${totDoc.toFixed(2)}\r`)
      }
    } catch (e: any) {
      console.error(`\n  [!] Errore durante lettura file ${path.basename(filePath)}: ${e.message}`)
    }
  }

  // ─── 4. AGGIORNAMENTO SEZIONALI / CONTATORI ─────────────────────────
  console.log('\n\n[4/4] Allineamento contatori sezionali studio...')
  for (const [key, maxNum] of Object.entries(maxNumeriPerSezionale)) {
    const [sez, annoStr] = key.split('_')
    const anno = parseInt(annoStr, 10)
    try {
      await prisma.documentSequence.upsert({
        where: {
          issuerId_sezionale_anno: {
            issuerId: emittenteDb.id,
            sezionale: sez,
            anno,
          },
        },
        update: {
          ultimoNumero: maxNum,
        },
        create: {
          issuerId: emittenteDb.id,
          sezionale: sez,
          anno,
          ultimoNumero: maxNum,
        },
      })
      console.log(`  [OK] Sezionale ${sez}/${anno}: prossimo numero impostato a ${maxNum + 1}`)
    } catch {
      // Ignora errori minori sequenza
    }
  }

  // Pulizia file temporanei
  if (isTemp) {
    try {
      fs.rmSync(workDir, { recursive: true, force: true })
    } catch {}
  }

  console.log('\n======================================================================')
  console.log('             IMPORTAZIONE COMPLETATA CON SUCCESSO!                    ')
  console.log('======================================================================')
  console.log(`  🏢 Nuove Anagrafiche Clienti create: ${clientiCreati}`)
  console.log(`  🏢 Anagrafiche Clienti aggiornate:   ${clientiAggiornati}`)
  console.log(`  📑 Fatture importate nel gestionale: ${fattureImportate}`)
  if (fattureSaltate > 0) {
    console.log(`  ⏭️ Fatture già presenti (saltate):   ${fattureSaltate}`)
  }
  if (segnaComeSaldate) {
    console.log(`  💳 Tutte le fatture sono state registrate con incasso a saldo!`)
  }
  console.log('======================================================================\n')
}

main().catch((err) => {
  console.error('[ERRORE FATALE]', err)
  process.exit(1)
})
