// src/app/api/aziende/[id]/contabilita/audit/route.ts
// Modulo di Diagnostica & Audit Fiscale/Contabile Intelligente dell'Agente Mastro
// Controlla squadrature, incongruenze forfettari, reverse charge, scritture NO IVA e salti di protocollo

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assureDbSchemaAligned } from '@/lib/db-align'

export interface AnomaliaContabile {
  id: string
  gravita: 'ERRORE' | 'ATTENZIONE' | 'INFO'
  categoria: 'SQUADRATURA' | 'REGIME_FISCALE' | 'REVERSE_CHARGE' | 'SCRITTURA_NO_IVA' | 'PROTOCOLLO' | 'CONTI'
  titolo: string
  dettaglio: string
  normativa: string
  suggerimento: string
  entryId?: string
  entryData?: {
    dataRegistrazione: string
    protocollo?: number | null
    registroCodice?: string | null
    descrizione: string
    soggetto?: string | null
    importoDare: number
    importoAvere: number
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    await assureDbSchemaAligned()
    const { id: aziendaId } = await params

    const azienda = await prisma.company.findUnique({
      where: { id: aziendaId },
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
    })

    if (!azienda) {
      return NextResponse.json({ error: 'Azienda non trovata' }, { status: 404 })
    }

    const entries = azienda.accountingEntries
    const anomalie: AnomaliaContabile[] = []

    // ─────────────────────────────────────────────────────────────
    // 1. CONTROLLO SQUADRATURE DARE / AVERE
    // ─────────────────────────────────────────────────────────────
    entries.forEach((entry) => {
      const dare = Number(entry.importoDare || 0)
      const avere = Number(entry.importoAvere || 0)
      const diff = Math.abs(dare - avere)

      if (diff > 0.01) {
        anomalie.push({
          id: `sq_${entry.id}`,
          gravita: 'ERRORE',
          categoria: 'SQUADRATURA',
          titolo: `Squadratura contabile di € ${diff.toFixed(2)}`,
          dettaglio: `La registrazione presenta Dare = € ${dare.toFixed(2)} ed Avere = € ${avere.toFixed(2)}. Il principio contabile della partita doppia richiede l'esatto pareggio dei mastri.`,
          normativa: 'Art. 2216 c.c. e principi contabili OIC (Regolarità della tenuta delle scritture contabili in partita doppia).',
          suggerimento: `Modifica la registrazione pareggiando i totali tra conto di debito/credito e conto economico/finanziario.`,
          entryId: entry.id,
          entryData: {
            dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
            protocollo: entry.protocollo,
            registroCodice: entry.registroCodice,
            descrizione: entry.descrizione,
            soggetto: entry.anagraficaSoggetto,
            importoDare: dare,
            importoAvere: avere,
          },
        })
      }
    })

    // ─────────────────────────────────────────────────────────────
    // 2. CONTROLLO REGIME FORFETTARIO
    // ─────────────────────────────────────────────────────────────
    const isForfettario = (azienda as any).regimeContabile === 'FORFETTARIO'

    if (isForfettario) {
      entries.forEach((entry) => {
        const aliquota = Number(entry.aliquotaIva || 0)
        const imposta = Number(entry.impostaIva || 0)

        if (entry.tipoRegistro === 'VENDITE' && (aliquota > 0 || imposta > 0)) {
          anomalie.push({
            id: `forf_iva_${entry.id}`,
            gravita: 'ERRORE',
            categoria: 'REGIME_FISCALE',
            titolo: `Applicazione indebita IVA su contribuente forfettario`,
            dettaglio: `L'azienda adotta il Regime Forfettario ma è stata registrata un'operazione attiva con aliquota IVA ${aliquota}% (imposta € ${imposta.toFixed(2)}). Le operazioni attive dei forfettari non scontano IVA.`,
            normativa: 'Legge 190/2014 art. 1 comma 58 e Natura SDI N2.2 (Operazione non soggetta ad IVA per adesione al regime forfettario).',
            suggerimento: `Imposta l'aliquota IVA a 0% e assegna la Natura SDI "N2.2" (Codice CGN FORF).`,
            entryId: entry.id,
            entryData: {
              dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
              protocollo: entry.protocollo,
              registroCodice: entry.registroCodice,
              descrizione: entry.descrizione,
              soggetto: entry.anagraficaSoggetto,
              importoDare: Number(entry.importoDare),
              importoAvere: Number(entry.importoAvere),
            },
          })
        }
      })
    }

    // ─────────────────────────────────────────────────────────────
    // 3. CONTROLLO REVERSE CHARGE ED AUTOFATTURE TD16
    // ─────────────────────────────────────────────────────────────
    entries.forEach((entry) => {
      const descr = (entry.descrizione || '').toLowerCase()
      const isReverse = entry.reverseCharge || (entry.naturaSdi || '').startsWith('N6')
      const keywordReverse = descr.includes('reverse charge') || descr.includes('rottami') || descr.includes('pulizie') || descr.includes('subappalto')

      if ((isReverse || keywordReverse) && entry.tipoRegistro === 'ACQUISTI') {
        if (entry.registroCodice !== 'AR1' && !entry.reverseCharge) {
          anomalie.push({
            id: `rev_${entry.id}`,
            gravita: 'ATTENZIONE',
            categoria: 'REVERSE_CHARGE',
            titolo: `Possibile omesso Reverse Charge (Registro AR1 / TD16)`,
            dettaglio: `L'acquisto "${entry.descrizione}" fa riferimento ad ambiti tipicamente soggetti ad inversione contabile (art. 17 c. 6 / art. 74). Non risulta annotato sul registro specifico AR1 né contrassegnato con l'apposito flag.`,
            normativa: 'Art. 17, comma 6 DPR 633/72 e obbligo autofattura elettronica TD16 via SDI.',
            suggerimento: `Verifica se la fattura del fornitore cita il Reverse Charge. In tal caso assegna il registro AR1 ed emetti l'autofattura TD16.`,
            entryId: entry.id,
            entryData: {
              dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
              protocollo: entry.protocollo,
              registroCodice: entry.registroCodice,
              descrizione: entry.descrizione,
              soggetto: entry.anagraficaSoggetto,
              importoDare: Number(entry.importoDare),
              importoAvere: Number(entry.importoAvere),
            },
          })
        }
      }
    })

    // ─────────────────────────────────────────────────────────────
    // 4. CONTROLLO SCRITTURE NO IVA (PAGHE, INPS, INAIL, ASSICURAZIONI)
    // ─────────────────────────────────────────────────────────────
    entries.forEach((entry) => {
      const descr = (entry.descrizione || '').toLowerCase()
      const aliquota = Number(entry.aliquotaIva || 0)
      const isCostoPersonaleOPrevidenziale =
        descr.includes('stipend') ||
        descr.includes('buste paga') ||
        descr.includes('inps') ||
        descr.includes('inail') ||
        descr.includes('tfr') ||
        descr.includes('assicurazion') ||
        descr.includes('imposte e tasse')

      if (isCostoPersonaleOPrevidenziale) {
        if (aliquota > 0) {
          anomalie.push({
            id: `noiva_aliq_${entry.id}`,
            gravita: 'ERRORE',
            categoria: 'SCRITTURA_NO_IVA',
            titolo: `Calcolata IVA su costo previdenziale o stipendiale`,
            dettaglio: `La voce "${entry.descrizione}" riguarda paghe, contributi o oneri non soggetti ad IVA, ma è stata registrata con aliquota ${aliquota}%.`,
            normativa: 'Art. 2 e 3 DPR 633/72 (Operazioni fuori campo IVA) e Prassi CGN Scritture NO IVA.',
            suggerimento: `Azzera l'aliquota IVA, imposta il codice IVA CGN a "NO_IVA" e abilita il flag Scrittura NO IVA (Causale 899).`,
            entryId: entry.id,
            entryData: {
              dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
              protocollo: entry.protocollo,
              registroCodice: entry.registroCodice,
              descrizione: entry.descrizione,
              soggetto: entry.anagraficaSoggetto,
              importoDare: Number(entry.importoDare),
              importoAvere: Number(entry.importoAvere),
            },
          })
        } else if (!entry.isScritturaNoIva && (azienda as any).regimeContabile === 'SEMPLIFICATO') {
          anomalie.push({
            id: `noiva_flag_${entry.id}`,
            gravita: 'INFO',
            categoria: 'SCRITTURA_NO_IVA',
            titolo: `Costo deducibile non marcato con Causale 899 NO IVA`,
            dettaglio: `Nelle imprese semplificate, per garantire la deducibilità reddituale analitica (art. 18 DPR 600/73) i costi di lavoro/previdenza devono transitare con causale 899.`,
            normativa: 'Art. 18 DPR 600/73 e Regole Registri IVA con valenza reddituale.',
            suggerimento: `Assegna "Causale 899 NO IVA" alla registrazione nel Registro Acquisti A1 per valorizzarlo correttamente nel Quadro RG/RE del Modello Redditi.`,
            entryId: entry.id,
            entryData: {
              dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
              protocollo: entry.protocollo,
              registroCodice: entry.registroCodice,
              descrizione: entry.descrizione,
              soggetto: entry.anagraficaSoggetto,
              importoDare: Number(entry.importoDare),
              importoAvere: Number(entry.importoAvere),
            },
          })
        }
      }
    })

    // ─────────────────────────────────────────────────────────────
    // 5. CONTROLLO SALTI E BUCHI NEI PROTOCOLLI IVA PROGRESSIVI
    // ─────────────────────────────────────────────────────────────
    // Raggruppa per Anno e Registro
    const registriMap = new Map<string, typeof entries>()
    entries.forEach((e) => {
      if (e.protocollo && e.registroCodice && e.anno) {
        const key = `${e.anno}_${e.registroCodice}`
        if (!registriMap.has(key)) {
          registriMap.set(key, [])
        }
        registriMap.get(key)!.push(e)
      }
    })

    registriMap.forEach((lista, key) => {
      const [anno, registro] = key.split('_')
      lista.sort((a, b) => (a.protocollo! - b.protocollo!))

      const protocolliVisti = new Set<number>()
      let expected = 1

      for (let i = 0; i < lista.length; i++) {
        const curr = lista[i].protocollo!

        // Duplicato
        if (protocolliVisti.has(curr)) {
          anomalie.push({
            id: `prot_dup_${key}_${curr}`,
            gravita: 'ERRORE',
            categoria: 'PROTOCOLLO',
            titolo: `Protocollo duplicato #${curr} nel Registro ${registro} (${anno})`,
            dettaglio: `Il protocollo progressivo #${curr} è assegnato a più di una registrazione nello stesso registro e anno fiscale.`,
            normativa: 'Art. 23 e 25 DPR 633/72 (Obbligo di numerazione progressiva univoca delle fatture nei registri IVA).',
            suggerimento: `Usa la funzione "Rinumera Protocolli" nel tab Prima Nota per riordinare la sequenza temporale.`,
            entryId: lista[i].id,
          })
        }
        protocolliVisti.add(curr)

        // Salto / Buco di numerazione
        if (i === 0 && curr > 1) {
          anomalie.push({
            id: `prot_start_${key}_${curr}`,
            gravita: 'ATTENZIONE',
            categoria: 'PROTOCOLLO',
            titolo: `La numerazione del Registro ${registro} (${anno}) non inizia da 1 (inizia da #${curr})`,
            dettaglio: `Il primo protocollo registrato per il registro ${registro} nell'anno ${anno} è il numero ${curr}.`,
            normativa: 'Art. 23 e 25 DPR 633/72.',
            suggerimento: `Se l'anno solare è iniziato con questo documento, conviene rinumerare partendo da 1.`,
            entryId: lista[i].id,
          })
        } else if (i > 0 && curr > expected) {
          const mancanti = []
          for (let m = expected; m < curr; m++) {
            mancanti.push(m)
          }
          anomalie.push({
            id: `prot_jump_${key}_${expected}_${curr}`,
            gravita: 'ATTENZIONE',
            categoria: 'PROTOCOLLO',
            titolo: `Salto di protocollo nel Registro ${registro} (${anno}): mancano #${mancanti.join(', #')}`,
            dettaglio: `Tra il protocollo #${expected - 1} e il protocollo #${curr} risulta un buco di numerazione (${mancanti.length} numeri mancanti).`,
            normativa: 'Art. 23 e 25 DPR 633/72 (Continuità e consequenzialità dei registri IVA vidimati).',
            suggerimento: `Esegui il ricalcolo sequenziale tramite il pulsante "Rinumera Protocolli".`,
            entryId: lista[i].id,
          })
        }
        expected = curr + 1
      }
    })

    // ─────────────────────────────────────────────────────────────
    // 6. CONTROLLO CONTI PATRIMONIALI ED ECONOMICI MANCANTI
    // ─────────────────────────────────────────────────────────────
    entries.forEach((entry) => {
      if (!entry.contoDareNome && !entry.contoAvereNome) {
        anomalie.push({
          id: `conti_mancanti_${entry.id}`,
          gravita: 'ATTENZIONE',
          categoria: 'CONTI',
          titolo: `Conti contabili Dare ed Avere non specificati`,
          dettaglio: `La registrazione "${entry.descrizione}" non ha mastri associati dal piano dei conti.`,
          normativa: 'Principi di corretta tenuta del libro giornale e piano dei conti dello studio.',
          suggerimento: `Assegna il conto di costo/ricavo e il conto finanziario (Banca, Cassa o Fornitore/Cliente).`,
          entryId: entry.id,
          entryData: {
            dataRegistrazione: entry.dataRegistrazione.toISOString().split('T')[0],
            protocollo: entry.protocollo,
            registroCodice: entry.registroCodice,
            descrizione: entry.descrizione,
            soggetto: entry.anagraficaSoggetto,
            importoDare: Number(entry.importoDare),
            importoAvere: Number(entry.importoAvere),
          },
        })
      }
    })

    return NextResponse.json({
      successo: true,
      aziendaId,
      totaleControllate: entries.length,
      totaleAnomalie: anomalie.length,
      anomalie,
      sintesi: {
        errori: anomalie.filter(a => a.gravita === 'ERRORE').length,
        attenzioni: anomalie.filter(a => a.gravita === 'ATTENZIONE').length,
        info: anomalie.filter(a => a.gravita === 'INFO').length,
      },
    })
  } catch (err: any) {
    console.error('Errore durante audit contabile IA:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
