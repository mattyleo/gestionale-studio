'use client'
// src/app/(dashboard)/fatture/incassate/page.tsx — con dati reali da API

import * as React from 'react'
import Link from 'next/link'
import { Search, RefreshCw, CheckCircle, FileText, Printer, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { formatEuro, formatData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function IncassatePage() {
  const { toast } = useToast()
  const [fatture, setFatture] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [ricerca, setRicerca] = React.useState('')
  const [filtroAzienda, setFiltroAzienda] = React.useState('TUTTE')

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resFatture, resAziende] = await Promise.all([
        fetch('/api/fatture?stato=incassate&perPagina=200'),
        fetch('/api/aziende?perPagina=100&stato=attive'),
      ])
      const datiF = await resFatture.json()
      const datiA = await resAziende.json()
      setFatture(datiF.fatture ?? [])
      setAziende(datiA.aziende ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare le fatture incassate', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  const fattureFiltrate = fatture.filter((f) => {
    const nomeAzienda = f.company?.ragioneSociale || ''
    const matchRicerca =
      ricerca === '' ||
      (f.numeroCompleto && f.numeroCompleto.toLowerCase().includes(ricerca.toLowerCase())) ||
      nomeAzienda.toLowerCase().includes(ricerca.toLowerCase())

    const matchAzienda = filtroAzienda === 'TUTTE' || f.companyId === filtroAzienda
    return matchRicerca && matchAzienda
  })

  const totaleIncassato = fattureFiltrate.reduce((sum, f) => sum + Number(f.totaleDocumento || 0), 0)

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fatture Incassate</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {fattureFiltrate.length} fatture saldate · Totale:{' '}
            <span className="font-semibold text-green-700">{formatEuro(totaleIncassato)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-sm px-3 py-1">
            <CheckCircle className="h-4 w-4 mr-1.5 inline" /> Saldo completo
          </Badge>
          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
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
                placeholder="Cerca per numero fattura o azienda..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroAzienda} onValueChange={setFiltroAzienda}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tutte le aziende" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUTTE">Tutte le aziende</SelectItem>
                {aziende.map((az) => (
                  <SelectItem key={az.id} value={az.id}>
                    {az.ragioneSociale}
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
                  <TableHead>Numero</TableHead>
                  <TableHead>Azienda</TableHead>
                  <TableHead>Data emissione</TableHead>
                  <TableHead>Ultimo pagamento</TableHead>
                  <TableHead className="text-right">Totale saldato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fattureFiltrate.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      Nessuna fattura incassata trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  fattureFiltrate.map((f) => (
                    <TableRow key={f.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-semibold">
                        <Link href={`/fatture/${f.id}`} className="text-blue-600 hover:underline">
                          {f.numeroCompleto || `FT ${f.numero}/${f.anno}`}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{f.company?.ragioneSociale}</TableCell>
                      <TableCell>{formatData(f.dataDocumento)}</TableCell>
                      <TableCell>
                        <span className="text-green-700 font-medium">
                          {f.ultimoPagamento ? formatData(f.ultimoPagamento) : formatData(f.dataDocumento)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-700">
                        {formatEuro(f.totaleDocumento)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/fatture/${f.id}`}>
                            <Button variant="ghost" size="sm" title="Vedi dettaglio">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Scarica PDF"
                            onClick={() => window.open(`/api/fatture/${f.id}/pdf`, '_blank')}
                          >
                            <Printer className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Scarica XML FatturaPA"
                            onClick={() => window.open(`/api/fatture/${f.id}/xml`, '_blank')}
                          >
                            <FileText className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Totale in fondo */}
          {!loading && fattureFiltrate.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm font-medium">
              <span className="text-gray-500">
                Conteggio: {fattureFiltrate.length} fatture saldate
              </span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Totale incassato:</span>
                <span className="text-lg font-bold text-green-700">{formatEuro(totaleIncassato)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
