'use client'
// src/app/(dashboard)/aziende/[id]/page.tsx — con dati reali da API

import * as React from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, RefreshCw, FileText, CheckCircle2, Clock, AlertCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { formatEuro, formatData, statoInvoiceLabel, statoInvoiceBadgeColor, statoWorkEntryLabel } from '@/lib/utils'
import { DocumentiAzienda } from '@/components/documenti/DocumentiAzienda'
import { useToast } from '@/hooks/use-toast'
import { validaCodiceFiscale, validaPartitaIva, validaCodiceSdi } from '@/lib/fiscal-validators'

export default function AziendaDettaglioPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const aziendaId = params.id as string
  const tabDefault = searchParams.get('tab') ?? 'anagrafica'
  const [tab, setTab] = React.useState(tabDefault)

  const [loading, setLoading] = React.useState(true)
  const [salvando, setSalvando] = React.useState(false)
  const [azienda, setAzienda] = React.useState<any>(null)
  const [attivita, setAttivita] = React.useState<any[]>([])
  const [fatture, setFatture] = React.useState<any[]>([])

  // Tariffe concordate per il cliente
  const [serviziDisponibili, setServiziDisponibili] = React.useState<any[]>([])
  const [openTariffaModal, setOpenTariffaModal] = React.useState(false)
  const [salvandoTariffa, setSalvandoTariffa] = React.useState(false)
  const [tariffaInModifica, setTariffaInModifica] = React.useState<any | null>(null)
  const [formTariffa, setFormTariffa] = React.useState({
    serviceId: '',
    prezzoUnitario: '',
    validaDal: '2025-01-01',
    validaAl: '',
    note: '',
  })

  // Form stato anagrafica
  const [form, setForm] = React.useState({
    ragioneSociale: '',
    tipoSoggetto: 'PERSONA_GIURIDICA',
    partitaIva: '',
    codiceFiscale: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    paese: 'IT',
    emailAmministrativa: '',
    telefono: '',
    pec: '',
    codiceDestinatarioSdi: '0000000',
    referente: '',
    note: '',
    modalitaPagamento: 'MP05',
    terminiPagamento: 30,
    ibanRiferimento: '',
    frequenzaFatturazione: 'MENSILE',
  })

  const caricaTutto = React.useCallback(async () => {
    if (!aziendaId) return
    setLoading(true)
    try {
      const [resAz, resAtt, resFat, resServ] = await Promise.all([
        fetch(`/api/aziende/${aziendaId}`),
        fetch(`/api/attivita?companyId=${aziendaId}&perPagina=100`),
        fetch(`/api/fatture?companyId=${aziendaId}&perPagina=100`),
        fetch('/api/servizi?soloAttivi=true'),
      ])

      const datiAz = await resAz.json()
      const datiAtt = await resAtt.json()
      const datiFat = await resFat.json()
      const datiServ = await resServ.json()

      if (!resAz.ok) throw new Error(datiAz.error)

      setAzienda(datiAz)
      setAttivita(datiAtt.attivita ?? [])
      setFatture(datiFat.fatture ?? [])
      setServiziDisponibili(datiServ.servizi ?? [])

      setForm({
        ragioneSociale: datiAz.ragioneSociale || '',
        tipoSoggetto: datiAz.tipoSoggetto || 'PERSONA_GIURIDICA',
        partitaIva: datiAz.partitaIva || '',
        codiceFiscale: datiAz.codiceFiscale || '',
        indirizzo: datiAz.indirizzo || '',
        cap: datiAz.cap || '',
        comune: datiAz.comune || '',
        provincia: datiAz.provincia || '',
        paese: datiAz.paese || 'IT',
        emailAmministrativa: datiAz.emailAmministrativa || '',
        telefono: datiAz.telefono || '',
        pec: datiAz.pec || '',
        codiceDestinatarioSdi: datiAz.codiceDestinatarioSdi || '0000000',
        referente: datiAz.referente || '',
        note: datiAz.note || '',
        modalitaPagamento: datiAz.modalitaPagamento || 'MP05',
        terminiPagamento: datiAz.terminiPagamento ?? 30,
        ibanRiferimento: datiAz.ibanRiferimento || '',
        frequenzaFatturazione: datiAz.frequenzaFatturazione || 'MENSILE',
      })
    } catch (e: any) {
      toast({ title: 'Errore caricamento azienda', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [aziendaId, toast])

  React.useEffect(() => {
    caricaTutto()
  }, [caricaTutto])

  const handleSalva = async () => {
    // Controllo Privato vs Partita IVA
    if (form.tipoSoggetto === 'PERSONA_FISICA') {
      const v = validaCodiceFiscale(form.codiceFiscale)
      if (!v.valida) {
        toast({ title: 'Codice Fiscale non valido', description: v.errore, variant: 'destructive' })
        return
      }
    } else {
      const v = validaPartitaIva(form.partitaIva)
      if (!v.valida) {
        toast({ title: 'Partita IVA non valida', description: v.errore, variant: 'destructive' })
        return
      }
    }

    setSalvando(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Dati salvati con successo' })
      caricaTutto()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio', description: e.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  // Gestione Tariffe Personalizzate per questo Cliente
  const apriNuovaTariffa = () => {
    setTariffaInModifica(null)
    const primo = serviziDisponibili[0]
    setFormTariffa({
      serviceId: primo?.id || '',
      prezzoUnitario: primo?.prezzoBase ? String(primo.prezzoBase) : primo?.tariffaOraria ? String(primo.tariffaOraria) : '',
      validaDal: '2025-01-01',
      validaAl: '',
      note: '',
    })
    setOpenTariffaModal(true)
  }

  const apriModificaTariffa = (pr: any) => {
    setTariffaInModifica(pr)
    setFormTariffa({
      serviceId: pr.serviceId,
      prezzoUnitario: String(pr.prezzoUnitario ?? pr.prezzo ?? ''),
      validaDal: pr.validaDal ? new Date(pr.validaDal).toISOString().split('T')[0] : '2025-01-01',
      validaAl: pr.validaAl ? new Date(pr.validaAl).toISOString().split('T')[0] : '',
      note: pr.note || '',
    })
    setOpenTariffaModal(true)
  }

  const handleSalvaTariffa = async () => {
    if (!formTariffa.serviceId) {
      toast({ title: 'Seleziona una prestazione', variant: 'destructive' })
      return
    }
    const prezzo = parseFloat(formTariffa.prezzoUnitario)
    if (isNaN(prezzo) || prezzo <= 0) {
      toast({ title: 'Inserisci un importo valido', variant: 'destructive' })
      return
    }
    setSalvandoTariffa(true)
    try {
      if (tariffaInModifica) {
        const res = await fetch(`/api/servizi/price-rules/${tariffaInModifica.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prezzoUnitario: prezzo,
            validaDal: formTariffa.validaDal ? new Date(formTariffa.validaDal).toISOString() : undefined,
            validaAl: formTariffa.validaAl ? new Date(formTariffa.validaAl).toISOString() : null,
            note: formTariffa.note.trim() || null,
          }),
        })
        const dati = await res.json()
        if (!res.ok) throw new Error(dati.error)
        toast({ title: '✅ Tariffa concordata aggiornata' })
      } else {
        const res = await fetch('/api/servizi/price-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: formTariffa.serviceId,
            companyId: aziendaId,
            prezzoUnitario: prezzo,
            validaDal: formTariffa.validaDal ? new Date(formTariffa.validaDal).toISOString() : undefined,
            validaAl: formTariffa.validaAl ? new Date(formTariffa.validaAl).toISOString() : null,
            note: formTariffa.note.trim() || null,
          }),
        })
        const dati = await res.json()
        if (!res.ok) throw new Error(dati.error)
        toast({ title: '✅ Nuova tariffa concordata salvata' })
      }
      setOpenTariffaModal(false)
      caricaTutto()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio tariffa', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoTariffa(false)
    }
  }

  const handleEliminaTariffa = async (pr: any) => {
    if (!confirm(`Rimuovere la tariffa concordata per "${pr.service?.descrizione || pr.service?.codice}"?`)) return
    try {
      const res = await fetch(`/api/servizi/price-rules/${pr.id}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Tariffa rimossa' })
      caricaTutto()
    } catch (e: any) {
      toast({ title: 'Errore eliminazione', description: e.message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!azienda) {
    return (
      <div className="p-6">
        <p className="text-red-600">Azienda non trovata</p>
        <Button variant="link" onClick={() => router.push('/aziende')}>
          ← Torna all'elenco aziende
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/aziende')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{azienda.ragioneSociale}</h2>
            <p className="text-sm text-gray-500">
              {azienda.tipoSoggetto} · {azienda.comune ? `${azienda.comune} (${azienda.provincia})` : 'Sede non specificata'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={!azienda.archiviata ? 'success' : 'secondary'}>
            {!azienda.archiviata ? 'Attiva' : 'Archiviata'}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.open(`/api/aziende/${aziendaId}/scheda-pdf`, '_blank')}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            title="Scarica estratto conto cliente con prestazioni fatturate, da fatturare e saldo"
          >
            <FileText className="h-4 w-4 mr-2 text-indigo-600" />
            Scheda Conto (PDF)
          </Button>
          <Button variant="outline" size="sm" onClick={caricaTutto}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleSalva} disabled={salvando}>
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Salva modifiche
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="anagrafica">Anagrafica</TabsTrigger>
          <TabsTrigger value="attivita">
            Attività ({attivita.length})
          </TabsTrigger>
          <TabsTrigger value="fatture">
            Fatture ({fatture.length})
          </TabsTrigger>
          <TabsTrigger value="tariffe">
            Tariffe personalizzate ({azienda.priceRules?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="documenti">📎 Documenti & CI</TabsTrigger>
        </TabsList>

        {/* TAB: Anagrafica */}
        <TabsContent value="anagrafica">
          <Card>
            <CardHeader>
              <CardTitle>Dati Anagrafici e Fiscali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="ragioneSociale">Ragione Sociale / Nome e Cognome</Label>
                  <Input
                    id="ragioneSociale"
                    value={form.ragioneSociale}
                    onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tipoSoggetto">Tipo Soggetto</Label>
                  <Select
                    value={form.tipoSoggetto}
                    onValueChange={(v) => setForm({ ...form, tipoSoggetto: v })}
                  >
                    <SelectTrigger id="tipoSoggetto">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONA_GIURIDICA">Persona Giuridica</SelectItem>
                      <SelectItem value="DITTA_INDIVIDUALE">Ditta Individuale</SelectItem>
                      <SelectItem value="PERSONA_FISICA">Persona Fisica</SelectItem>
                      <SelectItem value="ASSOCIAZIONE">Associazione</SelectItem>
                      <SelectItem value="PA">PA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="partitaIva">Partita IVA</Label>
                  <Input
                    id="partitaIva"
                    value={form.partitaIva}
                    onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                    maxLength={11}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                  <Input
                    id="codiceFiscale"
                    value={form.codiceFiscale}
                    onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                    maxLength={16}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="codiceDestinatario">Codice Destinatario SDI</Label>
                  <Input
                    id="codiceDestinatario"
                    value={form.codiceDestinatarioSdi}
                    onChange={(e) => setForm({ ...form, codiceDestinatarioSdi: e.target.value })}
                    maxLength={7}
                  />
                </div>
              </div>

              <Separator />

              {/* Indirizzo */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="indirizzo">Indirizzo Sede / Residenza</Label>
                  <Input
                    id="indirizzo"
                    value={form.indirizzo}
                    onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cap">CAP</Label>
                  <Input
                    id="cap"
                    value={form.cap}
                    onChange={(e) => setForm({ ...form, cap: e.target.value })}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={form.provincia}
                    onChange={(e) => setForm({ ...form, provincia: e.target.value.toUpperCase() })}
                    maxLength={2}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="comune">Comune</Label>
                  <Input
                    id="comune"
                    value={form.comune}
                    onChange={(e) => setForm({ ...form, comune: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="paese">Nazione</Label>
                  <Input
                    id="paese"
                    value={form.paese}
                    onChange={(e) => setForm({ ...form, paese: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <Separator />

              {/* Contatti */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Amministrativa</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.emailAmministrativa}
                    onChange={(e) => setForm({ ...form, emailAmministrativa: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pec">PEC</Label>
                  <Input
                    id="pec"
                    type="email"
                    value={form.pec}
                    onChange={(e) => setForm({ ...form, pec: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="referente">Referente aziendale</Label>
                  <Input
                    id="referente"
                    value={form.referente}
                    onChange={(e) => setForm({ ...form, referente: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="note">Note interne</Label>
                  <Input
                    id="note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              {/* Pagamenti e Fatturazione */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modalitaPagamento">Modalità Pagamento</Label>
                  <Select
                    value={form.modalitaPagamento}
                    onValueChange={(v) => setForm({ ...form, modalitaPagamento: v })}
                  >
                    <SelectTrigger id="modalitaPagamento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MP05">Bonifico Bancario (MP05)</SelectItem>
                      <SelectItem value="MP01">Contanti (MP01)</SelectItem>
                      <SelectItem value="MP02">Assegno (MP02)</SelectItem>
                      <SelectItem value="MP12">RID / SDD (MP12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="terminiPagamento">Termini Pagamento (giorni)</Label>
                  <Input
                    id="terminiPagamento"
                    type="number"
                    value={form.terminiPagamento}
                    onChange={(e) => setForm({ ...form, terminiPagamento: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="frequenzaFatturazione">Frequenza Fatturazione</Label>
                  <Select
                    value={form.frequenzaFatturazione}
                    onValueChange={(v) => setForm({ ...form, frequenzaFatturazione: v })}
                  >
                    <SelectTrigger id="frequenzaFatturazione">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MENSILE">Mensile</SelectItem>
                      <SelectItem value="BIMESTRALE">Bimestrale</SelectItem>
                      <SelectItem value="TRIMESTRALE">Trimestrale</SelectItem>
                      <SelectItem value="SEMESTRALE">Semestrale</SelectItem>
                      <SelectItem value="ANNUALE">Annuale</SelectItem>
                      <SelectItem value="MANUALE">Manuale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Attività */}
        <TabsContent value="attivita">
          <Card>
            <CardHeader>
              <CardTitle>Attività e Prestazioni</CardTitle>
            </CardHeader>
            <CardContent>
              {attivita.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Nessuna attività registrata per questa azienda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Servizio</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead className="text-right">Q.tà / Tempo</TableHead>
                      <TableHead className="text-right">Importo</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attivita.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm">{formatData(a.data)}</TableCell>
                        <TableCell className="font-medium">{a.service?.descrizione || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{a.descrizione || '—'}</TableCell>
                        <TableCell className="text-right text-sm">
                          {a.durataMinutiFatturabili ? `${a.durataMinutiFatturabili} min` : Number(a.quantita || 1).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{formatEuro(a.importo)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {statoWorkEntryLabel(a.stato)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Fatture */}
        <TabsContent value="fatture">
          <Card>
            <CardHeader>
              <CardTitle>Fatture collegate</CardTitle>
            </CardHeader>
            <CardContent>
              {fatture.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">Nessuna fattura emessa o in bozza per questa azienda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Data Documento</TableHead>
                      <TableHead className="text-right">Totale</TableHead>
                      <TableHead className="text-right">Residuo</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fatture.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono font-medium">
                          <Link href={`/fatture/${f.id}`} className="text-blue-600 hover:underline">
                            {f.numeroCompleto || `BOZZA (${f.id.slice(0, 8)})`}
                          </Link>
                        </TableCell>
                        <TableCell>{formatData(f.dataDocumento)}</TableCell>
                        <TableCell className="text-right font-medium">{formatEuro(f.totaleDocumento)}</TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">{formatEuro(f.residuo)}</TableCell>
                        <TableCell>
                          <Badge className={statoInvoiceBadgeColor(f.stato)}>
                            {statoInvoiceLabel(f.stato)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Tariffe personalizzate */}
        <TabsContent value="tariffe" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
              <div>
                <CardTitle>Tariffe specifiche per questo cliente</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Le tariffe concordate qui hanno priorità sul tariffario generale dello studio per tutte le attività registrate su questo cliente.
                </p>
              </div>
              <Button size="sm" onClick={apriNuovaTariffa}>
                <Plus className="h-4 w-4 mr-1.5" /> Nuova Tariffa Concordata
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!azienda.priceRules || azienda.priceRules.length === 0 ? (
                <p className="text-sm text-gray-500 py-12 text-center">
                  Nessuna tariffa personalizzata: vengono applicate le tariffe generali dello studio.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 text-xs">
                      <TableHead>Codice</TableHead>
                      <TableHead>Servizio</TableHead>
                      <TableHead className="text-right">Prezzo Base Studio</TableHead>
                      <TableHead className="text-right">Tariffa Concordata</TableHead>
                      <TableHead>Validità</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {azienda.priceRules.map((pr: any) => (
                      <TableRow key={pr.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-xs font-semibold text-blue-700">
                          {pr.service?.codice}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 text-sm">
                          {pr.service?.descrizione}
                        </TableCell>
                        <TableCell className="text-right text-gray-400 text-sm">
                          {pr.service?.prezzoBase != null
                            ? formatEuro(pr.service.prezzoBase)
                            : pr.service?.tariffaOraria
                            ? `${formatEuro(pr.service.tariffaOraria)}/ora`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-700 text-sm">
                          {formatEuro(pr.prezzoUnitario ?? pr.prezzo)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          Dal {formatData(pr.validaDal)} {pr.validaAl ? `al ${formatData(pr.validaAl)}` : '(senza scadenza)'}
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {pr.note || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:text-blue-800"
                              onClick={() => apriModificaTariffa(pr)}
                              title="Modifica tariffa concordata"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" /> Modifica
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaTariffa(pr)}
                              title="Elimina tariffa concordata"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Documenti */}
        <TabsContent value="documenti">
          <Card>
            <CardHeader>
              <CardTitle>Documenti del Cliente</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Carte d'identità, passaporti, visure camerali e altri documenti.
                I file sono conservati in modo protetto e consultabili in qualsiasi momento.
              </p>
            </CardHeader>
            <CardContent>
              <DocumentiAzienda aziendaId={aziendaId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: Nuova / Modifica Tariffa Concordata Cliente
         ───────────────────────────────────────────────────────────── */}
      <Dialog open={openTariffaModal} onOpenChange={setOpenTariffaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {tariffaInModifica ? 'Modifica Tariffa Concordata' : 'Nuova Tariffa per il Cliente'}
            </DialogTitle>
            <DialogDescription>
              Definisci un compenso personalizzato per {azienda?.ragioneSociale}. Questa tariffa avrà la priorità rispetto al tariffario standard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-servizio">Prestazione *</Label>
              <Select
                value={formTariffa.serviceId}
                onValueChange={(v) => {
                  const s = serviziDisponibili.find((x) => x.id === v)
                  setFormTariffa({
                    ...formTariffa,
                    serviceId: v,
                    prezzoUnitario: s?.prezzoBase ? String(s.prezzoBase) : s?.tariffaOraria ? String(s.tariffaOraria) : formTariffa.prezzoUnitario,
                  })
                }}
                disabled={!!tariffaInModifica}
              >
                <SelectTrigger id="tc-servizio">
                  <SelectValue placeholder="Seleziona prestazione..." />
                </SelectTrigger>
                <SelectContent>
                  {serviziDisponibili.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.codice} — {s.descrizione} ({s.prezzoBase != null ? formatEuro(s.prezzoBase) : s.tariffaOraria ? `${formatEuro(s.tariffaOraria)}/h` : s.unita})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-prezzo">Compenso Concordato (€) *</Label>
              <Input
                id="tc-prezzo"
                type="number"
                step="0.01"
                placeholder="es. 70.00"
                value={formTariffa.prezzoUnitario}
                onChange={(e) => setFormTariffa({ ...formTariffa, prezzoUnitario: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tc-validaDal">Valida dal</Label>
                <Input
                  id="tc-validaDal"
                  type="date"
                  value={formTariffa.validaDal}
                  onChange={(e) => setFormTariffa({ ...formTariffa, validaDal: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tc-validaAl">Valida al (opzionale)</Label>
                <Input
                  id="tc-validaAl"
                  type="date"
                  value={formTariffa.validaAl}
                  onChange={(e) => setFormTariffa({ ...formTariffa, validaAl: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tc-note">Note / Riferimento accordo</Label>
              <Input
                id="tc-note"
                placeholder="es. Accordo forfettario 2026, sconto volume..."
                value={formTariffa.note}
                onChange={(e) => setFormTariffa({ ...formTariffa, note: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTariffaModal(false)}>
              Annulla
            </Button>
            <Button onClick={handleSalvaTariffa} disabled={salvandoTariffa || !formTariffa.serviceId}>
              {salvandoTariffa ? 'Salvataggio...' : tariffaInModifica ? 'Salva Modifiche' : 'Aggiungi Tariffa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
