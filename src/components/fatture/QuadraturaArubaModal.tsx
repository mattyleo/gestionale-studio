'use client'
// src/components/fatture/QuadraturaArubaModal.tsx
// Strumento di verifica e quadratura automatica tra le fatture saldate del gestionale e il portale Aruba
// con check specifico per le spese anticipate Art. 15 DPR 633/72 escluse dai ricavi

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
  ShieldAlert,
  ArrowDownCircle,
  Trash2,
  Receipt,
  Info,
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
  const [escludiArt15, setEscludiArt15] = React.useState(true) // Di default attivo (regola Aruba)
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

  const totaleVisualizzato = escludiArt15
    ? (dati?.totaleGestionaleRicavi ?? 0)
    : (dati?.totaleGestionaleIncassato ?? 0)

  const deltaVisualizzato = escludiArt15
    ? (dati?.deltaRicavi ?? 0)
    : (dati?.deltaLordo ?? 0)

  const isQuadraturaPerfetta = Math.abs(deltaVisualizzato) <= 0.05
  const totaleArt15 = dati?.totaleGestionaleArt15 ?? 0

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
            Confronta il totale delle fatture saldate registrate nel gestionale con l'estratto conto e il widget «Fatturato 2026» di Aruba.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Checkbox Opzione Articolo 15 */}
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={escludiArt15}
                onChange={(e) => setEscludiArt15(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-gray-900 block flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-amber-700" />
                  Escludi Spese Anticipate Art. 15 DPR 633/72 (Natura N1 — Non concorrono a ricavi)
                </span>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Aruba esclude per legge le spese anticipate e le sanzioni riaddebitate in nome e per conto del cliente dal calcolo del Fatturato Attivo.
                  Attivando questo check, il totale gestionale quadra al centesimo con Aruba.
                </p>
              </div>
            </label>
          </div>

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
                <div className="text-[10px] text-gray-500 mt-1">Widget «Fatturato 2026»</div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 border-indigo-200">
              <CardContent className="p-4">
                <span className="text-xs font-semibold text-indigo-700 uppercase">
                  {escludiArt15 ? 'Ricavi Professionali Netti' : 'Totale Incassato Cassa'}
                </span>
                <div className="text-xl font-bold font-mono text-indigo-900 mt-1">
                  {dati ? formatEuro(totaleVisualizzato) : '...'}
                </div>
                <div className="text-[10px] text-indigo-600 mt-1 truncate">
                  {escludiArt15 && totaleArt15 > 0 ? (
                    <span>Cassa: {formatEuro(dati.totaleGestionaleIncassato)} (-{formatEuro(totaleArt15)} Art. 15)</span>
                  ) : (
                    <span>Include tutte le 161 fatture netti</span>
                  )}
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
                      {deltaVisualizzato > 0 ? `+${formatEuro(deltaVisualizzato)}` : formatEuro(deltaVisualizzato)}
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-gray-600 mt-1">
                  {isQuadraturaPerfetta ? 'Quadratura esatta con Aruba' : 'Differenza da verificare'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dettaglio Spese Art. 15 DPR 633/72 */}
          {dati?.fattureConArt15 && dati.fattureConArt15.length > 0 && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                <span className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600" />
                  Dettaglio Spese Anticipate Art. 15 escluse dai ricavi ({dati.fattureConArt15.length} fatture):
                </span>
                <span className="font-mono text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                  Totale: {formatEuro(totaleArt15)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-blue-900">
                {dati.fattureConArt15.map((f: any) => (
                  <div key={f.id} className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between gap-2 shadow-xs">
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <span>Fattura {f.numero}</span>
                        <span className="text-[11px] text-gray-500 font-normal">
                          {f.data ? new Date(f.data).toLocaleDateString('it-IT') : ''} · {f.cliente}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 italic mt-0.5">
                        {f.righe?.map((r: any) => r.descrizione).join(' | ')}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-amber-700">-{formatEuro(f.importoArt15)}</div>
                      <div className="text-[10px] text-gray-400">Escluso da ricavi</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidati che spiegano esattamente la differenza (se presente) */}
          {!isQuadraturaPerfetta && dati?.candidateDelta && dati.candidateDelta.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
                TROVATA FATTURA CHE SPIEGA LA DIFFERENZA ({formatEuro(Math.abs(deltaVisualizzato))}):
              </div>
              <div className="space-y-2 mt-2">
                {dati.candidateDelta.map((f: any) => (
                  <div
                    key={f.id}
                    className="bg-white p-3 rounded-lg border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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

          {/* Tabella di Controllo di tutte le Fatture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-700">
                Elenco fatture registrate ({dati?.conteggioFatture ?? 0})
              </span>
              <span>
                {escludiArt15 ? 'Visualizzazione al netto di Art. 15' : 'Visualizzazione importo totale'}
              </span>
            </div>

            <div className="border rounded-lg max-h-56 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 text-[11px]">
                    <TableHead>Data</TableHead>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Totale Doc</TableHead>
                    <TableHead className="text-right">Ricavi Netti</TableHead>
                    <TableHead className="text-center">Art. 15</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
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
                      const hasArt15 = f.art15Importo > 0
                      return (
                        <TableRow
                          key={f.id}
                          className={`text-xs ${hasArt15 ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}
                        >
                          <TableCell className="font-mono text-gray-600">
                            {f.data ? new Date(f.data).toLocaleDateString('it-IT') : '-'}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-indigo-600">
                            {f.numero}
                          </TableCell>
                          <TableCell className="max-w-[170px] truncate text-gray-800" title={f.cliente}>
                            {f.cliente}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatEuro(f.totaleDocumento)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-indigo-900 font-semibold">
                            {formatEuro(f.ricaviCompensi)}
                          </TableCell>
                          <TableCell className="text-center">
                            {hasArt15 ? (
                              <Badge className="bg-amber-100 text-amber-800 text-[10px] py-0 px-1 font-mono">
                                -{formatEuro(f.art15Importo)}
                              </Badge>
                            ) : (
                              <span className="text-gray-300 text-[10px]">-</span>
                            )}
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
                <CheckCircle2 className="h-4 w-4" /> Quadratura con Aruba al 100% (Delta: 0,00 €)
              </span>
            ) : (
              <span>Differenza residua: <strong className="text-amber-700">{formatEuro(deltaVisualizzato)}</strong></span>
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
