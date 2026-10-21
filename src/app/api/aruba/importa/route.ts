// src/app/api/aruba/importa/route.ts
// Endpoint API per l'importazione di file ZIP o XML di Aruba direttamente dal browser

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { XMLParser } from 'fast-xml-parser'
import { Decimal } from 'decimal.js'

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

function extractXmlContent(buffer: Buffer): string {
  const content = buffer.toString('utf8')
  const startMatch = content.match(/<([a-zA-Z0-9_]+:)?FatturaElettronica[\s>]/)
  const endMatch = content.match(/<\/([a-zA-Z0-9_]+:)?FatturaElettronica>/)

  if (startMatch && endMatch && startMatch.index !== undefined && endMatch.index !== undefined) {
    const startIdx = startMatch.index
    const endIdx = endMatch.index + endMatch[0].length
    return content.substring(startIdx, endIdx)
  }
  return content
}

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const segnaComeSaldate = formData.get('saldate') !== 'false'

    if (!file) {
      return NextResponse.json({ error: 'Nessun file inviato' }, { status: 400 })
    }

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aruba-upload-'))
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(tempDir, file.name)
    fs.writeFileSync(filePath, buffer)

    let workDir = tempDir
    if (file.name.toLowerCase().endsWith('.zip')) {
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })
      try {
        if (process.platform === 'win32') {
          execSync(`tar -xf "${filePath}" -C "${extractDir}"`, { stdio: 'ignore' })
        } else {
          execSync(`unzip -q -o "${filePath}" -d "${extractDir}"`, { stdio: 'ignore' })
        }
      } catch {
        try {
          execSync(`python3 -m zipfile -e "${filePath}" "${extractDir}"`, { stdio: 'ignore' })
        } catch {
          fs.rmSync(tempDir, { recursive: true, force: true })
          return NextResponse.json({ error: 'Impossibile estrarre il file ZIP sul server' }, { status: 500 })
        }
      }
      workDir = extractDir
    }

    const files = findXmlFiles(workDir)
    if (files.length === 0) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Nessun file XML o P7M valido trovato nell\'archivio' }, { status: 400 })
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
    })

    const emittenteDb = await prisma.issuerProfile.findFirst()
    if (!emittenteDb) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Profilo emittente studio non configurato' }, { status: 400 })
    }

    let clientiCreati = 0
    let clientiAggiornati = 0
    let fattureImportate = 0
    let fattureSaltate = 0
    let totaleImporto = 0
    const maxNumeriPerSezionale: Record<string, number> = {}

    for (let i = 0; i < files.length; i++) {
      const fPath = files[i]
      try {
        const rawBuf = fs.readFileSync(fPath)
        const xmlStr = extractXmlContent(rawBuf)
        const parsed = parser.parse(xmlStr)

        const root = parsed.FatturaElettronica
        if (!root) continue

        const header = root.FatturaElettronicaHeader
        const trasm = header?.DatiTrasmissione
        const cess = header?.CessionarioCommittente
        if (!cess) continue

        const anag = cess.DatiAnagrafici?.Anagrafica
        let ragioneSociale = cleanStr(anag?.Denominazione)
        if (!ragioneSociale) {
          const nome = cleanStr(anag?.Nome) || ''
          const cognome = cleanStr(anag?.Cognome) || ''
          ragioneSociale = `${nome} ${cognome}`.trim()
        }
        if (!ragioneSociale) {
          ragioneSociale = `Cliente ${path.basename(fPath)}`
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

        let tipoSoggetto: 'PERSONA_GIURIDICA' | 'PERSONA_FISICA' | 'PA' = 'PERSONA_GIURIDICA'
        if (trasm?.FormatoTrasmissione === 'FPA12' || codDest.length === 6) {
          tipoSoggetto = 'PA'
        } else if (cf && !pIva) {
          tipoSoggetto = 'PERSONA_FISICA'
        }

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

        const bodies = toArray(root.FatturaElettronicaBody)
        for (const body of bodies) {
          const datiGenDoc = body.DatiGenerali?.DatiGeneraliDocumento
          if (!datiGenDoc) continue

          const numeroRaw = cleanStr(datiGenDoc.Numero) || `FATT_${Date.now()}`
          const dataDocStr = cleanStr(datiGenDoc.Data)
          const dataDoc = dataDocStr ? new Date(dataDocStr) : new Date()
          const anno = dataDoc.getFullYear()

          const matchNum = numeroRaw.match(/(\d+)/)
          const numeroProgressivo = matchNum ? parseInt(matchNum[1], 10) : 1

          let sezionale = 'FT'
          if (numeroRaw.toUpperCase().includes('FPR')) sezionale = 'FPR'
          else if (numeroRaw.toUpperCase().includes('FPA')) sezionale = 'FPA'
          else if (numeroRaw.includes('/')) {
            const parts = numeroRaw.split('/')
            if (isNaN(Number(parts[0]))) sezionale = parts[0].trim()
          }

          const existingInvoice = await prisma.invoice.findFirst({
            where: {
              anno,
              OR: [
                { numeroCompleto: numeroRaw },
                { AND: [{ numero: numeroProgressivo }, { sezionale }] },
              ],
            },
          })

          if (existingInvoice) {
            fattureSaltate++
            continue
          }

          const importoTotDoc = parseNum(datiGenDoc.ImportoTotaleDocumento, 0)
          const datiBollo = datiGenDoc.DatiBollo
          const bollo = cleanStr(datiBollo?.BolloVirtuale) === 'SI' ? parseNum(datiBollo?.ImportoBollo, 2.0) : 0

          let totaleCassa = 0
          const datiCassaList = toArray(datiGenDoc.DatiCassaPrevidenziale)
          for (const c of datiCassaList) {
            totaleCassa += parseNum(c.ImportoContributoCassa, 0)
          }

          let totaleIva = 0
          let totaleImponibile = 0
          const datiRiepilogo = toArray(body.DatiBeniServizi?.DatiRiepilogo)
          for (const r of datiRiepilogo) {
            totaleIva += parseNum(r.Imposta, 0)
            totaleImponibile += parseNum(r.ImponibileImporto, 0)
          }

          const totaleFinale = importoTotDoc > 0 ? importoTotDoc : (totaleImponibile + totaleCassa + totaleIva + bollo)
          totaleImporto += totaleFinale

          const causaleArray = toArray(datiGenDoc.Causale).map(cleanStr).filter(Boolean)
          const noteDoc = causaleArray.join('; ') || null

          const modalitaPagamento = cleanStr(body.DatiPagamento?.DettaglioPagamento?.ModalitaPagamento) || 'MP05'
          const dataScadenzaStr = cleanStr(body.DatiPagamento?.DettaglioPagamento?.DataScadenzaPagamento)
          const dataScadenza = dataScadenzaStr ? new Date(dataScadenzaStr) : new Date(dataDoc.getTime() + 30 * 86400000)

          const inv = await prisma.invoice.create({
            data: {
              numero: numeroProgressivo,
              sezionale,
              anno,
              numeroCompleto: numeroRaw,
              dataDocumento: dataDoc,
              dataScadenza,
              stato: 'EMESSA',
              imponibile: new Decimal(totaleImponibile),
              totaleCassa: new Decimal(totaleCassa),
              totaleIva: new Decimal(totaleIva),
              bollo: new Decimal(bollo),
              totaleDocumento: new Decimal(totaleFinale),
              modalitaPagamento,
              terminiPagamento: 30,
              note: noteDoc,
              companyId: company.id,
              snapshotEmittente: emittenteDb as any,
              snapshotCliente: company as any,
            },
          })

          const linee = toArray(body.DatiBeniServizi?.DettaglioLinee)
          if (linee.length > 0) {
            for (let idx = 0; idx < linee.length; idx++) {
              const l = linee[idx]
              const desc = cleanStr(l.Descrizione) || `Prestazione professionale`
              const qta = parseNum(l.Quantita, 1)
              const prezzoUnit = parseNum(l.PrezzoUnitario, parseNum(l.PrezzoTotale, 0))
              const impTot = parseNum(l.PrezzoTotale, qta * prezzoUnit)
              const aliquota = cleanStr(l.AliquotaIVA) || '0'
              const natura = cleanStr(l.Natura) || 'N2.2'

              await prisma.invoiceLine.create({
                data: {
                  invoiceId: inv.id,
                  ordinamento: idx + 1,
                  descrizione: desc,
                  quantita: new Decimal(qta),
                  prezzoUnitario: new Decimal(prezzoUnit),
                  importo: new Decimal(impTot),
                  aliquotaIva: aliquota,
                  naturaIva: natura,
                },
              })
            }
          } else {
            await prisma.invoiceLine.create({
              data: {
                invoiceId: inv.id,
                ordinamento: 1,
                descrizione: 'Prestazioni professionali da fattura storica',
                quantita: new Decimal(1),
                prezzoUnitario: new Decimal(totaleImponibile),
                importo: new Decimal(totaleImponibile),
                aliquotaIva: '0',
                naturaIva: 'N2.2',
              },
            })
          }

          if (segnaComeSaldate && totaleFinale > 0) {
            await prisma.payment.create({
              data: {
                invoiceId: inv.id,
                importo: new Decimal(totaleFinale),
                dataValuta: dataDoc,
                dataIncasso: dataDoc,
                metodo: modalitaPagamento,
                note: 'Incasso registrato da importazione storico Aruba',
              },
            })
          }

          const key = `${sezionale}_${anno}`
          if (!maxNumeriPerSezionale[key] || numeroProgressivo > maxNumeriPerSezionale[key]) {
            maxNumeriPerSezionale[key] = numeroProgressivo
          }

          fattureImportate++
        }
      } catch (err) {
        console.error(`Errore nel file ${fPath}:`, err)
      }
    }

    // Allinea sequenze
    for (const [key, maxNum] of Object.entries(maxNumeriPerSezionale)) {
      const [sez, annoStr] = key.split('_')
      const a = parseInt(annoStr, 10)
      await prisma.documentSequence.upsert({
        where: {
          issuerId_sezionale_anno: {
            issuerId: emittenteDb.id,
            sezionale: sez,
            anno: a,
          },
        },
        update: {
          ultimoNumero: { set: maxNum },
        },
        create: {
          issuerId: emittenteDb.id,
          sezionale: sez,
          anno: a,
          ultimoNumero: maxNum,
        },
      })
    }

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      fattureImportate,
      fattureSaltate,
      clientiCreati,
      clientiAggiornati,
      totaleImporto,
    })
  } catch (error: any) {
    console.error('Errore durante importazione:', error)
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 })
  }
}
