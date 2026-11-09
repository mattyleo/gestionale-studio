'use client'
// src/app/(dashboard)/fornitori/page.tsx
// Gestione Fornitori e Fatture di Acquisto (Passive) dello Studio Professionale

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  Building,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Receipt,
  DollarSign,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const CATEGORIE_PREDEFINITE = [
  'Software e Licenze',
  'Cancelleria e Materiali',
  'Utenze e Telefonia',
  'Consulenze Esterne',
  'Hardware e Assistenza IT',
  'Formazione Professionale',
  'Banche e Servizi Finanziari',
  'Locazioni e Spese Studio',
  'Generale',
]

export default function FornitoriPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = React.useState(tabParam === 'acquisti' ? 'acquisti' : 'fornitori')

  React.useEffect(() => {
    if (tabParam === 'acquisti') {
      setActiveTab('acquisti')
    }
  }, [tabParam])

  // --- STATO TAB FORNITORI ---
  const [fornitori, setFornitori] = React.useState<any[]>([])
  const [categorieDisponibili, setCategorieDisponibili] = React.useState<string[]>([])
  const [loadingFornitori, setLoadingFornitori] = React.useState(true)
  const [cercaFornitore, setCercaFornitore] = React.useState('')
  const [statoFornitore, setStatoFornitore] = React.useState('attivi')
  const [filtroCategoria, setFiltroCategoria] = React.useState('TUTTE')

  // Modal Nuovo / Modifica Fornitore
  const [openModalFornitore, setOpenModalFornitore] = React.useState(false)
  const [salvandoFornitore, setSalvandoFornitore] = React.useState(false)
  const [fornitoreInModifica, setFornitoreInModifica] = React.useState<any | null>(null)

  const [formFornitore, setFormFornitore] = React.useState({
    ragioneSociale: '',
    tipoSoggetto: 'PERSONA_GIURIDICA',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    paese: 'IT',
    email: '',
    pec: '',
    telefono: '',
    referente: '',
    codiceDestinatarioSdi: '0000000',
    iban: '',
    categoria: 'Generale',
    note: '',
  })

  // --- STATO TAB FATTURE ACQUISTO ---
  const [acquisti, setAcquisti] = React.useState<any[]>([])
  const [loadingAcquisti, setLoadingAcquisti] = React.useState(false)
  const [cercaAcquisto, setCercaAcquisto] = React.useState('')
  const [annoAcquisti, setAnnoAcquisti] = React.useState<string>('TUTTI')
  const [statsAcquisti, setStatsAcquisti] = React.useState({
    totaleImporto: 0,
    totaleImponibile: 0,
    totaleIva: 0,
  })

  // Modal Importa XML / ZIP Aruba
  const [openModalImporta, setOpenModalImporta] = React.useState(false)
  const [importando, setImportando] = React.useState(false)
  const [fileDaImportare, setFileDaImportare] = React.useState<File | null>(null)
  const [esitoImport, setEsitoImport] = React.useState<any | null>(null)

  // 1. CARICAMENTO FORNITORI
  const caricaFornitori = React.useCallback(async () => {
    setLoadingFornitori(true)
    try {
      const params = new URLSearchParams({
        cerca: cercaFornitore,
        stato: statoFornitore,
        categoria: filtroCategoria,
        perPagina: '100',
      })
      const res = await fetch(`/api/fornitori?${params}`)
      const dati = await res.json()
      setFornitori(dati.fornitori ?? [])
      setCategorieDisponibili(dati.categorie ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i fornitori', variant: 'destructive' })
    } finally {
      setLoadingFornitori(false)
    }
  }, [cercaFornitore, statoFornitore, filtroCategoria, toast])

  // 2. CARICAMENTO FATTURE ACQUISTO
  const caricaAcquisti = React.useCallback(async () => {
    setLoadingAcquisti(true)
    try {
      const params = new URLSearchParams()
      if (cercaAcquisto) params.set('cerca', cercaAcquisto)
      if (annoAcquisti && annoAcquisti !== 'TUTTI') params.set('anno', annoAcquisti)

      const res = await fetch(`/api/fornitori/acquisti?${params}`)
      const dati = await res.json()
      setAcquisti(dati.fatture ?? [])
      setStatsAcquisti(
        dati.statistiche ?? {
          totaleImporto: 0,
          totaleImponibile: 0,
          totaleIva: 0,
        }
      )
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare le fatture d\'acquisto', variant: 'destructive' })
    } finally {
      setLoadingAcquisti(false)
    }
  }, [cercaAcquisto, annoAcquisti, toast])

  React.useEffect(() => {
    caricaFornitori()
    caricaAcquisti()
  }, [caricaFornitori, caricaAcquisti])

  React.useEffect(() => {
    if (activeTab === 'acquisti') {
      caricaAcquisti()
    }
  }, [activeTab, caricaAcquisti])

  // --- AZIONI FORNITORI ---
  const apriNuovoFornitore = () => {
    setFornitoreInModifica(null)
    setFormFornitore({
      ragioneSociale: '',
      tipoSoggetto: 'PERSONA_GIURIDICA',
      partitaIva: '',
      codiceFiscale: '',
      indirizzo: '',
      cap: '',
      comune: '',
      provincia: '',
      paese: 'IT',
      email: '',
      pec: '',
      telefono: '',
      referente: '',
      codiceDestinatarioSdi: '0000000',
      iban: '',
      categoria: 'Generale',
      note: '',
    })
    setOpenModalFornitore(true)
  }

  const apriModificaFornitore = (f: any) => {
    setFornitoreInModifica(f)
    setFormFornitore({
      ragioneSociale: f.ragioneSociale || '',
      tipoSoggetto: f.tipoSoggetto || 'PERSONA_GIURIDICA',
      partitaIva: f.partitaIva || '',
      codiceFiscale: f.codiceFiscale || '',
      indirizzo: f.indirizzo || '',
      cap: f.cap || '',
      comune: f.comune || '',
      provincia: f.provincia || '',
      paese: f.paese || 'IT',
      email: f.email || '',
      pec: f.pec || '',
      telefono: f.telefono || '',
      referente: f.referente || '',
      codiceDestinatarioSdi: f.codiceDestinatarioSdi || '0000000',
      iban: f.iban || '',
      categoria: f.categoria || 'Generale',
      note: f.note || '',
    })
    setOpenModalFornitore(true)
  }

  const handleSalvaFornitore = async () => {
    if (!formFornitore.ragioneSociale.trim()) {
      toast({ title: 'Inserisci la Ragione Sociale', variant: 'destructive' })
      return
    }

    setSalvandoFornitore(true)
    try {
      const url = fornitoreInModifica ? `/api/fornitori/${fornitoreInModifica.id}` : '/api/fornitori'
      const method = fornitoreInModifica ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formFornitore),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore salvataggio')

      toast({ title: fornitoreInModifica ? '✅ Fornitore aggiornato' : '✅ Fornitore aggiunto' })
      setOpenModalFornitore(false)
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setSalvandoFornitore(false)
    }
  }

  const handleEliminaFornitore = async (f: any) => {
    if (!confirm(`Sei sicuro di voler eliminare il fornitore "${f.ragioneSociale}"?`)) return

    try {
      const res = await fetch(`/api/fornitori/${f.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Errore durante l\'eliminazione')

      toast({ title: '✅ Fornitore eliminato' })
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    }
  }

  const handleToggleAttivo = async (f: any) => {
    try {
      const res = await fetch(`/api/fornitori/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: !f.attivo }),
      })
      if (!res.ok) throw new Error('Errore aggiornamento')
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    }
  }

  // --- AZIONI IMPORTAZIONE ARUBA ZIP/XML ---
  const handleAvviaImportazione = async () => {
    if (!fileDaImportare) {
      toast({ title: 'Seleziona un file ZIP o XML/P7M di Aruba', variant: 'destructive' })
      return
    }

    setImportando(true)
    setEsitoImport(null)
    try {
      const formData = new FormData()
      formData.append('file', fileDaImportare)

      const res = await fetch('/api/fornitori/importa', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'importazione')

      setEsitoImport(data)
      toast({
        title: '✅ Importazione completata',
        description: `${data.fattureCreate} fatture registrate, ${data.fornitoriCreati} nuovi fornitori censiti`,
      })
      caricaFornitori()
      caricaAcquisti()
    } catch (err: any) {
      toast({ title: 'Errore Importazione', description: err.message, variant: 'destructive' })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Pagina con Azioni Principali */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-indigo-600" />
            Fornitori & Fatture d'Acquisto
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestione anagrafiche fornitori, importazione fatture elettroniche passive Aruba (ZIP/XML) e controllo acquisti dello studio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              caricaFornitori()
              if (activeTab === 'acquisti') caricaAcquisti()
            }}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>

          <Button
            onClick={() => {
              setEsitoImport(null)
              setFileDaImportare(null)
              setOpenModalImporta(true)
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Importa Fatture di Acquisto (ZIP/XML Aruba)
          </Button>

          <Button onClick={apriNuovoFornitore} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Nuovo Fornitore
          </Button>
        </div>
      </div>

      {/* Tabs di navigazione */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="fornitori" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Anagrafica Fornitori ({fornitori.length})
          </TabsTrigger>
          <TabsTrigger value="acquisti" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Fatture d'Acquisto ({acquisti.length})
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: ANAGRAFICA FORNITORI                              */}
        {/* ======================================================== */}
        <TabsContent value="fornitori" className="space-y-4">
          {/* Filtri */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca per ragione sociale, P.IVA, codice fiscale, comune..."
                    value={cercaFornitore}
                    onChange={(e) => setCercaFornitore(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                    <SelectTrigger className="w-[190px]">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUTTE">Tutte le categorie</SelectItem>
                      {categorieDisponibili.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statoFornitore} onValueChange={setStatoFornitore}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attivi">Attivi</SelectItem>
                      <SelectItem value="archiviati">Archiviati</SelectItem>
                      <SelectItem value="tutti">Tutti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabella Fornitori */}
          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/75">
                  <TableHead className="font-semibold">Fornitore / Denominazione</TableHead>
                  <TableHead className="font-semibold">P.IVA / CF</TableHead>
                  <TableHead className="font-semibold">Categoria Spesa</TableHead>
                  <TableHead className="font-semibold">Sede</TableHead>
                  <TableHead className="font-semibold">Contatti / IBAN</TableHead>
                  <TableHead className="font-semibold text-center">Stato</TableHead>
                  <TableHead className="font-semibold text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingFornitori ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                      Caricamento elenco fornitori...
                    </TableCell>
                  </TableRow>
                ) : fornitori.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                      <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      Nessun fornitore trovato.
                      <p className="text-xs text-gray-400 mt-1">
                        Puoi aggiungerne uno manualmente o importare lo ZIP delle fatture Aruba per censirli in automatico!
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  fornitori.map((f) => (
                    <TableRow key={f.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="font-medium text-gray-900">{f.ragioneSociale}</div>
                        {f.referente && <div className="text-xs text-gray-500">Ref: {f.referente}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-gray-600">
                        {f.partitaIva ? `P.IVA: ${f.partitaIva}` : ''}
                        {f.codiceFiscale && f.codiceFiscale !== f.partitaIva ? (
                          <div>CF: {f.codiceFiscale}</div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          {f.categoria || 'Generale'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {f.comune ? `${f.comune} (${f.provincia || 'IT'})` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          {f.pec && (
                            <span className="flex items-center gap-1 text-indigo-600" title="PEC">
                              <Mail className="h-3 w-3" /> {f.pec}
                            </span>
                          )}
                          {f.email && !f.pec && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {f.email}
                            </span>
                          )}
                          {f.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {f.telefono}
                            </span>
                          )}
                          {f.iban && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500" title={`IBAN: ${f.iban}`}>
                              <CreditCard className="h-3 w-3" /> {f.iban.substring(0, 10)}...
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleAttivo(f)}
                          className="focus:outline-none"
                          title="Clicca per attivare/disattivare"
                        >
                          {f.attivo ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">
                              Attivo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 cursor-pointer">
                              Archiviato
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => apriModificaFornitore(f)}
                          title="Modifica Fornitore"
                        >
                          <Pencil className="h-4 w-4 text-gray-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminaFornitore(f)}
                          title="Elimina Fornitore"
                        >
                          <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: FATTURE D'ACQUISTO / PASSIVE                      */}
        {/* ======================================================== */}
        <TabsContent value="acquisti" className="space-y-6">
          {/* KPI Statistiche Acquisti */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Totale Imponibile Acquisti
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                        statsAcquisti.totaleImponibile
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      IVA a Credito (Detraibile)
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                        statsAcquisti.totaleIva
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Totale Lordo Documenti
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                      {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                        statsAcquisti.totaleImporto
                      )}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtri e Ricerca Acquisti */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca per fornitore, numero fattura o P.IVA..."
                    value={cercaAcquisto}
                    onChange={(e) => setCercaAcquisto(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Select value={annoAcquisti} onValueChange={setAnnoAcquisti}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Anno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TUTTI">Tutti gli anni</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabella Fatture di Acquisto */}
          <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/75">
                  <TableHead className="font-semibold">Data Doc.</TableHead>
                  <TableHead className="font-semibold">Numero</TableHead>
                  <TableHead className="font-semibold">Fornitore / Cedente</TableHead>
                  <TableHead className="font-semibold">Tipo Doc</TableHead>
                  <TableHead className="font-semibold text-right">Imponibile</TableHead>
                  <TableHead className="font-semibold text-right">IVA</TableHead>
                  <TableHead className="font-semibold text-right">Totale Documento</TableHead>
                  <TableHead className="font-semibold text-center">File XML</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAcquisti ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                      Caricamento fatture d'acquisto...
                    </TableCell>
                  </TableRow>
                ) : acquisti.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-gray-500">
                      <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      Nessuna fattura d'acquisto registrata per i filtri selezionati.
                      <div className="mt-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setEsitoImport(null)
                            setFileDaImportare(null)
                            setOpenModalImporta(true)
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Importa pacchetto Aruba (ZIP o XML)
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  acquisti.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium text-gray-800">
                        {new Date(doc.dataDocumento).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-indigo-600">
                        {doc.numero}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{doc.supplier?.ragioneSociale || '-'}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {doc.supplier?.partitaIva ? `P.IVA ${doc.supplier.partitaIva}` : doc.supplier?.codiceFiscale || ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                          {doc.tipoDocumento || 'TD01'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-700">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                          Number(doc.imponibile)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-600">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                          Number(doc.totaleIva)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-gray-900">
                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(
                          Number(doc.totaleDocumento)
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {doc.nomeFileXml ? (
                          <span className="text-[11px] font-mono text-gray-500 truncate block max-w-[140px] mx-auto" title={doc.nomeFileXml}>
                            {doc.nomeFileXml}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* MODAL IMPORTAZIONE FATTURE PASSIVE (ARUBA ZIP / XML)     */}
      {/* ======================================================== */}
      <Dialog open={openModalImporta} onOpenChange={setOpenModalImporta}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <UploadCloud className="h-6 w-6" />
              Importa Fatture di Acquisto (Aruba ZIP / XML / P7M)
            </DialogTitle>
            <DialogDescription>
              Carica lo ZIP scaricato dal portale Aruba (Fatture Ricevute) oppure singoli file XML/P7M.
              Il sistema estrarrà automaticamente i dati del fornitore (anagrafica, P.IVA, IBAN) e registrerà le fatture passive con relativi imponibili e IVA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
              <input
                type="file"
                id="file-import-aruba"
                accept=".zip,.xml,.p7m"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setFileDaImportare(f)
                }}
                className="hidden"
              />
              <label htmlFor="file-import-aruba" className="cursor-pointer block space-y-2">
                <UploadCloud className="h-10 w-10 text-emerald-600 mx-auto" />
                <div className="text-sm font-medium text-gray-800">
                  {fileDaImportare ? fileDaImportare.name : 'Clicca per selezionare il file ZIP o XML/P7M'}
                </div>
                <div className="text-xs text-gray-500">
                  Supporta archivi ZIP completi di Aruba o file singoli (.xml / .xml.p7m)
                </div>
              </label>
            </div>

            {/* Esito dell'importazione se completata */}
            {esitoImport && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Riepilogo Importazione Aruba
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-emerald-900 mt-2">
                  <div>📁 File XML analizzati: <strong>{esitoImport.totaleFattureTrovate}</strong></div>
                  <div>📄 Fatture registrate: <strong>{esitoImport.fattureCreate}</strong></div>
                  <div>🏢 Fornitori nuovi censiti: <strong>{esitoImport.fornitoriCreati}</strong></div>
                  <div>🔄 Fornitori aggiornati: <strong>{esitoImport.fornitoriAggiornati}</strong></div>
                  <div>⚠️ Già presenti (saltate): <strong>{esitoImport.fattureGiaEsistenti}</strong></div>
                </div>
                {esitoImport.errori && esitoImport.errori.length > 0 && (
                  <div className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded">
                    <strong>Avvisi ({esitoImport.errori.length}):</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {esitoImport.errori.slice(0, 3).map((e: string, idx: number) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpenModalImporta(false)}
              disabled={importando}
            >
              Chiudi
            </Button>
            <Button
              onClick={handleAvviaImportazione}
              disabled={importando || !fileDaImportare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {importando ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importazione in corso...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Avvia Importazione
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL NUOVO / MODIFICA FORNITORE                         */}
      {/* ======================================================== */}
      <Dialog open={openModalFornitore} onOpenChange={setOpenModalFornitore}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {fornitoreInModifica ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati identificativi, fiscali e bancari del fornitore dello studio.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label>Ragione Sociale / Nome Fornitore *</Label>
              <Input
                value={formFornitore.ragioneSociale}
                onChange={(e) => setFormFornitore({ ...formFornitore, ragioneSociale: e.target.value })}
                placeholder="es. TeamSystem SpA, Enel Energia, ecc."
              />
            </div>

            <div>
              <Label>Partita IVA</Label>
              <Input
                value={formFornitore.partitaIva}
                onChange={(e) => setFormFornitore({ ...formFornitore, partitaIva: e.target.value.trim() })}
                placeholder="11 cifre"
                maxLength={16}
              />
            </div>

            <div>
              <Label>Codice Fiscale</Label>
              <Input
                value={formFornitore.codiceFiscale}
                onChange={(e) => setFormFornitore({ ...formFornitore, codiceFiscale: e.target.value.toUpperCase().trim() })}
                placeholder="CF 16 car. o P.IVA 11 cifre"
                maxLength={16}
              />
            </div>

            <div>
              <Label>Categoria di Spesa</Label>
              <Select
                value={formFornitore.categoria}
                onValueChange={(val) => setFormFornitore({ ...formFornitore, categoria: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIE_PREDEFINITE.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Referente / Ufficio Contabilità</Label>
              <Input
                value={formFornitore.referente}
                onChange={(e) => setFormFornitore({ ...formFornitore, referente: e.target.value })}
                placeholder="es. Mario Rossi (Amministrazione)"
              />
            </div>

            <div className="col-span-2">
              <Label>Indirizzo Sede Legale</Label>
              <Input
                value={formFornitore.indirizzo}
                onChange={(e) => setFormFornitore({ ...formFornitore, indirizzo: e.target.value })}
                placeholder="es. Via Umberto Poli 9"
              />
            </div>

            <div>
              <Label>Comune</Label>
              <Input
                value={formFornitore.comune}
                onChange={(e) => setFormFornitore({ ...formFornitore, comune: e.target.value })}
                placeholder="es. Reggio Emilia"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>CAP</Label>
                <Input
                  value={formFornitore.cap}
                  onChange={(e) => setFormFornitore({ ...formFornitore, cap: e.target.value })}
                  placeholder="42123"
                />
              </div>
              <div>
                <Label>Provincia</Label>
                <Input
                  value={formFornitore.provincia}
                  onChange={(e) => setFormFornitore({ ...formFornitore, provincia: e.target.value.toUpperCase() })}
                  placeholder="RE"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Codice Destinatario SDI</Label>
              <Input
                value={formFornitore.codiceDestinatarioSdi}
                onChange={(e) => setFormFornitore({ ...formFornitore, codiceDestinatarioSdi: e.target.value.toUpperCase() })}
                placeholder="7 caratteri (default 0000000)"
              />
            </div>

            <div>
              <Label>PEC</Label>
              <Input
                type="email"
                value={formFornitore.pec}
                onChange={(e) => setFormFornitore({ ...formFornitore, pec: e.target.value })}
                placeholder="fornitore@pec.it"
              />
            </div>

            <div>
              <Label>Email Ordinaria</Label>
              <Input
                type="email"
                value={formFornitore.email}
                onChange={(e) => setFormFornitore({ ...formFornitore, email: e.target.value })}
                placeholder="info@fornitore.it"
              />
            </div>

            <div>
              <Label>Telefono</Label>
              <Input
                value={formFornitore.telefono}
                onChange={(e) => setFormFornitore({ ...formFornitore, telefono: e.target.value })}
                placeholder="es. 0522 123456"
              />
            </div>

            <div className="col-span-2">
              <Label>IBAN per Pagamenti Bonifico</Label>
              <Input
                value={formFornitore.iban}
                onChange={(e) => setFormFornitore({ ...formFornitore, iban: e.target.value.toUpperCase() })}
                placeholder="IT00X0000000000000000000000"
              />
            </div>

            <div className="col-span-2">
              <Label>Note interne / Condizioni di fornitura</Label>
              <Input
                value={formFornitore.note}
                onChange={(e) => setFormFornitore({ ...formFornitore, note: e.target.value })}
                placeholder="es. Pagamento 60 gg data fattura fine mese"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenModalFornitore(false)} disabled={salvandoFornitore}>
              Annulla
            </Button>
            <Button onClick={handleSalvaFornitore} disabled={salvandoFornitore} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {salvandoFornitore ? 'Salvataggio...' : 'Salva Fornitore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
