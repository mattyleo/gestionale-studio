// src/app/api/agenti-ia/audit-globale/route.ts
// Audit Fiscale e Contabile Globale per TUTTE le aziende dello Studio
// Scansiona squadrature, forfettari, reverse charge, causale 899 NO IVA e registri IVA in tutto il gestionale

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assureDbSchemaAligned } from '@/lib/db-align'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()

    const aziende = await prisma.company.findMany({
      where: { archiviata: false },
      include: {
        accountingEntries: {
          orderBy: [
            { anno: 'asc' },
            { registroCodice: 'asc' },
            { protocollo: 'asc' },
            { dataRegistrazione: 'asc' },
          ],
        },
      },
      orderBy: { ragioneSociale: 'asc' },
    })

    const reportPerAzienda: any[] = []
    let totaleMovimentiEsaminati = 0
    let totaleErroriGlobali = 0
    let totaleAttenzioniGlobali = 0

    for (const azienda of aziende) {
      const entries = azienda.accountingEntries
      totaleMovimentiEsaminati += entries.length
      const anomalie: any[] = []

      // 1. Squadrature Dare != Avere
      entries.forEach((e) => {
        const d = Number(e.importoDare || 0)
        const a = Number(e.importoAvere || 0)
        if (Math.abs(d - a) > 0.01) {
          anomalie.push({
            gravita: 'ERRORE',
            categoria: 'SQUADRATURA',
            titolo: `Squadratura di € ${Math.abs(d - a).toFixed(2)}`,
            dettaglio: `Scrittura del ${e.dataRegistrazione.toISOString().split('T')[0]} "${e.descrizione}": Dare € ${d.toFixed(2)} ≠ Avere € ${a.toFixed(2)}.`,
            normativa: 'Art. 2216 c.c. e principi contabili OIC.',
            suggerimento: 'Riequilibra i mastri di debito/credito o costo/ricavo.',
            entryId: e.id,
          })
        }
      })

      // 2. Regime Forfettario con IVA
      const isForf = (azienda as any).regimeContabile === 'FORFETTARIO'
      if (isForf) {
        entries.forEach((e) => {
          const aliq = Number(e.aliquotaIva || 0)
          const imp = Number(e.impostaIva || 0)
          if (e.tipoRegistro === 'VENDITE' && (aliq > 0 || imp > 0)) {
            anomalie.push({
              gravita: 'ERRORE',
              categoria: 'REGIME_FORFETTARIO',
              titolo: `IVA addebitata in regime forfettario (${aliq}%)`,
              dettaglio: `Fattura attiva "${e.descrizione}" con IVA di € ${imp.toFixed(2)}. I forfettari non applicano IVA a debito.`,
              normativa: 'L. 190/2014 art. 1 comma 58 e Natura SDI N2.2.',
              suggerimento: 'Azzera l\'aliquota IVA e imposta Natura N2.2 (Codice CGN FORF).',
              entryId: e.id,
            })
          }
        })
      }

      // 3. Reverse charge
      entries.forEach((e) => {
        const descr = (e.descrizione || '').toLowerCase()
        const isRev = e.reverseCharge || (e.naturaSdi || '').startsWith('N6')
        const kwRev = descr.includes('reverse charge') || descr.includes('rottami') || descr.includes('pulizie') || descr.includes('subappalto')
        if ((isRev || kwRev) && e.tipoRegistro === 'ACQUISTI') {
          if (e.registroCodice !== 'AR1' && !e.reverseCharge) {
            anomalie.push({
              gravita: 'ATTENZIONE',
              categoria: 'REVERSE_CHARGE',
              titolo: 'Possibile omesso Reverse Charge (Registro AR1 / TD16)',
              dettaglio: `Acquisto "${e.descrizione}" afferente ad ambiti di inversione contabile senza annotazione sul registro AR1.`,
              normativa: 'Art. 17 c. 6 DPR 633/72.',
              suggerimento: 'Verifica la fattura ed emetti eventuale autofattura TD16 su registro AR1.',
              entryId: e.id,
            })
          }
        }
      })

      // 4. Scritture NO IVA (paghe, inps, inail)
      entries.forEach((e) => {
        const descr = (e.descrizione || '').toLowerCase()
        const aliq = Number(e.aliquotaIva || 0)
        const isPersonale =
          descr.includes('stipend') ||
          descr.includes('buste paga') ||
          descr.includes('inps') ||
          descr.includes('inail') ||
          descr.includes('tfr') ||
          descr.includes('assicurazion')

        if (isPersonale && aliq > 0) {
          anomalie.push({
            gravita: 'ERRORE',
            categoria: 'SCRITTURA_NO_IVA',
            titolo: 'IVA calcolata su costo stipendiale o previdenziale',
            dettaglio: `La voce "${e.descrizione}" non è soggetta ad IVA ma presenta IVA al ${aliq}%.`,
            normativa: 'Art. 2 e 3 DPR 633/72 e Causale CGN 899.',
            suggerimento: 'Azzera IVA e usa Causale 899 NO IVA per deducibilità del costo.',
            entryId: e.id,
          })
        }
      })

      // 5. Buchi di protocollo
      const registriMap = new Map<string, typeof entries>()
      entries.forEach((e) => {
        if (e.protocollo && e.registroCodice && e.anno) {
          const key = `${e.anno}_${e.registroCodice}`
          if (!registriMap.has(key)) registriMap.set(key, [])
          registriMap.get(key)!.push(e)
        }
      })

      registriMap.forEach((lista, key) => {
        const [anno, reg] = key.split('_')
        lista.sort((a, b) => a.protocollo! - b.protocollo!)
        let expected = 1
        for (let i = 0; i < lista.length; i++) {
          const curr = lista[i].protocollo!
          if (i > 0 && curr > expected) {
            anomalie.push({
              gravita: 'ATTENZIONE',
              categoria: 'PROTOCOLLO',
              titolo: `Salto protocollo nel registro ${reg} (${anno})`,
              dettaglio: `Mancano protocolli tra #${expected - 1} e #${curr}.`,
              normativa: 'Art. 23 e 25 DPR 633/72.',
              suggerimento: 'Esegui "Rinumera Protocolli" nel tab Prima Nota dell\'azienda.',
              entryId: lista[i].id,
            })
          }
          expected = curr + 1
        }
      })

      const nErrori = anomalie.filter(a => a.gravita === 'ERRORE').length
      const nAttenzioni = anomalie.filter(a => a.gravita === 'ATTENZIONE').length
      totaleErroriGlobali += nErrori
      totaleAttenzioniGlobali += nAttenzioni

      reportPerAzienda.push({
        id: azienda.id,
        ragioneSociale: azienda.ragioneSociale,
        partitaIva: azienda.partitaIva,
        regimeContabile: (azienda as any).regimeContabile || 'SEMPLIFICATO',
        totaleMovimenti: entries.length,
        anomalie,
        stato: anomalie.length === 0 ? 'CONFORME' : nErrori > 0 ? 'CRITICO' : 'ATTENZIONE',
      })
    }

    return NextResponse.json({
      successo: true,
      timestamp: new Date().toISOString(),
      statistiche: {
        totaleAziende: aziende.length,
        aziendeConformi: reportPerAzienda.filter(r => r.stato === 'CONFORME').length,
        aziendeConAnomalie: reportPerAzienda.filter(r => r.stato !== 'CONFORME').length,
        totaleMovimentiEsaminati,
        totaleErroriGlobali,
        totaleAttenzioniGlobali,
      },
      aziende: reportPerAzienda,
    })
  } catch (err: any) {
    console.error('Errore durante audit globale:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
