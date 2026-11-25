// src/app/api/agenti-ia/documenti/route.ts
// Gestione Documenti Normativi e Manuali dello Studio per RAG / Agenti IA

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import path from 'path'
import fs from 'fs'

// Helper per estrazione testo da PDF con fallback
async function estraiTestoDaPdf(buffer: Buffer): Promise<{ testo: string; numPagine: number }> {
  try {
    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse(new Uint8Array(buffer))
    const res = await parser.getText()
    const testo = typeof res === 'string' ? res : (res?.text || '')
    return {
      testo: testo.trim(),
      numPagine: res?.numpages || 1,
    }
  } catch (err: any) {
    console.warn('Avviso estrazione PDF con pdf-parse:', err.message)
    // Fallback pulito: estrazione stream/stringhe
    const raw = buffer.toString('utf8')
    const cleanText = raw.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim()
    return {
      testo: cleanText.length > 100 ? cleanText.slice(0, 50000) : 'Testo non estratto direttamente dal PDF binario.',
      numPagine: 1,
    }
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const categoria = searchParams.get('categoria')
    const cerca = searchParams.get('cerca')?.trim()

    // Se richiesto singolo documento per visualizzazione testo completo
    if (id) {
      const doc = await prisma.studioKnowledgeDocument.findUnique({
        where: { id },
      })
      if (!doc) return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
      return NextResponse.json({ successo: true, documento: doc })
    }

    // Auto-seed: se la tabella è vuota e la guida CGN è presente nella cartella uploads, indicizzala subito
    const totale = await prisma.studioKnowledgeDocument.count()
    if (totale === 0) {
      const cgnPath = path.join(process.cwd(), 'uploads', 'manuali-ia', 'guida-schematica-codici-natura-iva-cgn.pdf')
      if (fs.existsSync(cgnPath)) {
        try {
          const buffer = fs.readFileSync(cgnPath)
          const estrazione = await estraiTestoDaPdf(buffer)
          await prisma.studioKnowledgeDocument.create({
            data: {
              titolo: 'Guida Schematica Codici IVA e Natura SDI (CGN)',
              descrizione: 'Tavola di raccordo codifiche software CGN, Natura IVA AdE N1-N7, Reverse Charge e Scritture NO IVA (Causale 899)',
              categoria: 'IVA & Fatturazione',
              nomeFile: 'guida-schematica-codici-natura-iva-cgn.pdf',
              dimensioneBytes: buffer.length,
              testoEstratto: estrazione.testo,
              pagineConteggio: estrazione.numPagine || 5,
              annoRiferimento: '2025',
              fonte: 'CGN / Agenzia delle Entrate',
              attivo: true,
            },
          })
        } catch (seedErr: any) {
          console.warn('Auto-seed guida CGN saltato:', seedErr.message)
        }
      }
    }

    const where: any = { attivo: true }
    if (categoria && categoria !== 'TUTTI') {
      where.categoria = categoria
    }
    if (cerca) {
      where.OR = [
        { titolo: { contains: cerca, mode: 'insensitive' } },
        { descrizione: { contains: cerca, mode: 'insensitive' } },
        { testoEstratto: { contains: cerca, mode: 'insensitive' } },
      ]
    }

    const documenti = await prisma.studioKnowledgeDocument.findMany({
      where,
      select: {
        id: true,
        titolo: true,
        descrizione: true,
        categoria: true,
        nomeFile: true,
        dimensioneBytes: true,
        pagineConteggio: true,
        annoRiferimento: true,
        fonte: true,
        createdAt: true,
        updatedAt: true,
        testoEstratto: false,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ successo: true, documenti })
  } catch (err: any) {
    console.error('Errore lettura biblioteca normativa:', err)
    return NextResponse.json({ error: 'Errore lettura documenti' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const contentType = request.headers.get('content-type') || ''

    // ── 1. Upload file (FormData) ──
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      const titolo = (formData.get('titolo') as string)?.trim()
      const descrizione = (formData.get('descrizione') as string)?.trim() || null
      const categoria = (formData.get('categoria') as string) || 'IVA & Fatturazione'
      const annoRiferimento = (formData.get('annoRiferimento') as string) || '2025'
      const fonte = (formData.get('fonte') as string) || 'Studio Tuzio'

      if (!file) {
        return NextResponse.json({ error: 'Nessun file selezionato' }, { status: 400 })
      }

      const nomeFile = file.name
      const buffer = Buffer.from(await file.arrayBuffer())
      const dimensioneBytes = buffer.length

      // Salva fisicamente il file nella cartella uploads/manuali-ia
      const uploadsDir = path.join(process.cwd(), 'uploads', 'manuali-ia')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      const safeFileName = `${Date.now()}_${nomeFile.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const targetPath = path.join(uploadsDir, safeFileName)
      fs.writeFileSync(targetPath, buffer)

      // Estrazione del testo dal PDF o file di testo
      let testoEstratto = ''
      let numPagine = 1

      if (nomeFile.toLowerCase().endsWith('.pdf')) {
        const estrazione = await estraiTestoDaPdf(buffer)
        testoEstratto = estrazione.testo
        numPagine = estrazione.numPagine
      } else {
        testoEstratto = buffer.toString('utf8').trim()
      }

      const doc = await prisma.studioKnowledgeDocument.create({
        data: {
          titolo: titolo || nomeFile.replace(/\.[^/.]+$/, ''),
          descrizione: descrizione || `Manuale caricato da ${session.user?.name || 'Dottore'} per l'assistente IA`,
          categoria,
          nomeFile: safeFileName,
          dimensioneBytes,
          testoEstratto: testoEstratto || 'Nessun testo estratto.',
          pagineConteggio: numPagine,
          annoRiferimento,
          fonte,
          attivo: true,
        },
      })

      return NextResponse.json({
        successo: true,
        messaggio: `Manuale "${doc.titolo}" indicizzato con successo nella memoria normativa dell'IA (${doc.pagineConteggio} pagine, ${Math.round(dimensioneBytes / 1024)} KB)!`,
        documento: {
          id: doc.id,
          titolo: doc.titolo,
          categoria: doc.categoria,
          pagineConteggio: doc.pagineConteggio,
          dimensioneBytes: doc.dimensioneBytes,
        },
      })
    }

    // ── 2. Inserimento manuale di testo / note ──
    const body = await request.json()
    const { titolo, descrizione, categoria, testo, annoRiferimento, fonte } = body

    if (!titolo?.trim() || !testo?.trim()) {
      return NextResponse.json({ error: 'Titolo e testo sono obbligatori' }, { status: 400 })
    }

    const doc = await prisma.studioKnowledgeDocument.create({
      data: {
        titolo: titolo.trim(),
        descrizione: descrizione?.trim() || 'Nota normativa inserita manualmente',
        categoria: categoria || 'Normativa Generale',
        nomeFile: 'inserimento_manuale.txt',
        dimensioneBytes: Buffer.byteLength(testo, 'utf8'),
        testoEstratto: testo.trim(),
        pagineConteggio: Math.max(1, Math.ceil(testo.length / 2500)),
        annoRiferimento: annoRiferimento || '2025',
        fonte: fonte || 'Studio Tuzio',
        attivo: true,
      },
    })

    return NextResponse.json({
      successo: true,
      messaggio: `Nota normativa "${doc.titolo}" registrata con successo nella base di conoscenza!`,
      documento: doc,
    })
  } catch (err: any) {
    console.error('Errore salvataggio manuale:', err)
    return NextResponse.json({ error: err.message || 'Errore durante il caricamento del documento' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 })

    await prisma.studioKnowledgeDocument.delete({ where: { id } })
    return NextResponse.json({ successo: true, messaggio: 'Documento eliminato dalla base di conoscenza' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
