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
  const [soloPiva, setSoloPiva] = React.useState(true)

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
        soloPiva: String(soloPiva),
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
  }, [cerca, settore, statoFascicolo, rischio, statoDocumento, soloPiva, toast])

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

      {/* Pannello Vademecum Regolarizzazione Studio (6 Discipline CNDCEC 2025 & Guardia di Finanza) */}
      {mostraGuida && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/50 shadow-sm">
          <CardContent className="p-5 space-y-4 text-xs text-slate-700">
            <div className="flex items-start justify-between gap-4 border-b border-indigo-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Piano Operativo di Regolarizzazione Antiriciclaggio Studio (Regole Tecniche CNDCEC &amp; CdL 2025)
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Inquadramento automatico delle 6 discipline dello Studio Dott. Antonio Tuzio ai sensi del D.Lgs. 231/2007 (mod. D.Lgs. 90/2017) e prassi ispettiva Guardia di Finanza.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={scaricaAutovalutazioneStudioPdf} className="shrink-0 bg-white border-indigo-300 text-indigo-700">
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Scarica Autovalutazione Studio (Mod. AV1)
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-emerald-800 flex items-center justify-between">
                  <span>Discipline 4 (730 / CAF / INPS)</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">ESONERATE</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Mod. 730, Redditi PF, IMU, Maternità, NASpI, Dimissioni online:</strong> ai sensi della <em>Tabella 1 Regola Tecnica n. 2 CNDCEC</em> sono <strong>escluse dagli obblighi di adeguata verifica</strong>. Il programma separa automaticamente i {statistiche.totalePrivatiCaf} clienti privati senza P.IVA per non inquinare il Registro Antiriciclaggio.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Discipline 1, 2 e 5 (Paghe &amp; Forfettari)</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">VERIFICA SEMPLIFICATA</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Elaborazione Buste Paga/LUL, Consulenza Lavoro (art. 17 co. 7) e Regime Forfettario:</strong> rischio inerente <em>Non Significativo (1,00)</em>. Richiedono fascicolo numerato (`ARC-2026-NNN`), documento d&apos;identità valido e revisione ogni <strong>36 mesi</strong>.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="font-bold text-indigo-900 flex items-center justify-between">
                  <span>Discipline 3 e 6 (Contabilità, SRL, Successioni)</span>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">VERIFICA ORDINARIA</Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  <strong>Contabilità Ditte/Società/SRL/Consorzi e Successioni:</strong> richiedono <strong>Modello AV4</strong> (Dichiarazione Cliente + <em>Titolare Effettivo</em> per SRL/Consorzi), <strong>Modello AV2</strong> (Scheda Valutazione Rischio Matrice CNDCEC) e copia Carta d&apos;Identità.
                </p>
              </div>
            </div>

            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1.5">
              <div className="text-[11px] text-amber-950">
                <strong>Nota di attenzione (Obbligo SOS &amp; Riattrazione in AVC):</strong>{' '}
                <em>Per le prestazioni esenti non occorre comporre la scheda di rischio cliente, ma <strong>resta sempre fermo l&apos;obbligo di Segnalazione di Operazioni Sospette (SOS)</strong>. Inoltre, l&apos;Adeguata Verifica (AVC) torna obbligatoria anche per i clienti paghe/forfettari qualora vi sia una <strong>consulenza continuativa o straordinaria</strong> (es. assistenza su verbale ispettivo ITL, riorganizzazioni aziendali, contrattazione di 2° livello), un sospetto di riciclaggio o dubbi sull&apos;identità.</em>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <TableHead>Settore</TableHead>
                  <TableHead>Legale Rappresentante</TableHead>
                  <TableHead>Documento d&apos;Identità</TableHead>
                  <TableHead>Rischio</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
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
                          <Badge variant="outline" className="text-xs bg-slate-50">
                            {az.settoreAttivita || 'CONTABILITA'}
                          </Badge>
                          {az.antiriciclaggioPrestazione?.includes('[SOGGETTA AVC]') ? (
                            <span className="block text-[10px] font-semibold text-indigo-700">
                              ● Soggetta AVC (Scheda Rischio)
                            </span>
                          ) : az.antiriciclaggioPrestazione?.includes('[ESENTE') ? (
                            <span className="block text-[10px] font-medium text-emerald-700" title="Esente da scheda di rischio cliente ex art. 17 co. 7 / Tab. 1 CNDCEC, fermo obbligo SOS">
                              ○ Esente Scheda (Solo SOS/ID)
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {az.legaleRappresentante || az.referente || '—'}
                      </TableCell>
                      <TableCell>
                        {az.documentoNumero ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-slate-900">
                              {az.documentoTipo === 'passaporto' ? 'Pass.' : az.documentoTipo === 'patente' ? 'Pat.' : 'C.I.'} {az.documentoNumero}
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
                              <span className="text-[11px] text-green-700 block">
                                ✓ Scad. {formatData(az.documentoScadenza)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Non caricato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${rischioColor}`}>
                          {rischioUpper}
                        </Badge>
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
                            className="h-8 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                            title="Modifica anagrafica e fascicolo antiriciclaggio"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
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
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=valutazione`, '_blank')}
                            title="Scarica Modello AV2 — Scheda Valutazione Rischio CNDCEC (PDF)"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=dichiarazione`, '_blank')}
                            title="Scarica Modello AV4 — Dichiarazione Cliente e Titolare Effettivo (PDF)"
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
