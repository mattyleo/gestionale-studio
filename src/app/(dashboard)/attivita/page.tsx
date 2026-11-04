'use client'
// src/app/(dashboard)/attivita/page.tsx — con gestione Approva, Modifica ed Elimina attività

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, RefreshCw, Check, AlertTriangle, Eye, Clock, Pencil, Trash2, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SelettoreClienteCombobox } from '@/components/aziende/SelettoreClienteCombobox'
import { formatEuro, formatData, statoWorkEntryLabel, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function AttivitaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [attivita, setAttivita] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [servizi, setServizi] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [ricerca, setRicerca] = React.useState('')
  const [filtroStato, setFiltroStato] = React.useState('TUTTI')
  const [filtroAzienda, setFiltroAzienda] = React.useState('TUTTE')
  const [generandoBozzaId, setGenerandoBozzaId] = React.useState<string | null>(null)

  // Modale Nuova Attività
  const [openNuova, setOpenNuova] = React.useState(false)
  const [formData, setFormData] = React.useState(new Date().toISOString().split('T')[0])
  const [formAzienda, setFormAzienda] = React.useState('')
  const [formServizio, setFormServizio] = React.useState('')
  const [formDescrizione, setFormDescrizione] = React.useState('')
  const [formQuantita, setFormQuantita] = React.useState('1')
  const [formMinuti, setFormMinuti] = React.useState('')
  const [formPrezzo, setFormPrezzo] = React.useState('')
  const [formNote, setFormNote] = React.useState('')
  const [formStato, setFormStato] = React.useState('DA_VERIFICARE')
  const [salvando, setSalvando] = React.useState(false)

  // Modale Modifica Attività
  const [openModifica, setOpenModifica] = React.useState(false)
  const [attivitaInModifica, setAttivitaInModifica] = React.useState<any | null>(null)
  const [editData, setEditData] = React.useState('')
  const [editAzienda, setEditAzienda] = React.useState('')
  const [editServizio, setEditServizio] = React.useState('')
  const [editDescrizione, setEditDescrizione] = React.useState('')
  const [editQuantita, setEditQuantita] = React.useState('1')
  const [editMinuti, setEditMinuti] = React.useState('')
  const [editPrezzo, setEditPrezzo] = React.useState('')
  const [editNote, setEditNote] = React.useState('')
  const [editStato, setEditStato] = React.useState('DA_VERIFICARE')
  const [salvandoModifica, setSalvandoModifica] = React.useState(false)

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStato !== 'TUTTI') params.set('stato', filtroStato)
      if (filtroAzienda !== 'TUTTE') params.set('companyId', filtroAzienda)
      params.set('perPagina', '100')

      const [resAtt, resAz, resSer] = await Promise.all([
        fetch(`/api/attivita?${params}`),
        fetch('/api/aziende?perPagina=500&stato=attive'),
        fetch('/api/servizi?attivi=true'),
      ])

      const datiAtt = await resAtt.json()
      const datiAz = await resAz.json()
      const datiSer = await resSer.json()

      setAttivita(datiAtt.attivita ?? [])
      setAziende(datiAz.aziende ?? [])
      setServizi(datiSer.servizi ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i dati delle attività', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filtroStato, filtroAzienda, toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  // Calcolo automatico prezzo per nuova attività
  React.useEffect(() => {
    if (!formServizio) return
    async function calcolaPrezzo() {
      try {
        const res = await fetch('/api/tariffazione/calcola', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formServizio,
            companyId: formAzienda || undefined,
            data: formData,
            quantita: parseFloat(formQuantita) || 1,
            durataMinuti: formMinuti ? parseInt(formMinuti) : undefined,
          }),
        })
        const calc = await res.json()
        if (calc.prezzoUnitario != null) {
          setFormPrezzo(calc.prezzoUnitario.toFixed(2))
        }
      } catch {
        // Fallback silenzioso
      }
    }
    calcolaPrezzo()
  }, [formServizio, formAzienda, formData, formQuantita, formMinuti])

  // Calcolo automatico prezzo per modifica attività (se cambia servizio)
  const calcolaPrezzoModifica = async (serviceId: string, companyId: string) => {
    if (!serviceId) return
    try {
      const res = await fetch('/api/tariffazione/calcola', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          companyId: companyId || undefined,
          data: editData || new Date().toISOString().split('T')[0],
          quantita: parseFloat(editQuantita) || 1,
          durataMinuti: editMinuti ? parseInt(editMinuti) : undefined,
        }),
      })
      const calc = await res.json()
      if (calc.prezzoUnitario != null) {
        setEditPrezzo(calc.prezzoUnitario.toFixed(2))
      }
    } catch {
      // Fallback
    }
  }

  const apriModifica = (a: any) => {
    setAttivitaInModifica(a)
    setEditData(a.data ? new Date(a.data).toISOString().split('T')[0] : '')
    setEditAzienda(a.companyId || '')
    setEditServizio(a.serviceId || '')
    setEditDescrizione(a.descrizione || '')
    setEditQuantita(a.quantita ? String(Number(a.quantita)) : '1')
    setEditMinuti(a.durataMinutiFatturabili ? String(a.durataMinutiFatturabili) : '')
    setEditPrezzo(a.prezzoUnitario != null ? String(Number(a.prezzoUnitario)) : '')
    setEditNote(a.note || '')
    setEditStato(a.stato || 'DA_VERIFICARE')
    setOpenModifica(true)
  }

  const handleSalvaModifica = async () => {
    if (!attivitaInModifica) return
    setSalvandoModifica(true)
    try {
      const res = await fetch(`/api/attivita/${attivitaInModifica.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: editData || undefined,
          companyId: editAzienda || null,
          serviceId: editServizio || null,
          descrizione: editDescrizione || null,
          quantita: editQuantita !== '' ? parseFloat(editQuantita) : 1,
          durataMinutiLavorati: editMinuti !== '' ? parseInt(editMinuti) : null,
          durataMinutiFatturabili: editMinuti !== '' ? parseInt(editMinuti) : null,
          prezzoUnitario: editPrezzo !== '' ? parseFloat(editPrezzo) : null,
          note: editNote || null,
          stato: editStato,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error || 'Errore durante la modifica')

      toast({ title: '✅ Attività modificata con successo' })
      setOpenModifica(false)
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore modifica', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoModifica(false)
    }
  }

  const handleElimina = async (a: any) => {
    const nome = a.company?.ragioneSociale || 'Cliente'
    const prest = a.service?.descrizione || a.descrizione || 'prestazione'
    if (!confirm(`Sei sicuro di voler eliminare l'attività per ${nome} (${prest})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/attivita/${a.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Impossibile eliminare l\'attività')

      toast({ title: '✅ Attività eliminata con successo' })
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore eliminazione', description: e.message, variant: 'destructive' })
    }
  }

  const handleApprova = async (a: any) => {
    // Se manca il prezzo, apri subito la modale di modifica guidata per inserire il prezzo!
    if (!a.prezzoUnitario && !a.importo) {
      toast({
        title: '⚠️ Prezzo mancante',
        description: 'Per approvare l\'attività è necessario specificare il prezzo. Inseriscilo nella finestra di modifica.',
      })
      apriModifica(a)
      return
    }

    if (!a.companyId || !a.serviceId) {
      toast({
        title: '⚠️ Dati incompleti',
        description: 'Associa l\'azienda e la prestazione per approvare l\'attività.',
      })
      apriModifica(a)
      return
    }

    try {
      const res = await fetch(`/api/attivita/${a.id}/approva`, { method: 'POST' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({
        title: '✅ Attività approvata',
        description: 'Attività pronta! Ora puoi cliccare su "Fattura ora" per creare la bozza.',
      })
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore approvazione', description: e.message, variant: 'destructive' })
    }
  }

  const handleCreaBozzaDaAttivita = async (a: any) => {
    if (!a.companyId) {
      toast({
        title: '⚠️ Azienda mancante',
        description: 'Associa un cliente prima di generare la bozza di fattura.',
        variant: 'destructive',
      })
      apriModifica(a)
      return
    }

    setGenerandoBozzaId(a.id)
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: a.companyId,
          attivitaIds: [a.id],
          raggruppamento: 'dettagliato',
        }),
      })
      const bozza = await res.json()
      if (!res.ok) throw new Error(bozza.error)
      toast({
        title: '✅ Bozza di fattura creata!',
        description: `Bozza generata per ${a.company?.ragioneSociale || 'il cliente'}. Apertura in corso…`,
      })
      caricaDati()
      router.push(`/fatture/${bozza.id}`)
    } catch (e: any) {
      toast({ title: 'Errore creazione bozza', description: e.message, variant: 'destructive' })
    } finally {
      setGenerandoBozzaId(null)
    }
  }

  const handleCreaAttivita = async () => {
    if (!formData) {
      toast({ title: 'Data obbligatoria', variant: 'destructive' })
      return
    }
    setSalvando(true)
    try {
      const res = await fetch('/api/attivita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: formData,
          companyId: formAzienda || undefined,
          serviceId: formServizio || undefined,
          descrizione: formDescrizione || undefined,
          note: formNote || undefined,
          quantita: parseFloat(formQuantita) || 1,
          durataMinutiLavorati: formMinuti ? parseInt(formMinuti) : undefined,
          durataMinutiFatturabili: formMinuti ? parseInt(formMinuti) : undefined,
          prezzoUnitario: formPrezzo ? parseFloat(formPrezzo) : undefined,
          stato: formStato,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Attività registrata con successo' })
      setOpenNuova(false)
      // Reset form
      setFormAzienda('')
      setFormServizio('')
      setFormDescrizione('')
      setFormQuantita('1')
      setFormMinuti('')
      setFormPrezzo('')
      setFormNote('')
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio', description: e.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const badgeStatoClass = (s: string) => {
    switch (s) {
      case 'DA_CLASSIFICARE':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'DA_VERIFICARE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'APPROVATA':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_BOZZA':
      case 'IN_BOZZA_FATTURA':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'FATTURATA':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'ESCLUSA':
      case 'NON_FATTURABILE':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const attivitaFiltrate = attivita.filter((a) => {
    const nomeAzienda = a.company?.ragioneSociale || ''
    const nomeServizio = a.service?.descrizione || ''
    const desc = a.descrizione || ''
    const match =
      ricerca === '' ||
      nomeAzienda.toLowerCase().includes(ricerca.toLowerCase()) ||
      nomeServizio.toLowerCase().includes(ricerca.toLowerCase()) ||
      desc.toLowerCase().includes(ricerca.toLowerCase())
    return match
  })

  const totaleValore = attivitaFiltrate.reduce((sum, a) => sum + Number(a.importo || 0), 0)
  const attivitaApprovate = attivita.filter(a => a.stato === 'APPROVATA')
  const valoreApprovate = attivitaApprovate.reduce((sum, a) => sum + Number(a.importo || 0), 0)

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attività & Prestazioni</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {attivitaFiltrate.length} prestazioni registrate · Valore totale:{' '}
            <span className="font-semibold text-blue-700">{formatEuro(totaleValore)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button onClick={() => setOpenNuova(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuova Attività
          </Button>
        </div>
      </div>

      {/* Banner attività approvate pronte per la fatturazione */}
      {attivitaApprovate.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-green-200 bg-green-50 text-green-900 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full text-green-700 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {attivitaApprovate.length} {attivitaApprovate.length === 1 ? 'prestazione approvata pronta' : 'prestazioni approvate pronte'} per la fatturazione ({formatEuro(valoreApprovate)})
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Puoi fatturare subito ogni attività con il tasto <strong>"Fattura ora"</strong> nella tabella, oppure andare su Bozze per raggrupparle.
              </p>
            </div>
          </div>
          <Link href="/fatture/bozze">
            <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white shrink-0">
              <FileText className="h-4 w-4 mr-1.5" /> Vai a Bozze fatture
            </Button>
          </Link>
        </div>
      )}

      {/* Filtri */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per azienda, servizio o descrizione..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUTTI">Tutti gli stati</SelectItem>
                <SelectItem value="DA_CLASSIFICARE">Da classificare</SelectItem>
                <SelectItem value="DA_VERIFICARE">Da verificare</SelectItem>
                <SelectItem value="APPROVATA">Approvate</SelectItem>
                <SelectItem value="IN_BOZZA_FATTURA">In bozza fattura</SelectItem>
                <SelectItem value="FATTURATA">Fatturate</SelectItem>
                <SelectItem value="ESCLUSA">Escluse</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-full sm:w-64">
              <SelettoreClienteCombobox
                value={filtroAzienda}
                onValueChange={(id) => setFiltroAzienda(id || 'TUTTE')}
                aziende={aziende}
                includeAllOption
                allOptionLabel="Tutte le aziende"
                placeholder="Filtra per azienda..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabella */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Data</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Prestazione / Servizio</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="text-right">Q.tà / Tempo</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attivitaFiltrate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      Nessuna attività registrata
                    </TableCell>
                  </TableRow>
                ) : (
                  attivitaFiltrate.map((a) => {
                    const isDaClassificare = a.stato === 'DA_CLASSIFICARE'
                    const isFatturataOInBozza = ['FATTURATA', 'IN_BOZZA', 'IN_BOZZA_FATTURA'].includes(a.stato)
                    return (
                      <TableRow
                        key={a.id}
                        className={cn(
                          'hover:bg-gray-50 transition-colors',
                          isDaClassificare && 'bg-amber-50/70 border-l-4 border-l-amber-500'
                        )}
                      >
                        <TableCell className="text-sm font-medium">{formatData(a.data)}</TableCell>
                        <TableCell>
                          {a.company ? (
                            <span className="font-semibold text-gray-900">{a.company.ragioneSociale}</span>
                          ) : (
                            <span className="text-amber-600 font-medium italic flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" /> Da associare
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.service ? (
                            <span>{a.service.descrizione}</span>
                          ) : (
                            <span className="text-gray-400 italic">Non specificato</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-xs truncate" title={a.descrizione || ''}>
                          {a.descrizione || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {a.durataMinutiFatturabili ? `${a.durataMinutiFatturabili} min` : `${Number(a.quantita || 1).toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {a.prezzoUnitario != null ? formatEuro(a.prezzoUnitario) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">
                          {a.importo != null ? formatEuro(a.importo) : '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-xs font-medium', badgeStatoClass(a.stato))}>
                            {statoWorkEntryLabel(a.stato)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {/* Pulsante Approva */}
                            {['DA_CLASSIFICARE', 'DA_VERIFICARE'].includes(a.stato) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => handleApprova(a)}
                                title={!a.prezzoUnitario ? 'Specifica il prezzo per approvare' : 'Approva per la fatturazione'}
                              >
                                <Check className="h-3.5 w-3.5 mr-1 text-green-600" /> Approva
                              </Button>
                            )}

                            {/* Pulsante Fattura ora (per attività già approvate) */}
                            {a.stato === 'APPROVATA' && (
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
                                onClick={() => handleCreaBozzaDaAttivita(a)}
                                disabled={generandoBozzaId === a.id}
                                title="Genera subito la bozza di fattura per questa attività approvata"
                              >
                                <FileText className="h-3.5 w-3.5 mr-1" />
                                {generandoBozzaId === a.id ? 'Creazione…' : 'Fattura ora'}
                              </Button>
                            )}

                            {/* Pulsante Modifica */}
                            {!isFatturataOInBozza && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                onClick={() => apriModifica(a)}
                                title="Modifica attività (prezzo, descrizione, cliente...)"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Pulsante Elimina */}
                            {!isFatturataOInBozza && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleElimina(a)}
                                title="Elimina attività dal registro"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuova Attività */}
      <Dialog open={openNuova} onOpenChange={setOpenNuova}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuova Prestazione / Attività</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della prestazione svolta. Il prezzo verrà calcolato in base al tariffario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data prestazione *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stato">Stato iniziale</Label>
                <Select value={formStato} onValueChange={(v: any) => setFormStato(v)}>
                  <SelectTrigger id="stato">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DA_VERIFICARE">Da verificare</SelectItem>
                    <SelectItem value="APPROVATA">Approvata (pronta per fattura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="azienda">Azienda cliente *</Label>
              <SelettoreClienteCombobox
                value={formAzienda}
                onValueChange={(id) => setFormAzienda(id)}
                aziende={aziende}
                placeholder="Digita il nome dell'azienda o cliente (es. Rossi, Bar, Edil...)"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="servizio">Tipo di prestazione (Tariffario) *</Label>
              <Select value={formServizio} onValueChange={setFormServizio}>
                <SelectTrigger id="servizio">
                  <SelectValue placeholder="Seleziona prestazione..." />
                </SelectTrigger>
                <SelectContent>
                  {servizi.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.codice} — {s.descrizione} ({formatEuro(s.prezzoBase)} / {s.unita})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="quantita">Quantità</Label>
                <Input
                  id="quantita"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={formQuantita}
                  onChange={(e) => setFormQuantita(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minuti">Minuti lavorati</Label>
                <Input
                  id="minuti"
                  type="number"
                  placeholder="opzionale"
                  value={formMinuti}
                  onChange={(e) => setFormMinuti(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prezzo">Prezzo unitario (€)</Label>
                <Input
                  id="prezzo"
                  type="number"
                  step="0.01"
                  placeholder="Autocalcolato"
                  value={formPrezzo}
                  onChange={(e) => setFormPrezzo(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descrizione">Descrizione dettagliata</Label>
              <Input
                id="descrizione"
                placeholder="es. Elaborazione cedolini mese di settembre..."
                value={formDescrizione}
                onChange={(e) => setFormDescrizione(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Note interne</Label>
              <Input
                id="note"
                placeholder="Visibili solo allo studio..."
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNuova(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreaAttivita} disabled={salvando || !formData}>
              {salvando ? 'Salvataggio...' : 'Crea Attività'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Attività */}
      <Dialog open={openModifica} onOpenChange={setOpenModifica}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Modifica Prestazione / Attività
            </DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell'attività. Puoi impostare o correggere il prezzo, l'azienda e la descrizione.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-data">Data prestazione *</Label>
                <Input
                  id="edit-data"
                  type="date"
                  value={editData}
                  onChange={(e) => setEditData(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-stato">Stato attività</Label>
                <Select value={editStato} onValueChange={(v: any) => setEditStato(v)}>
                  <SelectTrigger id="edit-stato">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DA_VERIFICARE">Da verificare</SelectItem>
                    <SelectItem value="APPROVATA">Approvata (pronta per fattura)</SelectItem>
                    <SelectItem value="DA_CLASSIFICARE">Da classificare</SelectItem>
                    <SelectItem value="ESCLUSA">Esclusa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-azienda">Azienda cliente</Label>
              <SelettoreClienteCombobox
                value={editAzienda}
                onValueChange={(id) => {
                  setEditAzienda(id)
                  if (editServizio) calcolaPrezzoModifica(editServizio, id)
                }}
                aziende={aziende}
                placeholder="Digita il nome dell'azienda o cliente..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-servizio">Tipo di prestazione (Tariffario)</Label>
              <Select
                value={editServizio}
                onValueChange={(val) => {
                  setEditServizio(val)
                  calcolaPrezzoModifica(val, editAzienda)
                }}
              >
                <SelectTrigger id="edit-servizio">
                  <SelectValue placeholder="Seleziona prestazione..." />
                </SelectTrigger>
                <SelectContent>
                  {servizi.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.codice} — {s.descrizione} ({formatEuro(s.prezzoBase)} / {s.unita})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-quantita">Quantità</Label>
                <Input
                  id="edit-quantita"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={editQuantita}
                  onChange={(e) => setEditQuantita(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-minuti">Minuti lavorati</Label>
                <Input
                  id="edit-minuti"
                  type="number"
                  placeholder="opzionale"
                  value={editMinuti}
                  onChange={(e) => setEditMinuti(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-prezzo" className="font-semibold text-blue-900">
                  Prezzo unitario (€) *
                </Label>
                <Input
                  id="edit-prezzo"
                  type="number"
                  step="0.01"
                  placeholder="Es. 80.00"
                  value={editPrezzo}
                  onChange={(e) => setEditPrezzo(e.target.value)}
                  className="font-mono font-medium border-blue-300 focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-descrizione">Descrizione dettagliata</Label>
              <Input
                id="edit-descrizione"
                placeholder="es. Consulenza fiscale, elaborazione cedolini..."
                value={editDescrizione}
                onChange={(e) => setEditDescrizione(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-note">Note interne</Label>
              <Input
                id="edit-note"
                placeholder="Note visibili solo allo studio..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-between items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                if (attivitaInModifica) {
                  setOpenModifica(false)
                  handleElimina(attivitaInModifica)
                }
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Elimina attività
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpenModifica(false)}>
                Annulla
              </Button>
              <Button onClick={handleSalvaModifica} disabled={salvandoModifica || !editData}>
                {salvandoModifica ? 'Salvataggio...' : 'Salva Modifiche'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
