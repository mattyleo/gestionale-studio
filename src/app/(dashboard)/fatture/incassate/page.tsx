'use client'
// src/app/(dashboard)/fatture/incassate/page.tsx — con dati reali da API

import * as React from 'react'
import Link from 'next/link'
import { Search, RefreshCw, CheckCircle, FileText, Printer, Eye, Mail } from 'lucide-react'
import { InviaEmailModal } from '@/components/fatture/InviaEmailModal'
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
import { ImportaArubaModal } from '@/components/aruba/ImportaArubaModal'
import { QuadraturaArubaModal } from '@/components/fatture/QuadraturaArubaModal'
import { ControlloNumerazioneModal } from '@/components/fatture/ControlloNumerazioneModal'
import { formatEuro, formatData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function IncassatePage() {
  const { toast } = useToast()
  const [fatture, setFatture] = React.useState<any[]>([])
  const [aziende, setAziende] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [ricerca, setRicerca] = React.useState('')
  const [filtroAzienda, setFiltroAzienda] = React.useState('TUTTE')
  const [escludiArt15, setEscludiArt15] = React.useState(true)

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

  const isNotaCredito = (f: any) =>
    f.sezionale?.toUpperCase() === 'NC' ||
    f.numeroCompleto?.toUpperCase().includes('NC') ||
    f.note?.toLowerCase().includes('credito') ||
    f.note?.toLowerCase().includes('storno')

  const fattureFiltrate = fatture.filter((f) => {
    const nomeAzienda = f.company?.ragioneSociale || ''
    const matchRicerca =
      ricerca === '' ||
      (f.numeroCompleto && f.numeroCompleto.toLowerCase().includes(ricerca.toLowerCase())) ||
      nomeAzienda.toLowerCase().includes(ricerca.toLowerCase())

    const matchAzienda = filtroAzienda === 'TUTTE' || f.companyId === filtroAzienda
    return matchRicerca && matchAzienda
  })

  // Le Note di Credito vengono sottratte dal totale incassato per riflettere lo storno reale
  const totaleIncassatoLordo = fattureFiltrate.reduce((sum, f) => {
    const importo = Number(f.totaleDocumento || 0)
    return isNotaCredito(f) ? sum - importo : sum + importo
  }, 0)

  const totaleArt15 = fattureFiltrate.reduce((sum, f) => {
    return isNotaCredito(f) ? sum : sum + Number(f.art15Importo || 0)
  }, 0)

  const totaleRicavi = +(totaleIncassatoLordo - totaleArt15).toFixed(2)
  const totaleIncassato = escludiArt15 ? totaleRicavi : totaleIncassatoLordo

  const numNC = fattureFiltrate.filter(isNotaCredito).length
  const numSaldate = fattureFiltrate.length - numNC

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fatture Incassate</h2>
          <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              {numSaldate} fatture saldate{numNC > 0 ? ` · ${numNC} note di credito stornate` : ''} ·{' '}
              <span className="text-gray-700 font-medium">Ricavi effettivi:</span>{' '}
              <span className="font-bold text-green-700 text-base">{formatEuro(totaleRicavi)}</span>
            </span>
            <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md font-mono">
              Totale cassa: {formatEuro(totaleIncassatoLordo)}
              {totaleArt15 > 0 ? ` (di cui Spese Art. 15: ${formatEuro(totaleArt15)})` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ControlloNumerazioneModal />
          <QuadraturaArubaModal onAggiornato={caricaDati} />
          <ImportaArubaModal onSuccess={caricaDati} />
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
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-amber-50/70 border border-amber-200 rounded-lg px-3 py-2 hover:bg-amber-100/70 transition shrink-0">
              <input
                type="checkbox"
                checked={escludiArt15}
                onChange={(e) => setEscludiArt15(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
              />
              <span>Escludi spese anticipate Art. 15 (Standard Aruba - Attivo)</span>
            </label>
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
                  <TableHead className="text-right">
                    <div>{escludiArt15 ? 'Ricavo effettivo' : 'Totale saldato'}</div>
                    {escludiArt15 && <div className="text-[10px] text-gray-400 font-normal">Escluso Art. 15</div>}
                  </TableHead>
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
                  fattureFiltrate.map((f) => {
                    const isNC = isNotaCredito(f)
                    return (
                    <TableRow key={f.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm font-semibold">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link href={`/fatture/${f.id}`} className="text-blue-600 hover:underline">
                            {f.numeroCompleto || `FT ${f.numero}/${f.anno}`}
                          </Link>
                          {isNC && (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                              Nota di Credito
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{f.company?.ragioneSociale}</TableCell>
                      <TableCell>{formatData(f.dataDocumento)}</TableCell>
                      <TableCell>
                        <span className="text-green-700 font-medium">
                          {f.ultimoPagamento ? formatData(f.ultimoPagamento) : formatData(f.dataDocumento)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${isNC ? 'text-purple-700 font-mono' : 'text-green-700 font-mono'}`}>
                        <div>
                          {isNC ? `- ${formatEuro(f.totaleDocumento)}` : formatEuro(escludiArt15 ? f.ricaviNetto : f.totaleDocumento)}
                        </div>
                        {f.hasArt15 && (
                          <div className="text-[10px] text-amber-700 font-normal">
                            {escludiArt15
                              ? `+ ${formatEuro(f.art15Importo)} Art. 15 (Tot: ${formatEuro(f.totaleDocumento)})`
                              : `Di cui Art. 15: ${formatEuro(f.art15Importo)}`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <InviaEmailModal
                            fatturaId={f.id}
                            trigger={
                              <Button variant="ghost" size="sm" title="Invia Fattura via Email">
                                <Mail className="h-4 w-4 text-blue-600" />
                              </Button>
                            }
                          />
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
                  )})
                )}
              </TableBody>
            </Table>
          )}

          {/* Totale in fondo */}
          {!loading && fattureFiltrate.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm font-medium flex-wrap gap-4">
              <span className="text-gray-500">
                Conteggio: {fattureFiltrate.length} documenti ({numSaldate} fatture{numNC > 0 ? ` · ${numNC} NC` : ''})
              </span>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                {totaleArt15 > 0 && (
                  <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                    Spese anticipate Art. 15: {formatEuro(totaleArt15)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Incasso cassa lordo: <span className="font-semibold text-gray-700">{formatEuro(totaleIncassatoLordo)}</span>
                </span>
                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                  <span className="text-green-900 font-semibold text-xs">
                    {escludiArt15 ? 'Ricavi Effettivi (Allineato Aruba):' : 'Totale Incassato:'}
                  </span>
                  <span className="text-lg font-bold text-green-700">{formatEuro(totaleIncassato)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
