'use client'
// src/components/fatture/ControlloNumerazioneModal.tsx
// Modal per la verifica fiscale della sequenzialità della numerazione (buchi, duplicati, date)

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
  Hash,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react'
import { formatEuro } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function ControlloNumerazioneModal() {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [report, setReport] = React.useState<any | null>(null)

  const caricaControllo = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fatture/controllo-numerazione')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setReport(json)
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    if (open) {
      caricaControllo()
    }
  }, [open, caricaControllo])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-50">
          <Hash className="h-4 w-4 mr-1.5 text-blue-600" />
          Verifica Sequenza Progressiva
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
            <Hash className="h-6 w-6 text-blue-600" />
            Controllo Fiscale Numerazione Progressiva
          </DialogTitle>
          <DialogDescription>
            Verifica automatica dell'integrità della sequenza fatture: ricerca di buchi (numeri saltati), numeri doppi (duplicati) e coerenza cronologica delle date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
              Scansione di tutte le fatture in corso...
            </div>
          ) : !report ? (
            <div className="text-center py-6 text-gray-400">Nessun dato disponibile</div>
          ) : (
            <>
              {/* Esito Generale */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  !report.haAnomalie
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {!report.haAnomalie ? (
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm">
                      {!report.haAnomalie
                        ? 'Sequenza Numerazione 100% Integra e Fiscale'
                        : 'Attenzione: Rilevate anomalie nella numerazione progressiva'}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      Verificate {report.totaleFattureVerificate} fatture in {report.sezionali?.length ?? 0} sezionali/anni.
                    </p>
                  </div>
                </div>

                <Button size="sm" variant="outline" onClick={caricaControllo} className="h-8">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Rianalizza
                </Button>
              </div>

              {/* Dettaglio per ogni sezionale */}
              <div className="space-y-4">
                {report.sezionali?.map((sez: any) => (
                  <Card key={sez.chiave} className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        <span className="font-bold text-gray-900">
                          Sezionale {sez.sezionale} - Anno {sez.anno}
                        </span>
                        <Badge variant="outline" className="text-xs bg-white">
                          {sez.totaleFatture} fatture (da n. {sez.minNumero} a n. {sez.maxNumero})
                        </Badge>
                      </div>

                      {sez.tuttoRegolare ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                          <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Nessun buco o doppio
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-amber-600">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" /> Anomalie rilevate
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4 space-y-4">
                      {/* Buchi di numerazione */}
                      {sez.buchi && sez.buchi.length > 0 ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-red-800">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            BUCHI DI NUMERAZIONE RILEVATI ({sez.buchi.length} numeri saltati):
                          </div>
                          <p>
                            Mancano nel database le seguenti fatture progressive:{' '}
                            <strong className="font-mono text-red-700">{sez.buchi.join(', ')}</strong>.
                          </p>
                          <p className="text-[11px] text-red-700">
                            Verifica se su Aruba queste fatture sono state annullate, scartate o non ancora importate.
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-800 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>Tutti i numeri progressivi da <strong>{sez.minNumero}</strong> a <strong>{sez.maxNumero}</strong> sono consecutivi e presenti.</span>
                        </div>
                      )}

                      {/* Numeri Duplicati */}
                      {sez.duplicati && sez.duplicati.length > 0 && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-purple-800">
                            <AlertCircle className="h-4 w-4 text-purple-600" />
                            NUMERI DUPLICATI RILEVATI:
                          </div>
                          {sez.duplicati.map((dup: any) => (
                            <div key={dup.numero}>
                              Il numero <strong>{dup.numero}</strong> compare <strong>{dup.volte} volte</strong>.
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inversioni di data */}
                      {sez.inversioniData && sez.inversioniData.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-800">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            INVERSIONI CRONOLOGICHE DI DATA ({sez.inversioniData.length}):
                          </div>
                          {sez.inversioniData.map((inv: any, idx: number) => (
                            <div key={idx} className="font-mono text-[11px]">
                              • {inv.motivo}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Elenco progressivo compatto */}
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 text-[11px]">
                              <TableHead>Num.</TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Importo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sez.fatture?.map((f: any) => (
                              <TableRow key={f.id} className="text-xs hover:bg-gray-50">
                                <TableCell className="font-mono font-bold text-indigo-700">
                                  {f.numeroCompleto || f.numero}
                                </TableCell>
                                <TableCell className="font-mono text-gray-600">
                                  {f.data ? new Date(f.data).toLocaleDateString('it-IT') : '-'}
                                </TableCell>
                                <TableCell className="truncate max-w-[200px]" title={f.cliente}>
                                  {f.cliente}
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {formatEuro(f.totale)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
