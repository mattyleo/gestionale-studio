// src/app/api/archivi/apri-cartella/route.ts
// Apre la cartella fisica dell'archivio cliente nel file manager locale (Nautilus/Explorer)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ARCHIVI_BASE_DIR, getCartellaCliente } from '@/lib/archivi'
import { exec } from 'child_process'
import path from 'path'
import fs from 'fs'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const { companyId } = await request.json()

    let targetDir = ARCHIVI_BASE_DIR
    let nomeCliente = 'Archivio Generale'

    if (companyId) {
      const az = await prisma.company.findUnique({
        where: { id: companyId },
        select: { ragioneSociale: true, codiceFiscale: true, partitaIva: true },
      })
      if (az) {
        nomeCliente = az.ragioneSociale
        const folderName = getCartellaCliente(az.ragioneSociale, az.codiceFiscale, az.partitaIva)
        targetDir = path.join(ARCHIVI_BASE_DIR, folderName)
      }
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Tenta apertura nel file manager locale
    if (process.platform === 'win32') {
      exec(`explorer.exe "${targetDir}"`)
    } else if (process.platform === 'linux') {
      exec(`xdg-open "${targetDir}" >/dev/null 2>&1 &`)
    } else if (process.platform === 'darwin') {
      exec(`open "${targetDir}"`)
    }

    return NextResponse.json({
      successo: true,
      percorso: targetDir,
      messaggio: `Cartella aperta per: ${nomeCliente}`,
    })
  } catch (err: any) {
    console.error('Errore apertura cartella archivio:', err)
    return NextResponse.json({ error: 'Impossibile aprire la cartella' }, { status: 500 })
  }
}
