// diagnostica-fatture.ts
// Script di analisi contabile e quadratura con Aruba per il Dott. Antonio Tuzio

import { prisma } from './src/lib/prisma'

async function main() {
  console.log('=======================================================================')
  console.log('       QUADRATURA FATTURE SALDATE CON ARUBA - GESTIONALE STUDIO        ')
  console.log('=======================================================================\n')

  const targetAruba = 26194.40
  const targetProgramma = 26419.86
  const delta = +(targetProgramma - targetAruba).toFixed(2)

  console.log(`Valore Aruba comunicato:     ${targetAruba.toFixed(2)} €`)
  console.log(`Valore Gestionale attuale:   ${targetProgramma.toFixed(2)} €`)
  console.log(`Differenza da trovare (Δ):    +${delta.toFixed(2)} €\n`)

  const fatture = await prisma.invoice.findMany({
    where: { stato: 'EMESSA' },
    include: {
      company: { select: { ragioneSociale: true } },
      payments: true,
      lines: true,
    },
    orderBy: { dataDocumento: 'asc' },
  })

  console.log(`Numero totale fatture emesse nel database: ${fatture.length}`)

  let sommaTotaleDocumenti = 0
  let sommaTotaleIncassato = 0
  let sommaTotaleResiduo = 0

  const candidatePerDelta: any[] = []
  const nonSaldate: any[] = []

  for (const f of fatture) {
    const totDoc = Number(f.totaleDocumento)
    const incassato = f.payments.reduce((acc, p) => acc + Number(p.importo), 0)
    const residuo = +(totDoc - incassato).toFixed(2)

    sommaTotaleDocumenti += totDoc
    sommaTotaleIncassato += incassato
    sommaTotaleResiduo += Math.max(0, residuo)

    // Verifica se questa fattura ha un totale o residuo vicino a 225.46
    if (Math.abs(totDoc - delta) < 0.05 || Math.abs(residuo - delta) < 0.05) {
      candidatePerDelta.push({
        tipo: 'Fattura di importo pari al Delta',
        numero: f.numeroCompleto,
        data: f.dataDocumento?.toISOString().split('T')[0],
        cliente: f.company?.ragioneSociale,
        totale: totDoc,
        incassato,
        residuo,
        note: f.note,
      })
    }

    // Se c'è una ritenuta o metà delta (possibile nota di credito)
    if (Math.abs(totDoc - (delta / 2)) < 0.05) {
      candidatePerDelta.push({
        tipo: 'Possibile Nota di Credito (metà delta)',
        numero: f.numeroCompleto,
        data: f.dataDocumento?.toISOString().split('T')[0],
        cliente: f.company?.ragioneSociale,
        totale: totDoc,
        incassato,
      })
    }

    if (residuo > 0.01) {
      nonSaldate.push({
        numero: f.numeroCompleto,
        data: f.dataDocumento?.toISOString().split('T')[0],
        cliente: f.company?.ragioneSociale,
        totale: totDoc,
        incassato,
        residuo,
      })
    }
  }

  console.log('-----------------------------------------------------------------------')
  console.log(`Somma Totale Documenti:      ${sommaTotaleDocumenti.toFixed(2)} €`)
  console.log(`Somma Totale Incassato:      ${sommaTotaleIncassato.toFixed(2)} €`)
  console.log(`Somma Totale Residuo Aperto: ${sommaTotaleResiduo.toFixed(2)} €`)
  console.log('-----------------------------------------------------------------------\n')

  if (candidatePerDelta.length > 0) {
    console.log('🎯 TROVATE FATTURE CANDIDATE CHE SPIEGANO ESATTAMENTE IL DELTA DI 225,46 €:')
    console.table(candidatePerDelta)
    console.log('')
  } else {
    console.log('Nessuna singola fattura ha importo esattamente uguale a 225,46 €.')
    console.log('Verifichiamo le fatture non saldate o parzialmente saldate:\n')
  }

  if (nonSaldate.length > 0) {
    console.log(`⚠️ Fatture NON saldate o parzialmente incassate (${nonSaldate.length}):`)
    console.table(nonSaldate)
    console.log('')
  } else {
    console.log('Tutte le fatture risultano saldate al 100% nel gestionale.\n')
  }

  // Verifica se ci sono fatture con note di credito o storni
  const noteCredito = fatture.filter(
    (f) =>
      f.sezionale?.toUpperCase().includes('NC') ||
      f.numeroCompleto?.toUpperCase().includes('NC') ||
      f.numeroCompleto?.toUpperCase().includes('ND') ||
      f.note?.toLowerCase().includes('credito') ||
      f.note?.toLowerCase().includes('storno')
  )

  if (noteCredito.length > 0) {
    console.log(`📝 Possibili Note di Credito / Storni trovati (${noteCredito.length}):`)
    console.table(
      noteCredito.map((nc) => ({
        numero: nc.numeroCompleto,
        data: nc.dataDocumento?.toISOString().split('T')[0],
        cliente: nc.company?.ragioneSociale,
        totale: Number(nc.totaleDocumento),
      }))
    )
    console.log('')
  }

  // Elenco completo ordinato per importo per consultazione rapida
  console.log('Top 15 fatture per importo:')
  const topFatture = [...fatture]
    .sort((a, b) => Number(b.totaleDocumento) - Number(a.totaleDocumento))
    .slice(0, 15)
    .map((f) => ({
      numero: f.numeroCompleto,
      data: f.dataDocumento?.toISOString().split('T')[0],
      cliente: f.company?.ragioneSociale?.substring(0, 25),
      totale: Number(f.totaleDocumento),
    }))
  console.table(topFatture)

  // ─────────────────────────────────────────────────────────────────
  // CONTROLLO NUMERAZIONE PROGRESSIVO, BUCHI E DUPLICATI
  // ─────────────────────────────────────────────────────────────────
  console.log('\n=======================================================================')
  console.log('       CONTROLLO PROGRESSIVO NUMERAZIONI FATTURE (BUCHI / DOPPI)       ')
  console.log('=======================================================================\n')

  const gruppi: Record<string, typeof fatture> = {}
  for (const f of fatture) {
    const anno = f.anno || (f.dataDocumento ? new Date(f.dataDocumento).getFullYear() : 2026)
    const sez = f.sezionale || 'FT'
    const key = `${sez} - Anno ${anno}`
    if (!gruppi[key]) gruppi[key] = []
    gruppi[key].push(f)
  }

  for (const [chiave, elenco] of Object.entries(gruppi)) {
    console.log(`📌 Sezionale ${chiave} (${elenco.length} fatture registrate):`)
    const ordinate = [...elenco].sort((a, b) => (a.numero || 0) - (b.numero || 0))
    const numeri = ordinate.map((f) => f.numero).filter((n): n is number => n !== null && n !== undefined)

    if (numeri.length === 0) {
      console.log('   Nessuna fattura con numero progressivo valido.\n')
      continue
    }

    const minNum = Math.min(...numeri)
    const maxNum = Math.max(...numeri)
    console.log(`   Intervallo: da n. ${minNum} a n. ${maxNum}`)

    // 1. Controllo buchi
    const numeriSet = new Set(numeri)
    const buchiGrezzi: number[] = []
    const startFrom = minNum > 1 && minNum <= 5 ? 1 : minNum
    const isNC = chiave.toUpperCase().startsWith('NC')

    if (!isNC) {
      for (let i = startFrom; i <= maxNum; i++) {
        if (!numeriSet.has(i)) {
          buchiGrezzi.push(i)
        }
      }
    }

    const buchi: number[] = []
    const buchiSpiegati: string[] = []
    for (const b of buchiGrezzi) {
      const ncCorrispondente = fatture.find(
        f => f.numero === b && (f.sezionale?.toUpperCase() === 'NC' || f.numeroCompleto?.includes('NC'))
      )
      if (ncCorrispondente) {
        buchiSpiegati.push(`n. ${b} (Nota di Credito ${ncCorrispondente.numeroCompleto} - ${ncCorrispondente.company?.ragioneSociale})`)
      } else {
        buchi.push(b)
      }
    }

    if (buchiSpiegati.length > 0) {
      console.log(`   ℹ️ Numeri utilizzati da Note di Credito nella stessa sequenza progressiva (${buchiSpiegati.length}):`)
      console.log(`      ${buchiSpiegati.join(', ')}`)
    }

    if (buchi.length > 0) {
      console.log(`   ❌ ATTENZIONE: Trovati ${buchi.length} BUCHI di numerazione reali (mancano nel DB):`)
      console.log(`      Numeri mancanti: ${buchi.join(', ')}`)
    } else {
      console.log(`   ✅ Sequenza progressiva integra: NESSUN BUCO REALE da ${startFrom} a ${maxNum}!`)
    }

    // 2. Controllo duplicati
    const visti = new Set<number>()
    const duplicati = new Set<number>()
    for (const num of numeri) {
      if (visti.has(num)) duplicati.add(num)
      visti.add(num)
    }

    if (duplicati.size > 0) {
      console.log(`   ❌ ATTENZIONE: Trovati NUMERI DUPLICATI: ${Array.from(duplicati).join(', ')}`)
    } else {
      console.log(`   ✅ Nessun numero duplicato.`)
    }

    // 3. Controllo ordine cronologico date
    let inversioniData = 0
    for (let idx = 1; idx < ordinate.length; idx++) {
      const prev = ordinate[idx - 1]
      const curr = ordinate[idx]
      if (prev.dataDocumento && curr.dataDocumento && prev.numero !== curr.numero) {
        if (new Date(curr.dataDocumento).getTime() < new Date(prev.dataDocumento).getTime()) {
          console.log(`   ⚠️ Inversione data: Fattura ${prev.numeroCompleto} (${prev.dataDocumento.toISOString().split('T')[0]}) ha data successiva alla Fattura ${curr.numeroCompleto} (${curr.dataDocumento.toISOString().split('T')[0]})`)
          inversioniData++
        }
      }
    }
    if (inversioniData === 0) {
      console.log(`   ✅ Sequenza cronologica coerente (nessuna inversione temporale).\n`)
    } else {
      console.log(`   ⚠️ Rilevate ${inversioniData} inversioni temporali di data.\n`)
    }
  }
}

main()
  .catch((e) => {
    console.error('Errore esecuzione diagnostica:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
