'use client'
// src/app/(dashboard)/fatture/bozze/page.tsx — versione con API reali

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, Plus, Eye, Send, Ban, RefreshCw } from 'lucide-react'
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
import { formatEuro, formatData, statoInvoiceLabel, statoInvoiceBadgeColor } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function BozzePage() {
  const { toast } = useToast()
  const [bozze, setBozze] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [generaDialog, setGeneraDialog] = React.useState(false)
  const [generando, setGenerando] = React.useState(false)

  // Form genera bozza
  const [selectedAzienda, setSelectedAzienda] = React.useState('')
  const oggi = new Date()
  const primoMese = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1).toISOString().split('T')[0]
  const ultimoMese = new Date(oggi.getFullYear(), oggi.getMonth(), 0).toISOString().split('T')[0]
  const [periodoDal, setPeriodoDal] = React.useState(primoMese)
  const [periodoAl, setPeriodoAl] = React.useState(ultimoMese)
  const [raggruppamento, setRaggruppamento] = React.useState<'per_servizio' | 'dettagliato'>('per_servizio')

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resBozze, resAziende] = await Promise.all([
        fetch('/api/fatture?stato=bozze'),
        fetch('/api/aziende?stato=attive&perPagina=100'),
      ])
      const datiBozze = await resBozze.json()
      const datiAziende = await resAziende.json()
      setBozze(datiBozze.fatture ?? [])
      setAziende(datiAziende.aziende ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i dati', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => { caricaDati() }, [caricaDati])

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button onClick={() => setGeneraDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Genera bozze
          </Button>
        </div>
      </div>

      {/* Banner importante */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Le bozze sono escluse dal fatturato emesso e dagli insoluti.</strong>{' '}
          Compaiono nel fatturato solo dopo la conferma di emissione con numero definitivo.
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
              <Label>Azienda</Label>
              <Select value={selectedAzienda} onValueChange={setSelectedAzienda}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona azienda…" />
                </SelectTrigger>
                <SelectContent>
                  {aziende.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.ragioneSociale}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dal</Label>
                <Input type="date" value={periodoDal} onChange={e => setPeriodoDal(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Al</Label>
                <Input type="date" value={periodoAl} onChange={e => setPeriodoAl(e.target.value)} />
              </div>
            </div>
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
