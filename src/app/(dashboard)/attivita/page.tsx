'use client'
// src/app/(dashboard)/attivita/page.tsx — con dati reali da API e creazione/approvazione

import * as React from 'react'
import { Plus, Search, Filter, RefreshCw, Check, AlertTriangle, Eye, Clock } from 'lucide-react'
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
import { formatEuro, formatData, statoWorkEntryLabel } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function AttivitaPage() {
  const { toast } = useToast()
  const [attivita, setAttivita] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [servizi, setServizi] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filtri
  const [filtroStato, setFiltroStato] = React.useState<string>('TUTTI')
  const [filtroAzienda, setFiltroAzienda] = React.useState<string>('TUTTE')
  const [ricerca, setRicerca] = React.useState('')

  // Dialog Nuova Attività
  const [openNuova, setOpenNuova] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [formAzienda, setFormAzienda] = React.useState('')
  const [formServizio, setFormServizio] = React.useState('')
  const [formData, setFormData] = React.useState(new Date().toISOString().split('T')[0])
  const [formDescrizione, setFormDescrizione] = React.useState('')
  const [formQuantita, setFormQuantita] = React.useState('1')
  const [formMinuti, setFormMinuti] = React.useState('')
  const [formPrezzo, setFormPrezzo] = React.useState('')
  const [formNote, setFormNote] = React.useState('')
  const [formStato, setFormStato] = React.useState<'DA_VERIFICARE' | 'APPROVATA'>('DA_VERIFICARE')

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ perPagina: '200' })
      if (filtroStato !== 'TUTTI') params.set('stato', filtroStato)
      if (filtroAzienda !== 'TUTTE') params.set('companyId', filtroAzienda)

      const [resAtt, resAz, resSer] = await Promise.all([
        fetch(`/api/attivita?${params}`),
        fetch('/api/aziende?perPagina=100&stato=attive'),
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

  // Calcolo automatico prezzo quando cambia servizio o azienda
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

  const handleApprova = async (id: string) => {
    try {
      const res = await fetch(`/api/attivita/${id}/approva`, { method: 'POST' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Attività approvata', description: 'Attività pronta per la fatturazione' })
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore approvazione', description: e.message, variant: 'destructive' })
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
          companyId: formAzienda || undefined,
          serviceId: formServizio || undefined,
          data: formData,
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
                <SelectItem value="IN_BOZZA">In bozza</SelectItem>
                <SelectItem value="FATTURATA">Fatturate</SelectItem>
                <SelectItem value="ESCLUSA">Escluse</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroAzienda} onValueChange={setFiltroAzienda}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tutte le aziende" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUTTE">Tutte le aziende</SelectItem>
                {aziende.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.ragioneSociale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                          <div className="flex items-center justify-end gap-1">
                            {['DA_CLASSIFICARE', 'DA_VERIFICARE'].includes(a.stato) && a.companyId && a.serviceId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                onClick={() => handleApprova(a.id)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" /> Approva
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
              <Select value={formAzienda} onValueChange={setFormAzienda}>
                <SelectTrigger id="azienda">
                  <SelectValue placeholder="Seleziona azienda..." />
                </SelectTrigger>
                <SelectContent>
                  {aziende.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.ragioneSociale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </div>
  )
}
