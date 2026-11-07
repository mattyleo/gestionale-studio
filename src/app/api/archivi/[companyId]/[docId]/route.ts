// src/app/api/archivi/[companyId]/[docId]/route.ts
// Download, anteprima ed eliminazione di un singolo documento archiviato

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ARCHIVI_BASE_DIR } from '@/lib/archivi'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ companyId: string; docId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const doc = await prisma.companyDocument.findUnique({
      where: { id: params.docId },
      include: { company: true },
    })

    if (!doc || doc.companyId !== params.companyId) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Risolvi percorso fisico
    let filePath = ''
    if (doc.percorsoRelativo) {
      filePath = path.join(ARCHIVI_BASE_DIR, doc.percorsoRelativo)
    }
    
    // Fallback: cerca nella vecchia cartella uploads/aziende/[companyId]/[nomeStorage]
    if (!filePath || !fs.existsSync(filePath)) {
      const fallbackOld = path.join(process.cwd(), 'uploads', 'aziende', params.companyId, doc.nomeStorage)
      if (fs.existsSync(fallbackOld)) {
        filePath = fallbackOld
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File fisico non presente sul server' }, { status: 404 })
    }

    const fileBuffer = await fsPromises.readFile(filePath)
    const { searchParams } = new URL(request.url)
    const download = searchParams.get('download') === '1'

    const disposition = download ? 'attachment' : 'inline'

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(doc.nomeFile)}"`,
        'Content-Length': String(fileBuffer.length),
      },
    })
  } catch (err: any) {
    console.error('Errore GET /api/archivi/[companyId]/[docId]:', err)
    return NextResponse.json({ error: 'Errore durante la lettura del file' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params: _params }: { params: Promise<{ companyId: string; docId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const doc = await prisma.companyDocument.findUnique({
      where: { id: params.docId },
    })

    if (!doc || doc.companyId !== params.companyId) {
      return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })
    }

    // Rimuovi file da disco se presente
    let filePath = ''
    if (doc.percorsoRelativo) {
      filePath = path.join(ARCHIVI_BASE_DIR, doc.percorsoRelativo)
    }
    if (!filePath || !fs.existsSync(filePath)) {
      const fallbackOld = path.join(process.cwd(), 'uploads', 'aziende', params.companyId, doc.nomeStorage)
      if (fs.existsSync(fallbackOld)) {
        filePath = fallbackOld
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      try {
        await fsPromises.unlink(filePath)
      } catch (e) {
        console.warn('Avviso: impossibile eliminare file fisico:', e)
      }
    }

    // Elimina record DB
    await prisma.companyDocument.delete({
      where: { id: params.docId },
    })

    return NextResponse.json({ successo: true, messaggio: 'Documento eliminato con successo' })
  } catch (err: any) {
    console.error('Errore DELETE /api/archivi/[companyId]/[docId]:', err)
    return NextResponse.json({ error: 'Errore durante l\'eliminazione del documento' }, { status: 500 })
  }
}
