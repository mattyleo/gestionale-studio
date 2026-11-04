// src/app/api/fatture/controllo-numerazione/route.ts
// Verifica fiscale della numerazione progressiva delle fatture (buchi, duplicati, inversioni cronologiche)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const [fatture, sequenzeDb] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          stato: { in: ['EMESSA', 'PRONTA_EMISSIONE'] },
        },
        include: {
          company: { select: { ragioneSociale: true } },
        },
        orderBy: [{ anno: 'desc' }, { dataDocumento: 'asc' }],
      }),
      prisma.documentSequence.findMany({}),
    ])

    // Mappa sequenze DB per contatore ultimoNumero
    const sequenzeMap = new Map<string, number>()
    for (const seq of sequenzeDb) {
      sequenzeMap.set(`${seq.sezionale}_${seq.anno}`, seq.ultimoNumero)
    }

    // Raggruppa per sezionale e anno
    const gruppi: Record<string, any[]> = {}
    for (const f of fatture) {
      const anno = f.anno || (f.dataDocumento ? new Date(f.dataDocumento).getFullYear() : new Date().getFullYear())
      const sez = (f.sezionale || 'FT').toUpperCase()
      const chiave = `${sez}_${anno}`
      if (!gruppi[chiave]) gruppi[chiave] = []
      gruppi[chiave].push(f)
    }

    const reportSezionali = Object.entries(gruppi).map(([chiave, lista]) => {
      const [sezionale, annoStr] = chiave.split('_')
      const anno = parseInt(annoStr, 10)

      // Ordina numericamente
      const ordinatePerNumero = [...lista].sort((a, b) => (a.numero || 0) - (b.numero || 0))
      const numeriValidi = ordinatePerNumero
        .map((f) => f.numero)
        .filter((n): n is number => typeof n === 'number' && !isNaN(n))

      const minNumero = numeriValidi.length > 0 ? Math.min(...numeriValidi) : 0
      const maxNumero = numeriValidi.length > 0 ? Math.max(...numeriValidi) : 0

      // 1. Controllo buchi (numeri mancanti)
      const numeriPresenti = new Set(numeriValidi)
      const buchiGrezzi: number[] = []
      // Verifica dal numero 1 (o dal minimo se parte da più in alto) fino al massimo
      const isNCSez = sezionale === 'NC'
      const startFrom = minNumero > 1 && minNumero <= 5 ? 1 : minNumero
      
      // Se è il sezionale NC e i numeri derivano dalla sequenza generale (es. 22 e 96), non è una sequenza 1..N a sé
      if (!isNCSez) {
        for (let i = startFrom; i <= maxNumero; i++) {
          if (!numeriPresenti.has(i)) {
            buchiGrezzi.push(i)
          }
        }
      }

      // Verifica se i buchi corrispondono a Note di Credito dello stesso anno (numerazione unificata fatture/note di credito)
      const buchiSpiegati: { numero: number; nota: string }[] = []
      const buchi: number[] = []

      for (const b of buchiGrezzi) {
        const docNC = fatture.find(
          f => f.anno === anno && f.numero === b && (f.sezionale?.toUpperCase() === 'NC' || f.numeroCompleto?.includes('NC'))
        )
        if (docNC) {
          buchiSpiegati.push({
            numero: b,
            nota: `Assegnato alla Nota di Credito ${docNC.numeroCompleto} (${docNC.company?.ragioneSociale || 'Cliente'}) - Sequenza unificata`,
          })
        } else {
          buchi.push(b)
        }
      }

      // 2. Controllo duplicati
      const contaNumeri: Record<number, number> = {}
      for (const num of numeriValidi) {
        contaNumeri[num] = (contaNumeri[num] || 0) + 1
      }
      const duplicati = Object.entries(contaNumeri)
        .filter(([_, count]) => count > 1)
        .map(([num, count]) => ({
          numero: parseInt(num, 10),
          volte: count,
          fatture: lista
            .filter((f) => f.numero === parseInt(num, 10))
            .map((f) => ({
              id: f.id,
              numeroCompleto: f.numeroCompleto,
              data: f.dataDocumento,
              cliente: f.company?.ragioneSociale,
              totale: Number(f.totaleDocumento),
            })),
        }))

      // 3. Controllo inversioni di data (es. fattura 5 del 20/03 e fattura 6 del 10/03)
      const inversioniData: any[] = []
      for (let idx = 1; idx < ordinatePerNumero.length; idx++) {
        const prev = ordinatePerNumero[idx - 1]
        const curr = ordinatePerNumero[idx]
        if (prev.dataDocumento && curr.dataDocumento && prev.numero !== curr.numero) {
          const dPrev = new Date(prev.dataDocumento).getTime()
          const dCurr = new Date(curr.dataDocumento).getTime()
          if (dCurr < dPrev) {
            inversioniData.push({
              fatturaPrecedente: {
                numero: prev.numeroCompleto,
                data: prev.dataDocumento,
              },
              fatturaSuccessiva: {
                numero: curr.numeroCompleto,
                data: curr.dataDocumento,
              },
              motivo: `La fattura ${curr.numeroCompleto} ha data precedente rispetto alla fattura ${prev.numeroCompleto}`,
            })
          }
        }
      }

      const ultimoNumeroContatore = sequenzeMap.get(chiave) ?? 0
      const contatoreAllineato = ultimoNumeroContatore >= maxNumero

      const tuttoRegolare = buchi.length === 0 && duplicati.length === 0 && inversioniData.length === 0

      return {
        chiave,
        sezionale,
        anno,
        totaleFatture: lista.length,
        minNumero,
        maxNumero,
        ultimoNumeroContatore,
        contatoreAllineato,
        buchi,
        buchiSpiegati,
        duplicati,
        inversioniData,
        tuttoRegolare,
        fatture: ordinatePerNumero.map((f) => ({
          id: f.id,
          numero: f.numero,
          numeroCompleto: f.numeroCompleto,
          data: f.dataDocumento,
          cliente: f.company?.ragioneSociale,
          totale: Number(f.totaleDocumento),
          imponibile: Number(f.imponibile),
        })),
      }
    })

    const haAnomalie = reportSezionali.some((r) => !r.tuttoRegolare)

    return NextResponse.json({
      haAnomalie,
      totaleFattureVerificate: fatture.length,
      sezionali: reportSezionali,
    })
  } catch (error: any) {
    console.error('Errore controllo numerazione:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
