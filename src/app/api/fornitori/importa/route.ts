// src/app/api/fornitori/importa/route.ts
// Importazione massiva fatture di acquisto (passive) e censimento automatico dei fornitori da file ZIP o XML/P7M di Aruba

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { XMLParser } from 'fast-xml-parser'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { Decimal } from 'decimal.js'

function cleanStr(val: any): string {
  if (!val) return ''
  return String(val).trim()
}

function parseNum(val: any, fallback = 0): number {
  if (val == null) return fallback
  const s = String(val).replace(',', '.')
  const n = parseFloat(s)
  return isNaN(n) ? fallback : n
}

function toArray(val: any): any[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function extractXmlContent(buffer: Buffer): string {
  if (buffer.length > 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    buffer = buffer.subarray(3)
  }
  const text = buffer.toString('utf-8')
  if (text.includes('<?xml') || text.includes('<FatturaElettronica')) {
    const idx = text.indexOf('<?xml') !== -1 ? text.indexOf('<?xml') : text.indexOf('<FatturaElettronica')
    const endIdx = text.lastIndexOf('</p:FatturaElettronica>') !== -1
      ? text.lastIndexOf('</p:FatturaElettronica>') + 23
      : text.lastIndexOf('</FatturaElettronica>') !== -1
      ? text.lastIndexOf('</FatturaElettronica>') + 21
      : text.length
    return text.substring(idx, endIdx)
  }
  return text
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
      if (lower.endsWith('.xml') || lower.endsWith('.p7m')) {
        results.push(full)
      }
    }
  }
  return results
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fattura-studio-acquisti-'))

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempFilePath = path.join(tempDir, file.name)
    fs.writeFileSync(tempFilePath, buffer)

    let workDir = tempDir
    const isZip = file.name.toLowerCase().endsWith('.zip')

    if (isZip) {
      const extractDir = path.join(tempDir, 'extracted')
      fs.mkdirSync(extractDir, { recursive: true })

      if (process.platform === 'win32') {
        const escapedZip = tempFilePath.replace(/'/g, "''")
        const escapedDest = extractDir.replace(/'/g, "''")
        execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDest}' -Force"`, {
          timeout: 60000,
        })
      } else {
        try {
          execSync(`unzip -o -q "${tempFilePath}" -d "${extractDir}"`, { timeout: 60000 })
        } catch {
          execSync(`python3 -c "import zipfile; zipfile.ZipFile('${tempFilePath}').extractall('${extractDir}')"`, { timeout: 60000 })
        }
      }
      workDir = extractDir
    }

    const files = findXmlFiles(workDir)
    if (files.length === 0) {
      fs.rmSync(tempDir, { recursive: true, force: true })
      return NextResponse.json({ error: 'Nessun file XML o P7M trovato nel pacchetto' }, { status: 400 })
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
    })

    let fornitoriCreati = 0
    let fornitoriAggiornati = 0
    let fattureImportate = 0
    let fattureSaltate = 0
    let totaleImporto = 0

    for (let i = 0; i < files.length; i++) {
      const fPath = files[i]
      try {
        const rawBuf = fs.readFileSync(fPath)
        const xmlStr = extractXmlContent(rawBuf)
        const parsed = parser.parse(xmlStr)

        const root = parsed.FatturaElettronica
        if (!root) continue

        const header = root.FatturaElettronicaHeader
        const cedente = header?.CedentePrestatore
        if (!cedente) continue

        const anag = cedente.DatiAnagrafici?.Anagrafica
        let ragioneSociale = cleanStr(anag?.Denominazione)
        if (!ragioneSociale) {
          const nome = cleanStr(anag?.Nome) || ''
          const cognome = cleanStr(anag?.Cognome) || ''
          ragioneSociale = `${nome} ${cognome}`.trim()
        }
        if (!ragioneSociale) {
          ragioneSociale = `Fornitore ${path.basename(fPath)}`
        }

        const pIva = cleanStr(cedente.DatiAnagrafici?.IdFiscaleIVA?.IdCodice)?.replace(/\s/g, '') || null
        const cf = cleanStr(cedente.DatiAnagrafici?.CodiceFiscale)?.replace(/\s/g, '').toUpperCase() || null
        const sede = cedente.Sede || {}
        const indirizzo = cleanStr(sede.Indirizzo)
        const cap = cleanStr(sede.CAP)
        const comune = cleanStr(sede.Comune)
        const prov = cleanStr(sede.Provincia)
        const nazione = cleanStr(sede.Nazione) || 'IT'
        const pec = cleanStr(header?.DatiTrasmissione?.PECDestinatario) || cleanStr(cedente.Contatti?.Email)

        let tipoSoggetto: 'PERSONA_GIURIDICA' | 'PERSONA_FISICA' = 'PERSONA_GIURIDICA'
        if (cf && !pIva) {
          tipoSoggetto = 'PERSONA_FISICA'
        }

        // Cerca fornitore esistente
        let supplier = await prisma.supplier.findFirst({
          where: {
            OR: [
              ...(pIva ? [{ partitaIva: pIva }] : []),
              ...(cf ? [{ codiceFiscale: cf }] : []),
              { ragioneSociale: { equals: ragioneSociale, mode: 'insensitive' as const } },
            ],
          },
        })

        if (!supplier) {
          supplier = await prisma.supplier.create({
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
              pec,
              categoria: 'Generale',
            },
          })
          fornitoriCreati++
        } else {
          await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
              partitaIva: supplier.partitaIva || pIva,
              codiceFiscale: supplier.codiceFiscale || cf,
              indirizzo: supplier.indirizzo || indirizzo,
              cap: supplier.cap || cap,
              comune: supplier.comune || comune,
              provincia: supplier.provincia || prov,
              pec: supplier.pec || pec,
            },
          })
          fornitoriAggiornati++
        }

        // Elabora Corpo Fattura
        const bodies = toArray(root.FatturaElettronicaBody)
        for (const body of bodies) {
          const datiGen = body.DatiGenerali?.DatiGeneraliDocumento
          if (!datiGen) continue

          const numeroRaw = cleanStr(datiGen.Numero) || `DOC-${Date.now()}`
          const dataDoc = datiGen.Data ? new Date(datiGen.Data) : new Date()
          const tipoDoc = cleanStr(datiGen.TipoDocumento) || 'TD01'
          let totaleFinale = parseNum(datiGen.ImportoTotaleDocumento, 0)

          // Riepilogo IVA e Imponibile
          const riepiloghi = toArray(body.DatiBeniServizi?.DatiRiepilogo)
          let totaleImponibile = 0
          let totaleIva = 0

          for (const r of riepiloghi) {
            totaleImponibile += parseNum(r.ImponibileImporto, 0)
            totaleIva += parseNum(r.Imposta, 0)
          }

          if (totaleFinale === 0) {
            totaleFinale = totaleImponibile + totaleIva
          }

          // Verifica se la fattura d'acquisto esiste già
          const esisteFattura = await prisma.purchaseInvoice.findFirst({
            where: {
              supplierId: supplier.id,
              numero: numeroRaw,
              dataDocumento: dataDoc,
            },
          })

          if (esisteFattura) {
            fattureSaltate++
            continue
          }

          await prisma.purchaseInvoice.create({
            data: {
              supplierId: supplier.id,
              numero: numeroRaw,
              dataDocumento: dataDoc,
              tipoDocumento: tipoDoc,
              imponibile: new Decimal(totaleImponibile),
              totaleIva: new Decimal(totaleIva),
              totaleDocumento: new Decimal(totaleFinale),
              nomeFileXml: path.basename(fPath),
              saldata: false,
            },
          })

          fattureImportate++
          totaleImporto += totaleFinale
        }
      } catch (errFile) {
        console.error(`Errore nel file ${fPath}:`, errFile)
      }
    }

    fs.rmSync(tempDir, { recursive: true, force: true })

    return NextResponse.json({
      successo: true,
      fornitoriCreati,
      fornitoriAggiornati,
      fattureImportate,
      fattureSaltate,
      totaleImporto,
      fileElaborati: files.length,
      messaggio: `Importazione completata con successo! ${fornitoriCreati} nuovi fornitori censiti, ${fattureImportate} fatture di acquisto registrate (Totale: € ${totaleImporto.toFixed(2)}).`,
    })
  } catch (err: any) {
    fs.rmSync(tempDir, { recursive: true, force: true })
    console.error('Errore importazione acquisti:', err)
    return NextResponse.json({ error: err.message || 'Errore interno durante l\'importazione' }, { status: 500 })
  }
}
