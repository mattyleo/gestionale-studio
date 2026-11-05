'use client'
// src/components/fatture/PromemoriaTrimestraleBanner.tsx
// Componente Banner intelligente per ricordare al Dottore i clienti con fatturazione TRIMESTRALE
// pronti per la fatturazione, con anteprima delle attività e generazione automatica in bozza con 1 clic.

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Sparkles, CheckCircle2, ChevronRight, FileText, ArrowRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEuro } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface TrimestrePromemoriaItem {
  companyId: string
  ragioneSociale: string
  frequenzaFatturazione: string
  anno: number
  trimestre: number
  trimestreLabel: string
  periodoDal: string
  periodoAl: string
  numeroAttivita: number
  totaleImporto: number
  attivitaIds: string[]
  dettaglioServizi: { descrizione: string; quantita: number; importo: number }[]
  haBozzaAperta: boolean
  bozzaId?: string
}

export function PromemoriaTrimestraleBanner() {
  const router = useRouter()
  const { toast } = useToast()
  const [promemoria, setPromemoria] = React.useState<TrimestrePromemoriaItem[]>([])
  const [totaleValore, setTotaleValore] = React.useState(0)
  const [totaleAttivita, setTotaleAttivita] = React.useState(0)
  const [loading, setLoading] = React.useState(true)

  // Dialog Dettaglio
  const [openModal, setOpenModal] = React.useState(false)
  const [generando, setGenerando] = React.useState(false)

  const caricaDati = React.useCallback(async () => {
    try {
      const res = await fetch('/api/fatture/promemoria-trimestrale')
      if (!res.ok) return
      const dati = await res.json()
      setPromemoria(dati.promemoria || [])
      setTotaleValore(dati.totaleValorePronto || 0)
      setTotaleAttivita(dati.totaleAttivitaPronte || 0)
    } catch {
      // silenzioso
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  // Elementi che non hanno ancora una bozza aperta generata
  const daGenerare = promemoria.filter((p) => !p.haBozzaAperta)

  if (loading || promemoria.length === 0) {
    return null
  }

  const handleGeneraTutte = async () => {
    if (daGenerare.length === 0) {
      toast({ title: 'Tutte le bozze trimestrali sono già state generate!' })
      return
    }

    setGenerando(true)
    try {
      const res = await fetch('/api/fatture/promemoria-trimestrale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: daGenerare.map((p) => ({
            companyId: p.companyId,
            periodoDal: p.periodoDal,
            periodoAl: p.periodoAl,
            attivitaIds: p.attivitaIds,
          })),
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)

      toast({
        title: '✅ Bozze trimestrali create con successo!',
        description: `Generate ${dati.createCount} nuove bozze pronte per il controllo e l'invio proforma.`,
      })
      setOpenModal(false)
      caricaDati()
      router.push('/fatture/bozze')
    } catch (e: any) {
      toast({ title: 'Errore generazione', description: e.message, variant: 'destructive' })
    } finally {
      setGenerando(false)
    }
  }

  const handleGeneraSingola = async (item: TrimestrePromemoriaItem) => {
    setGenerando(true)
    try {
      const res = await fetch('/api/fatture/promemoria-trimestrale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              companyId: item.companyId,
              periodoDal: item.periodoDal,
              periodoAl: item.periodoAl,
              attivitaIds: item.attivitaIds,
            },
          ],
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)

      toast({
        title: '✅ Bozza trimestrale creata!',
        description: `Bozza generata per ${item.ragioneSociale} (${item.trimestreLabel}).`,
      })
      caricaDati()
      router.push('/fatture/bozze')
    } catch (e: any) {
      toast({ title: 'Errore generazione', description: e.message, variant: 'destructive' })
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/60 to-white shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm shrink-0 mt-0.5">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-indigo-950 text-base">
                    Promemoria Fatturazione Trimestrale
                  </span>
                  <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50 text-xs">
                    {promemoria.length} {promemoria.length === 1 ? 'cliente pronto' : 'clienti pronti'}
                  </Badge>
                  {daGenerare.length > 0 && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[11px]">
                      {daGenerare.length} da generare
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-indigo-800/80 mt-1">
                  Sono presenti <span className="font-semibold text-indigo-950">{totaleAttivita} prestazioni approvate</span> svolte nel periodo per un totale di{' '}
                  <span className="font-bold text-indigo-950">{formatEuro(totaleValore)}</span> da raggruppare in fattura/proforma.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenModal(true)}
                className="border-indigo-300 text-indigo-900 hover:bg-indigo-100 text-xs sm:text-sm font-medium"
              >
                Vedi Dettaglio ({promemoria.length})
              </Button>
              {daGenerare.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGeneraTutte}
                  disabled={generando}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-xs sm:text-sm font-semibold"
                >
                  {generando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Generazione in corso...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      Genera Tutte le Bozze ({daGenerare.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DETTAGLIO CLIENTI TRIMESTRALI */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-950">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Clienti con Fatturazione Trimestrale da Emettere
            </DialogTitle>
            <DialogDescription>
              Di seguito sono elencate le prestazioni registrate e approvate nel corso dei 3 mesi per ciascun cliente.
              Puoi generare le bozze di fattura / proforma singolarmente o tutte assieme.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 text-xs">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Competenza Trimestre</TableHead>
                  <TableHead className="text-center">Prestazioni</TableHead>
                  <TableHead className="text-right">Totale Periodo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promemoria.map((item, idx) => (
                  <TableRow key={`${item.companyId}_${item.anno}_${item.trimestre}_${idx}`}>
                    <TableCell className="font-medium text-gray-900 text-sm">
                      {item.ragioneSociale}
                      <div className="text-[11px] text-gray-500 font-normal">
                        Frequenza: Trimestrale
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-indigo-950">{item.trimestreLabel}</span>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {item.periodoDal} ➔ {item.periodoAl}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      <Badge variant="secondary" className="font-semibold">
                        {item.numeroAttivita} att.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 text-sm">
                      {formatEuro(item.totaleImporto)}
                    </TableCell>
                    <TableCell>
                      {item.haBozzaAperta ? (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 text-[11px]">
                          Bozza Aperta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[11px]">
                          Pronto per Bozza
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.haBozzaAperta ? (
                        <Link href="/fatture/bozze">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
                            <FileText className="h-3 w-3 mr-1" />
                            Vedi Bozza
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleGeneraSingola(item)}
                          disabled={generando}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                        >
                          Genera Bozza
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-3">
            <div className="text-xs text-gray-500">
              Totale maturato: <span className="font-bold text-gray-900 text-sm">{formatEuro(totaleValore)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpenModal(false)}>
                Chiudi
              </Button>
              {daGenerare.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleGeneraTutte}
                  disabled={generando}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Genera Tutte ({daGenerare.length})
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
