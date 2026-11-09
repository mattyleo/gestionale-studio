'use client'
// src/app/(dashboard)/antiriciclaggio/page.tsx
// Registro Antiriciclaggio & Privacy per Studio Professionale (D.Lgs. 231/2007 & GDPR)

import * as React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Pencil,
  User,
  Building,
  Calendar,
  AlertCircle,
  FileCheck,
  Trash2,
  ExternalLink,
  Plus,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { AntiriciclaggioDettaglioModal } from '@/components/antiriciclaggio/AntiriciclaggioDettaglioModal'

export default function AntiriciclaggioPage() {
  const { toast } = useToast()
  const [aziende, setAziende] = React.useState<any[]>([])
  const [statistiche, setStatistiche] = React.useState<any>({
    totaleCensiti: 0,
    totaleRegolari: 0,
    totaleDaVerificare: 0,
    docScaduti: 0,
    docInScadenza: 0,
    docMancanti: 0,
    privacyMancante: 0,
    totalePrivatiCaf: 0,
  })
  const [loading, setLoading] = React.useState(true)

  // Filtri
  const [cerca, setCerca] = React.useState('')
  const [settore, setSettore] = React.useState('TUTTI')
  const [statoFascicolo, setStatoFascicolo] = React.useState('TUTTI')
  const [rischio, setRischio] = React.useState('TUTTI')
  const [statoDocumento, setStatoDocumento] = React.useState('TUTTI')
  const [soloPiva, setSoloPiva] = React.useState(false)
  const [zonaFiltro, setZonaFiltro] = React.useState<'TUTTE' | 'ZONA_3' | 'ZONA_2' | 'ZONA_1'>('TUTTE')

  // Modal fascicolo
  const [selectedAziendaId, setSelectedAziendaId] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [regolarizzando, setRegolarizzando] = React.useState(false)
  const [mostraGuida, setMostraGuida] = React.useState(false)
  const [mostraMappaMentale, setMostraMappaMentale] = React.useState(false)

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        cerca,
        settore,
        statoFascicolo,
        rischio,
        statoDocumento,
        soloPiva: String(zonaFiltro === 'ZONA_1' ? false : soloPiva),
        zona: zonaFiltro,
      })

      const res = await fetch(`/api/antiriciclaggio?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAziende(data.aziende ?? [])
      setStatistiche(data.statistiche ?? {})
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [cerca, settore, statoFascicolo, rischio, statoDocumento, soloPiva, zonaFiltro, toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  const apriFascicolo = (id: string) => {
    setSelectedAziendaId(id)
    setModalOpen(true)
  }

  const handleEliminaCliente = async (az: any) => {
    const confermato = confirm(
      `Sei sicuro di voler eliminare o archiviare il cliente "${az.ragioneSociale}"?\n\n` +
      `Se il cliente possiede fatture o prestazioni collegate verrà archiviato per conservare i registri contabili e fiscali, altrimenti verrà rimosso definitivamente dal database.`
    )
    if (!confermato) return

    try {
      const res = await fetch(`/api/antiriciclaggio/${az.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: data.archiviato ? 'ℹ️ Cliente archiviato' : '✅ Cliente eliminato',
        description: data.messaggio,
      })
      caricaDati()
    } catch (err: any) {
      toast({ title: 'Errore eliminazione', description: err.message, variant: 'destructive' })
    }
  }

  const scaricaAutovalutazioneStudioPdf = () => {
    window.open('/api/antiriciclaggio/export/autovalutazione-studio', '_blank')
  }

  const handleRegolarizzaMassiva = async () => {
    setRegolarizzando(true)
    try {
      const res = await fetch('/api/antiriciclaggio/regolarizza', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: '⚡ Regolarizzazione Studio Completata!',
        description: data.messaggio,
      })
      caricaDati()
    } catch (err: any) {
      toast({ title: 'Errore regolarizzazione', description: err.message, variant: 'destructive' })
    } finally {
      setRegolarizzando(false)
    }
  }

  const scaricaRegistroPdf = () => {
    const params = new URLSearchParams()
    if (settore !== 'TUTTI') params.append('settore', settore)
    window.open(`/api/antiriciclaggio/export/pdf?${params}`, '_blank')
  }

  const scaricaRegistroCsv = () => {
    const params = new URLSearchParams()
    if (settore !== 'TUTTI') params.append('settore', settore)
    window.open(`/api/antiriciclaggio/export/csv?${params}`, '_blank')
  }

  const formatData = (d: any) => {
    if (!d) return '—'
    try {
      return new Intl.DateTimeFormat('it-IT').format(new Date(d))
    } catch {
      return '—'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Registro Antiriciclaggio &amp; Privacy
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Censimento della clientela, verifica documenti d&apos;identità, adempimenti D.Lgs. 231/2007 e GDPR
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleRegolarizzaMassiva}
            disabled={regolarizzando}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
            title="Analizza tutte le anagrafiche e le fatture, separa i privati 730/CAF esonerati, numera i fascicoli ARC-2026 e calcola la valutazione del rischio CNDCEC"
          >
            <Sparkles className="h-4 w-4 mr-1.5 text-amber-300" />
            {regolarizzando ? 'Regolarizzazione in corso...' : 'Regolarizza Posizione Studio (CNDCEC 2025)'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={scaricaAutovalutazioneStudioPdf}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-medium"
            title="Stampa Modello AV1 CNDCEC — Autovalutazione del Rischio dello Studio Professionale (obbligatorio per verifiche Guardia di Finanza)"
          >
            <ShieldCheck className="h-4 w-4 mr-1 text-indigo-600" /> Modello AV1 Studio (PDF)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={scaricaRegistroPdf}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            title="Stampa ufficiale Registro Clienti Antiriciclaggio (A4 Orizzontale)"
          >
            <Printer className="h-4 w-4 mr-1 text-blue-600" /> Stampa Registro (PDF)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={scaricaRegistroCsv}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            title="Esporta registro antiriciclaggio in formato CSV/Excel"
          >
            <Download className="h-4 w-4 mr-1 text-emerald-600" /> Esporta CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostraMappaMentale((v) => !v)}
            className="border-purple-300 text-purple-800 bg-purple-50/70 hover:bg-purple-100 font-medium"
          >
            <Sparkles className="h-4 w-4 mr-1 text-purple-600" />
            Mappa Mentale &amp; Rischi Contabilità/Bilanci
            {mostraMappaMentale ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostraGuida((v) => !v)}
            className="border-amber-300 text-amber-800 bg-amber-50/60 hover:bg-amber-100"
          >
            <BookOpen className="h-4 w-4 mr-1 text-amber-700" />
            Guida 6 Discipline &amp; GdF
            {mostraGuida ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </Button>

          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
        </div>
      </div>

      {/* Mappa Mentale Interattiva & Copertura Rischi Contabilità e Bilanci */}
      {mostraMappaMentale && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/60 via-white to-indigo-50/40 shadow-sm">
          <CardContent className="p-5 space-y-5 text-xs text-slate-700">
            <div className="flex items-start justify-between gap-4 border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Mappa Mentale Completa Antiriciclaggio di Studio (inclusi Tenuta Contabilità e Predisposizione Bilanci)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Schema sinottico a 5 Pilastri conforme al D.Lgs. 231/2007, Regole Tecniche CNDCEC n. 1-2-3 (2025), Indicatori di Anomalia D.M. 16/08/2023 e Check-list Guardia di Finanza.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={scaricaAutovalutazioneStudioPdf} className="shrink-0 bg-white border-purple-300 text-purple-800">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Stampa Modello AV1 Studio
              </Button>
            </div>

            {/* Mappa Mentale Visuale ad Albero (5 Pilastri) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              {/* Pilastro 1 */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-blue-200 shadow-xs space-y-2">
                <div className="font-bold text-blue-900 text-xs uppercase tracking-wide border-b border-blue-100 pb-1.5">
                  1. Presidio di Studio (A Monte)
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4">
                  <li><strong>Autovalutazione Rischio Studio (Mod. AV1):</strong> obbligatoria ogni 3 anni (Rischio Inerente 40% + Vulnerabilità 60%).</li>
                  <li><strong>Organizzazione &amp; Formazione:</strong> attestati formazione continua AML titolare/collaboratori.</li>
                  <li><strong>Conservazione (Reg. Tecnica 3):</strong> archivio informatico/cartaceo per <strong>10 anni</strong> dalla chiusura del rapporto.</li>
                </ul>
              </div>

              {/* Pilastro 2 */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-emerald-200 shadow-xs space-y-2">
                <div className="font-bold text-emerald-900 text-xs uppercase tracking-wide border-b border-emerald-100 pb-1.5">
                  2. Filtro Prestazioni (Esenti vs AVC)
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4">
                  <li><strong className="text-emerald-700">ESENTI da Scheda Rischio:</strong> 730/CAF/IMU/INPS (Tab. 1), mera elaborazione <strong>Buste Paga/LUL</strong> (art. 17 co. 7), mera dichiarazione <strong>Forfettari</strong> senza contabilità.</li>
                  <li><strong className="text-indigo-700">SOGGETTE ad AVC:</strong> <strong>Tenuta Contabilità</strong> (Rischio Inerente = 3), <strong>Bilanci</strong>, <strong>Consulenza continuativa/straordinaria</strong> (es. verbali ITL, societario), <strong>Successioni</strong>.</li>
                </ul>
              </div>

              {/* Pilastro 3 */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-indigo-200 shadow-xs space-y-2">
                <div className="font-bold text-indigo-900 text-xs uppercase tracking-wide border-b border-indigo-100 pb-1.5">
                  3. Fascicolo Cliente (Contabilità/SRL)
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4">
                  <li><strong>Mandato professionale</strong> + <strong>Privacy GDPR</strong>.</li>
                  <li><strong>Documento d&apos;identità</strong> valido + <strong>Visura Camerale</strong> (e Statuto per SRL/Consorzi).</li>
                  <li><strong>Mod. AV4 (Dichiarazione Cliente):</strong> scopo/natura, <strong>Titolare Effettivo</strong> (&gt;25% o controllo) e verifica <strong>PEP</strong>.</li>
                  <li><strong>Mod. AV2 (Matrice CNDCEC):</strong> 70% Rischio Specifico + 30% Rischio Inerente.</li>
                </ul>
              </div>

              {/* Pilastro 4 */}
              <div className="p-3.5 bg-amber-50/50 rounded-xl border-2 border-amber-300 shadow-xs space-y-2">
                <div className="font-bold text-amber-950 text-xs uppercase tracking-wide border-b border-amber-200 pb-1.5">
                  4. Rischi Contabilità &amp; Bilanci
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-700 list-disc pl-4">
                  <li><strong>Contante ≥ 5.000 € (art. 49/51):</strong> obbligo comunicazione al MEF entro 30 gg.</li>
                  <li><strong>Cassa Contanti anomala:</strong> cassa negativa o saldo contante gonfiato/irrealistico.</li>
                  <li><strong>Finanziamenti Soci (SRL):</strong> verificare tracciabilità, verbali e capacità finanziaria del socio.</li>
                  <li><strong>Fatture false / Cartiere:</strong> descrizioni generiche, importi tondi, crediti d&apos;imposta fittizi.</li>
                  <li><strong>Bilanci:</strong> perdite coperte in contanti, cambi repentini amministratore (&ldquo;testa di legno&rdquo;).</li>
                </ul>
              </div>

              {/* Pilastro 5 */}
              <div className="p-3.5 bg-white rounded-xl border-2 border-red-200 shadow-xs space-y-2">
                <div className="font-bold text-red-900 text-xs uppercase tracking-wide border-b border-red-100 pb-1.5">
                  5. Controllo Costante, SOS &amp; MEF
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 list-disc pl-4">
                  <li><strong>Periodicità Controllo Costante:</strong> ogni <strong>36 mesi</strong> (Rischio Basso/Non signif.), <strong>24 mesi</strong> (Medio), <strong>6-12 mesi</strong> (Alto/PEP).</li>
                  <li><strong>Obbligo di Astensione (art. 42):</strong> se impossibile identificare cliente o Titolare Effettivo.</li>
                  <li><strong>SOS all&apos;UIF (art. 35):</strong> segnalazione operazioni sospette (con divieto assoluto di comunicarlo al cliente).</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pannello Vademecum Regolarizzazione Studio (Guida Operativa Antiriciclaggio di Studio — 5 Sezioni) */}
      {mostraGuida && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 shadow-sm">
          <CardContent className="p-5 space-y-4 text-xs text-slate-700">
            <div className="flex items-start justify-between gap-4 border-b border-indigo-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Guida Operativa Antiriciclaggio di Studio (D.Lgs. 231/2007 — Regole Tecniche CNDCEC &amp; CNOCDL)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Manuale procedurale in 5 sezioni integrato nel gestionale: Perimetro prestazioni, Autovalutazione Studio (Mod. AV.0 — scad. 27/05/2026), Semplificazione Contabile Tabella A/4, Piano in 5 Passaggi e Fascicoli RT n. 3.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={scaricaAutovalutazioneStudioPdf} className="shrink-0 bg-white border-indigo-300 text-indigo-700">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Scarica Autovalutazione Studio (Mod. AV.0)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Gruppo A · ZONA 1 (730 / CAF / Patronato)</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ESENTI DA AVC</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Mera redazione/invio 730, Mod. Redditi PF, IMU, Patronato (NASpI, Maternità, Dimissioni):</strong> esenti da AVC ex <em>art. 17 co. 7 D.Lgs. 231/2007</em>. Nessun fascicolo AVC ({statistiche.totalePrivatiCaf} privati separati automaticamente).
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Gruppo A · ZONA 2 (Paghe, Redditi, Successioni)</span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">ESENTI SCHEDA (Art. 17 c.7)</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Elaborazione buste paga L. 12/1979, Mera redazione Mod. Redditi/IRAP/770 (Forfettari) e Successioni isolate:</strong> esenti da fascicolo AVC (regola di condotta). Conservazione documenti fiscali/ID e obbligo generale di <strong>SOS</strong>.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span>Gruppo B · ZONA 3 (Contabilità, Bilanci, Consulenza)</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">SOGGETTE AD AVC (Grado 3)</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Tenuta contabilità (Ditte, Soc. Persone, SRL, Consorzi), Consulenza continuativa/bilanci (Grado 3) e Consulenza lavoro straordinaria (Grado 2/3):</strong> obbligatori <strong>Mod. AV.1, AV.2, AV.3, AV.4, AV.7</strong> e conservazione 10 anni.
                </p>
              </div>
            </div>

            {/* Piano Operativo in 5 Passaggi + Struttura a 2 Livelli RT n. 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-indigo-200 space-y-1.5">
                <div className="font-bold text-indigo-950 text-xs">
                  4. Piano Operativo di Regolarizzazione in 5 Passaggi (Attivo nel Gestionale)
                </div>
                <ol className="text-[11px] text-slate-600 space-y-1 list-decimal pl-4">
                  <li><strong>Cernita Anagrafiche:</strong> separazione automatica tra <em>Gruppo A (Esenti: ZONA 1 + ZONA 2)</em> e <em>Gruppo B (Soggetti ad AVC: ZONA 3)</em>.</li>
                  <li><strong>Inizializzazione Posizioni:</strong> importazione dati anagrafici e codici prestazione CNDCEC/CNOCDL.</li>
                  <li><strong>Sanatoria al Primo Contatto Utile:</strong> stampa con 1 click di <strong>Mod. AV.4</strong> (da far firmare) e <strong>Mod. AV.1</strong> (Semplificazione Tabella A / 4).</li>
                  <li><strong>Registrazione Titolare Effettivo &amp; PEP:</strong> criterio a cascata (&gt;25% quote → controllo → legale rappr.) e upload <strong>Visura Camerale</strong>.</li>
                  <li><strong>Scadenzario Automatico (Mod. AV.7):</strong> rinnovo automatico a <strong>36 mesi</strong> (Non/Poco signif.), <strong>24 mesi</strong> (Abbastanza signif.), <strong>12/6 mesi</strong> (Molto signif./PEP).</li>
                </ol>
              </div>

              <div className="p-3 bg-white rounded-lg border border-blue-200 space-y-1.5">
                <div className="font-bold text-blue-950 text-xs">
                  5. Conservazione Decennale e Struttura dei Fascicoli a 2 Livelli (RT n. 3)
                </div>
                <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                  <li>
                    <strong>Fascicolo Generale di Studio (Trasversale):</strong> Documento di Autovalutazione del Rischio (<strong>Modello AV.0</strong> — prossima scadenza CSF: <strong>27 maggio 2026</strong>), attestati di formazione del personale e procedure organizzative interne.
                  </li>
                  <li>
                    <strong>Fascicolo Specifico del Cliente (Individuale — 10 anni):</strong> Documento d&apos;identità e C.F. (Cliente, Esecutore, TE), <strong>Visura Camerale</strong> / estratto Registro TE, <strong>Mod. AV.4</strong> sottoscritto, <strong>Mod. AV.1</strong> (Rischio Effettivo), <strong>Mod. AV.2</strong> (Check-list), <strong>Mod. AV.3</strong> (Istruttoria) e <strong>Mod. AV.7</strong> (Controllo costante).
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🤖 BOT RAGGRUPPAMENTO AUTOMATICO IN ZONA 1 · ZONA 2 · ZONA 3 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div
          onClick={() => {
            setZonaFiltro('TUTTE')
            setSoloPiva(true)
          }}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            zonaFiltro === 'TUTTE'
              ? 'border-blue-600 bg-blue-50/70 shadow-sm'
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Tutte le Aziende P.IVA
            </span>
            <Badge className="bg-blue-600 text-white text-[10px]">ZONA 2 + ZONA 3</Badge>
          </div>
          <div className="text-3xl font-extrabold text-blue-950 mt-1.5">
            {statistiche.totaleCensiti ?? 0}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Tutti i fascicoli aziendali P.IVA monitorati dal Bot ({statistiche.zona3Count ?? 0} in Zona 3 + {statistiche.zona2Count ?? 0} in Zona 2)
          </p>
        </div>

        <div
          onClick={() => {
            setZonaFiltro('ZONA_3')
            setSoloPiva(true)
          }}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            zonaFiltro === 'ZONA_3'
              ? 'border-indigo-600 bg-indigo-50/80 shadow-sm'
              : 'border-indigo-200 bg-white hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-950">
              🔴 ZONA 3 · Soggette AVC
            </span>
            <Badge className="bg-indigo-600 text-white text-[10px]">Obbligo Scheda AV2</Badge>
          </div>
          <div className="text-3xl font-extrabold text-indigo-700 mt-1.5">
            {statistiche.zona3Count ?? 0}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Contabilità, Bilanci, Consulenza straordinaria (es. Verbali ITL), Registro Imprese e Successioni
          </p>
        </div>

        <div
          onClick={() => {
            setZonaFiltro('ZONA_2')
            setSoloPiva(true)
          }}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            zonaFiltro === 'ZONA_2'
              ? 'border-amber-500 bg-amber-50/80 shadow-sm'
              : 'border-amber-200 bg-white hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
              🟡 ZONA 2 · Solo Paghe / Forfettari
            </span>
            <Badge className="bg-amber-500 text-white text-[10px]">Esente Scheda · Presidio SOS</Badge>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 mt-1.5">
            {statistiche.zona2Count ?? 0}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Mera elaborazione Buste Paga/LUL (art. 17 co. 7) e Forfettari senza contabilità (solo ID + SOS)
          </p>
        </div>

        <div
          onClick={() => {
            setZonaFiltro('ZONA_1')
            setSoloPiva(false)
          }}
          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
            zonaFiltro === 'ZONA_1'
              ? 'border-emerald-600 bg-emerald-50/80 shadow-sm'
              : 'border-emerald-200 bg-white hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-950">
              🟢 ZONA 1 · Privati 730 / CAF
            </span>
            <Badge className="bg-emerald-600 text-white text-[10px]">Esonerati Tab. 1</Badge>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-1.5">
            {statistiche.zona1Count ?? statistiche.totalePrivatiCaf ?? 0}
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Persone fisiche senza P.IVA (Mod. 730, IMU, Redditi PF, Maternità, NASpI, Dimissioni)
          </p>
        </div>
      </div>

      {/* KPI Cards / Monitoraggio Studio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-blue-800">Aziende Censite</div>
            <div className="text-2xl font-bold text-blue-950 mt-1">{statistiche.totaleCensiti}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Soggetti con P.IVA</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-green-800">Fascicoli Regolari</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{statistiche.totaleRegolari}</div>
            <div className="text-[11px] text-green-600 mt-0.5">Verifiche complete</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-amber-800">Doc. In Scadenza</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{statistiche.docInScadenza}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Entro 60 giorni</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-red-800">Doc. Scaduti</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{statistiche.docScaduti}</div>
            <div className="text-[11px] text-red-500 mt-0.5">Da rinnovare subito</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-slate-700">Doc. Non Caricati</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{statistiche.docMancanti}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Senza documento</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-purple-800">Privacy Mancante</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{statistiche.privacyMancante}</div>
            <div className="text-[11px] text-purple-600 mt-0.5">Da far firmare</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra Filtri e Ricerca */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Campo Ricerca */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per ragione sociale, P.IVA, CF, referente o fascicolo..."
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro Settore Studio */}
            <div>
              <Select value={settore} onValueChange={setSettore}>
                <SelectTrigger>
                  <SelectValue placeholder="Settore Studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutte le 6 Discipline</SelectItem>
                  <SelectItem value="PAGHE">1-2. Paghe, LUL &amp; Consulenza Lavoro</SelectItem>
                  <SelectItem value="CONTABILITA">3. Contabilità (Ditte / Società / SRL / Consorzi)</SelectItem>
                  <SelectItem value="FORFETTARI">5. Redditi Ditte &amp; Regime Forfettario</SelectItem>
                  <SelectItem value="SUCCESSIONI">6. Dichiarazioni di Successione</SelectItem>
                  <SelectItem value="CAF">4. CAF / 730 / Pratiche INPS (Esonerati)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Stato Documenti */}
            <div>
              <Select value={statoDocumento} onValueChange={setStatoDocumento}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutti i documenti</SelectItem>
                  <SelectItem value="IN_SCADENZA">⚠️ In Scadenza (≤ 60gg)</SelectItem>
                  <SelectItem value="SCADUTO">❌ Solo Scaduti</SelectItem>
                  <SelectItem value="MANCANTE">📄 Documento Mancante</SelectItem>
                  <SelectItem value="VALIDO">✓ Solo Documenti Validi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Rischio */}
            <div>
              <Select value={rischio} onValueChange={setRischio}>
                <SelectTrigger>
                  <SelectValue placeholder="Livello Rischio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutti i rischi</SelectItem>
                  <SelectItem value="BASSO">Rischio Basso</SelectItem>
                  <SelectItem value="MEDIO">Rischio Medio</SelectItem>
                  <SelectItem value="ALTO">Rischio Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opzione Filtro P.IVA */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                checked={soloPiva}
                onChange={(e) => setSoloPiva(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>
                <strong>Escludi soggetti senza Partita IVA</strong> (esclude automaticamente i privati e persone fisiche solo CAF non soggetti ad antiriciclaggio)
              </span>
            </label>

            {statistiche.totalePrivatiCaf > 0 && (
              <span className="text-slate-400">
                ({statistiche.totalePrivatiCaf} privati esclusi dal censimento)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabella Registro Antiriciclaggio */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : aziende.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30 text-blue-400" />
              <p className="text-base font-medium text-gray-600">Nessun cliente trovato con i filtri impostati</p>
              <p className="text-xs text-gray-400 mt-1">
                Tutti i clienti con Partita IVA importati da fatture o creati vengono censiti automaticamente qui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-24">N. Fascicolo</TableHead>
                  <TableHead>Cliente / Ragione Sociale</TableHead>
                  <TableHead>Zona Bot &amp; Settore</TableHead>
                  <TableHead>Legale Rappresentante</TableHead>
                  <TableHead>Documenti, Visura &amp; Firme (AV.2)</TableHead>
                  <TableHead>Rischio CNDCEC</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni &amp; Stampe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aziende.map((az, idx) => {
                  const fascicolo = az.antiriciclaggioFascicolo || `ARC-${String(idx + 1).padStart(3, '0')}`
                  const oggiTime = Date.now()
                  const scadenzaTime = az.documentoScadenza ? new Date(az.documentoScadenza).getTime() : null
                  const isScaduto = scadenzaTime ? scadenzaTime < oggiTime : false
                  const isInScadenza = scadenzaTime && !isScaduto ? (scadenzaTime - oggiTime) / (1000 * 60 * 60 * 24) <= 60 : false

                  const rischioUpper = (az.antiriciclaggioRischio || 'BASSO').toUpperCase()
                  const rischioColor = rischioUpper.includes('ALTO')
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : rischioUpper.includes('MEDIO')
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-green-100 text-green-800 border-green-300'

                  return (
                    <TableRow key={az.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-bold text-blue-700">
                        {fascicolo}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/aziende/${az.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600 hover:underline inline-flex items-center gap-1 group"
                          title="Apri scheda anagrafica cliente"
                        >
                          <span>{az.ragioneSociale}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                        </Link>
                        <div className="text-xs text-gray-500 font-mono">
                          {az.partitaIva ? `P.I. ${az.partitaIva}` : ''}
                          {az.codiceFiscale ? ` · CF ${az.codiceFiscale}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {az.botValutazione?.zona === 'ZONA_3' ? (
                              <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] py-0 px-1.5">
                                🔴 ZONA 3 · AVC
                              </Badge>
                            ) : az.botValutazione?.zona === 'ZONA_2' ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] py-0 px-1.5">
                                🟡 ZONA 2 · Paghe/Forf.
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-0 px-1.5">
                                🟢 ZONA 1 · Esente
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] bg-slate-50">
                              {az.settoreAttivita || 'CONTABILITA'}
                            </Badge>
                          </div>
                          {az.botValutazione?.zona === 'ZONA_3' ? (
                            <span className="block text-[10px] font-semibold text-indigo-700" title={az.botValutazione?.motivoBot}>
                              ● Obbligo AV.1+AV.2+AV.3+AV.4+AV.7
                            </span>
                          ) : az.botValutazione?.zona === 'ZONA_2' ? (
                            <span className="block text-[10px] font-medium text-amber-800" title={az.botValutazione?.motivoBot}>
                              ○ Esente Scheda (Solo ID + SOS)
                            </span>
                          ) : (
                            <span className="block text-[10px] text-emerald-700">
                              Esonerato Tab. 1 CNDCEC
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {az.legaleRappresentante || az.referente || '—'}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const docs: any[] = Array.isArray(az.documents) ? az.documents : []
                          const hasDocIdPdf = docs.some((d) =>
                            ['carta_identita', 'passaporto', 'patente', 'tessera_sanitaria', 'documenti_identita', 'ci'].includes((d.tipoDoc || '').toLowerCase()) ||
                            d.cartella === 'documenti_identita' ||
                            (d.nomeFile && /(identit|patente|passaporto|ci_)/i.test(d.nomeFile))
                          )
                          const hasVisuraPdf = docs.some((d) =>
                            ['visura', 'visura_camerale', 'visura_catastale', 'visure_catasto'].includes((d.tipoDoc || '').toLowerCase()) ||
                            d.cartella === 'visure_catasto' ||
                            (d.nomeFile && /(visura|camerale|catastale)/i.test(d.nomeFile))
                          )
                          const hasAv4Pdf = docs.some((d) =>
                            ['av4_firmato', 'av4', 'dichiarazione_av4'].includes((d.tipoDoc || '').toLowerCase()) ||
                            (d.nomeFile && /(av4|av\.4)/i.test(d.nomeFile))
                          )

                          return (
                            <div className="space-y-1">
                              {az.documentoNumero ? (
                                <div className="space-y-0.5">
                                  <div className="text-xs font-medium text-slate-900">
                                    🪪 {az.documentoTipo === 'passaporto' ? 'Pass.' : az.documentoTipo === 'patente' ? 'Pat.' : 'C.I.'} {az.documentoNumero}
                                  </div>
                                  {isScaduto ? (
                                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                                      Scaduto il {formatData(az.documentoScadenza)}
                                    </Badge>
                                  ) : isInScadenza ? (
                                    <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5 h-4 hover:bg-amber-600">
                                      Scade il {formatData(az.documentoScadenza)}
                                    </Badge>
                                  ) : (
                                    <span className="text-[10px] text-green-700 block">
                                      ✓ Scad. {formatData(az.documentoScadenza)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic block">🪪 ID non inserito</span>
                              )}
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                <span
                                  onClick={() => apriFascicolo(az.id)}
                                  className={`cursor-pointer text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                                    hasDocIdPdf
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                                  }`}
                                  title="Clicca per caricare o visualizzare il PDF/Foto del Documento d'Identità"
                                >
                                  {hasDocIdPdf ? '✓ PDF ID' : '+ PDF ID'}
                                </span>
                                <span
                                  onClick={() => apriFascicolo(az.id)}
                                  className={`cursor-pointer text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                                    hasVisuraPdf
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                                  }`}
                                  title="Clicca per caricare o visualizzare la Visura Camerale CCIAA"
                                >
                                  {hasVisuraPdf ? '✓ Visura' : '+ Visura'}
                                </span>
                                <span
                                  onClick={() => apriFascicolo(az.id)}
                                  className={`cursor-pointer text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                                    hasAv4Pdf
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-300'
                                  }`}
                                  title="Clicca per stampare il modulo AV.4 da far firmare o caricare il PDF firmato dal cliente"
                                >
                                  {hasAv4Pdf ? '✓ AV.4 Firmato' : '+ AV.4'}
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Badge variant="outline" className={`text-xs ${rischioColor}`}>
                            {rischioUpper}
                          </Badge>
                          {az.botValutazione?.rischioEffettivo && (
                            <div className="text-[10px] font-mono text-slate-500">
                              Indice: {az.botValutazione.rischioEffettivo.toFixed(2)}/4,00
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {az.privacyFirmata ? (
                          <Badge variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 text-[11px]">
                            ✓ Firmata
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 text-slate-500 text-[11px]">
                            Da firmare
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={az.antiriciclaggioStato === 'REGOLARE' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {az.antiriciclaggioStato === 'REGOLARE' ? 'Regolare' : 'Da Verificare'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => apriFascicolo(az.id)}
                            className="h-8 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50 font-medium"
                            title="Apri Cassetto Documentale (Documento d'Identità, Visura Camerale, AV.4 Firmato) e modifica fascicolo"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Fascicolo &amp; Doc.
                          </Button>

                          <Link href={`/aziende/${az.id}`} title="Scheda anagrafica completa cliente">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-700 hover:text-amber-900 hover:bg-amber-50"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=mandato`, '_blank')}
                            title="Stampa Lettera d'Incarico / Mandato Professionale Studio Tuzio (con Delega LUL/F24, Policy Privacy, Tariffario e Inquadramento Antiriciclaggio)"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-1.5 text-[10px] font-bold text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=f24`, '_blank')}
                            title="Stampa Allegato A — Autorizzazione alla trasmissione telematica dei modelli di versamento unificato F24 (Servizio Entratel)"
                          >
                            F24
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=valutazione`, '_blank')}
                            title="Scarica Modelli Ufficiali CNDCEC AV.1 + AV.2 + AV.3 + AV.7 — Fascicolo Professionista (PDF)"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=dichiarazione`, '_blank')}
                            title="Scarica Modello Ufficiale CNDCEC AV.4 — Dichiarazione Cliente da far firmare con Allegato Note 1-4 (PDF)"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleEliminaCliente(az)}
                            title="Elimina o archivia cliente dal gestionale"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Fascicolo Antiriciclaggio */}
      <AntiriciclaggioDettaglioModal
        aziendaId={selectedAziendaId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={caricaDati}
      />
    </div>
  )
}
