// src/components/contabilita/AziendaContabilitaTab.tsx
// Modulo Contabilità, Prima Nota, Liquidazione IVA e Piano dei Conti del cliente

'use client'

import * as React from 'react'
import {
  BookOpen,
  Plus,
  Receipt,
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
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
import { formatEuro, formatData } from '@/lib/utils'
import { TABELLA_IVA_CGN, CodificaIvaCGN, trovaCodificaCgn } from '@/lib/cgn-tabelle-iva'

interface AziendaContabilitaTabProps {
  aziendaId: string
  aziendaNome: string
  partitaIva?: string | null
  regimeContabile?: string | null
  periodicitaIva?: string | null
  codiceAteco?: string | null
  onDatiAggiornati?: () => void
}

export function AziendaContabilitaTab({
  aziendaId,
  aziendaNome,
  partitaIva,
  regimeContabile,
  periodicitaIva,
  codiceAteco,
  onDatiAggiornati,
}: AziendaContabilitaTabProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [datiContabili, setDatiContabili] = React.useState<any>(null)
  const [sottoTab, setSottoTab] = React.useState('prima-nota')
  const [cgnFiltroAmbito, setCgnFiltroAmbito] = React.useState<string>('TUTTI')
  const [cgnRicerca, setCgnRicerca] = React.useState<string>('')

  // Modale Nuova Registrazione Prima Nota
  const [openModalNuova, setOpenModalNuova] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [formPN, setFormPN] = React.useState({
    dataRegistrazione: new Date().toISOString().split('T')[0],
    dataCompetenza: new Date().toISOString().split('T')[0],
    numeroDocumento: '',
    dataDocumento: '',
    descrizione: '',
    contoDareCodice: '',
    contoDareNome: '',
    contoAvereCodice: '',
    contoAvereNome: '',
    importoDare: '',
    importoAvere: '',
    tipoRegistro: 'GENERALE',
    aliquotaIva: '22',
    impostaIva: '',
    reverseCharge: false,
    note: '',
  })

  const caricaContabilita = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita`)
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      setDatiContabili(dati)
    } catch (e: any) {
      toast({ title: 'Errore contabilità', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [aziendaId, toast])

  React.useEffect(() => {
    caricaContabilita()
  }, [caricaContabilita])

  const handleSalvaPrimaNota = async () => {
    if (!formPN.descrizione.trim()) {
      toast({ title: 'Inserisci la causale / descrizione operazione', variant: 'destructive' })
      return
    }
    const impDare = parseFloat(formPN.importoDare) || 0
    const impAvere = parseFloat(formPN.importoAvere) || 0
    if (impDare <= 0 && impAvere <= 0) {
      toast({ title: 'Inserisci un importo valido in Dare o in Avere', variant: 'destructive' })
      return
    }

    setSalvando(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPN),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)

      toast({ title: '✅ Registrazione di Prima Nota salvata' })
      setOpenModalNuova(false)
      setFormPN({
        dataRegistrazione: new Date().toISOString().split('T')[0],
        dataCompetenza: new Date().toISOString().split('T')[0],
        numeroDocumento: '',
        dataDocumento: '',
        descrizione: '',
        contoDareCodice: '',
        contoDareNome: '',
        contoAvereCodice: '',
        contoAvereNome: '',
        importoDare: '',
        importoAvere: '',
        tipoRegistro: 'GENERALE',
        aliquotaIva: '22',
        impostaIva: '',
        reverseCharge: false,
        note: '',
      })
      caricaContabilita()
      onDatiAggiornati?.()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio prima nota', description: e.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleEliminaEntry = async (id: string) => {
    if (!confirm('Eliminare questa riga di prima nota?')) return
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita?entryId=${id}`, {
        method: 'DELETE',
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: 'Registrazione eliminata' })
      caricaContabilita()
    } catch (e: any) {
      toast({ title: 'Errore eliminazione', description: e.message, variant: 'destructive' })
    }
  }

  const regimeAttuale = datiContabili?.azienda?.regimeContabile || regimeContabile || 'SEMPLIFICATO'
  const periodicitaAttuale = datiContabili?.azienda?.periodicitaIva || periodicitaIva || 'TRIMESTRALE'

  return (
    <div className="space-y-6">
      {/* Intestazione Contabile Cliente */}
      <Card className="border-l-4 border-l-blue-600 shadow-sm bg-gradient-to-r from-blue-50/40 to-white">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Gestione Contabilità Studio — {aziendaNome}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                P.IVA: <span className="font-semibold text-gray-800">{partitaIva || 'Mancante'}</span> • Codice ATECO: <span className="font-semibold text-gray-800">{codiceAteco || datiContabili?.azienda?.codiceAteco || 'Non impostato'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs py-1 px-2.5 font-medium">
                Regime: {regimeAttuale}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs py-1 px-2.5 font-medium">
                IVA: {periodicitaAttuale}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={caricaContabilita}
                className="text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Ricarica
              </Button>
              <Button
                size="sm"
                onClick={() => setOpenModalNuova(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
              >
                <Plus className="h-4 w-4 mr-1" /> Nuova Scrittura Prima Nota
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sotto-Tabs: Prima Nota | Liquidazione IVA | Piano dei Conti | Flussi AdE */}
      <Tabs value={sottoTab} onValueChange={setSottoTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="prima-nota" className="gap-1.5 text-xs sm:text-sm">
            <FileSpreadsheet className="h-4 w-4" /> Prima Nota ({datiContabili?.primaNota?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="liquidazione-iva" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" /> Liquidazione IVA Periodica & Annuale
          </TabsTrigger>
          <TabsTrigger value="piano-conti" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="h-4 w-4" /> Piano dei Conti ({datiContabili?.pianoConti?.nome?.split('(')[0]?.trim() || 'Modello'})
          </TabsTrigger>
          <TabsTrigger value="flussi-ade" className="gap-1.5 text-xs sm:text-sm">
            <ShieldCheck className="h-4 w-4" /> Fatture AdE &amp; Reverse Charge
          </TabsTrigger>
          <TabsTrigger value="tabelle-cgn" className="gap-1.5 text-xs sm:text-sm font-medium text-indigo-700 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-800">
            <BookOpen className="h-4 w-4 text-indigo-600" /> Tabelle IVA CGN &amp; SDI
          </TabsTrigger>
        </TabsList>

        {/* 1. TAB: PRIMA NOTA */}
        <TabsContent value="prima-nota" className="space-y-4">
          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/75 text-xs">
                  <TableHead className="font-semibold">Data Reg.</TableHead>
                  <TableHead className="font-semibold">N. Doc / Data</TableHead>
                  <TableHead className="font-semibold">Causale / Descrizione Operazione</TableHead>
                  <TableHead className="font-semibold">Registro</TableHead>
                  <TableHead className="font-semibold">Conto Dare</TableHead>
                  <TableHead className="font-semibold">Conto Avere</TableHead>
                  <TableHead className="font-semibold text-right">Importo Dare</TableHead>
                  <TableHead className="font-semibold text-right">Importo Avere</TableHead>
                  <TableHead className="font-semibold text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Caricamento prima nota in corso...
                    </TableCell>
                  </TableRow>
                ) : !datiContabili?.primaNota || datiContabili.primaNota.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="max-w-md mx-auto text-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                          <FileSpreadsheet className="h-6 w-6" />
                        </div>
                        <h4 className="font-semibold text-gray-800">Nessuna registrazione di Prima Nota</h4>
                        <p className="text-sm text-gray-500">
                          Non sono ancora presenti scritture contabili manuali o automatiche per questo cliente.
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setOpenModalNuova(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Aggiungi Prima Registrazione
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  datiContabili.primaNota.map((entry: any) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50/50 text-xs">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatData(entry.dataRegistrazione)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-600">
                        {entry.numeroDocumento ? `Doc. ${entry.numeroDocumento}` : '—'}
                        {entry.dataDocumento && (
                          <span className="block text-[11px] text-gray-400">
                            del {formatData(entry.dataDocumento)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                        {entry.descrizione}
                        {entry.reverseCharge && (
                          <Badge variant="outline" className="ml-2 text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Reverse Charge
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {entry.tipoRegistro || 'GENERALE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {entry.contoDareNome || entry.contoDareCodice || '—'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {entry.contoAvereNome || entry.contoAvereCodice || '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {Number(entry.importoDare) > 0 ? formatEuro(entry.importoDare) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {Number(entry.importoAvere) > 0 ? formatEuro(entry.importoAvere) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminaEntry(entry.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* 2. TAB: LIQUIDAZIONE IVA PERIODICA & ANNUALE */}
        <TabsContent value="liquidazione-iva" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  IVA a Debito (Vendite / Fatture Emesse)
                </p>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {formatEuro(datiContabili?.liquidazioneIva?.totaleIvaDebito || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  su Imponibile {formatEuro(datiContabili?.liquidazioneIva?.totaleImponibileVendite || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  IVA a Credito Detraibile (Acquisti)
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatEuro(datiContabili?.liquidazioneIva?.totaleIvaCredito || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  su Imponibile {formatEuro(datiContabili?.liquidazioneIva?.totaleImponibileAcquisti || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${(datiContabili?.liquidazioneIva?.saldoIva || 0) > 0 ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Saldo Periodo ({periodicitaAttuale})
                </p>
                <p className={`text-2xl font-bold mt-1 ${(datiContabili?.liquidazioneIva?.saldoIva || 0) > 0 ? 'text-amber-600' : 'text-blue-600'}`}>
                  {formatEuro(Math.abs(datiContabili?.liquidazioneIva?.saldoIva || 0))}
                </p>
                <p className="text-xs font-medium mt-0.5">
                  {(datiContabili?.liquidazioneIva?.saldoIva || 0) > 0 ? (
                    <span className="text-amber-600 font-semibold">Da versare all&apos;Erario (F24)</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Credito IVA da compensare</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Periodicità & Regime
                </p>
                <p className="text-lg font-bold text-purple-900 mt-1 truncate">
                  {periodicitaAttuale}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Modello Dichiarazione IVA Annuale integrato
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Prospetto Liquidazione IVA Annuale e Trimestrale</span>
                <Badge variant="outline" className="text-xs font-normal">
                  Fuso orario: Europe/Rome
                </Badge>
              </CardTitle>
              <CardDescription>
                Calcolo automatico per adempimento periodico LIPE e quadro VH/VL della dichiarazione annuale IVA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg border text-sm space-y-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">1. Totale IVA esigibile sulle operazioni attive (Registro Fatture Emesse / Corrispettivi):</span>
                  <span className="font-semibold text-gray-900">{formatEuro(datiContabili?.liquidazioneIva?.totaleIvaDebito || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">2. Totale IVA detratta sugli acquisti (Registro Fatture d&apos;Acquisto Passive):</span>
                  <span className="font-semibold text-emerald-600">- {formatEuro(datiContabili?.liquidazioneIva?.totaleIvaCredito || 0)}</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span className="text-gray-600">3. Credito d&apos;imposta periodo precedente (compensabile):</span>
                  <span className="font-semibold text-gray-700">0,00 €</span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold">
                  <span>RISULTATO LIQUIDAZIONE IVA:</span>
                  <span className={(datiContabili?.liquidazioneIva?.saldoIva || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    {(datiContabili?.liquidazioneIva?.saldoIva || 0) > 0
                      ? `${formatEuro(datiContabili.liquidazioneIva.saldoIva)} (A DEBITO)`
                      : `${formatEuro(Math.abs(datiContabili?.liquidazioneIva?.saldoIva || 0))} (A CREDITO)`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TAB: PIANO DEI CONTI */}
        <TabsContent value="piano-conti" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    {datiContabili?.pianoConti?.nome || 'Piano dei Conti per Regime'}
                  </CardTitle>
                  <CardDescription>
                    Mappatura conti personalizzata per regime fiscale ({regimeAttuale}). Il Dottore fornirà a breve i piani dei conti specifici personalizzati dello studio.
                  </CardDescription>
                </div>
                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {datiContabili?.pianoConti?.tipo || 'STANDARD'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {datiContabili?.pianoConti?.sezioni?.map((sez: any) => (
                <div key={sez.codice} className="border rounded-lg p-4 bg-gray-50/50 space-y-2">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded font-mono">
                      {sez.codice}
                    </span>
                    {sez.nome}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                    {sez.conti?.map((c: any) => (
                      <div
                        key={c.codice}
                        className="bg-white p-2.5 rounded border flex items-center justify-between text-xs hover:border-indigo-300 transition-colors"
                      >
                        <div>
                          <span className="font-mono font-semibold text-indigo-600 mr-2">{c.codice}</span>
                          <span className="text-gray-800">{c.nome}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-gray-500">
                          Attivo
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. TAB: FATTURE ADE & REVERSE CHARGE */}
        <TabsContent value="flussi-ade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Flussi Automatici Agenzia delle Entrate & Reverse Charge
              </CardTitle>
              <CardDescription>
                Download automatico e importazione delle fatture attive, passive e corrispettivi dal cassetto fiscale AdE direttamente all&apos;interno del database unificato.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-sm text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Modulo Pronto per Integrazione Canale AdE / Hub Studio
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Tutti i documenti contabili del cliente ({aziendaNome}) confluiscono nello stesso database dello studio senza necessità di programmi o archivi esterni. Le fatture di acquisto con <strong>Reverse Charge</strong> o autofatture elettroniche (tipo TD16, TD17, TD18, TD19) vengono identificate automaticamente per l&apos;integrazione nei registri IVA e nella prima nota.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="border p-3 rounded-lg bg-gray-50">
                  <span className="font-semibold block text-gray-800">1. Fatture Emesse (Clienti)</span>
                  <span className="text-gray-500 mt-1 block">Scaricate in automatico e contabilizzate a ricavo (Merci / Servizi).</span>
                </div>
                <div className="border p-3 rounded-lg bg-gray-50">
                  <span className="font-semibold block text-gray-800">2. Fatture di Acquisto (Fornitori)</span>
                  <span className="text-gray-500 mt-1 block">Aggancio automatico ai conti del piano (es. Acquisti merci XY).</span>
                </div>
                <div className="border p-3 rounded-lg bg-gray-50">
                  <span className="font-semibold block text-gray-800">3. Corrispettivi Telematici RT</span>
                  <span className="text-gray-500 mt-1 block">Acquisizione giornaliera con scorporo IVA o ventilazione.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. TAB: TABELLE IVA CGN & RACCORDO SDI */}
        <TabsContent value="tabelle-cgn" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                    Tavola di Raccordo Codifiche CGN Contabilità &amp; Natura SDI (DPR 633/1972)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Guida operativa per la corretta associazione tra causali software CGN, tracciato XML Fattura Elettronica, quadri LIPE e Dichiarazione IVA annuale.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Cerca codice CGN, natura (es. N6.3) o norma..."
                    value={cgnRicerca}
                    onChange={(e) => setCgnRicerca(e.target.value)}
                    className="h-8 text-xs w-64 bg-white"
                  />
                </div>
              </div>

              {/* Filtro Ambito */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t">
                {[
                  { id: 'TUTTI', label: 'Tutti i Codici' },
                  { id: 'REVERSE_CHARGE', label: 'Reverse Charge (N6)' },
                  { id: 'NON_SOGGETTO', label: 'Non Soggetto (N2 / Forfettari)' },
                  { id: 'NON_IMPONIBILE', label: 'Non Imponibile (N3 / Intra)' },
                  { id: 'ESENTE', label: 'Esenti (N4)' },
                  { id: 'ESCLUSO', label: 'Escluso Art. 15 (N1)' },
                  { id: 'SPLIT_PAYMENT', label: 'Split Payment (PA)' },
                  { id: 'NO_IVA', label: 'Operazioni NO IVA' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCgnFiltroAmbito(f.id)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      cgnFiltroAmbito === f.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="border-t overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/75 text-xs">
                      <TableHead className="font-semibold w-28">Codice CGN</TableHead>
                      <TableHead className="font-semibold w-24">Natura SDI</TableHead>
                      <TableHead className="font-semibold w-24">Autofattura</TableHead>
                      <TableHead className="font-semibold w-40">Rif. Norma DPR 633</TableHead>
                      <TableHead className="font-semibold">Descrizione &amp; Ambito Fiscale</TableHead>
                      <TableHead className="font-semibold w-28 text-center">Causale PN</TableHead>
                      <TableHead className="font-semibold w-24 text-center">Azione</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {TABELLA_IVA_CGN
                      .filter((c) => {
                        if (cgnFiltroAmbito !== 'TUTTI' && c.ambito !== cgnFiltroAmbito) return false
                        if (cgnRicerca.trim()) {
                          const q = cgnRicerca.toLowerCase()
                          return (
                            c.codiceCgn.toLowerCase().includes(q) ||
                            (c.naturaSdi && c.naturaSdi.toLowerCase().includes(q)) ||
                            c.norma.toLowerCase().includes(q) ||
                            c.descrizione.toLowerCase().includes(q) ||
                            (c.tipoDocumentoAutofattura && c.tipoDocumentoAutofattura.toLowerCase().includes(q))
                          )
                        }
                        return true
                      })
                      .map((c) => (
                        <TableRow key={c.codiceCgn} className="hover:bg-indigo-50/30 text-xs">
                          <TableCell className="font-mono font-bold text-indigo-700">
                            {c.codiceCgn}
                          </TableCell>
                          <TableCell>
                            {c.naturaSdi ? (
                              <Badge variant="outline" className="font-mono bg-purple-50 text-purple-700 border-purple-200 text-[11px]">
                                {c.naturaSdi}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.tipoDocumentoAutofattura ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-mono text-[10px]">
                                {c.tipoDocumentoAutofattura}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-gray-700">
                            {c.norma}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {c.descrizione}
                          </TableCell>
                          <TableCell className="text-center font-mono text-gray-600">
                            {c.causalePrimaNota || '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormPN((prev) => ({
                                  ...prev,
                                  descrizione: prev.descrizione || c.descrizione.split('(')[0].trim(),
                                  aliquotaIva: c.aliquotaPredefinita ? String(c.aliquotaPredefinita) : (c.naturaSdi ? '0' : '22'),
                                  reverseCharge: c.ambito === 'REVERSE_CHARGE',
                                  note: `Cod. CGN: ${c.codiceCgn} | Natura SDI: ${c.naturaSdi || 'Ord'} | ${c.norma}`,
                                }))
                                setOpenModalNuova(true)
                              }}
                              className="text-[11px] h-7 px-2 text-indigo-700 hover:bg-indigo-100"
                            >
                              Usa in PN
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: NUOVA REGISTRAZIONE PRIMA NOTA */}
      <Dialog open={openModalNuova} onOpenChange={setOpenModalNuova}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-blue-600" />
              Nuova Registrazione di Prima Nota — {aziendaNome}
            </DialogTitle>
            <DialogDescription>
              Inserimento scrittura contabile per il cliente nel database unificato dello studio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pn-dataReg">Data Registrazione *</Label>
                <Input
                  id="pn-dataReg"
                  type="date"
                  value={formPN.dataRegistrazione}
                  onChange={(e) => setFormPN({ ...formPN, dataRegistrazione: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pn-tipoReg">Tipo Registro / Operazione</Label>
                <Select
                  value={formPN.tipoRegistro}
                  onValueChange={(v) => setFormPN({ ...formPN, tipoRegistro: v })}
                >
                  <SelectTrigger id="pn-tipoReg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERALE">Prima Nota Generale / Giroconto</SelectItem>
                    <SelectItem value="VENDITE">Registro Vendite / Fattura Emessa</SelectItem>
                    <SelectItem value="ACQUISTI">Registro Acquisti / Fattura Passiva</SelectItem>
                    <SelectItem value="CORRISPETTIVI">Registro Corrispettivi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pn-cgn">Raccordo Codice CGN / Natura SDI (Opzionale)</Label>
                <Select
                  onValueChange={(val) => {
                    const c = TABELLA_IVA_CGN.find(x => x.codiceCgn === val)
                    if (c) {
                      setFormPN(prev => ({
                        ...prev,
                        descrizione: prev.descrizione || c.descrizione.split('(')[0].trim(),
                        aliquotaIva: c.aliquotaPredefinita ? String(c.aliquotaPredefinita) : (c.naturaSdi ? '0' : '22'),
                        reverseCharge: c.ambito === 'REVERSE_CHARGE',
                        note: `Cod. CGN: ${c.codiceCgn} | Natura SDI: ${c.naturaSdi || 'Ord'} | ${c.norma}`,
                      }))
                    }
                  }}
                >
                  <SelectTrigger id="pn-cgn" className="text-xs">
                    <SelectValue placeholder="Seleziona raccordo CGN / SDI..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A1706A">A1706A — N6.3 Subappalto Edilizia (Rev. Charge)</SelectItem>
                    <SelectItem value="A1706AT">A1706AT — N6.7 Pulizia/Impianti Edifici (Rev. Charge)</SelectItem>
                    <SelectItem value="FORF">FORF — N2.2 Regime Forfettario (No IVA)</SelectItem>
                    <SelectItem value="A1503">A1503 — N1 Rimborsi Spese Anticipate (Art. 15)</SelectItem>
                    <SelectItem value="D41">D41 — N3.2 Cessioni Intracomunitarie UE</SelectItem>
                    <SelectItem value="A07T">A07T — N2.1 Servizi Resi a Extra-UE</SelectItem>
                    <SelectItem value="A1001">A1001 — N4 Servizi Finanziari / Esenti Art. 10</SelectItem>
                    <SelectItem value="A17T22">A17T22 — Split Payment Fatture PA (22%)</SelectItem>
                    <SelectItem value="NO_IVA">NO_IVA — Causale 899 (Paghe, Assicurazioni)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pn-numDoc">Numero Documento</Label>
                <Input
                  id="pn-numDoc"
                  placeholder="es. Fatt. 12/2026"
                  value={formPN.numeroDocumento}
                  onChange={(e) => setFormPN({ ...formPN, numeroDocumento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="pn-dataDoc">Data Documento</Label>
                <Input
                  id="pn-dataDoc"
                  type="date"
                  value={formPN.dataDocumento}
                  onChange={(e) => setFormPN({ ...formPN, dataDocumento: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pn-note">Note / Riferimenti Interni</Label>
                <Input
                  id="pn-note"
                  placeholder="es. Riferimento CGN o protocollo contabile..."
                  value={formPN.note}
                  onChange={(e) => setFormPN({ ...formPN, note: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pn-desc">Causale / Descrizione Operazione *</Label>
              <Input
                id="pn-desc"
                placeholder="es. Acquisto merci da fornitore / Incasso fattura cliente..."
                value={formPN.descrizione}
                onChange={(e) => setFormPN({ ...formPN, descrizione: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <Label className="font-semibold text-blue-900">Sezione DARE</Label>
                <div className="space-y-1.5">
                  <Input
                    placeholder="Conto Dare (es. Acquisti merci / Cassa)"
                    value={formPN.contoDareNome}
                    onChange={(e) => setFormPN({ ...formPN, contoDareNome: e.target.value })}
                    className="text-xs bg-white"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Importo Dare (€)"
                    value={formPN.importoDare}
                    onChange={(e) => setFormPN({ ...formPN, importoDare: e.target.value })}
                    className="text-xs bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                <Label className="font-semibold text-emerald-900">Sezione AVERE</Label>
                <div className="space-y-1.5">
                  <Input
                    placeholder="Conto Avere (es. Debiti v/fornitori / Banca)"
                    value={formPN.contoAvereNome}
                    onChange={(e) => setFormPN({ ...formPN, contoAvereNome: e.target.value })}
                    className="text-xs bg-white"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Importo Avere (€)"
                    value={formPN.importoAvere}
                    onChange={(e) => setFormPN({ ...formPN, importoAvere: e.target.value })}
                    className="text-xs bg-white font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="pn-aliquota">Aliquota IVA (%)</Label>
                <Input
                  id="pn-aliquota"
                  type="number"
                  placeholder="22"
                  value={formPN.aliquotaIva}
                  onChange={(e) => setFormPN({ ...formPN, aliquotaIva: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pn-iva">Imposta IVA (€)</Label>
                <Input
                  id="pn-iva"
                  type="number"
                  step="0.01"
                  placeholder="es. 22.00"
                  value={formPN.impostaIva}
                  onChange={(e) => setFormPN({ ...formPN, impostaIva: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="pn-revCharge"
                  checked={formPN.reverseCharge}
                  onChange={(e) => setFormPN({ ...formPN, reverseCharge: e.target.checked })}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <Label htmlFor="pn-revCharge" className="text-xs cursor-pointer">
                  Reverse Charge
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModalNuova(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSalvaPrimaNota}
              disabled={salvando}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {salvando ? 'Salvataggio...' : 'Salva Scrittura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
