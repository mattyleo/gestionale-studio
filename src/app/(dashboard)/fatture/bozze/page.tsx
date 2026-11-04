'use client'
// src/app/(dashboard)/fatture/bozze/page.tsx — versione con API reali

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Plus, Eye, Send, Ban, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { formatEuro, formatData, statoInvoiceLabel, statoInvoiceBadgeColor, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImportaArubaModal } from '@/components/aruba/ImportaArubaModal'
import { SelettoreClienteCombobox } from '@/components/aziende/SelettoreClienteCombobox'

export default function BozzePage() {
  const { toast } = useToast()
  const [bozze, setBozze] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [attivitaApprovate, setAttivitaApprovate] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generaDialog, setGeneraDialog] = React.useState(false)
  const [generando, setGenerando] = React.useState(false)

  // Form genera bozza: default da inizio anno a fine mese corrente per non perdersi nulla
  const [selectedAzienda, setSelectedAzienda] = React.useState('')
  const oggi = new Date()
  const inizioAnno = `${oggi.getFullYear()}-01-01`
  const fineMese = new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0).toISOString().split('T')[0]
  const [periodoDal, setPeriodoDal] = React.useState(inizioAnno)
  const [periodoAl, setPeriodoAl] = React.useState(fineMese)
  const [raggruppamento, setRaggruppamento] = React.useState<'per_servizio' | 'dettagliato'>('per_servizio')

  const impostaPresetPeriodo = (tipo: 'anno' | 'questo_mese' | 'mese_scorso') => {
    const o = new Date()
    if (tipo === 'anno') {
      setPeriodoDal(`${o.getFullYear()}-01-01`)
      setPeriodoAl(new Date(o.getFullYear(), o.getMonth() + 1, 0).toISOString().split('T')[0])
    } else if (tipo === 'questo_mese') {
      setPeriodoDal(new Date(o.getFullYear(), o.getMonth(), 1).toISOString().split('T')[0])
      setPeriodoAl(new Date(o.getFullYear(), o.getMonth() + 1, 0).toISOString().split('T')[0])
    } else if (tipo === 'mese_scorso') {
      setPeriodoDal(new Date(o.getFullYear(), o.getMonth() - 1, 1).toISOString().split('T')[0])
      setPeriodoAl(new Date(o.getFullYear(), o.getMonth(), 0).toISOString().split('T')[0])
    }
  }

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resBozze, resAziende, resAttivita] = await Promise.all([
        fetch('/api/fatture?stato=bozze'),
        fetch('/api/aziende?stato=attive&perPagina=500'),
        fetch('/api/attivita?stato=APPROVATA&perPagina=500'),
      ])
      const datiBozze = await resBozze.json()
      const datiAziende = await resAziende.json()
      const datiAttivita = await resAttivita.json()
      setBozze(datiBozze.fatture ?? [])
      setAziende(datiAziende.aziende ?? [])
      setAttivitaApprovate(datiAttivita.attivita ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i dati', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => { caricaDati() }, [caricaDati])

  // Attività approvate per l'azienda e il periodo selezionato nel popup
  const attivitaSelezionatePerBozza = React.useMemo(() => {
    if (!selectedAzienda) return []
    return attivitaApprovate.filter(a => {
      if (a.companyId !== selectedAzienda) return false
      const dataStr = typeof a.data === 'string' ? a.data.split('T')[0] : new Date(a.data).toISOString().split('T')[0]
      if (periodoDal && dataStr < periodoDal) return false
      if (periodoAl && dataStr > periodoAl) return false
      return true
    })
  }, [selectedAzienda, attivitaApprovate, periodoDal, periodoAl])

  const totaleAttivitaSelezionate = attivitaSelezionatePerBozza.reduce((s, a) => s + Number(a.importo || 0), 0)
  const totaleGeneraleApprovate = attivitaApprovate.reduce((s, a) => s + Number(a.importo || 0), 0)

  const handleGeneraBozza = async () => {
    if (!selectedAzienda) {
      toast({ title: 'Seleziona un\'azienda', variant: 'destructive' })
      return
    }
    setGenerando(true)
    try {
      const res = await fetch('/api/fatture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedAzienda,
          periodoDal,
          periodoAl,
          raggruppamento,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Bozza creata', description: `Bozza generata per ${aziende.find(a => a.id === selectedAzienda)?.ragioneSociale}` })
      setGeneraDialog(false)
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore generazione', description: e.message, variant: 'destructive' })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bozze fatture</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fatture in preparazione, non ancora emesse</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportaArubaModal onSuccess={caricaDati} />
          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button onClick={() => setGeneraDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Genera bozze
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
                Ci sono {attivitaApprovate.length} {attivitaApprovate.length === 1 ? 'prestazione approvata' : 'prestazioni approvate'} in attesa di fatturazione ({formatEuro(totaleGeneraleApprovate)})
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                Clicca su <strong>"Genera bozze"</strong> per creare la fattura per il cliente desiderato.
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white shrink-0" onClick={() => setGeneraDialog(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Genera bozza ora
          </Button>
        </div>
      )}

      {/* Banner importante */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Le bozze sono escluse dal fatturato emesso e dagli insoluti.</strong>{' '}
          Compaiono nel fatturato e in <em>"Da incassare"</em> solo dopo la conferma di emissione con numero definitivo.
        </p>
      </div>

      {/* Tabella */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : bozze.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Nessuna bozza</p>
          <p className="text-sm mt-1">Clicca su "Genera bozze" per creare una nuova bozza da attività approvate.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ID / Azienda</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Righe</TableHead>
                <TableHead className="text-right">Importo</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Creata il</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bozze.map((b) => (
                <TableRow key={b.id} className="hover:bg-gray-50">
                  <TableCell>
                    <p className="font-medium text-gray-900">{b.company?.ragioneSociale}</p>
                    <p className="text-xs text-gray-400 font-mono">{b.id.slice(0, 8)}…</p>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {b.periodoDal ? `${formatData(b.periodoDal)} – ${formatData(b.periodoAl)}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{b._count?.lines ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium">{formatEuro(b.totaleDocumento)}</TableCell>
                  <TableCell>
                    <Badge className={statoInvoiceBadgeColor(b.stato)}>
                      {statoInvoiceLabel(b.stato)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{formatData(b.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Link href={`/fatture/${b.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog Genera Bozza */}
      <Dialog open={generaDialog} onOpenChange={setGeneraDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Genera bozza di fattura</DialogTitle>
            <DialogDescription>
              Seleziona l'azienda e il periodo. Verranno incluse solo le attività approvate non ancora fatturate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Azienda / Cliente</Label>
              <SelettoreClienteCombobox
                value={selectedAzienda}
                onValueChange={(id) => setSelectedAzienda(id)}
                aziende={aziende}
                placeholder="Digita il nome del cliente o azienda…"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Periodo attività</Label>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-blue-600 hover:text-blue-800" onClick={() => impostaPresetPeriodo('anno')}>
                    Anno intero
                  </Button>
                  <span className="text-gray-300">·</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-blue-600 hover:text-blue-800" onClick={() => impostaPresetPeriodo('questo_mese')}>
                    Questo mese
                  </Button>
                  <span className="text-gray-300">·</span>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-blue-600 hover:text-blue-800" onClick={() => impostaPresetPeriodo('mese_scorso')}>
                    Mese scorso
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Dal</span>
                  <Input type="date" value={periodoDal} onChange={e => setPeriodoDal(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500">Al</span>
                  <Input type="date" value={periodoAl} onChange={e => setPeriodoAl(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Anteprima attività trovate */}
            {selectedAzienda && (
              <div className={cn(
                'p-3 rounded-lg border text-xs',
                attivitaSelezionatePerBozza.length > 0
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              )}>
                {attivitaSelezionatePerBozza.length > 0 ? (
                  <p className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span>
                      Trovate <strong>{attivitaSelezionatePerBozza.length}</strong> prestazioni approvate nel periodo ({formatEuro(totaleAttivitaSelezionate)})
                    </span>
                  </p>
                ) : (
                  <p className="flex items-start gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Nessuna attività approvata trovata per questa azienda nel periodo indicato. Se hai appena registrato una prestazione, verifica che la data rientri nel periodo o che sia in stato <strong>Approvata</strong> in Attività.
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Raggruppamento righe</Label>
              <Select value={raggruppamento} onValueChange={(v: any) => setRaggruppamento(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_servizio">Per tipo prestazione (una riga per servizio)</SelectItem>
                  <SelectItem value="dettagliato">Dettagliato (una riga per attività)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGeneraDialog(false)}>Annulla</Button>
            <Button onClick={handleGeneraBozza} disabled={generando || !selectedAzienda}>
              {generando ? 'Generazione…' : 'Genera bozza'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
