'use client'
// src/components/fatture/QuadraturaArubaModal.tsx
// Strumento di verifica e quadratura automatica tra le fatture saldate del gestionale e il portale Aruba

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  ArrowDownCircle,
  Trash2,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface QuadraturaArubaModalProps {
  onAggiornato?: () => void
}

export function QuadraturaArubaModal({ onAggiornato }: QuadraturaArubaModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [arubaValore, setArubaValore] = React.useState('26194.40')
  const [dati, setDati] = React.useState<any | null>(null)
  const [azioneInCorso, setAzioneInCorso] = React.useState(false)

  const caricaQuadratura = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fatture/quadratura?aruba=${arubaValore}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDati(json)
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [arubaValore, toast])

  React.useEffect(() => {
    if (open) {
      caricaQuadratura()
    }
  }, [open, caricaQuadratura])

  const handleAzioneFattura = async (invoiceId: string, azione: 'segna_da_incassare' | 'elimina_fattura') => {
    if (azione === 'elimina_fattura' && !confirm('Sei sicuro di voler eliminare questa fattura? (Usa questa opzione solo se la fattura era stata scartata da Aruba o è un duplicato)')) {
      return
    }

    setAzioneInCorso(true)
    try {
      const res = await fetch('/api/fatture/quadratura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, azione }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)

      toast({
        title: '✅ Operazione completata',
        description: result.messaggio,
      })

      caricaQuadratura()
      if (onAggiornato) onAggiornato()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setAzioneInCorso(false)
    }
  }

  const delta = dati ? Math.abs(dati.delta) : 0
  const isQuadraturaPerfetta = dati && Math.abs(dati.delta) < 0.01

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-amber-300 text-amber-800 hover:bg-amber-50">
          <Scale className="h-4 w-4 mr-1.5 text-amber-600" />
          Verifica Quadratura Aruba
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
            <Scale className="h-6 w-6 text-indigo-600" />
            Controllo & Quadratura Saldo Aruba
          </DialogTitle>
          <DialogDescription>
            Confronta il totale delle fatture saldate registrate nel gestionale con l'estratto conto o riepilogo di Aruba.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Confronto Valori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-gray-500 uppercase">Valore da Aruba</span>
                <div className="mt-1 flex items-center gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    value={arubaValore}
                    onChange={(e) => setArubaValore(e.target.value)}
                    className="h-8 font-bold text-gray-900 font-mono"
                  />
                  <Button size="sm" variant="ghost" onClick={caricaQuadratura} disabled={loading} className="h-8 px-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 border-indigo-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-indigo-700 uppercase">Totale Saldate Gestionale</span>
                <div className="text-xl font-bold font-mono text-indigo-900 mt-1">
                  {dati ? formatEuro(dati.totaleGestionaleIncassato) : '...'}
                </div>
              </CardContent>
            </Card>

            <Card className={isQuadraturaPerfetta ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}>
              <CardContent className="p-4">
                <span className="text-xs font-semibold uppercase text-gray-700">Differenza (Delta)</span>
                <div className="flex items-center gap-2 mt-1">
                  {isQuadraturaPerfetta ? (
                    <div className="text-xl font-bold text-emerald-700 font-mono flex items-center gap-1">
                      <CheckCircle2 className="h-5 w-5" /> 0,00 €
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-amber-800 font-mono flex items-center gap-1">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      {dati ? (dati.delta > 0 ? `+${formatEuro(dati.delta)}` : formatEuro(dati.delta)) : '...'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Candidati che spiegano esattamente la differenza */}
          {dati?.candidateDelta && dati.candidateDelta.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                TROVATA FATTURA CHE SPIEGA ESATTAMENTE LA DIFFERENZA ({formatEuro(delta)}):
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Nel gestionale è presente una fattura il cui importo coincide al centesimo con la differenza di <strong>{formatEuro(delta)}</strong>.
                Se su Aruba questa fattura non è stata ancora saldata (o è stata scartata dallo SdI), puoi aggiornarla con 1 clic:
              </p>

              <div className="space-y-2 mt-2">
                {dati.candidateDelta.map((f: any) => (
                  <div
                    key={f.id}
                    className="bg-white p-3.5 rounded-lg border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        <span>Fattura n. {f.numero}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {f.data ? new Date(f.data).toLocaleDateString('it-IT') : '-'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5 font-medium">{f.cliente}</div>
                      <div className="text-xs font-bold text-indigo-700 font-mono mt-1">
                        Totale Documento: {formatEuro(f.totaleDocumento)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAzioneFattura(f.id, 'segna_da_incassare')}
                        disabled={azioneInCorso}
                        className="text-xs border-amber-300 text-amber-900 hover:bg-amber-100"
                        title="Rimuove lo stato saldata e la sposta in Da Incassare"
                      >
                        <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />
                        Sposta in "Da Incassare"
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAzioneFattura(f.id, 'elimina_fattura')}
                        disabled={azioneInCorso}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Elimina solo se era una fattura scartata dallo SdI o duplicata"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Elimina (se scarto)
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Possibili Note di Credito */}
          {dati?.possibiliNoteCredito && dati.possibiliNoteCredito.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
              <strong>Possibili Note di Credito / Storni trovati:</strong>
              {dati.possibiliNoteCredito.map((nc: any) => (
                <div key={nc.id} className="flex justify-between">
                  <span>{nc.numero} - {nc.cliente}</span>
                  <span className="font-mono font-bold">{formatEuro(nc.totaleDocumento)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabella di Controllo di tutte le Fatture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                Elenco fatture presenti nel gestionale ({dati?.conteggioFatture ?? 0})
              </span>
              <span>Visualizzazione delle fatture con stato e incasso</span>
            </div>

            <div className="border rounded-lg max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 text-[11px]">
                    <TableHead>Data</TableHead>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Totale Doc</TableHead>
                    <TableHead className="text-right">Incassato</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto text-indigo-600 mb-1" />
                        Caricamento dati quadratura...
                      </TableCell>
                    </TableRow>
                  ) : !dati?.fatture || dati.fatture.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                        Nessuna fattura trovata
                      </TableCell>
                    </TableRow>
                  ) : (
                    dati.fatture.map((f: any) => {
                      const isCandidate = Math.abs(f.totaleDocumento - delta) < 0.05
                      return (
                        <TableRow
                          key={f.id}
                          className={`text-xs ${isCandidate ? 'bg-amber-100/70 font-semibold' : 'hover:bg-gray-50'}`}
                        >
                          <TableCell className="font-mono text-gray-600">
                            {f.data ? new Date(f.data).toLocaleDateString('it-IT') : '-'}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-indigo-600">
                            {f.numero}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-gray-800" title={f.cliente}>
                            {f.cliente}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatEuro(f.totaleDocumento)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-700">
                            {formatEuro(f.incassato)}
                          </TableCell>
                          <TableCell className="text-center">
                            {f.saldata ? (
                              <Badge className="bg-emerald-100 text-emerald-800 text-[10px] py-0 px-1.5">
                                Saldata
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-800 text-[10px] py-0 px-1.5">
                                Aperta
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {f.saldata ? (
                              <button
                                type="button"
                                onClick={() => handleAzioneFattura(f.id, 'segna_da_incassare')}
                                className="text-[11px] text-amber-700 hover:text-amber-900 underline"
                                title="Rimuovi incasso e sposta in Da Incassare"
                              >
                                Apri
                              </button>
                            ) : (
                              <span className="text-gray-400 text-[10px]">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between items-center">
          <div className="text-xs text-gray-500">
            {isQuadraturaPerfetta ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Quadratura con Aruba al 100%
              </span>
            ) : (
              <span>Differenza residua: <strong className="text-amber-700">{formatEuro(delta)}</strong></span>
            )}
          </div>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
