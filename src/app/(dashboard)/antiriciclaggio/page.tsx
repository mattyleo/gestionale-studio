'use client'
// src/app/(dashboard)/antiriciclaggio/page.tsx
// Registro Antiriciclaggio & Privacy per Studio Professionale (D.Lgs. 231/2007 & GDPR)

import * as React from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Pencil,
  User,
  Building,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { AntiriciclaggioDettaglioModal } from '@/components/antiriciclaggio/AntiriciclaggioDettaglioModal'

export default function AntiriciclaggioPage() {
  const { toast } = useToast()
  const [aziende, setAziende] = React.useState<any[]>([])
  const [statistiche, setStatistiche] = React.useState<any>({
    totaleCensiti: 0,
    totaleRegolari: 0,
    totaleDaVerificare: 0,
    docScaduti: 0,
    docInScadenza: 0,
    docMancanti: 0,
    privacyMancante: 0,
    totalePrivatiCaf: 0,
  })
  const [loading, setLoading] = React.useState(true)

  // Filtri
  const [cerca, setCerca] = React.useState('')
  const [settore, setSettore] = React.useState('TUTTI')
  const [statoFascicolo, setStatoFascicolo] = React.useState('TUTTI')
  const [rischio, setRischio] = React.useState('TUTTI')
  const [statoDocumento, setStatoDocumento] = React.useState('TUTTI')
  const [soloPiva, setSoloPiva] = React.useState(true)

  // Modal fascicolo
  const [selectedAziendaId, setSelectedAziendaId] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        cerca,
        settore,
        statoFascicolo,
        rischio,
        statoDocumento,
        soloPiva: String(soloPiva),
      })

      const res = await fetch(`/api/antiriciclaggio?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAziende(data.aziende ?? [])
      setStatistiche(data.statistiche ?? {})
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [cerca, settore, statoFascicolo, rischio, statoDocumento, soloPiva, toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  const apriFascicolo = (id: string) => {
    setSelectedAziendaId(id)
    setModalOpen(true)
  }

  const scaricaRegistroPdf = () => {
    const params = new URLSearchParams()
    if (settore !== 'TUTTI') params.append('settore', settore)
    window.open(`/api/antiriciclaggio/export/pdf?${params}`, '_blank')
  }

  const scaricaRegistroCsv = () => {
    const params = new URLSearchParams()
    if (settore !== 'TUTTI') params.append('settore', settore)
    window.open(`/api/antiriciclaggio/export/csv?${params}`, '_blank')
  }

  const formatData = (d: any) => {
    if (!d) return '—'
    try {
      return new Intl.DateTimeFormat('it-IT').format(new Date(d))
    } catch {
      return '—'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            Registro Antiriciclaggio &amp; Privacy
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Censimento della clientela, verifica documenti d&apos;identità, adempimenti D.Lgs. 231/2007 e GDPR
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={scaricaRegistroPdf}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
            title="Stampa ufficiale Registro Clienti Antiriciclaggio (A4 Orizzontale)"
          >
            <Printer className="h-4 w-4 mr-1 text-blue-600" /> Stampa Registro (PDF)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={scaricaRegistroCsv}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            title="Esporta registro antiriciclaggio in formato CSV/Excel"
          >
            <Download className="h-4 w-4 mr-1 text-emerald-600" /> Esporta CSV
          </Button>

          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
        </div>
      </div>

      {/* KPI Cards / Monitoraggio Studio */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-blue-800">Aziende Censite</div>
            <div className="text-2xl font-bold text-blue-950 mt-1">{statistiche.totaleCensiti}</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Soggetti con P.IVA</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-green-800">Fascicoli Regolari</div>
            <div className="text-2xl font-bold text-green-700 mt-1">{statistiche.totaleRegolari}</div>
            <div className="text-[11px] text-green-600 mt-0.5">Verifiche complete</div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-amber-800">Doc. In Scadenza</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{statistiche.docInScadenza}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Entro 60 giorni</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-red-800">Doc. Scaduti</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{statistiche.docScaduti}</div>
            <div className="text-[11px] text-red-500 mt-0.5">Da rinnovare subito</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-slate-700">Doc. Non Caricati</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{statistiche.docMancanti}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Senza documento</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/40">
          <CardContent className="p-3.5">
            <div className="text-xs font-medium text-purple-800">Privacy Mancante</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{statistiche.privacyMancante}</div>
            <div className="text-[11px] text-purple-600 mt-0.5">Da far firmare</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra Filtri e Ricerca */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Campo Ricerca */}
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per ragione sociale, P.IVA, CF, referente o fascicolo..."
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro Settore Studio */}
            <div>
              <Select value={settore} onValueChange={setSettore}>
                <SelectTrigger>
                  <SelectValue placeholder="Settore Studio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutti i settori</SelectItem>
                  <SelectItem value="CONTABILITA">Solo Contabilità</SelectItem>
                  <SelectItem value="PAGHE">Solo Paghe &amp; Lavoro</SelectItem>
                  <SelectItem value="CAF">Solo CAF / Dichiarazioni</SelectItem>
                  <SelectItem value="MISTO">Misto (Contab. + Paghe)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Stato Documenti */}
            <div>
              <Select value={statoDocumento} onValueChange={setStatoDocumento}>
                <SelectTrigger>
                  <SelectValue placeholder="Stato Documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutti i documenti</SelectItem>
                  <SelectItem value="IN_SCADENZA">⚠️ In Scadenza (≤ 60gg)</SelectItem>
                  <SelectItem value="SCADUTO">❌ Solo Scaduti</SelectItem>
                  <SelectItem value="MANCANTE">📄 Documento Mancante</SelectItem>
                  <SelectItem value="VALIDO">✓ Solo Documenti Validi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Rischio */}
            <div>
              <Select value={rischio} onValueChange={setRischio}>
                <SelectTrigger>
                  <SelectValue placeholder="Livello Rischio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TUTTI">Tutti i rischi</SelectItem>
                  <SelectItem value="BASSO">Rischio Basso</SelectItem>
                  <SelectItem value="MEDIO">Rischio Medio</SelectItem>
                  <SelectItem value="ALTO">Rischio Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Opzione Filtro P.IVA */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700">
              <input
                type="checkbox"
                checked={soloPiva}
                onChange={(e) => setSoloPiva(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>
                <strong>Escludi soggetti senza Partita IVA</strong> (esclude automaticamente i privati e persone fisiche solo CAF non soggetti ad antiriciclaggio)
              </span>
            </label>

            {statistiche.totalePrivatiCaf > 0 && (
              <span className="text-slate-400">
                ({statistiche.totalePrivatiCaf} privati esclusi dal censimento)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabella Registro Antiriciclaggio */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : aziende.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30 text-blue-400" />
              <p className="text-base font-medium text-gray-600">Nessun cliente trovato con i filtri impostati</p>
              <p className="text-xs text-gray-400 mt-1">
                Tutti i clienti con Partita IVA importati da fatture o creati vengono censiti automaticamente qui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="w-24">N. Fascicolo</TableHead>
                  <TableHead>Cliente / Ragione Sociale</TableHead>
                  <TableHead>Settore</TableHead>
                  <TableHead>Legale Rappresentante</TableHead>
                  <TableHead>Documento d&apos;Identità</TableHead>
                  <TableHead>Rischio</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aziende.map((az, idx) => {
                  const fascicolo = az.antiriciclaggioFascicolo || `ARC-${String(idx + 1).padStart(3, '0')}`
                  const oggiTime = Date.now()
                  const scadenzaTime = az.documentoScadenza ? new Date(az.documentoScadenza).getTime() : null
                  const isScaduto = scadenzaTime ? scadenzaTime < oggiTime : false
                  const isInScadenza = scadenzaTime && !isScaduto ? (scadenzaTime - oggiTime) / (1000 * 60 * 60 * 24) <= 60 : false

                  const rischioUpper = (az.antiriciclaggioRischio || 'BASSO').toUpperCase()
                  const rischioColor = rischioUpper.includes('ALTO')
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : rischioUpper.includes('MEDIO')
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-green-100 text-green-800 border-green-300'

                  return (
                    <TableRow key={az.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-mono text-xs font-bold text-blue-700">
                        {fascicolo}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{az.ragioneSociale}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {az.partitaIva ? `P.I. ${az.partitaIva}` : ''}
                          {az.codiceFiscale ? ` · CF ${az.codiceFiscale}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs bg-slate-50">
                          {az.settoreAttivita || 'CONTABILITA'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {az.legaleRappresentante || az.referente || '—'}
                      </TableCell>
                      <TableCell>
                        {az.documentoNumero ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium text-slate-900">
                              {az.documentoTipo === 'passaporto' ? 'Pass.' : az.documentoTipo === 'patente' ? 'Pat.' : 'C.I.'} {az.documentoNumero}
                            </div>
                            {isScaduto ? (
                              <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                                Scaduto il {formatData(az.documentoScadenza)}
                              </Badge>
                            ) : isInScadenza ? (
                              <Badge className="bg-amber-500 text-white text-[10px] py-0 px-1.5 h-4 hover:bg-amber-600">
                                Scade il {formatData(az.documentoScadenza)}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-green-700 block">
                                ✓ Scad. {formatData(az.documentoScadenza)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Non caricato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${rischioColor}`}>
                          {rischioUpper}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {az.privacyFirmata ? (
                          <Badge variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 text-[11px]">
                            ✓ Firmata
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 text-slate-500 text-[11px]">
                            Da firmare
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={az.antiriciclaggioStato === 'REGOLARE' ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {az.antiriciclaggioStato === 'REGOLARE' ? 'Regolare' : 'Da Verificare'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => apriFascicolo(az.id)}
                            className="h-8 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                            title="Apri fascicolo antiriciclaggio e privacy del cliente"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Fascicolo
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-blue-600"
                            onClick={() => window.open(`/api/antiriciclaggio/${az.id}/pdf?tipo=dichiarazione`, '_blank')}
                            title="Scarica Dichiarazione Cliente Antiriciclaggio (PDF)"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Fascicolo Antiriciclaggio */}
      <AntiriciclaggioDettaglioModal
        aziendaId={selectedAziendaId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={caricaDati}
      />
    </div>
  )
}
