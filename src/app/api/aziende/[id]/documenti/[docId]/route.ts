// src/app/api/aziende/[id]/documenti/[docId]/route.ts
// Scarica o elimina un singolo documento

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'aziende')

// GET — scarica il file
export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const doc = await prisma.companyDocument.findUnique({
    where: { id: params.docId, companyId: params.id },
  })

  if (!doc) return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })

  const percorso = join(UPLOAD_DIR, params.id, doc.nomeStorage)
  if (!existsSync(percorso)) {
    return NextResponse.json({ error: 'File non trovato su disco' }, { status: 404 })
  }

  const buffer = await readFile(percorso)
  const inline = request.url.includes('?inline=1')

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(doc.nomeFile)}"`,
      'Content-Length': String(doc.dimensione),
      'Cache-Control': 'private, max-age=3600',
    },
  })
}

// DELETE — elimina documento (solo admin)
export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ id: string; docId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const doc = await prisma.companyDocument.findUnique({
    where: { id: params.docId, companyId: params.id },
  })

  if (!doc) return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })

  // Elimina dal DB
  await prisma.companyDocument.delete({ where: { id: params.docId } })

  // Elimina file da disco
  const percorso = join(UPLOAD_DIR, params.id, doc.nomeStorage)
  if (existsSync(percorso)) {
    await unlink(percorso)
  }

  // Audit log
  await prisma.auditEvent.create({
    data: {
      userId: (session.user as any).id,
      entityType: 'CompanyDocument',
      entityId: params.docId,
      azione: 'DOCUMENTO_ELIMINATO',
      dettagli: { nomeFile: doc.nomeFile, tipoDoc: doc.tipoDoc },
    },
  })

  return NextResponse.json({ messaggio: 'Documento eliminato' })
}
