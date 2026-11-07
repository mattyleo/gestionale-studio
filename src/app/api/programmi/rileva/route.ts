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
        path.join(homeDir, 'Scaricati', 'DesktopTelematico-linux64_140', 'DesktopTelematico'),
        path.join(homeDir, 'Scaricati', 'DesktopTelematico-linux64_140 (2)', 'DesktopTelematico'),
        path.join(homeDir, 'Scaricati', 'google-chrome-stable_current_amd64', 'DesktopTelematico'),
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
        '/opt/INPS - Controlli Uniemens/inps-controlli-uniemens',
        path.join(homeDir, 'Scaricati', 'Auto_4.2.0_Linux-x64', 'inps-controlli-uniemens-auto'),
        path.join(homeDir, 'Scaricati', 'Auto_4.2.0_Linux-x64', 'inps-controlli-uniemens_linux_flat.sh'),
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

    // ─── SCANSIONE DINAMICA LAUNCHER .desktop SU LINUX ──────────────
    const desktopDirs = [
      path.join(homeDir, '.local', 'share', 'applications'),
      '/usr/share/applications',
      '/usr/local/share/applications',
      path.join(homeDir, 'Scrivania'),
      path.join(homeDir, 'Desktop'),
    ]

    for (const dDir of desktopDirs) {
      if (fs.existsSync(dDir)) {
        try {
          const files = fs.readdirSync(dDir).filter(f => f.endsWith('.desktop'))
          for (const f of files) {
            const fullP = path.join(dDir, f)
            try {
              const content = fs.readFileSync(fullP, 'utf8')
              const execMatch = content.match(/^Exec=(.+)$/m)
              const nameMatch = content.match(/^Name=(.+)$/m)
              const textToMatch = `${f} ${nameMatch?.[1] || ''} ${execMatch?.[1] || ''}`.toLowerCase()
              const execCmd = execMatch ? execMatch[1].trim() : fullP

              if ((textToMatch.includes('telematico') || textToMatch.includes('entratel')) && !trovati.some(t => t.nomeKey === 'telematico')) {
                trovati.push({ nomeKey: 'telematico', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
              if ((textToMatch.includes('uniemens') || textToMatch.includes('inps')) && !trovati.some(t => t.nomeKey === 'uniemens')) {
                trovati.push({ nomeKey: 'uniemens', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
              if (textToMatch.includes('redditi') && !trovati.some(t => t.nomeKey === 'redditi')) {
                trovati.push({ nomeKey: 'redditi', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
              if (textToMatch.includes('lipe') && !trovati.some(t => t.nomeKey === 'lipe')) {
                trovati.push({ nomeKey: 'lipe', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
              if ((textToMatch.includes('cu') || textToMatch.includes('certificazione unica')) && !trovati.some(t => t.nomeKey === 'cu')) {
                trovati.push({ nomeKey: 'cu', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
              if (textToMatch.includes('f24') && !trovati.some(t => t.nomeKey === 'f24')) {
                trovati.push({ nomeKey: 'f24', percorsoTrovato: execCmd, tipo: 'desktop_entry' })
              }
            } catch {}
          }
        } catch {}
      }
    }

    // ─── SCANSIONE ATTIVA FILESYSTEM (find) SE ANCORA NON TROVATI ──
    const chiaviMancanti = ['telematico', 'uniemens', 'redditi', 'lipe', 'cu', 'f24'].filter(
      k => !trovati.some(t => t.nomeKey === k)
    )

    if (chiaviMancanti.length > 0) {
      try {
        const findOut = execSync(
          `find "${homeDir}" /opt /usr/local -maxdepth 4 \\( -iname "*telematico*" -o -iname "*uniemens*" -o -iname "*redditi*" -o -iname "*lipe*" -o -iname "*f24*" \\) 2>/dev/null | head -n 40`,
          { encoding: 'utf8', timeout: 5000 }
        )
        const righeFind = findOut.split('\n').map(r => r.trim()).filter(Boolean)
        for (const p of righeFind) {
          const pl = p.toLowerCase()
          // Ignora archivi, log e directory
          if (pl.endsWith('.log') || pl.endsWith('.zip') || pl.endsWith('.tar.gz') || pl.endsWith('.txt')) continue
          try {
            const stat = fs.statSync(p)
            if (stat.isDirectory()) {
              // Se è una cartella (es. ~/DesktopTelematico), controlla se dentro c'è un eseguibile con lo stesso nome o .sh
              const base = path.basename(p)
              const cand1 = path.join(p, base)
              const cand2 = path.join(p, `${base}.sh`)
              const cand3 = path.join(p, 'run.sh')
              const cand4 = path.join(p, `${base}.desktop`)
              for (const cand of [cand1, cand2, cand3, cand4]) {
                if (fs.existsSync(cand)) {
                  if (pl.includes('telematico') && !trovati.some(t => t.nomeKey === 'telematico')) {
                    trovati.push({ nomeKey: 'telematico', percorsoTrovato: cand, tipo: 'eseguibile' })
                  } else if (pl.includes('uniemens') && !trovati.some(t => t.nomeKey === 'uniemens')) {
                    trovati.push({ nomeKey: 'uniemens', percorsoTrovato: cand, tipo: 'eseguibile' })
                  }
                  break
                }
              }
              continue
            }
          } catch {}

          if ((pl.includes('telematico') || pl.includes('entratel')) && !trovati.some(t => t.nomeKey === 'telematico')) {
            trovati.push({ nomeKey: 'telematico', percorsoTrovato: p, tipo: p.endsWith('.sh') ? 'script' : 'eseguibile' })
          }
          if ((pl.includes('uniemens') || pl.includes('inps')) && !trovati.some(t => t.nomeKey === 'uniemens')) {
            trovati.push({ nomeKey: 'uniemens', percorsoTrovato: p, tipo: p.endsWith('.sh') ? 'script' : 'eseguibile' })
          }
          if (pl.includes('redditi') && !trovati.some(t => t.nomeKey === 'redditi')) {
            trovati.push({ nomeKey: 'redditi', percorsoTrovato: p, tipo: p.endsWith('.sh') ? 'script' : 'eseguibile' })
          }
          if (pl.includes('lipe') && !trovati.some(t => t.nomeKey === 'lipe')) {
            trovati.push({ nomeKey: 'lipe', percorsoTrovato: p, tipo: p.endsWith('.sh') ? 'script' : 'eseguibile' })
          }
          if (pl.includes('f24') && !trovati.some(t => t.nomeKey === 'f24')) {
            trovati.push({ nomeKey: 'f24', percorsoTrovato: p, tipo: p.endsWith('.sh') ? 'script' : 'eseguibile' })
          }
        }
      } catch {}
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
