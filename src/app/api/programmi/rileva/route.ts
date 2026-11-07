// src/app/api/programmi/rileva/route.ts
// Rilevamento automatico dei software ministeriali installati nel sistema (Linux / Windows)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

interface DetectedProgram {
  id?: string
  nomeKey: string
  percorsoTrovato: string
  tipo: 'eseguibile' | 'script' | 'desktop_entry'
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const isWindows = process.platform === 'win32'
    const homeDir = process.env.HOME || process.env.USERPROFILE || ''
    const trovati: DetectedProgram[] = []

  if (isWindows) {
    // ─── WINDOWS SEARCH PATHS ──────────────────────────────
    const searchMap: Record<string, string[]> = {
      telematico: [
        'C:\\DesktopTelematico\\DesktopTelematico.exe',
        'C:\\Program Files\\DesktopTelematico\\DesktopTelematico.exe',
        'C:\\Program Files (x86)\\DesktopTelematico\\DesktopTelematico.exe',
        path.join(homeDir, 'DesktopTelematico', 'DesktopTelematico.exe'),
      ],
      uniemens: [
        'C:\\INPS\\UniEMens\\uniemens.bat',
        'C:\\Program Files\\INPS\\UniEMens\\uniemens.exe',
        'C:\\UniEMens\\uniemens.bat',
        path.join(homeDir, 'UniEMens', 'uniemens.bat'),
      ],
      redditi: [
        'C:\\RedditiOnline\\redditi.exe',
        'C:\\Program Files\\RedditiOnline\\redditi.exe',
      ],
      lipe: [
        'C:\\LIPE\\lipe.exe',
        'C:\\Program Files\\LIPE\\lipe.exe',
      ],
      cu: [
        'C:\\CU\\cu.exe',
        'C:\\Program Files\\CU\\cu.exe',
      ],
      f24: [
        'C:\\F24Online\\f24.exe',
        'C:\\Program Files\\F24Online\\f24.exe',
      ],
    }

    for (const [key, paths] of Object.entries(searchMap)) {
      for (const p of paths) {
        if (fs.existsSync(p)) {
          trovati.push({ nomeKey: key, percorsoTrovato: p, tipo: 'eseguibile' })
          break
        }
      }
    }
  } else {
    // ─── LINUX (UBUNTU) SEARCH PATHS ───────────────────────
    const searchMap: Record<string, string[]> = {
      telematico: [
        path.join(homeDir, 'DesktopTelematico', 'DesktopTelematico'),
        path.join(homeDir, 'DesktopTelematico', 'DesktopTelematico.sh'),
        '/opt/DesktopTelematico/DesktopTelematico',
        '/opt/DesktopTelematico/DesktopTelematico.sh',
        '/usr/local/bin/desktoptelematico',
        '/usr/bin/desktoptelematico',
        path.join(homeDir, '.local', 'share', 'applications', 'DesktopTelematico.desktop'),
        path.join(homeDir, 'Scrivania', 'DesktopTelematico.desktop'),
        path.join(homeDir, 'Desktop', 'DesktopTelematico.desktop'),
      ],
      uniemens: [
        path.join(homeDir, 'uniemens', 'uniemens'),
        path.join(homeDir, 'uniemens', 'uniemens.sh'),
        '/opt/uniemens/uniemens',
        '/opt/uniemens/uniemens.sh',
        '/usr/local/bin/uniemens',
        path.join(homeDir, '.local', 'share', 'applications', 'uniemens.desktop'),
      ],
      redditi: [
        path.join(homeDir, 'redditi', 'redditionline'),
        path.join(homeDir, 'redditi', 'redditi.sh'),
        '/opt/redditi/redditi',
      ],
      lipe: [
        path.join(homeDir, 'lipe', 'lipe'),
        path.join(homeDir, 'lipe', 'lipe.sh'),
        '/opt/lipe/lipe',
      ],
      cu: [
        path.join(homeDir, 'cu', 'cu'),
        path.join(homeDir, 'cu', 'cu.sh'),
        '/opt/cu/cu',
      ],
      f24: [
        path.join(homeDir, 'f24online', 'f24online'),
        path.join(homeDir, 'f24online', 'f24.sh'),
        '/opt/f24online/f24online',
      ],
    }

    for (const [key, paths] of Object.entries(searchMap)) {
      for (const p of paths) {
        if (fs.existsSync(p)) {
          let tipo: 'eseguibile' | 'script' | 'desktop_entry' = 'eseguibile'
          let execCmd = p
          if (p.endsWith('.desktop')) {
            tipo = 'desktop_entry'
            // Estrai riga Exec da file .desktop
            try {
              const content = fs.readFileSync(p, 'utf8')
              const execMatch = content.match(/^Exec=(.+)$/m)
              if (execMatch) {
                execCmd = execMatch[1].trim()
              }
            } catch {}
          } else if (p.endsWith('.sh') || p.endsWith('.bat')) {
            tipo = 'script'
          }
          trovati.push({ nomeKey: key, percorsoTrovato: execCmd, tipo })
          break
        }
      }
    }
  }

    // Aggiorna automaticamente i percorsi nella tabella database StudioProgram se presente
    let aggiornati = 0
    try {
      const programmiDb = await prisma.studioProgram.findMany()

      for (const t of trovati) {
        const match = programmiDb.find((p) => {
          const n = p.nome.toLowerCase()
          if (t.nomeKey === 'telematico') return n.includes('telematico') || n.includes('entratel')
          if (t.nomeKey === 'uniemens') return n.includes('uniemens') || n.includes('inps')
          if (t.nomeKey === 'redditi') return n.includes('redditi')
          if (t.nomeKey === 'lipe') return n.includes('lipe')
          if (t.nomeKey === 'cu') return n.includes('certificazione unica') || n.includes('cu')
          if (t.nomeKey === 'f24') return n.includes('f24')
          return false
        })

        if (match) {
          const dataUpdate = isWindows
            ? { comandoWindows: t.percorsoTrovato }
            : { comandoLinux: t.percorsoTrovato }

          await prisma.studioProgram.update({
            where: { id: match.id },
            data: dataUpdate,
          })
          aggiornati++
        }
      }
    } catch (dbErr: any) {
      console.warn('Aggiornamento database rilevamento saltato (tabella non pronta):', dbErr.message)
    }

    return NextResponse.json({
      successo: true,
      trovati,
      aggiornati,
      messaggio: trovati.length > 0
        ? `Rilevati ${trovati.length} programmi installati sul computer e configurati con successo!`
        : 'Nessun programma rilevato nei percorsi standard. È possibile impostare il percorso manualmente dal tasto Configura.',
    })
  } catch (err: any) {
    console.error('Errore rilevamento programmi:', err)
    return NextResponse.json({
      successo: false,
      error: err.message || 'Errore durante il rilevamento dei programmi',
    }, { status: 500 })
  }
}
