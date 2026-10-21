'use client'
// src/app/(dashboard)/tariffario/page.tsx — Gestione completa del Tariffario e Compensi Studio

import * as React from 'react'
import {
  Plus,
  RefreshCw,
  Layers,
  Tag,
  Search,
  Pencil,
  Trash2,
  Power,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatEuro } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ServizioItem {
  id: string
  codice: string
  descrizione: string
  unita: string
  prezzoBase: number | null
  tariffaOraria: number | null
  aliquotaIva: string
  naturaIva: string
  arrotondamento: string
  attivo: boolean
  note: string | null
  priceRules?: any[]
  _count?: { workEntries: number }
}

interface FasciaItem {
  id: string
  serviceId: string
  companyId: string | null
  tipoDitta: string | null
  dipendentiMin: number | null
  dipendentiMax: number | null
  prezzoUnitario: number
  attiva: boolean
  note: string | null
  servizioCodice?: string
  servizioDescrizione?: string
}

export default function TariffarioPage() {
  const { toast } = useToast()
  const [servizi, setServizi] = React.useState<ServizioItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState('servizi')

  // Filtri ricerca e stato
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filtroStato, setFiltroStato] = React.useState<'TUTTI' | 'ATTIVI' | 'DISATTIVATI'>('TUTTI')

  // Dialog Nuovo Servizio
  const [openNuovo, setOpenNuovo] = React.useState(false)
  const [salvandoNuovo, setSalvandoNuovo] = React.useState(false)
  const [formNuovo, setFormNuovo] = React.useState({
    codice: '',
    descrizione: '',
    unita: 'PRATICA',
    prezzoBase: '',
    tariffaOraria: '',
    aliquotaIva: '0',
    naturaIva: 'N2.2',
    arrotondamento: 'COMMERCIALE',
    note: '',
  })

  // Dialog Modifica Servizio
  const [openModifica, setOpenModifica] = React.useState(false)
  const [salvandoModifica, setSalvandoModifica] = React.useState(false)
  const [servizioInModifica, setServizioInModifica] = React.useState<ServizioItem | null>(null)
  const [formModifica, setFormModifica] = React.useState({
    id: '',
    codice: '',
    descrizione: '',
    unita: 'PRATICA',
    prezzoBase: '',
    tariffaOraria: '',
    aliquotaIva: '0',
    naturaIva: 'N2.2',
    arrotondamento: 'COMMERCIALE',
    attivo: true,
    note: '',
  })

  // Dialog Fascia Buste Paga (Crea / Modifica)
  const [openFascia, setOpenFascia] = React.useState(false)
  const [salvandoFascia, setSalvandoFascia] = React.useState(false)
  const [fasciaInModifica, setFasciaInModifica] = React.useState<FasciaItem | null>(null)
  const [formFascia, setFormFascia] = React.useState({
    id: '',
    serviceId: '',
    tipoDitta: 'ordinaria',
    dipendentiMin: '1',
    dipendentiMax: '20',
    prezzoUnitario: '25.00',
    attiva: true,
    note: '',
  })

  // Dialog Conferma Eliminazione Servizio
  const [servizioDaEliminare, setServizioDaEliminare] = React.useState<ServizioItem | null>(null)
  const [eliminando, setEliminando] = React.useState(false)

  // Caricamento servizi (tutti, anche disattivati)
  const caricaServizi = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/servizi?soloAttivi=false')
      const dati = await res.json()
      setServizi(dati.servizi ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare il tariffario', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    caricaServizi()
  }, [caricaServizi])

  // Estrai tutte le fasce per buste paga da priceRules
  const fasceBustePaga = React.useMemo(() => {
    const regole: FasciaItem[] = []
    servizi.forEach((s) => {
      if (s.priceRules && s.priceRules.length > 0) {
        s.priceRules.forEach((pr: any) => {
          if (pr.tipoDitta || pr.dipendentiMin != null) {
            regole.push({
              id: pr.id,
              serviceId: s.id,
              companyId: pr.companyId ?? null,
              tipoDitta: pr.tipoDitta,
              dipendentiMin: pr.dipendentiMin,
              dipendentiMax: pr.dipendentiMax,
              prezzoUnitario: pr.prezzoUnitario != null ? Number(pr.prezzoUnitario) : (pr.prezzo != null ? Number(pr.prezzo) : 0),
              attiva: pr.attiva ?? true,
              note: pr.note ?? null,
              servizioCodice: s.codice,
              servizioDescrizione: s.descrizione,
            })
          }
        })
      }
    })
    return regole
  }, [servizi])

  // Servizi filtrati per ricerca e stato
  const serviziFiltrati = React.useMemo(() => {
    return servizi.filter((s) => {
      if (filtroStato === 'ATTIVI' && !s.attivo) return false
      if (filtroStato === 'DISATTIVATI' && s.attivo) return false
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchCodice = s.codice.toLowerCase().includes(query)
        const matchDesc = s.descrizione.toLowerCase().includes(query)
        const matchNote = s.note ? s.note.toLowerCase().includes(query) : false
        if (!matchCodice && !matchDesc && !matchNote) return false
      }
      return true
    })
  }, [servizi, searchQuery, filtroStato])

  // CREA NUOVO SERVIZIO
  const handleCreaServizio = async () => {
    if (!formNuovo.codice.trim() || !formNuovo.descrizione.trim()) {
      toast({ title: 'Campi obbligatori mancanti', description: 'Codice e descrizione sono obbligatori.', variant: 'destructive' })
      return
    }
    setSalvandoNuovo(true)
    try {
      const res = await fetch('/api/servizi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formNuovo,
          prezzoBase: formNuovo.prezzoBase ? parseFloat(formNuovo.prezzoBase) : null,
          tariffaOraria: formNuovo.tariffaOraria ? parseFloat(formNuovo.tariffaOraria) : null,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Servizio aggiunto al tariffario' })
      setOpenNuovo(false)
      setFormNuovo({
        codice: '',
        descrizione: '',
        unita: 'PRATICA',
        prezzoBase: '',
        tariffaOraria: '',
        aliquotaIva: '0',
        naturaIva: 'N2.2',
        arrotondamento: 'COMMERCIALE',
        note: '',
      })
      caricaServizi()
    } catch (e: any) {
      toast({ title: 'Errore creazione servizio', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoNuovo(false)
    }
  }

  // APRI MODIFICA SERVIZIO
  const apriModificaServizio = (s: ServizioItem) => {
    setServizioInModifica(s)
    setFormModifica({
      id: s.id,
      codice: s.codice,
      descrizione: s.descrizione,
      unita: s.unita,
      prezzoBase: s.prezzoBase != null ? String(s.prezzoBase) : '',
      tariffaOraria: s.tariffaOraria != null ? String(s.tariffaOraria) : '',
      aliquotaIva: s.aliquotaIva || '0',
      naturaIva: s.naturaIva || 'N2.2',
      arrotondamento: s.arrotondamento || 'COMMERCIALE',
      attivo: s.attivo ?? true,
      note: s.note || '',
    })
    setOpenModifica(true)
  }

  // SALVA MODIFICA SERVIZIO
  const handleSalvaModificaServizio = async () => {
    if (!formModifica.descrizione.trim()) {
      toast({ title: 'Descrizione obbligatoria', variant: 'destructive' })
      return
    }
    setSalvandoModifica(true)
    try {
      const res = await fetch(`/api/servizi/${formModifica.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descrizione: formModifica.descrizione.trim(),
          unita: formModifica.unita,
          prezzoBase: formModifica.prezzoBase ? parseFloat(formModifica.prezzoBase) : null,
          tariffaOraria: formModifica.tariffaOraria ? parseFloat(formModifica.tariffaOraria) : null,
          aliquotaIva: formModifica.aliquotaIva,
          naturaIva: formModifica.naturaIva,
          arrotondamento: formModifica.arrotondamento,
          attivo: formModifica.attivo,
          note: formModifica.note.trim() ? formModifica.note.trim() : null,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Tariffario aggiornato con successo', description: `Modificata prestazione ${formModifica.codice}` })
      setOpenModifica(false)
      caricaServizi()
    } catch (e: any) {
      toast({ title: 'Errore aggiornamento', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoModifica(false)
    }
  }

  // TOGGLE ATTIVO / DISATTIVATO IMMEDIATO
  const handleToggleAttivo = async (s: ServizioItem) => {
    const nuovoStato = !s.attivo
    try {
      const res = await fetch(`/api/servizi/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: nuovoStato }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({
        title: nuovoStato ? '✅ Servizio riattivato' : '⏸️ Servizio disattivato',
        description: `${s.codice} - ${s.descrizione}`,
      })
      setServizi((prev) => prev.map((item) => (item.id === s.id ? { ...item, attivo: nuovoStato } : item)))
    } catch (e: any) {
      toast({ title: 'Errore modifica stato', description: e.message, variant: 'destructive' })
    }
  }

  // ELIMINA SERVIZIO
  const handleConfermaEliminazione = async () => {
    if (!servizioDaEliminare) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/servizi/${servizioDaEliminare.id}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      if (dati.disattivato) {
        toast({
          title: '⚠️ Servizio disattivato',
          description: dati.messaggio,
        })
      } else {
        toast({ title: '✅ Servizio eliminato definitivamente' })
      }
      setServizioDaEliminare(null)
      caricaServizi()
    } catch (e: any) {
      toast({ title: 'Errore eliminazione', description: e.message, variant: 'destructive' })
    } finally {
      setEliminando(false)
    }
  }

  // APRI CREA FASCIA
  const apriNuovaFascia = () => {
    const bustaPaga = servizi.find((s) => s.codice === 'BUSTA_PAGA') || servizi[0]
    setFasciaInModifica(null)
    setFormFascia({
      id: '',
      serviceId: bustaPaga?.id ?? '',
      tipoDitta: 'ordinaria',
      dipendentiMin: '1',
      dipendentiMax: '20',
      prezzoUnitario: '25.00',
      attiva: true,
      note: '',
    })
    setOpenFascia(true)
  }

  // APRI MODIFICA FASCIA
  const apriModificaFascia = (f: FasciaItem) => {
    setFasciaInModifica(f)
    setFormFascia({
      id: f.id,
      serviceId: f.serviceId,
      tipoDitta: f.tipoDitta || 'ordinaria',
      dipendentiMin: f.dipendentiMin != null ? String(f.dipendentiMin) : '',
      dipendentiMax: f.dipendentiMax != null ? String(f.dipendentiMax) : '',
      prezzoUnitario: String(f.prezzoUnitario),
      attiva: f.attiva,
      note: f.note || '',
    })
    setOpenFascia(true)
  }

  // SALVA FASCIA (CREA O MODIFICA)
  const handleSalvaFascia = async () => {
    if (!formFascia.serviceId) {
      toast({ title: 'Seleziona una prestazione', variant: 'destructive' })
      return
    }
    const prezzo = parseFloat(formFascia.prezzoUnitario)
    if (isNaN(prezzo) || prezzo <= 0) {
      toast({ title: 'Inserisci un compenso unitario valido', variant: 'destructive' })
      return
    }

    setSalvandoFascia(true)
    try {
      if (fasciaInModifica) {
        // PUT
        const res = await fetch(`/api/servizi/price-rules/${fasciaInModifica.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipoDitta: formFascia.tipoDitta.trim() || null,
            dipendentiMin: formFascia.dipendentiMin ? parseInt(formFascia.dipendentiMin) : null,
            dipendentiMax: formFascia.dipendentiMax ? parseInt(formFascia.dipendentiMax) : null,
            prezzoUnitario: prezzo,
            attiva: formFascia.attiva,
            note: formFascia.note.trim() || null,
          }),
        })
        const dati = await res.json()
        if (!res.ok) throw new Error(dati.error)
        toast({ title: '✅ Fascia aggiornata' })
      } else {
        // POST
        const res = await fetch('/api/servizi/price-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formFascia.serviceId,
            tipoDitta: formFascia.tipoDitta.trim() || null,
            dipendentiMin: formFascia.dipendentiMin ? parseInt(formFascia.dipendentiMin) : null,
            dipendentiMax: formFascia.dipendentiMax ? parseInt(formFascia.dipendentiMax) : null,
            prezzoUnitario: prezzo,
            note: formFascia.note.trim() || null,
          }),
        })
        const dati = await res.json()
        if (!res.ok) throw new Error(dati.error)
        toast({ title: '✅ Nuova fascia creata con successo' })
      }
      setOpenFascia(false)
      caricaServizi()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio fascia', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoFascia(false)
    }
  }

  // ELIMINA FASCIA
  const handleEliminaFascia = async (f: FasciaItem) => {
    if (!confirm(`Sei sicuro di voler rimuovere la fascia per "${f.tipoDitta || 'qualsiasi'}" (${formatEuro(f.prezzoUnitario)})?`)) {
      return
    }
    try {
      const res = await fetch(`/api/servizi/price-rules/${f.id}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Fascia eliminata' })
      caricaServizi()
    } catch (e: any) {
      toast({ title: 'Errore eliminazione fascia', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tariffario & Compensi</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurazione prestazioni professionali dello studio (Dott. Antonio Tuzio) · Modifica prezzi e regole
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={caricaServizi}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Aggiorna
          </Button>
          <Button onClick={() => setOpenNuovo(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Nuovo Servizio
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="servizi">
            <Tag className="h-4 w-4 mr-1.5" /> Servizi & Prestazioni ({servizi.length})
          </TabsTrigger>
          <TabsTrigger value="fasce">
            <Layers className="h-4 w-4 mr-1.5" /> Fasce Buste Paga & CCNL ({fasceBustePaga.length})
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────────────
            TAB: Servizi & Prestazioni
           ───────────────────────────────────────────────────────────── */}
        <TabsContent value="servizi" className="space-y-4">
          {/* Barra di ricerca e filtri */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-gray-200">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per codice o descrizione..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-gray-500">Stato:</span>
              <div className="inline-flex rounded-md shadow-sm border border-gray-200 p-0.5 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setFiltroStato('TUTTI')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filtroStato === 'TUTTI' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tutti ({servizi.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStato('ATTIVI')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filtroStato === 'ATTIVI' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Attivi ({servizi.filter((s) => s.attivo).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroStato('DISATTIVATI')}
                  className={`px-3 py-1 text-xs font-medium rounded ${
                    filtroStato === 'DISATTIVATI' ? 'bg-white shadow text-gray-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Disattivati ({servizi.filter((s) => !s.attivo).length})
                </button>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-gray-50/50">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Elenco Prestazioni e Tariffe Base</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Clicca sull'icona di modifica (✏️) per cambiare prezzo, descrizione o unità di misura.
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {serviziFiltrati.length} di {servizi.length} prestazioni
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : serviziFiltrati.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  Nessuna prestazione trovata per i criteri selezionati.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 text-xs">
                      <TableHead className="w-[130px]">Codice</TableHead>
                      <TableHead>Descrizione Prestazione</TableHead>
                      <TableHead className="w-[120px]">Unità</TableHead>
                      <TableHead className="text-right w-[140px]">Compenso Base</TableHead>
                      <TableHead className="w-[110px]">IVA</TableHead>
                      <TableHead className="w-[100px]">Stato</TableHead>
                      <TableHead className="text-right w-[140px]">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviziFiltrati.map((s) => (
                      <TableRow key={s.id} className={`hover:bg-blue-50/40 transition-colors ${!s.attivo ? 'opacity-60 bg-gray-50/60' : ''}`}>
                        <TableCell className="font-mono font-semibold text-blue-700 text-xs">
                          {s.codice}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900 text-sm">{s.descrizione}</div>
                          {s.note && <span className="block text-xs text-gray-400 mt-0.5">{s.note}</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-mono font-normal">
                            {s.unita}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 text-sm">
                          {s.prezzoBase != null ? (
                            formatEuro(s.prezzoBase)
                          ) : s.tariffaOraria ? (
                            <span>{formatEuro(s.tariffaOraria)}<span className="text-xs font-normal text-gray-500">/ora</span></span>
                          ) : (
                            <span className="text-xs text-gray-400 font-normal italic">Su preventivo</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-gray-500">
                          {s.naturaIva || 'N2.2'} {s.aliquotaIva ? `(${s.aliquotaIva}%)` : '(0%)'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.attivo ? 'success' : 'secondary'} className="text-[11px]">
                            {s.attivo ? 'Attivo' : 'Disattivato'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              onClick={() => apriModificaServizio(s)}
                              title="Modifica tariffa e dati"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 w-8 p-0 ${s.attivo ? 'text-gray-400 hover:text-amber-600' : 'text-green-600 hover:text-green-800'}`}
                              onClick={() => handleToggleAttivo(s)}
                              title={s.attivo ? 'Disattiva prestazione' : 'Riattiva prestazione'}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setServizioDaEliminare(s)}
                              title="Elimina dal tariffario"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────
            TAB: Fasce Buste Paga & CCNL
           ───────────────────────────────────────────────────────────── */}
        <TabsContent value="fasce" className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
            <div>
              <p className="text-sm font-semibold text-gray-900">Scaglioni per Elaborazione Cedolini Paga</p>
              <p className="text-xs text-gray-500">
                Calcolo automatico del compenso unitario a cedolino in base al tipo di ditta e al numero dipendenti.
              </p>
            </div>
            <Button size="sm" onClick={apriNuovaFascia}>
              <Plus className="h-4 w-4 mr-1.5" /> Nuova Fascia
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 text-xs">
                    <TableHead>Settore / Ditta</TableHead>
                    <TableHead>Fascia Dipendenti</TableHead>
                    <TableHead>Prestazione Collegata</TableHead>
                    <TableHead className="text-right">Compenso Unitario / Cedolino</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fasceBustePaga.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                        Nessuna fascia configurata. Clicca su &quot;Nuova Fascia&quot; per definirne una.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fasceBustePaga.map((f) => (
                      <TableRow key={f.id} className="hover:bg-gray-50">
                        <TableCell className="font-semibold text-gray-900 capitalize">
                          {f.tipoDitta || 'Tutti i settori'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {f.dipendentiMin != null
                            ? f.dipendentiMax != null
                              ? `Da ${f.dipendentiMin} a ${f.dipendentiMax} dipendenti`
                              : `Oltre ${f.dipendentiMin} dipendenti`
                            : 'Qualsiasi numero'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono text-xs">
                          {f.servizioCodice} — {f.servizioDescrizione}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-700 text-sm">
                          {formatEuro(f.prezzoUnitario)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {f.note || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={f.attiva ? 'success' : 'secondary'} className="text-[11px]">
                            {f.attiva ? 'Attiva' : 'Disattivata'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-800"
                              onClick={() => apriModificaFascia(f)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaFascia(f)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Modifica Servizio Esistente
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openModifica} onOpenChange={setOpenModifica}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Modifica Prestazione: <span className="font-mono text-blue-700">{formModifica.codice}</span>
            </DialogTitle>
            <DialogDescription>
              Aggiorna il compenso base, la tariffa oraria, l&apos;unità di misura o le note contabili per questa prestazione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="mod-descrizione">Descrizione della prestazione *</Label>
              <Input
                id="mod-descrizione"
                value={formModifica.descrizione}
                onChange={(e) => setFormModifica({ ...formModifica, descrizione: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mod-unita">Unità di misura</Label>
                <Select
                  value={formModifica.unita}
                  onValueChange={(v) => setFormModifica({ ...formModifica, unita: v })}
                >
                  <SelectTrigger id="mod-unita">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRATICA">Per pratica</SelectItem>
                    <SelectItem value="ORA">All&apos;ora</SelectItem>
                    <SelectItem value="CEDOLINO">A cedolino</SelectItem>
                    <SelectItem value="DICHIARAZIONE">A dichiarazione</SelectItem>
                    <SelectItem value="MESE">Canone mensile</SelectItem>
                    <SelectItem value="QUANTITA">A quantità</SelectItem>
                    <SelectItem value="BUSTA_PAGA_FASCIA">Fascia buste paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-prezzoBase">
                  {formModifica.unita === 'ORA' ? 'Compenso a forfait (€)' : 'Prezzo Base (€)'}
                </Label>
                <Input
                  id="mod-prezzoBase"
                  type="number"
                  step="0.01"
                  placeholder="es. 120.00"
                  value={formModifica.prezzoBase}
                  onChange={(e) => setFormModifica({ ...formModifica, prezzoBase: e.target.value })}
                />
              </div>
            </div>

            {/* Se è a ora o misto, mostra anche la tariffa oraria e l'arrotondamento */}
            <div className="grid grid-cols-2 gap-3 bg-blue-50/60 p-3 rounded-md border border-blue-100">
              <div className="space-y-1.5">
                <Label htmlFor="mod-tariffaOraria" className="text-blue-900">Tariffa Oraria (€/ora)</Label>
                <Input
                  id="mod-tariffaOraria"
                  type="number"
                  step="0.01"
                  placeholder="es. 80.00"
                  value={formModifica.tariffaOraria}
                  onChange={(e) => setFormModifica({ ...formModifica, tariffaOraria: e.target.value })}
                  className="bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-arrotondamento" className="text-blue-900">Arrotondamento Ore</Label>
                <Select
                  value={formModifica.arrotondamento}
                  onValueChange={(v) => setFormModifica({ ...formModifica, arrotondamento: v })}
                >
                  <SelectTrigger id="mod-arrotondamento" className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMERCIALE">Commerciale (esatto)</SelectItem>
                    <SelectItem value="QUARTO_ORA">Al quarto d&apos;ora (15m)</SelectItem>
                    <SelectItem value="SEMPRE_SU">Sempre per eccesso</SelectItem>
                    <SelectItem value="SEMPRE_GIU">Sempre per difetto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mod-naturaIva">Natura IVA (FatturaPA)</Label>
                <Select
                  value={formModifica.naturaIva}
                  onValueChange={(v) => setFormModifica({ ...formModifica, naturaIva: v })}
                >
                  <SelectTrigger id="mod-naturaIva">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N2.2">N2.2 (Regime Forfetario)</SelectItem>
                    <SelectItem value="N1">N1 (Escluse ex art. 15)</SelectItem>
                    <SelectItem value="N4">N4 (Esenti art. 10)</SelectItem>
                    <SelectItem value="N3.1">N3.1 (Non imponibili)</SelectItem>
                    <SelectItem value="ORDINARIA">Nessuna natura (IVA ordinaria)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-aliquotaIva">Aliquota IVA (%)</Label>
                <Select
                  value={formModifica.aliquotaIva}
                  onValueChange={(v) => setFormModifica({ ...formModifica, aliquotaIva: v })}
                >
                  <SelectTrigger id="mod-aliquotaIva">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Forfetario / Esente)</SelectItem>
                    <SelectItem value="22">22% (Ordinaria)</SelectItem>
                    <SelectItem value="10">10% (Ridotta)</SelectItem>
                    <SelectItem value="4">4% (Minima)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mod-note">Note interne / Istruzioni</Label>
              <Input
                id="mod-note"
                placeholder="es. Applicabile a ditte individuali o forfettari..."
                value={formModifica.note}
                onChange={(e) => setFormModifica({ ...formModifica, note: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <input
                type="checkbox"
                id="mod-attivo"
                checked={formModifica.attivo}
                onChange={(e) => setFormModifica({ ...formModifica, attivo: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="mod-attivo" className="text-sm font-medium text-gray-700 cursor-pointer">
                Prestazione attiva (visibile per nuove attività e sincronizzazioni)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpenModifica(false)}>
              Annulla
            </Button>
            <Button onClick={handleSalvaModificaServizio} disabled={salvandoModifica || !formModifica.descrizione.trim()}>
              {salvandoModifica ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Nuovo Servizio
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openNuovo} onOpenChange={setOpenNuovo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiungi Voce al Tariffario</DialogTitle>
            <DialogDescription>
              Definisci una nuova prestazione professionale con relativa unità di misura e compenso base.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nuovo-codice">Codice identificativo *</Label>
              <Input
                id="nuovo-codice"
                placeholder="es. CONS_AZ_01"
                value={formNuovo.codice}
                onChange={(e) => setFormNuovo({ ...formNuovo, codice: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nuovo-descrizione">Descrizione della prestazione *</Label>
              <Input
                id="nuovo-descrizione"
                placeholder="es. Consulenza societaria e tributaria"
                value={formNuovo.descrizione}
                onChange={(e) => setFormNuovo({ ...formNuovo, descrizione: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nuovo-unita">Unità di misura</Label>
                <Select
                  value={formNuovo.unita}
                  onValueChange={(v) => setFormNuovo({ ...formNuovo, unita: v })}
                >
                  <SelectTrigger id="nuovo-unita">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRATICA">Per pratica</SelectItem>
                    <SelectItem value="ORA">All&apos;ora</SelectItem>
                    <SelectItem value="CEDOLINO">A cedolino</SelectItem>
                    <SelectItem value="DICHIARAZIONE">A dichiarazione</SelectItem>
                    <SelectItem value="MESE">Canone mensile</SelectItem>
                    <SelectItem value="QUANTITA">A quantità</SelectItem>
                    <SelectItem value="BUSTA_PAGA_FASCIA">Fascia buste paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nuovo-prezzoBase">Prezzo base (€)</Label>
                <Input
                  id="nuovo-prezzoBase"
                  type="number"
                  step="0.01"
                  placeholder="es. 120.00"
                  value={formNuovo.prezzoBase}
                  onChange={(e) => setFormNuovo({ ...formNuovo, prezzoBase: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="nuovo-note">Note interne</Label>
              <Input
                id="nuovo-note"
                placeholder="es. Applicabile solo per ditte individuali..."
                value={formNuovo.note}
                onChange={(e) => setFormNuovo({ ...formNuovo, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNuovo(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreaServizio} disabled={salvandoNuovo || !formNuovo.codice.trim() || !formNuovo.descrizione.trim()}>
              {salvandoNuovo ? 'Salvataggio...' : 'Crea Servizio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Nuova / Modifica Fascia Buste Paga
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openFascia} onOpenChange={setOpenFascia}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {fasciaInModifica ? 'Modifica Scaglione Busta Paga' : 'Nuovo Scaglione Busta Paga'}
            </DialogTitle>
            <DialogDescription>
              Imposta il compenso unitario a cedolino in base al tipo di ditta e al numero dei dipendenti.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="fascia-servizio">Prestazione di riferimento *</Label>
              <Select
                value={formFascia.serviceId}
                onValueChange={(v) => setFormFascia({ ...formFascia, serviceId: v })}
              >
                <SelectTrigger id="fascia-servizio">
                  <SelectValue placeholder="Seleziona servizio..." />
                </SelectTrigger>
                <SelectContent>
                  {servizi
                    .filter((s) => s.unita === 'BUSTA_PAGA_FASCIA' || s.codice.includes('BUSTA') || s.codice.includes('CEDOLINO'))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.codice} — {s.descrizione}
                      </SelectItem>
                    ))}
                  {/* Fallback per selezionare qualsiasi servizio */}
                  {servizi
                    .filter((s) => s.unita !== 'BUSTA_PAGA_FASCIA' && !s.codice.includes('BUSTA') && !s.codice.includes('CEDOLINO'))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.codice} — {s.descrizione}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fascia-tipoDitta">Settore / Tipo Ditta</Label>
              <Input
                id="fascia-tipoDitta"
                placeholder="es. ordinaria, edilizia, commercio, artigianato..."
                value={formFascia.tipoDitta}
                onChange={(e) => setFormFascia({ ...formFascia, tipoDitta: e.target.value })}
              />
              <span className="text-[11px] text-gray-400">Lascia vuoto per applicare a tutti i settori.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fascia-min">Dipendenti da</Label>
                <Input
                  id="fascia-min"
                  type="number"
                  min="0"
                  placeholder="1"
                  value={formFascia.dipendentiMin}
                  onChange={(e) => setFormFascia({ ...formFascia, dipendentiMin: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fascia-max">Dipendenti a</Label>
                <Input
                  id="fascia-max"
                  type="number"
                  min="0"
                  placeholder="20 (vuoto = ∞)"
                  value={formFascia.dipendentiMax}
                  onChange={(e) => setFormFascia({ ...formFascia, dipendentiMax: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fascia-prezzo">Compenso per singolo cedolino (€) *</Label>
              <Input
                id="fascia-prezzo"
                type="number"
                step="0.01"
                placeholder="es. 25.00"
                value={formFascia.prezzoUnitario}
                onChange={(e) => setFormFascia({ ...formFascia, prezzoUnitario: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fascia-note">Note / Descrizione fascia</Label>
              <Input
                id="fascia-note"
                placeholder="es. Ditte ordinarie da 1 a 20 dipendenti"
                value={formFascia.note}
                onChange={(e) => setFormFascia({ ...formFascia, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenFascia(false)}>
              Annulla
            </Button>
            <Button onClick={handleSalvaFascia} disabled={salvandoFascia || !formFascia.serviceId}>
              {salvandoFascia ? 'Salvataggio...' : fasciaInModifica ? 'Salva Modifiche' : 'Crea Fascia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Conferma Eliminazione Servizio
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={!!servizioDaEliminare} onOpenChange={(open) => !open && setServizioDaEliminare(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Eliminazione Servizio
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la prestazione{' '}
              <strong className="text-gray-900">{servizioDaEliminare?.codice}</strong> ({servizioDaEliminare?.descrizione})?
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs text-gray-500 py-2">
            Nota: se il servizio ha già attività registrate o collegate a fatture, verrà{' '}
            <strong>disattivato</strong> per preservare l&apos;integrità contabile anziché cancellato fisicamente.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServizioDaEliminare(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfermaEliminazione}
              disabled={eliminando}
            >
              {eliminando ? 'Eliminazione...' : 'Conferma Eliminazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
