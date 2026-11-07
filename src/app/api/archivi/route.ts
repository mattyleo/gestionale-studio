// src/app/api/archivi/route.ts
// Panoramica e statistiche Archivio Documentale di tutti i clienti

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CATEGORIE_ARCHIVIO, ARCHIVI_BASE_DIR, getCartellaCliente } from '@/lib/archivi'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim() || ''

    // Assicura che la cartella base esista
    if (!fs.existsSync(ARCHIVI_BASE_DIR)) {
      fs.mkdirSync(ARCHIVI_BASE_DIR, { recursive: true })
    }

    // Carica tutte le aziende attive con il conteggio dei documenti
    const whereCondition: any = { attivo: true }
    if (query) {
      whereCondition.OR = [
        { ragioneSociale: { contains: query, mode: 'insensitive' } },
        { codiceFiscale: { contains: query, mode: 'insensitive' } },
        { partitaIva: { contains: query, mode: 'insensitive' } },
      ]
    }

    const aziende = await prisma.company.findMany({
      where: whereCondition,
      select: {
        id: true,
        ragioneSociale: true,
        codiceFiscale: true,
        partitaIva: true,
        tipoSoggetto: true,
        comune: true,
        documents: {
          select: {
            id: true,
            cartella: true,
            dimensione: true,
            createdAt: true,
          },
        },
      },
      orderBy: { ragioneSociale: 'asc' },
    })

    // Statistiche complessive
    const totaleDocumenti = aziende.reduce((acc, a) => acc + a.documents.length, 0)
    const totaleBytes = aziende.reduce(
      (acc, a) => acc + a.documents.reduce((dAcc, d) => dAcc + d.dimensione, 0),
      0
    )

    const listaAziende = aziende.map((az) => {
      const cartellaFisica = getCartellaCliente(az.ragioneSociale, az.codiceFiscale, az.partitaIva)
      const percorsoFisico = path.join(ARCHIVI_BASE_DIR, cartellaFisica)
      const esisteSuDisco = fs.existsSync(percorsoFisico)

      const breakdownCategorie: Record<string, number> = {}
      CATEGORIE_ARCHIVIO.forEach(c => { breakdownCategorie[c.id] = 0 })

      az.documents.forEach((d) => {
        const cat = d.cartella || 'altro'
        breakdownCategorie[cat] = (breakdownCategorie[cat] || 0) + 1
      })

      // Data ultimo caricamento
      const lastDoc = az.documents.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]

      return {
        id: az.id,
        ragioneSociale: az.ragioneSociale,
        codiceFiscale: az.codiceFiscale,
        partitaIva: az.partitaIva,
        tipoSoggetto: az.tipoSoggetto,
        comune: az.comune,
        cartellaFisica,
        esisteSuDisco,
        totaleDocumenti: az.documents.length,
        totaleBytes: az.documents.reduce((acc, d) => acc + d.dimensione, 0),
        ultimoCaricamento: lastDoc ? lastDoc.createdAt : null,
        categorie: breakdownCategorie,
      }
    })

    return NextResponse.json({
      successo: true,
      categorie: CATEGORIE_ARCHIVIO,
      totaleAziende: aziende.length,
      totaleDocumenti,
      totaleBytes,
      aziende: listaAziende,
    })
  } catch (err: any) {
    console.error('Errore GET /api/archivi:', err)
    return NextResponse.json({ error: 'Errore durante il recupero degli archivi' }, { status: 500 })
  }
}
