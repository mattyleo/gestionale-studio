// src/components/contabilita/AziendaContabilitaTab.tsx
// Modulo Contabilità, Registri IVA con Protocolli Progressivi, Prima Nota, Scritture NO IVA e Piano dei Conti
// Specifiche Dott. Antonio Tuzio

'use client'

import * as React from 'react'
import {
  BookOpen,
  Plus,
  Receipt,
  FileSpreadsheet,
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
  Printer,
  FileText,
  RotateCcw,
  Zap,
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
import { REGISTRI_IVA_STANDARD, TIPI_SCRITTURE_NO_IVA, trovaRegistroIva, RegistroIvaDef } from '@/lib/registri-iva'

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

  // Filtri registro e anno per i protocolli IVA
  const [filtroRegistro, setFiltroRegistro] = React.useState<string>('A1')
  const [filtroAnno, setFiltroAnno] = React.useState<string>(new Date().getFullYear().toString())

  // Filtri CGN
  const [cgnFiltroAmbito, setCgnFiltroAmbito] = React.useState<string>('TUTTI')
  const [cgnRicerca, setCgnRicerca] = React.useState<string>('')

  // Modale Rinumerazione Protocolli
  const [openModalRinumera, setOpenModalRinumera] = React.useState(false)
  const [rinumerando, setRinumerando] = React.useState(false)

  // Modale Nuova Registrazione Prima Nota / IVA
  const [openModalNuova, setOpenModalNuova] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)

  // Modale Diagnostica & Audit Fiscale IA
  const [openModalAudit, setOpenModalAudit] = React.useState(false)
  const [auditCaricamento, setAuditCaricamento] = React.useState(false)
  const [auditDati, setAuditDati] = React.useState<any>(null)
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
    tipoRegistro: 'ACQUISTI',
    registroCodice: 'A1',
    protocollo: '',
    anno: new Date().getFullYear().toString(),
    codiceIvaCgn: '',
    naturaSdi: '',
    anagraficaSoggetto: '',
    isScritturaNoIva: false,
    aliquotaIva: '22',
    impostaIva: '',
    reverseCharge: false,
    note: '',
  })

  const caricaContabilita = React.useCallback(async () => {
    setLoading(true)
    try {
      const regQuery = filtroRegistro !== 'TUTTI' ? `&registroCodice=${encodeURIComponent(filtroRegistro)}` : ''
      const annoQuery = filtroAnno ? `&anno=${encodeURIComponent(filtroAnno)}` : ''
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita?t=${Date.now()}${regQuery}${annoQuery}`)
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      setDatiContabili(dati)
    } catch (e: any) {
      toast({ title: 'Errore contabilità', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [aziendaId, filtroRegistro, filtroAnno, toast])

  React.useEffect(() => {
    caricaContabilita()
  }, [caricaContabilita])

  // Salva Scrittura Contabile / IVA
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
      toast({ title: '✅ Registrazione salvata', description: dati.messaggio })
      setOpenModalNuova(false)
      // Reset form parziale
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
        tipoRegistro: formPN.tipoRegistro,
        registroCodice: formPN.registroCodice,
        protocollo: '',
        anno: formPN.anno,
        codiceIvaCgn: '',
        naturaSdi: '',
        anagraficaSoggetto: '',
        isScritturaNoIva: false,
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

  // Azione Rinumera / Modifica Protocolli
  const handleRinumeraProtocolli = async () => {
    const regTarget = filtroRegistro === 'TUTTI' ? 'A1' : filtroRegistro
    const annoTarget = filtroAnno || new Date().getFullYear().toString()
    setRinumerando(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rinumera-protocolli',
          registroCodice: regTarget,
          anno: annoTarget,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '⚡ Rinumerazione Protocolli completata', description: dati.messaggio })
      setOpenModalRinumera(false)
      caricaContabilita()
    } catch (e: any) {
      toast({ title: 'Errore rinumerazione', description: e.message, variant: 'destructive' })
    } finally {
      setRinumerando(false)
    }
  }

  // Azione Diagnostica & Audit Fiscale IA
  const handleEseguiAudit = async () => {
    setAuditCaricamento(true)
    setOpenModalAudit(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/contabilita/audit`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setAuditDati(json)
    } catch (e: any) {
      toast({ title: 'Errore durante audit IA', description: e.message, variant: 'destructive' })
    } finally {
      setAuditCaricamento(false)
    }
  }

  // Pre-compilazione rapida per "Scritture NO IVA" (Paghe, INPS, INAIL, Assicurazioni)
  const apriScritturaNoIva = (conf: typeof TIPI_SCRITTURE_NO_IVA[0]) => {
    setFormPN((prev) => ({
      ...prev,
      registroCodice: conf.registroDestinazione || 'A1',
      tipoRegistro: 'ACQUISTI',
      descrizione: conf.causaleDescrizione,
      anagraficaSoggetto: conf.anagraficaFittizia,
      codiceIvaCgn: conf.codiceCgn,
      naturaSdi: conf.naturaSdi || 'Fuori campo',
      aliquotaIva: '0',
      impostaIva: '0',
      isScritturaNoIva: true,
      reverseCharge: false,
      contoDareNome: conf.causaleDescrizione.split('(')[0].trim(),
      contoAvereNome: 'Banca c/c ordinario',
      note: `Scrittura NO IVA (Causale ${conf.causaleCodice}) ai fini della deducibilità nel reddito d'impresa`,
    }))
    setOpenModalNuova(true)
  }

  const handleEliminaEntry = async (id: string) => {
    if (!confirm('Eliminare questa scrittura contabile / registrazione IVA?')) return
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

  // Stampa Ufficiale Registro IVA
  const handleStampaRegistro = () => {
    const regNome = trovaRegistroIva(filtroRegistro).nome
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rowsHtml = (datiContabili?.primaNota || []).map((e: any) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 6px; font-family: monospace; font-weight: bold;">${e.registroCodice || 'A1'}/${e.protocollo || '—'}</td>
        <td style="border: 1px solid #ddd; padding: 6px;">${formatData(e.dataRegistrazione)}</td>
        <td style="border: 1px solid #ddd; padding: 6px;">${e.numeroDocumento || '—'} ${e.dataDocumento ? 'del ' + formatData(e.dataDocumento) : ''}</td>
        <td style="border: 1px solid #ddd; padding: 6px;"><strong>${e.anagraficaSoggetto || '—'}</strong> ${e.isScritturaNoIva ? '<span style="color:#d97706; font-size:10px;">[NO IVA]</span>' : ''}</td>
        <td style="border: 1px solid #ddd; padding: 6px;">${e.descrizione}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">${Number(e.importoDare) > 0 ? formatEuro(e.importoDare) : Number(e.importoAvere) > 0 ? formatEuro(e.importoAvere) : '—'}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${e.aliquotaIva != null ? e.aliquotaIva + '%' : e.naturaSdi || '0%'}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">${e.impostaIva != null ? formatEuro(e.impostaIva) : '—'}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${regNome} — ${aziendaNome} — Anno ${filtroAnno}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; margin: 20px; color: #222; }
            h2, h3 { margin: 0 0 5px 0; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background: #f3f4f6; border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
            .badge { display: inline-block; padding: 2px 6px; font-size: 10px; border-radius: 4px; background: #e0e7ff; color: #3730a3; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${aziendaNome}</h2>
            <p style="margin: 0; color: #555;">Partita IVA: ${partitaIva || '—'} • Codice Fiscale: ${datiContabili?.azienda?.codiceFiscale || '—'}</p>
            <h3 style="margin-top: 10px; color: #1e40af;">STAMPA UFFICIALE: ${regNome.toUpperCase()} — ANNO ${filtroAnno}</h3>
            <p style="margin: 0; font-size: 11px; color: #666;">Elaborato dal Gestionale Studio Tuzio in data ${new Date().toLocaleDateString('it-IT')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Protocollo</th>
                <th>Data Reg.</th>
                <th>Doc. N. / Data</th>
                <th>Fornitore / Cliente</th>
                <th>Descrizione Operazione</th>
                <th style="text-align: right;">Imponibile / Costo</th>
                <th style="text-align: center;">Aliquota / Natura</th>
                <th style="text-align: right;">Imposta IVA</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="8" style="text-align:center; padding: 20px;">Nessuna registrazione nel periodo selezionato</td></tr>'}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
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
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Nuova Scrittura
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sotto-Tabs: Registri IVA & Prima Nota | Liquidazione IVA | Piano dei Conti | Flussi AdE | Tabelle CGN */}
      <Tabs value={sottoTab} onValueChange={setSottoTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="prima-nota" className="gap-1.5 text-xs sm:text-sm">
            <FileSpreadsheet className="h-4 w-4" /> Registri IVA &amp; Prima Nota ({datiContabili?.primaNota?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="liquidazione-iva" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-4 w-4" /> Liquidazione IVA Periodica &amp; Annuale
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

        {/* 1. TAB: REGISTRI IVA & PRIMA NOTA (con Protocolli e Scritture NO IVA) */}
        <TabsContent value="prima-nota" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Selettore Anno e Registro IVA */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Anno:</span>
                    <Select value={filtroAnno} onValueChange={setFiltroAnno}>
                      <SelectTrigger className="h-8 w-24 text-xs font-bold bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['2026', '2025', '2024', '2023'].map(a => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-gray-700">Registro:</span>
                    <Select value={filtroRegistro} onValueChange={setFiltroRegistro}>
                      <SelectTrigger className="h-8 w-56 text-xs font-semibold bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TUTTI">Tutti i Registri ({datiContabili?.primaNota?.length ?? 0})</SelectItem>
                        {REGISTRI_IVA_STANDARD.map(r => (
                          <SelectItem key={r.codice} value={r.codice}>
                            {r.codice} — {r.nome} ({datiContabili?.conteggiPerRegistro?.[r.codice] ?? 0})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Comandi Operativi Studio */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleEseguiAudit}
                    className="h-8 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-300 shadow-sm"
                    title="L'Agente Mastro verifica squadrature, forfettari, reverse charge, scritture NO IVA e salti di protocollo"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                    Audit Errori IA
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenModalRinumera(true)}
                    className="h-8 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300"
                    title="Controllo e correzione automatica protocolli progressivi del registro"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
                    Modifica / Rinumera Protocolli
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleStampaRegistro}
                    className="h-8 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5 text-gray-600" />
                    Stampa Registro
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpenModalNuova(true)}
                    className="h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Nuova Registrazione
                  </Button>
                </div>
              </div>

              {/* Bottoni Rapidi Scritture NO IVA (Contabilità Semplificata) */}
              <div className="flex flex-wrap items-center gap-2 pt-3">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  Scritture NO IVA (Causale 899 nel Registro Acquisti):
                </span>
                {TIPI_SCRITTURE_NO_IVA.map((s) => (
                  <button
                    key={s.causaleCodice}
                    type="button"
                    onClick={() => apriScritturaNoIva(s)}
                    className="text-[11px] px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium transition-colors"
                  >
                    + {s.causaleDescrizione.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/75 text-xs">
                      <TableHead className="font-semibold w-24">Protocollo</TableHead>
                      <TableHead className="font-semibold w-24">Data Reg.</TableHead>
                      <TableHead className="font-semibold w-32">N. Doc / Data</TableHead>
                      <TableHead className="font-semibold">Fornitore / Cliente / Soggetto</TableHead>
                      <TableHead className="font-semibold">Causale / Descrizione Operazione</TableHead>
                      <TableHead className="font-semibold w-20 text-center">Registro</TableHead>
                      <TableHead className="font-semibold text-right w-28">Imponibile/Dare</TableHead>
                      <TableHead className="font-semibold text-right w-28">Ricavo/Avere</TableHead>
                      <TableHead className="font-semibold text-center w-28">Aliquota / SDI</TableHead>
                      <TableHead className="font-semibold text-right w-24">Imposta IVA</TableHead>
                      <TableHead className="font-semibold text-center w-16">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-gray-500 text-xs">
                          Caricamento registrazioni IVA in corso...
                        </TableCell>
                      </TableRow>
                    ) : !datiContabili?.primaNota || datiContabili.primaNota.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-12">
                          <div className="max-w-md mx-auto text-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                              <FileSpreadsheet className="h-6 w-6" />
                            </div>
                            <h4 className="font-semibold text-gray-800">Nessuna registrazione nel registro {filtroRegistro} per il {filtroAnno}</h4>
                            <p className="text-xs text-gray-500">
                              Il registro è pronto per ricevere annotazioni, fatture elettroniche scaricate o scritture manuali.
                            </p>
                            <Button
                              size="sm"
                              onClick={() => setOpenModalNuova(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Aggiungi Registrazione
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      datiContabili.primaNota.map((entry: any) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50/50 text-xs">
                          {/* Protocollo Progressivo Obbligatorio */}
                          <TableCell className="font-mono font-bold text-blue-800 whitespace-nowrap">
                            <span className="bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {entry.registroCodice || 'A1'}/{entry.protocollo != null ? entry.protocollo : '—'}
                            </span>
                          </TableCell>

                          {/* Data Registrazione */}
                          <TableCell className="font-medium whitespace-nowrap">
                            {formatData(entry.dataRegistrazione)}
                          </TableCell>

                          {/* Numero e Data Documento */}
                          <TableCell className="whitespace-nowrap text-gray-600">
                            {entry.numeroDocumento ? `Doc. ${entry.numeroDocumento}` : '—'}
                            {entry.dataDocumento && (
                              <span className="block text-[10px] text-gray-400">
                                del {formatData(entry.dataDocumento)}
                              </span>
                            )}
                          </TableCell>

                          {/* Soggetto / Fornitore / Anagrafica Fittizia */}
                          <TableCell className="font-medium text-gray-800">
                            <div>{entry.anagraficaSoggetto || '—'}</div>
                            {entry.isScritturaNoIva && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[9px] px-1 py-0 font-mono">
                                NO IVA (Causale 899)
                              </Badge>
                            )}
                          </TableCell>

                          {/* Causale / Descrizione */}
                          <TableCell className="text-gray-900 max-w-xs truncate">
                            {entry.descrizione}
                            {entry.reverseCharge && (
                              <Badge variant="outline" className="ml-1 text-[9px] text-purple-700 border-purple-300 bg-purple-50">
                                Rev. Charge (TD16)
                              </Badge>
                            )}
                          </TableCell>

                          {/* Codice Registro */}
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              {entry.registroCodice || entry.tipoRegistro || 'A1'}
                            </Badge>
                          </TableCell>

                          {/* Dare / Costo */}
                          <TableCell className="text-right font-semibold text-gray-900">
                            {Number(entry.importoDare) > 0 ? formatEuro(entry.importoDare) : '—'}
                          </TableCell>

                          {/* Avere / Ricavo */}
                          <TableCell className="text-right font-semibold text-gray-900">
                            {Number(entry.importoAvere) > 0 ? formatEuro(entry.importoAvere) : '—'}
                          </TableCell>

                          {/* Aliquota / Codice CGN / Natura SDI */}
                          <TableCell className="text-center font-mono text-[11px]">
                            {entry.codiceIvaCgn ? (
                              <span className="font-bold text-indigo-700">{entry.codiceIvaCgn}</span>
                            ) : entry.aliquotaIva != null ? (
                              `${entry.aliquotaIva}%`
                            ) : entry.naturaSdi ? (
                              <span className="text-purple-600">{entry.naturaSdi}</span>
                            ) : (
                              '0%'
                            )}
                          </TableCell>

                          {/* Imposta IVA */}
                          <TableCell className="text-right font-semibold text-gray-800">
                            {Number(entry.impostaIva) > 0 ? formatEuro(entry.impostaIva) : '0,00 €'}
                          </TableCell>

                          {/* Azioni */}
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminaEntry(entry.id)}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Elimina registrazione"
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
            </CardContent>
          </Card>
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
                  {formatEuro(datiContabili?.quadraturaIva?.totaleIvaDebito || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Su imponibile di {formatEuro(datiContabili?.quadraturaIva?.totaleImponibileVendite || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  IVA a Credito (Acquisti Detraibili)
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatEuro(datiContabili?.quadraturaIva?.totaleIvaCredito || 0)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Su acquisti di {formatEuro(datiContabili?.quadraturaIva?.totaleImponibileAcquisti || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className={`border-l-4 ${(datiContabili?.quadraturaIva?.saldoIva || 0) > 0 ? 'border-l-red-600 bg-red-50/20' : 'border-l-green-600 bg-green-50/20'}`}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Saldo Liquidazione Periodica
                </p>
                <p className={`text-2xl font-bold mt-1 ${(datiContabili?.quadraturaIva?.saldoIva || 0) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {formatEuro(Math.abs(datiContabili?.quadraturaIva?.saldoIva || 0))}
                </p>
                <p className="text-xs font-semibold mt-1">
                  {(datiContabili?.quadraturaIva?.saldoIva || 0) > 0
                    ? '⚠️ IVA DA VERSARE (Modello F24)'
                    : (datiContabili?.quadraturaIva?.saldoIva || 0) < 0
                    ? '✅ CREDITO IVA DA RIPORTARE'
                    : 'PAREGGIO'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Regime &amp; Periodicità Studio
                </p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {periodicitaAttuale}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {regimeAttuale}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. TAB: PIANO DEI CONTI */}
        <TabsContent value="piano-conti" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Piano dei Conti per il Cliente — {datiContabili?.pianoConti?.nome}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Struttura ad albero Mastro, Conto e Sottoconto pronta per il caricamento delle tabelle personalizzate del Dottore.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-semibold text-blue-700 border-blue-300">
                  {datiContabili?.pianoConti?.tipo || 'STANDARD'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {datiContabili?.pianoConti?.sezioni?.map((sez: any) => (
                  <div key={sez.codice} className="border rounded-lg p-3 bg-gray-50/50">
                    <div className="font-semibold text-sm text-gray-800 flex items-center gap-2 border-b pb-1.5 mb-2">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        {sez.codice}
                      </span>
                      {sez.nome}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {sez.conti?.map((c: any) => (
                        <div key={c.codice} className="p-2 rounded bg-white border text-xs flex items-center justify-between">
                          <span className="text-gray-700">{c.nome}</span>
                          <span className="font-mono text-[10px] text-gray-400 font-semibold">{c.codice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. TAB: FLUSSI ADE & REVERSE CHARGE */}
        <TabsContent value="flussi-ade" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Flussi Agenzia delle Entrate, Corrispettivi &amp; Reverse Charge
              </CardTitle>
              <CardDescription className="text-xs">
                Acquisizione automatica fatture elettroniche attive, passive e corrispettivi RT nello stesso database senza programmi esterni.
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

        {/* 5. TAB: TABELLE IVA CGN & RACCORDO SDI (Tutte le 5 pagine) */}
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
                                  codiceIvaCgn: c.codiceCgn,
                                  naturaSdi: c.naturaSdi || '',
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

      {/* ─────────────────────────────────────────────────────────────
          MODAL: RINUMERAZIONE / MODIFICA PROTOCOLLI DEL REGISTRO
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openModalRinumera} onOpenChange={setOpenModalRinumera}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Rinumera Protocolli Registro {filtroRegistro === 'TUTTI' ? 'A1' : filtroRegistro}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Questa funzione riordina cronologicamente le scritture in base alla data di registrazione e riassegna i protocolli consecutivi (1, 2, 3...) eliminando eventuali buchi o errori di digitazione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 space-y-1">
              <p className="font-semibold">Parametri di esecuzione:</p>
              <p>• Registro IVA target: <strong>{filtroRegistro === 'TUTTI' ? 'A1 - Acquisti Ordinari' : filtroRegistro}</strong></p>
              <p>• Anno fiscale: <strong>{filtroAnno}</strong></p>
              <p>• Ordine: Data Registrazione crescente e ordine temporale di creazione.</p>
            </div>
            <p className="text-gray-500">
              I numeri di protocollo verranno aggiornati automaticamente nel database unificato dello studio.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenModalRinumera(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleRinumeraProtocolli}
              disabled={rinumerando}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
            >
              {rinumerando ? 'Rinumerazione in corso...' : 'Esegui Rinumerazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: NUOVA REGISTRAZIONE PRIMA NOTA & REGISTRI IVA
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openModalNuova} onOpenChange={setOpenModalNuova}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5 text-blue-600" />
              Nuova Registrazione di Prima Nota &amp; IVA — {aziendaNome}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assegnazione automatica del numero di protocollo progressivo sul registro selezionato.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {/* Registro di Destinazione & Protocollo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pn-registroCodice" className="text-xs font-semibold text-blue-900">
                  Registro IVA di Destinazione *
                </Label>
                <Select
                  value={formPN.registroCodice}
                  onValueChange={(v) => {
                    const reg = trovaRegistroIva(v)
                    setFormPN({
                      ...formPN,
                      registroCodice: v,
                      tipoRegistro: reg.tipo,
                    })
                  }}
                >
                  <SelectTrigger id="pn-registroCodice" className="bg-white text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGISTRI_IVA_STANDARD.map((r) => (
                      <SelectItem key={r.codice} value={r.codice}>
                        {r.codice} — {r.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pn-protocollo" className="text-xs font-semibold text-blue-900">
                    Protocollo N. *
                  </Label>
                  <span className="text-[10px] text-blue-600">Auto (Prossimo)</span>
                </div>
                <Input
                  id="pn-protocollo"
                  placeholder="Automatico"
                  value={formPN.protocollo}
                  onChange={(e) => setFormPN({ ...formPN, protocollo: e.target.value })}
                  className="bg-white text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Date e Riferimento Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pn-dataReg" className="text-xs font-semibold text-gray-700">
                  Data Registrazione *
                </Label>
                <Input
                  id="pn-dataReg"
                  type="date"
                  value={formPN.dataRegistrazione}
                  onChange={(e) => {
                    const dt = e.target.value
                    const an = dt ? new Date(dt).getFullYear().toString() : formPN.anno
                    setFormPN({ ...formPN, dataRegistrazione: dt, anno: an })
                  }}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pn-numDoc" className="text-xs font-semibold text-gray-700">
                  N. Documento / Fattura
                </Label>
                <Input
                  id="pn-numDoc"
                  placeholder="es. Fatt. 124"
                  value={formPN.numeroDocumento}
                  onChange={(e) => setFormPN({ ...formPN, numeroDocumento: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pn-dataDoc" className="text-xs font-semibold text-gray-700">
                  Data Documento
                </Label>
                <Input
                  id="pn-dataDoc"
                  type="date"
                  value={formPN.dataDocumento}
                  onChange={(e) => setFormPN({ ...formPN, dataDocumento: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Soggetto e Causale / Descrizione */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="pn-soggetto" className="text-xs font-semibold text-gray-700">
                  Fornitore / Cliente / Soggetto
                </Label>
                <Input
                  id="pn-soggetto"
                  placeholder="es. Fornitori Non IVA / Rossi Srl..."
                  value={formPN.anagraficaSoggetto}
                  onChange={(e) => setFormPN({ ...formPN, anagraficaSoggetto: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pn-desc" className="text-xs font-semibold text-gray-700">
                  Causale / Descrizione Operazione *
                </Label>
                <Input
                  id="pn-desc"
                  placeholder="es. Acquisto merci / Liquidazione stipendi (Causale 899)..."
                  value={formPN.descrizione}
                  onChange={(e) => setFormPN({ ...formPN, descrizione: e.target.value })}
                  className="text-xs font-medium"
                />
              </div>
            </div>

            {/* Codice CGN e Raccordo SDI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 bg-gray-50 rounded-lg border">
              <div className="space-y-1.5">
                <Label htmlFor="pn-cgn" className="text-xs font-semibold text-gray-700">
                  Codice IVA CGN / Prontuario Studio
                </Label>
                <Select
                  value={formPN.codiceIvaCgn}
                  onValueChange={(val) => {
                    const c = TABELLA_IVA_CGN.find(x => x.codiceCgn === val)
                    if (c) {
                      setFormPN(prev => ({
                        ...prev,
                        codiceIvaCgn: val,
                        naturaSdi: c.naturaSdi || '',
                        aliquotaIva: c.aliquotaPredefinita ? String(c.aliquotaPredefinita) : (c.naturaSdi ? '0' : '22'),
                        reverseCharge: c.ambito === 'REVERSE_CHARGE',
                        isScritturaNoIva: c.ambito === 'NO_IVA' || prev.isScritturaNoIva,
                        note: prev.note || `Cod. CGN: ${c.codiceCgn} | ${c.norma}`,
                      }))
                    }
                  }}
                >
                  <SelectTrigger id="pn-cgn" className="text-xs bg-white">
                    <SelectValue placeholder="Seleziona raccordo CGN / SDI..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NO_IVA">NO_IVA — Causale 899 (Paghe, INPS, INAIL)</SelectItem>
                    <SelectItem value="A1706A">A1706A — N6.3 Subappalto Edilizia (Rev. Charge TD16)</SelectItem>
                    <SelectItem value="A1706AT">A1706AT — N6.7 Pulizia/Impianti Edifici (Rev. Charge TD16)</SelectItem>
                    <SelectItem value="FORF">FORF — N2.2 Regime Forfettario (No IVA)</SelectItem>
                    <SelectItem value="A1503">A1503 — N1 Spese Anticipate Nome e Conto (Art. 15)</SelectItem>
                    <SelectItem value="D41">D41 — N3.2 Cessioni Intra UE (TD18)</SelectItem>
                    <SelectItem value="A07T">A07T — N2.1 Servizi Resi a Extra-UE (TD17)</SelectItem>
                    <SelectItem value="A1001">A1001 — N4 Servizi Finanziari / Esenti Art. 10</SelectItem>
                    <SelectItem value="A17T22">A17T22 — Split Payment Fatture PA (22%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pn-natura" className="text-xs font-semibold text-gray-700">
                  Natura SDI Agenzia delle Entrate
                </Label>
                <Input
                  id="pn-natura"
                  placeholder="es. N6.3 o N2.2"
                  value={formPN.naturaSdi}
                  onChange={(e) => setFormPN({ ...formPN, naturaSdi: e.target.value })}
                  className="text-xs bg-white font-mono"
                />
              </div>
            </div>

            {/* Sezione Dare / Avere */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <Label className="font-semibold text-blue-900 text-xs">Sezione DARE (Costi / Uscite / Cassa)</Label>
                <div className="space-y-1.5">
                  <Input
                    placeholder="Conto Dare (es. Acquisti merci / Salari stipendi)"
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
                <Label className="font-semibold text-emerald-900 text-xs">Sezione AVERE (Ricavi / Entrate / Fornitori)</Label>
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

            {/* Aliquota, Imposta e Spunte Speciali */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="pn-aliquota" className="text-xs">Aliquota IVA (%)</Label>
                <Input
                  id="pn-aliquota"
                  type="number"
                  placeholder="22"
                  value={formPN.aliquotaIva}
                  onChange={(e) => setFormPN({ ...formPN, aliquotaIva: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pn-iva" className="text-xs">Imposta IVA (€)</Label>
                <Input
                  id="pn-iva"
                  type="number"
                  step="0.01"
                  placeholder="es. 22.00"
                  value={formPN.impostaIva}
                  onChange={(e) => setFormPN({ ...formPN, impostaIva: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="flex flex-col justify-center space-y-1 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formPN.reverseCharge}
                    onChange={(e) => setFormPN({ ...formPN, reverseCharge: e.target.checked })}
                    className="rounded text-blue-600 h-3.5 w-3.5"
                  />
                  <span>Reverse Charge (TD16)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={formPN.isScritturaNoIva}
                    onChange={(e) => setFormPN({ ...formPN, isScritturaNoIva: e.target.checked })}
                    className="rounded text-amber-600 h-3.5 w-3.5"
                  />
                  <span className="text-amber-800 font-medium">Scrittura NO IVA (Causale 899)</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenModalNuova(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSalvaPrimaNota}
              disabled={salvando}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              {salvando ? 'Salvataggio...' : 'Salva e Assegna Protocollo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DIAGNOSTICA & AUDIT FISCALE/CONTABILE IA
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openModalAudit} onOpenChange={setOpenModalAudit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-900 text-base">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Diagnostica &amp; Audit Fiscale Intelligente — Studio Dott. Antonio Tuzio
            </DialogTitle>
            <DialogDescription className="text-xs">
              L&apos;Agente Mastro esamina la conformità delle registrazioni contabili, registri IVA, forfettari, reverse charge, squadrature e sequenzialità dei protocolli per {aziendaNome}.
            </DialogDescription>
          </DialogHeader>

          {auditCaricamento ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs text-gray-500 font-medium">Scansione e verifica normativa delle registrazioni in corso...</p>
            </div>
          ) : auditDati ? (
            <div className="space-y-4 py-2">
              {/* Riepilogo dell'Audit */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                auditDati.totaleAnomalie === 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-3">
                  {auditDati.totaleAnomalie === 0 ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-8 w-8 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm">
                      {auditDati.totaleAnomalie === 0
                        ? '✅ Contabilità Perfettamente Conforme!'
                        : `Rilevate ${auditDati.totaleAnomalie} anomalie su ${auditDati.totaleControllate} registrazioni esaminate`}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5">
                      {auditDati.totaleAnomalie === 0
                        ? 'Nessuna squadratura, protocolli sequenziali e corretta applicazione delle regole IVA e forfettari.'
                        : `${auditDati.sintesi?.errori || 0} errori critici, ${auditDati.sintesi?.attenzioni || 0} avvertenze fiscali, ${auditDati.sintesi?.info || 0} note informative.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <Badge variant="outline" className="bg-white">
                    {auditDati.totaleControllate} Movimenti
                  </Badge>
                  {auditDati.sintesi?.errori > 0 && (
                    <Badge className="bg-red-600 text-white">
                      {auditDati.sintesi.errori} Errori
                    </Badge>
                  )}
                </div>
              </div>

              {/* Elenco Anomalie Riscontrate */}
              {auditDati.anomalie && auditDati.anomalie.length > 0 ? (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Dettaglio Rilievi &amp; Suggerimenti di Correzione
                  </h5>

                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                    {auditDati.anomalie.map((ano: any) => (
                      <div
                        key={ano.id}
                        className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                          ano.gravita === 'ERRORE'
                            ? 'bg-red-50/40 border-red-200'
                            : ano.gravita === 'ATTENZIONE'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-blue-50/40 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                ano.gravita === 'ERRORE'
                                  ? 'bg-red-600 text-white'
                                  : ano.gravita === 'ATTENZIONE'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }
                            >
                              {ano.gravita}
                            </Badge>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {ano.categoria}
                            </Badge>
                          </div>

                          {ano.entryData?.protocollo && (
                            <span className="text-[11px] font-mono font-medium text-gray-500">
                              Prot. #{ano.entryData.protocollo} ({ano.entryData.registroCodice || 'A1'})
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-gray-900 text-xs">{ano.titolo}</p>
                          <p className="text-gray-600 mt-0.5 leading-relaxed">{ano.dettaglio}</p>
                        </div>

                        {ano.entryData && (
                          <div className="p-2 bg-white/80 rounded border text-[11px] text-gray-700 flex flex-wrap gap-x-4 gap-y-1">
                            <span><strong>Data:</strong> {formatData(ano.entryData.dataRegistrazione)}</span>
                            {ano.entryData.soggetto && <span><strong>Soggetto:</strong> {ano.entryData.soggetto}</span>}
                            <span><strong>Descrizione:</strong> {ano.entryData.descrizione}</span>
                            <span><strong>Dare:</strong> {formatEuro(ano.entryData.importoDare)}</span>
                            <span><strong>Avere:</strong> {formatEuro(ano.entryData.importoAvere)}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-gray-200/60 text-[11px]">
                          <div className="text-gray-600">
                            <span className="font-semibold text-gray-800">📖 Normativa:</span> {ano.normativa}
                          </div>
                          <div className="text-indigo-900 font-medium">
                            <span className="font-semibold text-indigo-700">💡 Correzione:</span> {ano.suggerimento}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between items-center sm:items-center">
            {auditDati?.anomalie?.some((a: any) => a.categoria === 'PROTOCOLLO') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpenModalAudit(false)
                  setOpenModalRinumera(true)
                }}
                className="text-xs text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 mr-auto"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Apri Rinumerazione Protocolli
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => setOpenModalAudit(false)}
              className="bg-gray-900 text-white text-xs px-4 ml-auto"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
