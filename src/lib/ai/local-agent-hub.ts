// src/lib/ai/local-agent-hub.ts
// Rete di Agenti IA Locali dello Studio con Agente Mastro (Orchestratore) e Apprendimento Continuo
// Architettura per Software Fiscale & Gestionale Commercialisti — Specifiche Dott. Antonio Tuzio

import { prisma } from '@/lib/prisma'
import { TABELLA_IVA_CGN } from '@/lib/cgn-tabelle-iva'
import { REGISTRI_IVA_STANDARD } from '@/lib/registri-iva'

export interface RuoloAgente {
  id: string
  nome: string
  descrizione: string
  icona: string
  competenza: string
  stato: 'ATTIVO' | 'IN_ADDESTRAMENTO' | 'STANDBY'
  versione: string
}

export const SQUADRA_AGENTI_STUDIO: RuoloAgente[] = [
  {
    id: 'mastro',
    nome: 'Agente Mastro (Orchestratore Fiscale)',
    descrizione: 'Supervisiona tutte le operazioni, analizza le richieste del Dottore e assegna i compiti agli agenti specialisti',
    icona: 'Brain',
    competenza: 'Coordinamento generale, decisioni multi-disciplinari, prioritizzazione adempimenti',
    stato: 'ATTIVO',
    versione: '1.0-Local',
  },
  {
    id: 'contabilita',
    nome: 'Agente Contabilità & Registri IVA',
    descrizione: 'Gestisce la Prima Nota, protocolli progressivi, registri A1/V1/C1, scritture NO IVA (Causale 899) e liquidazioni periodiche',
    icona: 'FileSpreadsheet',
    competenza: 'Partita doppia, codifiche CGN, reverse charge TD16, fatture elettroniche AdE',
    stato: 'ATTIVO',
    versione: '1.2-Local',
  },
  {
    id: 'f24',
    nome: 'Agente F24 & Deleghe di Versamento',
    descrizione: 'Elabora e quadra i modelli F24 con tributi erariali, contributi INPS, addizionali regionali/comunali e compensazioni',
    icona: 'CreditCard',
    competenza: 'Codici tributo (1040, 1001, 6001-6099), sezioni Erario/INPS/Regioni/Imu, compensazioni orizzontali',
    stato: 'ATTIVO',
    versione: '1.0-Local',
  },
  {
    id: 'dichiarativi',
    nome: 'Agente Dichiarativi (730 / 770 / Modello Redditi)',
    descrizione: 'Predispone la base dati per i modelli dichiarativi fiscali: 730, 770 (sostituti d\'imposta), Modello Redditi PF/SP/SC (ex 740, 750)',
    icona: 'FileText',
    competenza: 'Quadri reddituali, ritenute d\'acconto, deduzioni/detrazioni, certificazioni uniche CU',
    stato: 'ATTIVO',
    versione: '0.9-Addestramento',
  },
  {
    id: 'bilancio',
    nome: 'Agente Bilancio d\'Esercizio CEE',
    descrizione: 'Riclassifica le scritture contabili secondo la IV Direttiva CEE: Stato Patrimoniale, Conto Economico e Nota Integrativa',
    icona: 'BarChart2',
    competenza: 'Schema civilistico CEE art. 2424-2425 c.c., ammortamenti, rimanenze e ratei/risconti',
    stato: 'ATTIVO',
    versione: '0.8-Addestramento',
  },
  {
    id: 'compliance',
    nome: 'Agente Antiriciclaggio & Privacy CNDCEC',
    descrizione: 'Verifica la conformità D.Lgs. 231/2007, calcolo indici di rischio, scadenze documenti e privacy GDPR',
    icona: 'ShieldCheck',
    competenza: 'Linee guida CNDCEC 2025, titolari effettivi, fascicoli antiriciclaggio e controlli GdF',
    stato: 'ATTIVO',
    versione: '1.1-Local',
  },
]

// ── 1. Interfaccia Apprendimento Continuo (Self-Improving dello Studio) ──
export async function registraApprendimentoDottore(params: {
  tipo: 'CONTABILITA' | 'FISCALE_F24' | 'DICHIARATIVI' | 'BILANCIO' | 'CLASSIFICAZIONE_ATECO'
  chiavePattern: string
  valoreRegola: Record<string, any>
  istruzioniCustom?: string
  creatoDa?: string
}) {
  const chiave = params.chiavePattern.trim().toUpperCase()

  // Verifica se esiste già un pattern registrato per aggiornare il punteggio e conteggio
  const esistente = await prisma.studioAiMemory.findFirst({
    where: {
      tipo: params.tipo,
      chiavePattern: chiave,
    },
  })

  if (esistente) {
    return await prisma.studioAiMemory.update({
      where: { id: esistente.id },
      data: {
        valoreRegola: params.valoreRegola,
        confermeConteggio: { increment: 1 },
        accuratezzaScore: Math.min(1.0, esistente.accuratezzaScore + 0.05),
        istruzioniCustom: params.istruzioniCustom || esistente.istruzioniCustom,
        updatedAt: new Date(),
      },
    })
  }

  return await prisma.studioAiMemory.create({
    data: {
      tipo: params.tipo,
      chiavePattern: chiave,
      valoreRegola: params.valoreRegola,
      confermeConteggio: 1,
      accuratezzaScore: 0.95,
      istruzioniCustom: params.istruzioniCustom || 'Regola appresa dalle indicazioni del Dottore',
      creatoDa: params.creatoDa || 'Dott. Antonio Tuzio',
    },
  })
}

export async function cercaMemoriaAppresa(tipo: string, chiave: string) {
  const norm = chiave.trim().toUpperCase()
  return await prisma.studioAiMemory.findFirst({
    where: {
      tipo,
      chiavePattern: norm,
    },
  })
}

export async function elencoMemorieStudio(filtroTipo?: string) {
  const where: any = {}
  if (filtroTipo && filtroTipo !== 'TUTTI') {
    where.tipo = filtroTipo
  }
  return await prisma.studioAiMemory.findMany({
    where,
    orderBy: [
      { confermeConteggio: 'desc' },
      { updatedAt: 'desc' },
    ],
    take: 100,
  })
}

// ── 2. Ricerca RAG nella Biblioteca Normativa & Manuali Studio ──
export async function cercaNellaNormativaStudio(quesito: string, limit = 2): Promise<{ fonte: string; titolo: string; estratto: string }[]> {
  try {
    const qWords = quesito.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
    if (qWords.length === 0) return []

    const docs = await prisma.studioKnowledgeDocument.findMany({
      where: { attivo: true },
      take: 20,
    })

    const risultati: { fonte: string; titolo: string; estratto: string; score: number }[] = []

    for (const d of docs) {
      const testoLower = d.testoEstratto.toLowerCase()
      let score = 0
      for (const w of qWords) {
        if (testoLower.includes(w)) score += 2
        if (d.titolo.toLowerCase().includes(w)) score += 5
      }

      if (score > 0) {
        const firstMatchWord = qWords.find((w) => testoLower.includes(w))
        let snippet = ''
        if (firstMatchWord) {
          const idx = testoLower.indexOf(firstMatchWord)
          const start = Math.max(0, idx - 150)
          const end = Math.min(d.testoEstratto.length, idx + 350)
          snippet = d.testoEstratto.slice(start, end).replace(/\s+/g, ' ').trim()
        } else {
          snippet = d.testoEstratto.slice(0, 400).replace(/\s+/g, ' ').trim()
        }

        risultati.push({
          fonte: d.fonte || 'Studio Tuzio',
          titolo: d.titolo,
          estratto: snippet,
          score,
        })
      }
    }

    risultati.sort((a, b) => b.score - a.score)
    return risultati.slice(0, limit)
  } catch (err) {
    return []
  }
}

// ── 3. Connettore IA Locale (Ollama / On-Premise) con Fallback Deterministico & RAG ──
export async function interrogaIaLocale(prompt: string, contesto?: string): Promise<{ risposta: string; motore: 'OLLAMA_LOCALE' | 'MOTORE_DETERMINISTICO_STUDIO'; fonti?: string[] }> {
  const endpointLocale = process.env.LOCAL_AI_URL || 'http://localhost:11434/api/generate'
  const modello = process.env.LOCAL_AI_MODEL || 'llama3:8b'

  // Ricerca RAG nella Biblioteca Normativa & Manuali caricati dal Dottore
  const normativiPertinenti = await cercaNellaNormativaStudio(prompt, 2)
  let contestoNormativo = contesto || 'Generale studio commercialista Dott. Antonio Tuzio'
  const fontiTrovate: string[] = []

  if (normativiPertinenti.length > 0) {
    const estrattiStr = normativiPertinenti
      .map((n) => {
        fontiTrovate.push(`${n.titolo} (${n.fonte})`)
        return `[MANUALE STUDIO: "${n.titolo}" - Fonte: ${n.fonte}]\n"${n.estratto}"`
      })
      .join('\n\n')
    contestoNormativo += `\n\nDOCUMENTI E MANUALI UFFICIALI CARICATI DAL DOTTORE:\n${estrattiStr}`
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500) // 3.5s timeout per non bloccare mai la UI

    const res = await fetch(endpointLocale, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: modello,
        prompt: `Sei l'Agente Fiscale dello Studio del Dott. Antonio Tuzio. Rispondi con massima precisione normativa italiana (DPR 633/72, TUIR, L. 190/2014, CNDCEC) citando i documenti e le regole dello studio fornite.\nContesto e Documenti:\n${contestoNormativo}\n\nQuesito del Dottore: ${prompt}`,
        stream: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data?.response) {
        return {
          risposta: data.response.trim(),
          motore: 'OLLAMA_LOCALE',
          fonti: fontiTrovate.length > 0 ? fontiTrovate : undefined,
        }
      }
    }
  } catch (_e) {
    // LLM locale non avviato o offline: fallback istantaneo su motore euristico dello studio
  }

  // Risoluzione Euristica / Normativa Deterministica Locale dello Studio arricchita con RAG
  let rispostaDeterministica = elaboraRispostaDeterministica(prompt)
  if (normativiPertinenti.length > 0) {
    rispostaDeterministica += `\n\n📚 Riferimento dai Manuali dello Studio ("${normativiPertinenti[0].titolo}"):\n«...${normativiPertinenti[0].estratto}...»`
  }

  return {
    risposta: rispostaDeterministica,
    motore: 'MOTORE_DETERMINISTICO_STUDIO',
    fonti: fontiTrovate.length > 0 ? fontiTrovate : undefined,
  }
}

function elaboraRispostaDeterministica(quesito: string): string {
  const q = quesito.toLowerCase()

  if (q.includes('f24') || q.includes('tribut')) {
    return 'Agente F24: Il modello F24 gestisce i tributi erariali (Sezione Erario, es. ritenute 1040/1001 e IVA 6001-6012, saldo 6099), i contributi previdenziali (Sezione INPS, es. gestione separata, artigiani e commercianti) e le sezioni Regioni/IMU. Il saldo a debito può essere abbattuto tramite compensazione con crediti IVA o crediti d\'imposta regolarmente maturati.'
  }

  if (q.includes('730') || q.includes('740') || q.includes('750') || q.includes('770') || q.includes('redditi')) {
    return 'Agente Dichiarativi: La modulistica fiscale copre il Modello 730 (per dipendenti e pensionati con conguaglio in busta paga/pensione), il Modello Redditi PF/SP/SC (gli storici 740, 750 e 760 per persone fisiche, società di persone e capitali) e il Modello 770 (per la certificazione delle ritenute operate dai sostituti d\'imposta e il raccordo con le Certificazioni Uniche CU).'
  }

  if (q.includes('no iva') || q.includes('899') || q.includes('paghe') || q.includes('inps') || q.includes('inail')) {
    return 'Agente Contabilità: Nelle imprese in contabilità semplificata con registri IVA aventi valenza reddituale (art. 18 DPR 600/73), i costi per paghe dipendenti, contributi INPS, premi INAIL e assicurazioni vanno registrati con Causale 899 nel Registro Acquisti A1 con anagrafica "Fornitori Non IVA" e codice "NO_IVA", garantendo la deducibilità analitica del costo.'
  }

  if (q.includes('reverse charge') || q.includes('td16') || q.includes('n6')) {
    return 'Agente Contabilità: Le operazioni in Reverse Charge interno (art. 17 c. 6 e art. 74) non espongono IVA in fattura attiva (Natura da N6.1 a N6.9). L\'acquirente committente ha l\'obbligo di trasmettere l\'autofattura elettronica TD16 al Sistema di Interscambio (SDI) e procedere alla doppia annotazione nel registro Acquisti AR1 e nel registro Vendite.'
  }

  return 'Agente Mastro: Richiesta presa in carico. I sub-agenti specializzati (Contabilità, Deleghe F24, Dichiarativi 730/770/Redditi, Bilancio CEE) sono pronti a processare i flussi per lo studio e ad apprendere le correzioni impartite dal Dottore per perfezionare le regole del gestionale.'
}
