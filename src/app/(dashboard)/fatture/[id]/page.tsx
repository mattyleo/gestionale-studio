'use client'
// src/app/(dashboard)/fatture/[id]/page.tsx
// Dettaglio fattura con anteprima righe, emissione, download PDF/XML e registrazione pagamento

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Download, Send, CheckCircle2,
  AlertTriangle, Clock, CreditCard, Printer, Ban, Euro,
  Pencil, Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatEuro, formatData, statoInvoiceLabel, statoInvoiceBadgeColor } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function FatturaDettaglioPage() {
  const router = useRouter()
  const routeParams = useParams()
  const fatturaId = routeParams?.id as string
  const { toast } = useToast()
  const [fattura, setFattura] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [emettiDialog, setEmettiDialog] = React.useState(false)
  const [pagamentoDialog, setPagamentoDialog] = React.useState(false)
  const [annullaDialog, setAnnullaDialog] = React.useState(false)
  const [salvataggio, setSalvataggio] = React.useState(false)
  const [importoPagamento, setImportoPagamento] = React.useState('')
  const [dataPagamento, setDataPagamento] = React.useState(new Date().toISOString().split('T')[0])
  const [metodoPagamento, setMetodoPagamento] = React.useState('bonifico')
  const [riferimentoPagamento, setRiferimentoPagamento] = React.useState('')
  const [numeroPersonalizzato, setNumeroPersonalizzato] = React.useState('')
  const [dataEmissione, setDataEmissione] = React.useState(new Date().toISOString().split('T')[0])
  const [prossimoNumeroInfo, setProssimoNumeroInfo] = React.useState('')
  const [incassataAllEmissione, setIncassataAllEmissione] = React.useState(true)
  const [metodoEmissione, setMetodoEmissione] = React.useState('bonifico')
  const [riferimentoEmissione, setRiferimentoEmissione] = React.useState('')

  // Modifica numero fattura emessa
  const [modificaNumeroDialog, setModificaNumeroDialog] = React.useState(false)
  const [nuovoNumeroFattura, setNuovoNumeroFattura] = React.useState('')
  const [nuovaDataFattura, setNuovaDataFattura] = React.useState('')
  const [salvandoNumero, setSalvandoNumero] = React.useState(false)

  const caricaFattura = React.useCallback(async () => {
    if (!fatturaId) return
    try {
      const res = await fetch(`/api/fatture/${fatturaId}`)
      if (!res.ok) throw new Error('Fattura non trovata')
      const dati = await res.json()
      setFattura(dati)
    } catch (e) {
      toast({ title: 'Errore', description: 'Impossibile caricare la fattura', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [fatturaId, toast])

  React.useEffect(() => { caricaFattura() }, [caricaFattura])

  const apriDialogEmissione = async () => {
    try {
      const res = await fetch('/api/impostazioni/numerazione')
      const dati = await res.json()
      if (dati?.corrente) {
        setProssimoNumeroInfo(dati.corrente.prossimoNumeroCompleto)
        setNumeroPersonalizzato(String(dati.corrente.prossimoNumero))
      }
    } catch {
      // fallback
    }
    setEmettiDialog(true)
  }

  const handleEmetti = async () => {
    setSalvataggio(true)
    try {
      const res = await fetch(`/api/fatture/${fatturaId}/emetti`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroPersonalizzato: numeroPersonalizzato ? parseInt(numeroPersonalizzato) : undefined,
          dataDocumento: dataEmissione,
          incassataContestualmente: incassataAllEmissione,
          metodoPagamento: metodoEmissione,
          riferimentoPagamento: riferimentoEmissione,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({
        title: incassataAllEmissione ? '✅ Fattura emessa e saldata!' : '✅ Fattura emessa',
        description: dati.messaggio,
        variant: 'default',
      })
      setEmettiDialog(false)
      caricaFattura()
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    } finally {
      setSalvataggio(false)
    }
  }

  const apriDialogModificaNumero = () => {
    setNuovoNumeroFattura(fattura.numero ? String(fattura.numero) : '')
    setNuovaDataFattura(fattura.dataDocumento ? new Date(fattura.dataDocumento).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
    setModificaNumeroDialog(true)
  }

  const handleSalvaModificaNumero = async () => {
    const num = parseInt(nuovoNumeroFattura)
    if (isNaN(num) || num <= 0) {
      toast({ title: 'Numero non valido', description: 'Inserisci un numero intero positivo maggiore di zero', variant: 'destructive' })
      return
    }
    setSalvandoNumero(true)
    try {
      const res = await fetch(`/api/fatture/${fatturaId}/numero`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: num,
          sezionale: fattura.sezionale || 'FT',
          dataDocumento: nuovaDataFattura || undefined,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Numero fattura aggiornato', description: dati.messaggio })
      setModificaNumeroDialog(false)
      caricaFattura()
    } catch (e: any) {
      toast({ title: 'Errore modifica numero', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoNumero(false)
    }
  }

  const handleAnnulla = async () => {
    setSalvataggio(true)
    try {
      const res = await fetch(`/api/fatture/${fatturaId}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: 'Bozza annullata', description: dati.messaggio })
      router.push('/fatture/bozze')
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    } finally {
      setSalvataggio(false)
    }
  }

  const handleRegistraPagamento = async () => {
    if (!importoPagamento || parseFloat(importoPagamento) <= 0) {
      toast({ title: 'Importo non valido', description: 'Inserisci un importo maggiore di zero', variant: 'destructive' })
      return
    }
    setSalvataggio(true)
    try {
      const res = await fetch('/api/pagamenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: fatturaId,
          importo: parseFloat(importoPagamento),
          dataValuta: dataPagamento,
          dataIncasso: dataPagamento,
          metodo: metodoPagamento,
          riferimento: riferimentoPagamento,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({
        title: dati.pagataCompletamente ? '✅ Fattura saldata' : '✅ Pagamento registrato',
        description: dati.messaggio,
        variant: 'default',
      })
      setPagamentoDialog(false)
      setImportoPagamento('')
      caricaFattura()
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    } finally {
      setSalvataggio(false)
    }
  }

  const scaricaPDF = () => {
    window.open(`/api/fatture/${fatturaId}/pdf`, '_blank')
  }

  const scaricaXML = () => {
    window.open(`/api/fatture/${fatturaId}/xml`, '_blank')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!fattura) {
    return (
      <div className="p-6">
        <p className="text-red-600">Fattura non trovata.</p>
        <Link href="/fatture/bozze" className="text-blue-600 underline text-sm mt-2 block">
          ← Torna alle bozze
        </Link>
      </div>
    )
  }

  const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)
  const isEmessa = fattura.stato === 'EMESSA'
  const residuo = fattura.residuo ?? 0

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {fattura.numeroCompleto ?? `BOZZA — ${fattura.id.slice(0, 8)}`}
            </h1>
            <Badge className={statoInvoiceBadgeColor(fattura.stato)}>
              {statoInvoiceLabel(fattura.stato)}
            </Badge>
            {isEmessa && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                onClick={apriDialogModificaNumero}
                title="Modifica o rettifica il numero progressivo della fattura"
              >
                <Pencil className="h-3 w-3 mr-1" /> Modifica numero
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {fattura.company?.ragioneSociale} · {fattura.periodoDal ? `${formatData(fattura.periodoDal)} – ${formatData(fattura.periodoAl)}` : ''}
          </p>
        </div>

        {/* Azioni */}
        <div className="flex gap-2 flex-wrap justify-end">
          {isBozza && (
            <>
              <Button variant="outline" onClick={scaricaPDF} title="Scarica o stampa l'avviso di parcella da inviare al cliente per il pagamento">
                <Printer className="h-4 w-4 mr-2 text-blue-600" /> Stampa Avviso di Parcella
              </Button>
              <Button onClick={apriDialogEmissione} className="bg-green-600 hover:bg-green-700">
                <Send className="h-4 w-4 mr-2" /> Emetti fattura fiscale
              </Button>
              <Button variant="outline" onClick={() => setAnnullaDialog(true)} className="text-red-600 border-red-200 hover:bg-red-50">
                <Ban className="h-4 w-4 mr-2" /> Annulla bozza
              </Button>
            </>
          )}
          {isEmessa && (
            <>
              <Button variant="outline" onClick={scaricaPDF}>
                <Printer className="h-4 w-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" onClick={scaricaXML} title="Scarica il file XML ufficiale da inviare allo SdI tramite Aruba o Agenzia delle Entrate">
                <FileText className="h-4 w-4 mr-2" /> XML Fattura Elettronica
              </Button>
              {residuo > 0 && (
                <Button onClick={() => setPagamentoDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <CreditCard className="h-4 w-4 mr-2" /> Registra pagamento
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Banner bozza */}
      {isBozza && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>Bozza — non emessa.</strong> Questa bozza è esclusa dal fatturato emesso e dagli insoluti.
            Verifica importi, dati anagrafici e trattamento fiscale prima di emettere.
          </p>
        </div>
      )}

      {/* Importi principali */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Imponibile</p>
            <p className="text-lg font-bold text-gray-900">{formatEuro(fattura.imponibile)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Totale documento</p>
            <p className="text-lg font-bold text-blue-600">{formatEuro(fattura.totaleDocumento)}</p>
          </CardContent>
        </Card>
        {isEmessa && (
          <>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Incassato</p>
                <p className="text-lg font-bold text-green-600">{formatEuro(fattura.incassato ?? 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-gray-500">Residuo</p>
                <p className={`text-lg font-bold ${residuo > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {formatEuro(residuo)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Righe fattura */}
      <Card>
        <CardHeader>
          <CardTitle>Righe fattura</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">N°</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead className="text-right w-20">Q.tà</TableHead>
                <TableHead className="text-right w-28">Prezzo unit.</TableHead>
                <TableHead className="text-right w-28">Importo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fattura.lines?.map((riga: any) => (
                <TableRow key={riga.id}>
                  <TableCell className="text-gray-500">{riga.ordinamento}</TableCell>
                  <TableCell>{riga.descrizione}</TableCell>
                  <TableCell className="text-right">{Number(riga.quantita).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatEuro(riga.prezzoUnitario)}</TableCell>
                  <TableCell className="text-right font-medium">{formatEuro(riga.importo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Riepilogo */}
          <div className="mt-4 border-t pt-4 space-y-1.5 ml-auto max-w-xs text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Imponibile</span>
              <span>{formatEuro(fattura.imponibile)}</span>
            </div>
            {Number(fattura.totaleCassa) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cassa CNPADC 4%</span>
                <span>{formatEuro(fattura.totaleCassa)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">IVA N2.2</span>
              <span className="text-gray-400">Esclusa</span>
            </div>
            {Number(fattura.bollo) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Bollo virtuale</span>
                <span>{formatEuro(fattura.bollo)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Totale documento</span>
              <span className="text-blue-600">{formatEuro(fattura.totaleDocumento)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagamenti */}
      {isEmessa && fattura.payments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Storico pagamenti</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Riferimento</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fattura.payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatData(p.dataIncasso)}</TableCell>
                    <TableCell className="capitalize">{p.metodo}</TableCell>
                    <TableCell className="text-gray-500">{p.riferimento || '—'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{formatEuro(p.importo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog Emissione */}
      <Dialog open={emettiDialog} onOpenChange={setEmettiDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Conferma emissione fattura</DialogTitle>
            <DialogDescription>
              Operazione irreversibile. Verifica i dati prima di procedere.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm py-2">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium">{fattura.company?.ragioneSociale}</span>
            </div>

            {/* Configurazione numero e data fattura */}
            <div className="bg-blue-50/80 p-3.5 rounded-lg border border-blue-200 space-y-2.5">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold text-xs">
                <Hash className="h-4 w-4 text-blue-600" />
                Numero Fattura & Data Emissione
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <Label htmlFor="numFattura" className="text-xs font-semibold text-gray-700">
                    N° Fattura *
                  </Label>
                  <div className="flex items-center mt-1">
                    <span className="inline-flex items-center px-2.5 h-8 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-xs font-mono font-bold">
                      FT
                    </span>
                    <Input
                      id="numFattura"
                      type="number"
                      min="1"
                      className="h-8 rounded-l-none text-sm bg-white font-mono font-bold text-blue-900"
                      placeholder="Auto"
                      value={numeroPersonalizzato}
                      onChange={(e) => setNumeroPersonalizzato(e.target.value)}
                    />
                  </div>
                  {prossimoNumeroInfo && (
                    <span className="text-[10px] text-gray-500 block mt-0.5">Proposto: {prossimoNumeroInfo}</span>
                  )}
                </div>
                <div>
                  <Label htmlFor="dataDoc" className="text-xs font-semibold text-gray-700">
                    Data Emissione *
                  </Label>
                  <Input
                    id="dataDoc"
                    type="date"
                    className="h-8 text-sm bg-white mt-1"
                    value={dataEmissione}
                    onChange={(e) => setDataEmissione(e.target.value)}
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">Anno: {dataEmissione ? new Date(dataEmissione).getFullYear() : new Date().getFullYear()}</span>
                </div>
              </div>
              <div className="px-2.5 py-1.5 bg-white rounded border border-blue-100 text-xs flex items-center justify-between">
                <span className="text-gray-500">Documento finale che verrà generato:</span>
                <span className="font-mono font-bold text-blue-700">
                  FT {numeroPersonalizzato || '—'} / {dataEmissione ? new Date(dataEmissione).getFullYear() : new Date().getFullYear()}
                </span>
              </div>
            </div>

            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Imponibile</span>
              <span>{formatEuro(fattura.imponibile)}</span>
            </div>
            {Number(fattura.totaleCassa) > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Cassa CNPADC 4%</span>
                <span>{formatEuro(fattura.totaleCassa)}</span>
              </div>
            )}
            {Number(fattura.bollo) > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Bollo virtuale</span>
                <span>{formatEuro(fattura.bollo)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base">
              <span>Totale documento</span>
              <span className="text-blue-600">{formatEuro(fattura.totaleDocumento)}</span>
            </div>

            {/* Opzione incasso contestuale */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incassataAllEmissione}
                  onChange={(e) => setIncassataAllEmissione(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <div>
                  <span className="text-xs font-bold text-green-950 block">
                    Registra contestualmente come già incassata (saldo totale di {formatEuro(fattura.totaleDocumento)})
                  </span>
                  <span className="text-[11px] text-green-800">
                    Spunta questa opzione se il cliente ha già saldato l&apos;avviso di parcella con bonifico e stai emettendo la fattura definitiva per quietanza.
                  </span>
                </div>
              </label>

              {incassataAllEmissione && (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-green-200 text-xs">
                  <div>
                    <Label className="text-[11px] text-green-900 font-semibold">Metodo di pagamento</Label>
                    <select
                      className="w-full h-8 border border-green-300 rounded px-2 text-xs bg-white mt-0.5"
                      value={metodoEmissione}
                      onChange={(e) => setMetodoEmissione(e.target.value)}
                    >
                      <option value="bonifico">Bonifico bancario</option>
                      <option value="contanti">Contanti</option>
                      <option value="assegno">Assegno</option>
                      <option value="altro">Altro</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-green-900 font-semibold">Riferimento (opzionale)</Label>
                    <Input
                      className="h-8 text-xs bg-white border-green-300 mt-0.5"
                      placeholder="es. CRO bonifico..."
                      value={riferimentoEmissione}
                      onChange={(e) => setRiferimentoEmissione(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
            ⚠️ Assegna il numero ufficiale e genera l&apos;XML per lo SdI. Dopo l&apos;emissione il documento è definitivo.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmettiDialog(false)}>Annulla</Button>
            <Button onClick={handleEmetti} disabled={salvataggio} className="bg-green-600 hover:bg-green-700">
              {salvataggio ? 'Emissione…' : '✓ Conferma emissione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento */}
      <Dialog open={pagamentoDialog} onOpenChange={setPagamentoDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registra pagamento</DialogTitle>
            <DialogDescription>
              Residuo da incassare: <strong>{formatEuro(residuo)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="importo">Importo pagato (€)</Label>
              <Input
                id="importo"
                type="number"
                step="0.01"
                min="0.01"
                max={residuo}
                placeholder={`Max ${residuo.toFixed(2)}`}
                value={importoPagamento}
                onChange={e => setImportoPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="data">Data incasso</Label>
              <Input
                id="data"
                type="date"
                value={dataPagamento}
                onChange={e => setDataPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="metodo">Metodo</Label>
              <select
                id="metodo"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={metodoPagamento}
                onChange={e => setMetodoPagamento(e.target.value)}
              >
                <option value="bonifico">Bonifico bancario</option>
                <option value="contanti">Contanti</option>
                <option value="assegno">Assegno</option>
                <option value="rid">RID/SDD</option>
                <option value="altro">Altro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="riferimento">Riferimento (opzionale)</Label>
              <Input
                id="riferimento"
                placeholder="N° bonifico, ricevuta…"
                value={riferimentoPagamento}
                onChange={e => setRiferimentoPagamento(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoDialog(false)}>Annulla</Button>
            <Button onClick={handleRegistraPagamento} disabled={salvataggio}>
              {salvataggio ? 'Salvataggio…' : 'Registra pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Annulla */}
      <Dialog open={annullaDialog} onOpenChange={setAnnullaDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Annullare la bozza?</DialogTitle>
            <DialogDescription>
              Le attività collegate verranno liberate e potranno essere incluse in una nuova fattura.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnullaDialog(false)}>No, torna indietro</Button>
            <Button variant="destructive" onClick={handleAnnulla} disabled={salvataggio}>
              {salvataggio ? 'Annullamento…' : 'Sì, annulla bozza'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Numero Fattura Emessa */}
      <Dialog open={modificaNumeroDialog} onOpenChange={setModificaNumeroDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Modifica Numero Fattura
            </DialogTitle>
            <DialogDescription>
              Rettifica il numero progressivo o la data documento per la fattura emessa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              ⚠️ Modificando il numero, verrà aggiornato l&apos;XML FatturaPA e il PDF. Se imposti un numero maggiore dell&apos;attuale, il contatore studio avanzerà automaticamente per le prossime fatture.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mod-num" className="text-xs font-bold text-gray-700">
                  Numero Progressivo *
                </Label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 h-9 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-600 text-xs font-mono font-bold">
                    {fattura?.sezionale || 'FT'}
                  </span>
                  <Input
                    id="mod-num"
                    type="number"
                    min="1"
                    className="h-9 rounded-l-none font-mono font-bold text-base text-blue-900"
                    value={nuovoNumeroFattura}
                    onChange={(e) => setNuovoNumeroFattura(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mod-data" className="text-xs font-bold text-gray-700">
                  Data Documento
                </Label>
                <Input
                  id="mod-data"
                  type="date"
                  className="h-9 text-sm"
                  value={nuovaDataFattura}
                  onChange={(e) => setNuovaDataFattura(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs flex items-center justify-between">
              <span className="text-gray-500">Nuova dicitura completa:</span>
              <span className="font-mono font-bold text-base text-green-700">
                {fattura?.sezionale || 'FT'} {nuovoNumeroFattura || '—'} / {nuovaDataFattura ? new Date(nuovaDataFattura).getFullYear() : fattura?.anno}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModificaNumeroDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSalvaModificaNumero}
              disabled={salvandoNumero || !nuovoNumeroFattura}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {salvandoNumero ? 'Salvataggio...' : 'Conferma Nuovo Numero'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
