'use client'
// src/app/(dashboard)/pagamenti/page.tsx

import * as React from 'react'
import { CreditCard, RefreshCw, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEuro, formatData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function PagamentiPage() {
  const { toast } = useToast()
  const [pagamenti, setPagamenti] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filtroAzienda, setFiltroAzienda] = React.useState('')
  const [filtroPeriodo, setFiltroPeriodo] = React.useState('tutti')
  const [aziende, setAziende] = React.useState<any[]>([])

  const carica = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ perPagina: '200' })
      if (filtroAzienda) params.set('companyId', filtroAzienda)
      if (filtroPeriodo !== 'tutti') params.set('periodo', filtroPeriodo)

      const [resPag, resAz] = await Promise.all([
        fetch(`/api/pagamenti?${params}`),
        fetch('/api/aziende?perPagina=100&stato=attive'),
      ])
      const datiPag = await resPag.json()
      const datiAz = await resAz.json()
      setPagamenti(datiPag.pagamenti ?? [])
      setAziende(datiAz.aziende ?? [])
    } catch {
      toast({ title: 'Errore caricamento', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [filtroAzienda, filtroPeriodo, toast])

  React.useEffect(() => { carica() }, [carica])

  const totale = pagamenti.reduce((s, p) => s + Number(p.importo), 0)

  const esportaCsv = () => {
    const righe = [
      ['Data', 'Azienda', 'Fattura', 'Metodo', 'Riferimento', 'Importo'],
      ...pagamenti.map(p => [
        formatData(p.dataIncasso),
        p.invoice?.company?.ragioneSociale ?? '',
        p.invoice?.numeroCompleto ?? '',
        p.metodo ?? '',
        p.riferimento ?? '',
        Number(p.importo).toFixed(2).replace('.', ','),
      ]),
    ]
    const csv = righe.map(r => r.map(c => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `pagamenti_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pagamenti</h2>
          <p className="text-sm text-gray-500 mt-0.5">Storico di tutti i pagamenti registrati</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carica}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={esportaCsv} disabled={pagamenti.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filtroAzienda} onValueChange={setFiltroAzienda}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Tutte le aziende" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tutte le aziende</SelectItem>
            {aziende.map(a => <SelectItem key={a.id} value={a.id}>{a.ragioneSociale}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutti i periodi</SelectItem>
            <SelectItem value="mese-corrente">Questo mese</SelectItem>
            <SelectItem value="mese-precedente">Mese scorso</SelectItem>
            <SelectItem value="trimestre">Ultimo trimestre</SelectItem>
            <SelectItem value="anno">Anno corrente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Totale incassato</p>
          <p className="text-2xl font-bold text-green-600">{formatEuro(totale)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">N° pagamenti</p>
          <p className="text-2xl font-bold text-gray-900">{pagamenti.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500">Media per pagamento</p>
          <p className="text-2xl font-bold text-gray-900">
            {pagamenti.length > 0 ? formatEuro(totale / pagamenti.length) : '—'}
          </p>
        </CardContent></Card>
      </div>

      {/* Tabella */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : pagamenti.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nessun pagamento trovato</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Data incasso</TableHead>
                <TableHead>Azienda</TableHead>
                <TableHead>Fattura</TableHead>
                <TableHead>Metodo</TableHead>
                <TableHead>Riferimento</TableHead>
                <TableHead className="text-right">Importo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamenti.map((p) => (
                <TableRow key={p.id} className="hover:bg-gray-50">
                  <TableCell className="text-sm">{formatData(p.dataIncasso)}</TableCell>
                  <TableCell className="font-medium">{p.invoice?.company?.ragioneSociale ?? '—'}</TableCell>
                  <TableCell>
                    {p.invoice?.numeroCompleto ? (
                      <Link href={`/fatture/${p.invoiceId}`} className="font-mono text-blue-600 hover:underline text-sm">
                        {p.invoice.numeroCompleto}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">{p.metodo ?? 'N/D'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{p.riferimento || '—'}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{formatEuro(p.importo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t bg-gray-50 px-4 py-3 flex justify-between text-sm font-semibold">
            <span>Totale ({pagamenti.length} pagamenti)</span>
            <span className="text-green-700">{formatEuro(totale)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
