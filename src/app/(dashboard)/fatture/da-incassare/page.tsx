'use client'
// src/app/(dashboard)/fatture/da-incassare/page.tsx — con API reali

import * as React from 'react'
import Link from 'next/link'
import { Clock, CreditCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEuro, formatData } from '@/lib/utils'
import { ImportaArubaModal } from '@/components/aruba/ImportaArubaModal'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export default function DaIncassarePage() {
  const { toast } = useToast()
  const [fatture, setFatture] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [fatturaSelezionata, setFatturaSelezionata] = React.useState<any>(null)
  const [pagamentoDialog, setPagamentoDialog] = React.useState(false)
  const [importo, setImporto] = React.useState('')
  const [data, setData] = React.useState(new Date().toISOString().split('T')[0])
  const [metodo, setMetodo] = React.useState('bonifico')
  const [riferimento, setRiferimento] = React.useState('')
  const [salvataggio, setSalvataggio] = React.useState(false)

  const carica = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fatture?stato=da-incassare&perPagina=100')
      const dati = await res.json()
      setFatture(dati.fatture ?? [])
    } catch {
      toast({ title: 'Errore caricamento', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => { carica() }, [carica])

  const apriPagamento = (f: any) => {
    setFatturaSelezionata(f)
    setImporto(f.residuo?.toFixed(2) ?? '')
    setPagamentoDialog(true)
  }

  const handlePagamento = async () => {
    setSalvataggio(true)
    try {
      const res = await fetch('/api/pagamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: fatturaSelezionata.id,
          importo: parseFloat(importo),
          dataValuta: data,
          dataIncasso: data,
          metodo,
          riferimento,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({
        title: dati.pagataCompletamente ? '✅ Fattura saldata!' : '✅ Pagamento registrato',
        description: dati.messaggio,
      })
      setPagamentoDialog(false)
      setImporto('')
      carica()
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    } finally {
      setSalvataggio(false)
    }
  }

  // Solo le fatture con residuo > 0
  const fattureAperte = fatture.filter(f => (f.residuo ?? 0) > 0.005)
  const totaleResiduo = fattureAperte.reduce((s, f) => s + (f.residuo ?? 0), 0)
  const scadute = fattureAperte.filter(f => f.isScaduta)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Da incassare</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {fattureAperte.length} fatture · residuo totale{' '}
            <span className="font-semibold text-red-600">{formatEuro(totaleResiduo)}</span>
            {scadute.length > 0 && (
              <span className="ml-2 text-red-600">· {scadute.length} scadute</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportaArubaModal onSuccess={carica} />
          <Button variant="outline" size="sm" onClick={carica}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : fattureAperte.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Nessuna fattura da incassare</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Numero</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead className="text-right">Totale</TableHead>
                <TableHead className="text-right">Incassato</TableHead>
                <TableHead className="text-right">Residuo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fattureAperte.map((f) => (
                <TableRow
                  key={f.id}
                  className={cn('hover:bg-gray-50', f.isScaduta && 'bg-red-50')}
                >
                  <TableCell>
                    <Link href={`/fatture/${f.id}`} className="font-mono font-medium text-blue-600 hover:underline">
                      {f.numeroCompleto}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{f.company?.ragioneSociale}</TableCell>
                  <TableCell className="text-sm text-gray-500">{formatData(f.dataDocumento)}</TableCell>
                  <TableCell>
                    <span className={cn('text-sm', f.isScaduta ? 'text-red-600 font-semibold' : 'text-gray-500')}>
                      {formatData(f.dataScadenza)}
                      {f.isScaduta && f.giorniRitardo > 0 && (
                        <span className="ml-1 text-xs">({f.giorniRitardo}gg)</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatEuro(f.totaleDocumento)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatEuro(f.incassato ?? 0)}</TableCell>
                  <TableCell className="text-right font-bold text-red-600">{formatEuro(f.residuo)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => apriPagamento(f)}>
                      <CreditCard className="h-4 w-4 mr-1" /> Pagamento
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog pagamento */}
      <Dialog open={pagamentoDialog} onOpenChange={setPagamentoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registra pagamento</DialogTitle>
            <DialogDescription>
              {fatturaSelezionata?.numeroCompleto} · {fatturaSelezionata?.company?.ragioneSociale}
              <br />Residuo: <strong>{formatEuro(fatturaSelezionata?.residuo ?? 0)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Importo (€)</Label>
              <Input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data incasso</Label>
              <Input type="date" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Metodo</Label>
              <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" value={metodo} onChange={e => setMetodo(e.target.value)}>
                <option value="bonifico">Bonifico bancario</option>
                <option value="contanti">Contanti</option>
                <option value="assegno">Assegno</option>
                <option value="rid">RID/SDD</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Riferimento (opzionale)</Label>
              <Input placeholder="N° bonifico…" value={riferimento} onChange={e => setRiferimento(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoDialog(false)}>Annulla</Button>
            <Button onClick={handlePagamento} disabled={salvataggio}>
              {salvataggio ? 'Registrazione…' : 'Registra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
