// src/app/api/programmi/route.ts
// Gestione dei programmi e software ministeriali/esterni dello studio

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_PROGRAMMI = [
  {
    nome: 'Desktop Telematico (Entratel / FileInternet)',
    descrizione: 'Software ufficiale Agenzia delle Entrate per invio telematico dichiarazioni fiscali, F24 e atti',
    categoria: 'Fiscale',
    icona: 'Monitor',
    comandoLinux: 'desktoptelematico',
    comandoWindows: 'C:\\DesktopTelematico\\DesktopTelematico.exe',
    webUrl: 'https://telematici.agenziaentrate.gov.it/',
    ordinamento: 1,
  },
  {
    nome: 'INPS Controlli UniEMens',
    descrizione: 'Software INPS di controllo, validazione formale e squadratura dei flussi mensili UniEMens',
    categoria: 'Previdenziale',
    icona: 'Users',
    comandoLinux: 'uniemens',
    comandoWindows: 'C:\\INPS\\UniEMens\\uniemens.bat',
    webUrl: 'https://www.inps.it/it/it/servizi-e-ricerca/servizi-per/aziende-e-consulenti.html',
    ordinamento: 2,
  },
  {
    nome: 'Dichiarazioni dei Redditi (Redditi PF / SP / SC / 730)',
    descrizione: 'Pacchetto ministeriale per la compilazione e il calcolo delle dichiarazioni dei redditi annuali',
    categoria: 'Fiscale',
    icona: 'FileSpreadsheet',
    comandoLinux: 'redditionline',
    comandoWindows: 'C:\\RedditiOnline\\redditi.exe',
    webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazioni-e-comunicazioni',
    ordinamento: 3,
  },
  {
    nome: 'Comunicazioni LIPE (Liquidazioni IVA)',
    descrizione: 'Modulo per la preparazione e il controllo delle comunicazioni liquidazioni periodiche IVA trimestrali',
    categoria: 'Fiscale',
    icona: 'Receipt',
    comandoLinux: 'lipe',
    comandoWindows: 'C:\\LIPE\\lipe.exe',
    webUrl: 'https://ivaservizi.agenziaentrate.gov.it/portale/',
    ordinamento: 4,
  },
  {
    nome: 'Certificazione Unica (CU)',
    descrizione: 'Software ministeriale per la compilazione e trasmissione delle Certificazioni Uniche lavoratori e autonomi',
    categoria: 'Fiscale',
    icona: 'Award',
    comandoLinux: 'cu',
    comandoWindows: 'C:\\CU\\cu.exe',
    webUrl: 'https://www.agenziaentrate.gov.it/portale/certificazione-unica',
    ordinamento: 5,
  },
  {
    nome: 'Compilazione Modelli F24',
    descrizione: 'Software F24 Online per deleghe di pagamento unificato tributi e contributi con F24 telematico',
    categoria: 'Fiscale',
    icona: 'CreditCard',
    comandoLinux: 'f24online',
    comandoWindows: 'C:\\F24Online\\f24.exe',
    webUrl: 'https://telematici.agenziaentrate.gov.it/',
    ordinamento: 6,
  },
  {
    nome: 'Sister - Territorio & Catasto',
    descrizione: 'Portale Agenzia delle Entrate per visure catastali, ipotecarie, mappe e planimetrie terreni e fabbricati',
    categoria: 'Catasto',
    icona: 'Landmark',
    webUrl: 'https://sister.agenziaentrate.gov.it/',
    ordinamento: 7,
  },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    let programmi = await prisma.studioProgram.findMany({
      orderBy: { ordinamento: 'asc' },
    })

    // Se la tabella è ancora vuota, inserisci automaticamente i software predefiniti
    if (programmi.length === 0) {
      for (const p of DEFAULT_PROGRAMMI) {
        await prisma.studioProgram.create({ data: p })
      }
      programmi = await prisma.studioProgram.findMany({
        orderBy: { ordinamento: 'asc' },
      })
    }

    return NextResponse.json({
      successo: true,
      programmi,
      sistemaOperativo: process.platform === 'win32' ? 'windows' : 'linux',
    })
  } catch (err: any) {
    console.error('Errore GET /api/programmi:', err)
    return NextResponse.json({ error: 'Errore durante il recupero dei programmi' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, nome, descrizione, categoria, icona, comandoLinux, comandoWindows, webUrl, ordinamento, attivo } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Il nome del programma è obbligatorio' }, { status: 400 })
    }

    let prog
    if (id) {
      prog = await prisma.studioProgram.update({
        where: { id },
        data: {
          nome: nome.trim(),
          descrizione: descrizione?.trim() || null,
          categoria: categoria || 'Fiscale',
          icona: icona || 'Monitor',
          comandoLinux: comandoLinux?.trim() || null,
          comandoWindows: comandoWindows?.trim() || null,
          webUrl: webUrl?.trim() || null,
          ordinamento: ordinamento !== undefined ? Number(ordinamento) : 0,
          attivo: attivo !== undefined ? Boolean(attivo) : true,
        },
      })
    } else {
      prog = await prisma.studioProgram.create({
        data: {
          nome: nome.trim(),
          descrizione: descrizione?.trim() || null,
          categoria: categoria || 'Fiscale',
          icona: icona || 'Monitor',
          comandoLinux: comandoLinux?.trim() || null,
          comandoWindows: comandoWindows?.trim() || null,
          webUrl: webUrl?.trim() || null,
          ordinamento: ordinamento !== undefined ? Number(ordinamento) : 0,
          attivo: attivo !== undefined ? Boolean(attivo) : true,
        },
      })
    }

    return NextResponse.json({ successo: true, programma: prog })
  } catch (err: any) {
    console.error('Errore POST /api/programmi:', err)
    return NextResponse.json({ error: 'Errore salvataggio programma' }, { status: 500 })
  }
}
