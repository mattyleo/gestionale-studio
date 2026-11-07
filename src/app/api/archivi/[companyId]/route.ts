// src/app/api/archivi/[companyId]/route.ts
// Documenti di una specifica azienda: elenco e caricamento con codice univoco

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  CATEGORIE_ARCHIVIO,
  ARCHIVI_BASE_DIR,
  getCartellaCliente,
  generaCodiceUnivocoDoc,
  assicuraCartellaArchivio,
} from '@/lib/archivi'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'

export async function GET(
  request: Request,
  { params: _params }: { params: Promise<{ companyId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const categoria = searchParams.get('categoria') || ''
    const q = searchParams.get('q')?.trim() || ''

    const azienda = await prisma.company.findUnique({
      where: { id: params.companyId },
      select: {
        id: true,
        ragioneSociale: true,
        codiceFiscale: true,
        partitaIva: true,
        tipoSoggetto: true,
      },
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const whereCondition: any = { companyId: params.companyId }
    if (categoria && categoria !== 'tutte') {
      whereCondition.cartella = categoria
    }
    if (q) {
      whereCondition.OR = [
        { nomeFile: { contains: q, mode: 'insensitive' } },
        { codiceUnivoco: { contains: q, mode: 'insensitive' } },
        { note: { contains: q, mode: 'insensitive' } },
      ]
    }

    const documenti = await prisma.companyDocument.findMany({
      where: whereCondition,
      include: {
        uploadedByUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const cartellaFisica = getCartellaCliente(azienda.ragioneSociale, azienda.codiceFiscale, azienda.partitaIva)

    return NextResponse.json({
      successo: true,
      azienda,
      cartellaFisica,
      documenti,
      categorie: CATEGORIE_ARCHIVIO,
    })
  } catch (err: any) {
    console.error('Errore GET /api/archivi/[companyId]:', err)
    return NextResponse.json({ error: 'Errore recupero documenti' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ companyId: string }> }
) {
  const params = await _params
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const azienda = await prisma.company.findUnique({
      where: { id: params.companyId },
    })
    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoria = (formData.get('categoria') as string) || 'altro'
    const note = (formData.get('note') as string) || ''
    const annoCompetenzaStr = formData.get('annoCompetenza') as string | null
    const scadenzaStr = formData.get('scadenza') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nessun file selezionato' }, { status: 400 })
    }

    // Limite dimensione: 50 MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Dimensione file superiore al limite di 50 MB' }, { status: 400 })
    }

    const cartellaCliente = getCartellaCliente(azienda.ragioneSociale, azienda.codiceFiscale, azienda.partitaIva)
    const cartellaFisicaTarget = await assicuraCartellaArchivio(cartellaCliente, categoria)

    // Genera codice alfanumerico univoco
    const codiceUnivoco = generaCodiceUnivocoDoc(azienda.ragioneSociale)

    // Nome file fisico: {CODICE_UNIVOCO}_{NOME_ORIGINALE}
    const ext = path.extname(file.name)
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const nomeStorage = `${codiceUnivoco}_${baseName}${ext}`
    const percorsoAssoluto = path.join(cartellaFisicaTarget, nomeStorage)
    const percorsoRelativo = path.relative(ARCHIVI_BASE_DIR, percorsoAssoluto).replace(/\\/g, '/')

    // Scrivi su disco
    const buffer = Buffer.from(await file.arrayBuffer())
    await fsPromises.writeFile(percorsoAssoluto, buffer)

    // Salva nel database
    const nuovoDoc = await prisma.companyDocument.create({
      data: {
        companyId: azienda.id,
        uploadedBy: (session.user as any).id,
        codiceUnivoco,
        cartella: categoria,
        tipoDoc: categoria,
        nomeFile: file.name,
        nomeStorage,
        percorsoRelativo,
        mimeType: file.type || 'application/octet-stream',
        dimensione: file.size,
        note: note.trim() || null,
        annoCompetenza: annoCompetenzaStr ? parseInt(annoCompetenzaStr, 10) : null,
        scadenza: scadenzaStr ? new Date(scadenzaStr) : null,
      },
    })

    return NextResponse.json({
      successo: true,
      documento: nuovoDoc,
      messaggio: `Documento archiviato con successo con codice ${codiceUnivoco}`,
    })
  } catch (err: any) {
    console.error('Errore POST /api/archivi/[companyId]:', err)
    return NextResponse.json({ error: err.message || 'Errore durante il salvataggio del file' }, { status: 500 })
  }
}
