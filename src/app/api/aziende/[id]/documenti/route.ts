// src/app/api/aziende/[id]/documenti/route.ts
// Upload e lista documenti azienda (carte d'identità, PDF, ecc.)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'aziende')
const MAX_SIZE_MB = 10
const TIPI_AMMESSI = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
]

// GET — lista documenti dell'azienda
export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const docs = await prisma.companyDocument.findMany({
    where: { companyId: params.id },
    include: { uploadedByUser: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ documenti: docs })
}

// POST — carica un nuovo documento
export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  // Verifica che l'azienda esista
  const azienda = await prisma.company.findUnique({ where: { id: params.id } })
  if (!azienda) return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const tipoDoc = (formData.get('tipoDoc') as string) || 'altro'
    const note = (formData.get('note') as string) || ''
    const scadenza = formData.get('scadenza') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nessun file ricevuto' }, { status: 400 })
    }

    // Validazione tipo
    if (!TIPI_AMMESSI.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo file non consentito. Ammessi: JPG, PNG, WEBP, PDF` },
        { status: 400 }
      )
    }

    // Validazione dimensione (max 10 MB)
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `File troppo grande. Massimo ${MAX_SIZE_MB} MB` },
        { status: 400 }
      )
    }

    // Crea cartella azienda se non esiste
    const aziendaDir = join(UPLOAD_DIR, params.id)
    if (!existsSync(aziendaDir)) {
      await mkdir(aziendaDir, { recursive: true })
    }

    // Genera nome storage univoco: {timestamp}_{cuid}.{ext}
    const ext = extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const nomeStorage = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}${ext}`
    const percorsoFile = join(aziendaDir, nomeStorage)

    // Scrivi file su disco
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(percorsoFile, buffer)

    // Salva metadati nel DB
    const doc = await prisma.companyDocument.create({
      data: {
        companyId: params.id,
        uploadedBy: (session.user as any).id,
        nomeFile: file.name,
        nomeStorage,
        tipoDoc,
        mimeType: file.type,
        dimensione: file.size,
        note: note || null,
        scadenza: scadenza ? new Date(scadenza) : null,
      },
      include: { uploadedByUser: { select: { name: true } } },
    })

    // Audit log
    await prisma.auditEvent.create({
      data: {
        userId: (session.user as any).id,
        entityType: 'CompanyDocument',
        entityId: doc.id,
        azione: 'DOCUMENTO_CARICATO',
        dettagli: {
          azienda: azienda.ragioneSociale,
          nomeFile: file.name,
          tipoDoc,
          dimensione: file.size,
        },
      },
    })

    return NextResponse.json({ documento: doc, messaggio: 'Documento caricato con successo' })
  } catch (error) {
    console.error('Errore upload documento:', error)
    return NextResponse.json({ error: 'Errore durante il caricamento del file' }, { status: 500 })
  }
}
