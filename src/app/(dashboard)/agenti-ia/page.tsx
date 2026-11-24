// src/app/(dashboard)/agenti-ia/page.tsx
// Hub Agenti IA Locali dello Studio con Agente Mastro, Apprendimento Continuo e Roadmap Fiscale
// Specifiche Dott. Antonio Tuzio

'use client'

import * as React from 'react'
import {
  Brain,
  Bot,
  Sparkles,
  FileSpreadsheet,
  CreditCard,
  FileText,
  BarChart2,
  ShieldCheck,
  Send,
  Plus,
  RefreshCw,
  CheckCircle2,
  GraduationCap,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { formatData } from '@/lib/utils'

export default function AgentiIaPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [dati, setDati] = React.useState<any>(null)
  const [tab, setTab] = React.useState('squadra')

  // Chat Console Agente Mastro
  const [prompt, setPrompt] = React.useState('')
  const [interrogando, setInterrogando] = React.useState(false)
  const [cronologia, setCronologia] = React.useState<Array<{ quesito: string; risposta: string; motore: string }>>([
    {
      quesito: 'Quali sono i compiti principali della squadra di Agenti IA?',
      risposta: 'L\'Agente Mastro coordina gli specialisti: Contabilità (registri A1/V1 e causale 899 NO IVA), Deleghe F24, Dichiarativi (730, 770, Redditi) e Bilancio CEE. Il sistema è progettato per operare in locale a tutela dei dati dello studio e si auto-perfeziona memorizzando le correzioni e le preferenze del Dottore.',
      motore: 'MOTORE_DETERMINISTICO_STUDIO',
    },
  ])

  // Modale Insegna Regola (Auto-apprendimento)
  const [openModalInsegna, setOpenModalInsegna] = React.useState(false)
  const [salvandoRegola, setSalvandoRegola] = React.useState(false)
  const [formRegola, setFormRegola] = React.useState({
    tipo: 'CONTABILITA',
    chiavePattern: '',
    contoDare: '',
    contoAvere: '',
    registroCodice: 'A1',
    codiceCgn: '',
    istruzioniCustom: '',
  })

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agenti-ia')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDati(json)
    } catch (e: any) {
      toast({ title: 'Errore caricamento IA', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  const handleInviaPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!prompt.trim()) return

    const q = prompt.trim()
    setPrompt('')
    setInterrogando(true)

    try {
      const res = await fetch('/api/agenti-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setCronologia((prev) => [
        ...prev,
        {
          quesito: q,
          risposta: json.risposta,
          motore: json.motore,
        },
      ])
    } catch (err: any) {
      toast({ title: 'Errore consultazione agente', description: err.message, variant: 'destructive' })
    } finally {
      setInterrogando(false)
    }
  }

  const handleSalvaNuovoApprendimento = async () => {
    if (!formRegola.chiavePattern.trim()) {
      toast({ title: 'Inserisci il pattern o fornitore di riferimento', variant: 'destructive' })
      return
    }

    setSalvandoRegola(true)
    try {
      const res = await fetch('/api/agenti-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apprendi',
          tipo: formRegola.tipo,
          chiavePattern: formRegola.chiavePattern.trim(),
          valoreRegola: {
            contoDare: formRegola.contoDare.trim() || undefined,
            contoAvere: formRegola.contoAvere.trim() || undefined,
            registroCodice: formRegola.registroCodice,
            codiceCgn: formRegola.codiceCgn.trim() || undefined,
          },
          istruzioniCustom: formRegola.istruzioniCustom.trim() || 'Regola inserita manualmente dal Dottore',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      toast({ title: '🧠 Regola Appresa con Successo', description: json.messaggio })
      setOpenModalInsegna(false)
      setFormRegola({
        tipo: 'CONTABILITA',
        chiavePattern: '',
        contoDare: '',
        contoAvere: '',
        registroCodice: 'A1',
        codiceCgn: '',
        istruzioniCustom: '',
      })
      caricaDati()
    } catch (err: any) {
      toast({ title: 'Errore salvataggio apprendimento', description: err.message, variant: 'destructive' })
    } finally {
      setSalvandoRegola(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                Hub Agenti IA Studio Tuzio
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-xs">
                  100% IA Locale &amp; Privacy
                </Badge>
              </h2>
              <p className="text-xs text-gray-500">
                Architettura multi-agente ad auto-apprendimento: Agente Mastro, Contabilità, F24, Dichiarativi (730/770/Redditi) e Bilancio CEE.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={caricaDati}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Aggiorna
          </Button>
          <Button
            size="sm"
            onClick={() => setOpenModalInsegna(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
          >
            <GraduationCap className="h-4 w-4 mr-1.5" />
            Insegna Nuova Regola all&apos;IA
          </Button>
        </div>
      </div>

      {/* Riquadro Privacy & IA Locale */}
      <Card className="border-l-4 border-l-emerald-600 bg-gradient-to-r from-emerald-50/40 via-blue-50/20 to-white shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block">Garanzia di Riservatezza &amp; Nessun Dato Fiscale su Server Cloud</span>
              <span className="text-gray-600">
                Gli agenti intelligenti operano in locale sul server Ubuntu dello studio (`docker` + PostgreSQL). Nessun dato di bilancio, fattura o F24 viene ceduto a terzi.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 font-medium">
            <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
              Regole Apprese: <strong>{dati?.statistiche?.totaleRegoleApprese ?? 0}</strong>
            </span>
            <span className="bg-white px-2.5 py-1 rounded border border-gray-200">
              Agenti di Settore: <strong>{dati?.statistiche?.agentiAttivi ?? 6}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Principali */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="squadra" className="gap-1.5 text-xs sm:text-sm">
            <Bot className="h-4 w-4" /> Squadra Agenti ({dati?.agenti?.length ?? 6})
          </TabsTrigger>
          <TabsTrigger value="memoria" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="h-4 w-4" /> Memoria &amp; Regole Apprese ({dati?.memorieApprese?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" /> Roadmap Fiscale &amp; Commercializzazione
          </TabsTrigger>
          <TabsTrigger value="console" className="gap-1.5 text-xs sm:text-sm font-semibold text-blue-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-800">
            <Sparkles className="h-4 w-4 text-blue-600" /> Console Agente Mastro
          </TabsTrigger>
        </TabsList>

        {/* 1. TAB: SQUADRA AGENTI */}
        <TabsContent value="squadra" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(dati?.agenti || []).map((ag: any) => (
              <Card key={ag.id} className="border shadow-sm hover:shadow transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        {ag.id === 'mastro' ? <Brain className="h-4 w-4" /> : ag.id === 'contabilita' ? <FileSpreadsheet className="h-4 w-4" /> : ag.id === 'f24' ? <CreditCard className="h-4 w-4" /> : ag.id === 'dichiarativi' ? <FileText className="h-4 w-4" /> : ag.id === 'bilancio' ? <BarChart2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-gray-900">{ag.nome}</CardTitle>
                        <Badge variant="outline" className="text-[10px] mt-0.5 font-mono">
                          {ag.versione}
                        </Badge>
                      </div>
                    </div>
                    <Badge className={ag.stato === 'ATTIVO' ? 'bg-emerald-100 text-emerald-800 text-[10px]' : 'bg-amber-100 text-amber-800 text-[10px]'}>
                      {ag.stato}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-xs space-y-2 pt-0">
                  <p className="text-gray-600 leading-relaxed">{ag.descrizione}</p>
                  <div className="p-2 bg-gray-50 rounded border text-[11px] text-gray-700">
                    <strong className="block text-gray-900 mb-0.5">Competenza Chiave:</strong>
                    {ag.competenza}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 2. TAB: MEMORIA DI APPRENDIMENTO CONTINUO */}
        <TabsContent value="memoria" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    Regole e Pattern Appresi dallo Studio
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Ogni volta che il Dottore convalida o corregge una riga di prima nota, un fornitore o una causale, l&apos;IA memorizza la decisione per non sbagliare più.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setOpenModalInsegna(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi Pattern
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="border-t overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/75 text-xs">
                      <TableHead className="font-semibold">Tipo Ambito</TableHead>
                      <TableHead className="font-semibold">Chiave Pattern / Fornitore</TableHead>
                      <TableHead className="font-semibold">Regola Appresa</TableHead>
                      <TableHead className="font-semibold text-center w-24">Conferme</TableHead>
                      <TableHead className="font-semibold text-center w-24">Accuratezza</TableHead>
                      <TableHead className="font-semibold">Note / Istruzioni Dottore</TableHead>
                      <TableHead className="font-semibold w-24">Data Agg.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500 text-xs">
                          Caricamento memorie in corso...
                        </TableCell>
                      </TableRow>
                    ) : !dati?.memorieApprese || dati.memorieApprese.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="max-w-md mx-auto text-center space-y-2">
                            <GraduationCap className="h-8 w-8 text-indigo-400 mx-auto" />
                            <h4 className="font-semibold text-gray-800 text-sm">Nessuna regola personalizzata ancora registrata</h4>
                            <p className="text-xs text-gray-500">
                              L&apos;IA apprenderà in automatico man mano che userai la Prima Nota, oppure puoi cliccare su &quot;Insegna Nuova Regola&quot; per istruirla subito.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dati.memorieApprese.map((m: any) => (
                        <TableRow key={m.id} className="text-xs hover:bg-indigo-50/20">
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {m.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold font-mono text-indigo-800">
                            {m.chiavePattern}
                          </TableCell>
                          <TableCell className="text-gray-700 font-mono text-[11px]">
                            {JSON.stringify(m.valoreRegola)}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {m.confermeConteggio}x
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold text-emerald-700">
                              {Math.round(m.accuratezzaScore * 100)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {m.istruzioniCustom || '—'}
                          </TableCell>
                          <TableCell className="text-gray-400 whitespace-nowrap">
                            {formatData(m.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TAB: ROADMAP FISCALE & COMMERCIALIZZAZIONE */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Roadmap di Sviluppo &amp; Pacchetto Software per Commercializzazione
              </CardTitle>
              <CardDescription className="text-xs">
                Stato di avanzamento dei moduli fiscali per trasformare il gestionale in un prodotto completo e commercializzabile per altri studi e commercialisti.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Modulo 1: Contabilità e IVA */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-sm">1. Registri IVA &amp; Prima Nota</span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">100% OPERATIVO</Badge>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Registri A1, AS1, AI1, AR1, V1, V2, C1, CV1, R1. Protocolli progressivi automatici, rinumerazione e scritture NO IVA (Causale 899).
                  </p>
                </div>

                {/* Modulo 2: Deleghe F24 */}
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-sm">2. Modello F24 &amp; Tributi</span>
                    <Badge className="bg-blue-600 text-white text-[10px]">IN SVILUPPO</Badge>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Sezioni Erario (1040, 1001, IVA 6001-6099), INPS dipendenti/gestione separata, Regioni/Comuni, ravvedimento operoso e compensazioni.
                  </p>
                </div>

                {/* Modulo 3: Modello 730 */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 text-sm">3. Modello 730 (Dipendenti/Pensionati)</span>
                    <Badge className="bg-purple-100 text-purple-800 text-[10px]">ROADMAP</Badge>
                  </div>
                  <p className="text-xs text-purple-800 leading-relaxed">
                    Quadri Terreni (A), Fabbricati (B), Redditi di Lavoro Dipendente (C), Oneri e Spese Detraibili/Deducibili (E), Acconti e Ritenute (F).
                  </p>
                </div>

                {/* Modulo 4: Modello Redditi (ex 740, 750, 760) */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-sm">4. Modello Redditi (PF / SP / SC)</span>
                    <Badge className="bg-amber-100 text-amber-800 text-[10px]">ROADMAP</Badge>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Quadro RE (Professionisti cassa), Quadro RG/RF (Imprese semplificate/ordinarie), Quadro LM (Regime Forfettario L. 190/2014).
                  </p>
                </div>

                {/* Modulo 5: Modello 770 & Certificazioni CU */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-900 text-sm">5. Modello 770 &amp; CU</span>
                    <Badge className="bg-rose-100 text-rose-800 text-[10px]">ROADMAP</Badge>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Certificazione Unica lavoratori autonomi e dipendenti, quadri ST e SV per il controllo dei versamenti delle ritenute con modello F24.
                  </p>
                </div>

                {/* Modulo 6: Bilancio CEE */}
                <div className="p-4 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-900 text-sm">6. Bilancio d&apos;Esercizio CEE</span>
                    <Badge className="bg-cyan-100 text-cyan-800 text-[10px]">ROADMAP</Badge>
                  </div>
                  <p className="text-xs text-cyan-800 leading-relaxed">
                    Stato Patrimoniale, Conto Economico a valore della produzione, Rendiconto Finanziario e Nota Integrativa XBRL per Registro Imprese.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. TAB: CONSOLE AGENTE MASTRO */}
        <TabsContent value="console" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
                <Brain className="h-4 w-4 text-blue-600" />
                Interazione Diretta con l&apos;Agente Mastro dello Studio
              </CardTitle>
              <CardDescription className="text-xs">
                Poni qualsiasi quesito su codifiche IVA CGN, reverse charge TD16, F24, 730 o regole contabili. L&apos;agente risponde elaborando la risposta in locale.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Cronologia conversazioni */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {cronologia.map((m, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 font-medium text-blue-950">
                      <strong>Dottore:</strong> {m.quesito}
                    </div>
                    <div className="p-3 bg-white rounded-lg border text-gray-800 leading-relaxed space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1 border-b pb-1">
                        <span className="font-semibold text-indigo-700 flex items-center gap-1">
                          <Bot className="h-3 w-3" /> Agente Mastro
                        </span>
                        <span>Motore: {m.motore}</span>
                      </div>
                      <p className="text-xs whitespace-pre-line">{m.risposta}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleInviaPrompt} className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Es. Come registrare una fattura di pulizie in reverse charge TD16? o Chiarimenti su acconti F24..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="text-xs bg-white"
                  disabled={interrogando}
                />
                <Button
                  type="submit"
                  disabled={interrogando || !prompt.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {interrogando ? 'Analisi...' : 'Invia'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: INSEGNA NUOVA REGOLA ALL'IA (Auto-apprendimento)
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openModalInsegna} onOpenChange={setOpenModalInsegna}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 text-base">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              Insegna una Regola Personalizzata all&apos;IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              Memorizza un criterio contabile o fiscale specifico dello studio. L&apos;IA applicherà automaticamente questa regola quando rileverà il fornitore o pattern.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-tipo">Ambito Regola</Label>
                <Select
                  value={formRegola.tipo}
                  onValueChange={(v) => setFormRegola({ ...formRegola, tipo: v })}
                >
                  <SelectTrigger id="reg-tipo" className="text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTABILITA">Contabilità &amp; Prima Nota</SelectItem>
                    <SelectItem value="FISCALE_F24">Deleghe F24 &amp; Tributi</SelectItem>
                    <SelectItem value="DICHIARATIVI">Dichiarativi (730 / 770)</SelectItem>
                    <SelectItem value="BILANCIO">Bilancio CEE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-pat">Pattern / P.IVA Fornitore / Parola Chiave *</Label>
                <Input
                  id="reg-pat"
                  placeholder="es. 01234567890 o ENEL ENERGIA"
                  value={formRegola.chiavePattern}
                  onChange={(e) => setFormRegola({ ...formRegola, chiavePattern: e.target.value })}
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-dare">Conto Dare Associato</Label>
                <Input
                  id="reg-dare"
                  placeholder="es. 30.02.01 Spese Energia Elettrica"
                  value={formRegola.contoDare}
                  onChange={(e) => setFormRegola({ ...formRegola, contoDare: e.target.value })}
                  className="text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-avere">Conto Avere Associato</Label>
                <Input
                  id="reg-avere"
                  placeholder="es. 20.01.01 Debiti v/Fornitori"
                  value={formRegola.contoAvere}
                  onChange={(e) => setFormRegola({ ...formRegola, contoAvere: e.target.value })}
                  className="text-xs bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="reg-reg">Registro IVA Target</Label>
                <Select
                  value={formRegola.registroCodice}
                  onValueChange={(v) => setFormRegola({ ...formRegola, registroCodice: v })}
                >
                  <SelectTrigger id="reg-reg" className="text-xs bg-white font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1">A1 — Acquisti Ordinari</SelectItem>
                    <SelectItem value="AR1">AR1 — Acquisti Reverse Charge</SelectItem>
                    <SelectItem value="AI1">AI1 — Acquisti Intra UE</SelectItem>
                    <SelectItem value="V1">V1 — Vendite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-cgn">Codice IVA CGN Proposto</Label>
                <Input
                  id="reg-cgn"
                  placeholder="es. A1706A o FORF o NO_IVA"
                  value={formRegola.codiceCgn}
                  onChange={(e) => setFormRegola({ ...formRegola, codiceCgn: e.target.value })}
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <Label htmlFor="reg-note">Istruzione Specifica del Dottore</Label>
              <Input
                id="reg-note"
                placeholder="es. Imputare sempre a costo deducibile al 100% per attività studio..."
                value={formRegola.istruzioniCustom}
                onChange={(e) => setFormRegola({ ...formRegola, istruzioniCustom: e.target.value })}
                className="text-xs bg-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenModalInsegna(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSalvaNuovoApprendimento}
              disabled={salvandoRegola}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
            >
              {salvandoRegola ? 'Salvataggio...' : 'Memorizza Regola'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
