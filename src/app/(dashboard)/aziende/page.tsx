'use client'
// src/app/(dashboard)/aziende/page.tsx — con dati reali da API e creazione azienda

import * as React from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Archive,
  RefreshCw,
  FileText,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { validaCodiceFiscale, validaPartitaIva, validaCodiceSdi } from '@/lib/fiscal-validators'
import { User, Building, Landmark, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AziendePage() {
  const { toast } = useToast()
  const [aziende, setAziende] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [cerca, setCerca] = React.useState('')
  const [stato, setStato] = React.useState('attive')
  const [pagina, setPagina] = React.useState(1)
  const [totalePagine, setTotalePagine] = React.useState(1)
  const [totaleAziende, setTotaleAziende] = React.useState(0)

  // Dialog Nuova Azienda
  const [openNuova, setOpenNuova] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [form, setForm] = React.useState({
    ragioneSociale: '',
    tipoSoggetto: 'PERSONA_GIURIDICA',
    partitaIva: '',
    codiceFiscale: '',
    codiceDestinatarioSdi: '0000000',
    pec: '',
    emailAmministrativa: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    referente: '',
    telefono: '',
    note: '',
  })

  const caricaAziende = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        cerca,
        stato,
        pagina: String(pagina),
        perPagina: '20',
      })
      const res = await fetch(`/api/aziende?${params}`)
      const dati = await res.json()
      setAziende(dati.aziende ?? [])
      setTotalePagine(dati.paginazione?.totalePagine ?? 1)
      setTotaleAziende(dati.paginazione?.totale ?? 0)
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare le aziende', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [cerca, stato, pagina, toast])

  React.useEffect(() => {
    caricaAziende()
  }, [caricaAziende])

  const handleCreaAzienda = async () => {
    if (!form.ragioneSociale.trim()) {
      toast({ title: 'Ragione Sociale obbligatoria', variant: 'destructive' })
      return
    }

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
      const res = await fetch('/api/aziende', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Azienda creata con successo' })
      setOpenNuova(false)
      setForm({
        ragioneSociale: '',
        tipoSoggetto: 'PERSONA_GIURIDICA',
        partitaIva: '',
        codiceFiscale: '',
        codiceDestinatarioSdi: '0000000',
        pec: '',
        emailAmministrativa: '',
        indirizzo: '',
        cap: '',
        comune: '',
        provincia: '',
        referente: '',
        telefono: '',
        note: '',
      })
      caricaAziende()
    } catch (e: any) {
      toast({ title: 'Errore creazione azienda', description: e.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleArchivia = async (id: string, nome: string) => {
    if (!confirm(`Sei sicuro di voler archiviare ${nome}?`)) return
    try {
      const res = await fetch(`/api/aziende/${id}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: 'Azienda archiviata' })
      caricaAziende()
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Aziende Clienti</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {totaleAziende} aziende registrate nel gestionale
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/aziende/export/pdf', '_blank')}
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            title="Scarica il documento PDF dell'elenco anagrafico clienti per lo studio"
          >
            <FileText className="h-4 w-4 mr-1 text-indigo-600" /> Elenco Clienti (PDF)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/api/aziende/export/csv', '_blank')}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            title="Esporta anagrafica clienti in formato Excel / CSV"
          >
            <Download className="h-4 w-4 mr-1 text-emerald-600" /> Esporta CSV
          </Button>
          <Button variant="outline" size="sm" onClick={caricaAziende}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button onClick={() => setOpenNuova(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuova Azienda
          </Button>
        </div>
      </div>

      {/* Barra di ricerca e filtri */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per ragione sociale, P.IVA, CF, comune..."
                value={cerca}
                onChange={(e) => {
                  setCerca(e.target.value)
                  setPagina(1)
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={stato}
              onValueChange={(val) => {
                setStato(val)
                setPagina(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attive">Solo attive</SelectItem>
                <SelectItem value="archiviate">Solo archiviate</SelectItem>
                <SelectItem value="tutte">Tutte</SelectItem>
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
                  <TableHead>Ragione Sociale</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>P.IVA / C.F.</TableHead>
                  <TableHead>Comune</TableHead>
                  <TableHead>Attività / Fatture</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aziende.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      Nessuna azienda trovata
                    </TableCell>
                  </TableRow>
                ) : (
                  aziende.map((a) => (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell className="font-semibold text-gray-900">
                        <Link href={`/aziende/${a.id}`} className="hover:text-blue-600">
                          {a.ragioneSociale}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">
                        {a.tipoSoggetto}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-700">
                        {a.partitaIva || a.codiceFiscale || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.comune ? `${a.comune}${a.provincia ? ` (${a.provincia})` : ''}` : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {a._count?.workEntries ?? 0} att. · {a._count?.invoices ?? 0} fat.
                      </TableCell>
                      <TableCell>
                        <Badge variant={!a.archiviata ? 'success' : 'secondary'}>
                          {!a.archiviata ? 'Attiva' : 'Archiviata'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/aziende/${a.id}`}>
                            <Button variant="ghost" size="sm" title="Vedi scheda">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {!a.archiviata && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Archivia azienda"
                              onClick={() => handleArchivia(a.id, a.ragioneSociale)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Paginazione */}
          {!loading && totalePagine > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-500">
                Pagina {pagina} di {totalePagine} ({totaleAziende} aziende)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.min(totalePagine, p + 1))}
                  disabled={pagina === totalePagine}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nuova Azienda */}
      <Dialog open={openNuova} onOpenChange={setOpenNuova}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Azienda Cliente</DialogTitle>
            <DialogDescription>
              Inserisci l'anagrafica del nuovo cliente. Potrai caricare anche documenti (es. carta d'identità) nella scheda dedicata.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Selezione Rapida Tipologia Cliente */}
            <div className="sm:col-span-2 space-y-2">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Tipologia Cliente
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tipoSoggetto: 'PERSONA_GIURIDICA',
                      codiceDestinatarioSdi: form.codiceDestinatarioSdi === '0000000' ? '' : form.codiceDestinatarioSdi,
                    })
                  }
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    form.tipoSoggetto === 'PERSONA_GIURIDICA' || form.tipoSoggetto === 'DITTA_INDIVIDUALE'
                      ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>Azienda / P.IVA</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tipoSoggetto: 'PERSONA_FISICA',
                      partitaIva: '',
                      codiceDestinatarioSdi: '0000000',
                    })
                  }
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    form.tipoSoggetto === 'PERSONA_FISICA'
                      ? 'border-green-600 bg-green-50 text-green-800 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <User className="h-4 w-4 text-green-600" />
                  <span>Privato (Solo C.F.)</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      tipoSoggetto: 'PA',
                      codiceDestinatarioSdi: '',
                    })
                  }
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    form.tipoSoggetto === 'PA'
                      ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <Landmark className="h-4 w-4 text-purple-600" />
                  <span>Pubblica Amm.</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="ragioneSociale">
                  {form.tipoSoggetto === 'PERSONA_FISICA' ? 'Nome e Cognome *' : 'Ragione Sociale / Denominazione *'}
                </Label>
                <Input
                  id="ragioneSociale"
                  placeholder={
                    form.tipoSoggetto === 'PERSONA_FISICA'
                      ? 'es. Mario Rossi'
                      : 'es. Rossi Consulting S.r.l.'
                  }
                  value={form.ragioneSociale}
                  onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                />
              </div>

              {/* Sezione Fiscale Differenziata */}
              {form.tipoSoggetto === 'PERSONA_FISICA' ? (
                <>
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="codiceFiscale" className="text-green-900 font-semibold">
                        Codice Fiscale * (16 caratteri)
                      </Label>
                      {form.codiceFiscale && (
                        <span className="text-[11px]">
                          {validaCodiceFiscale(form.codiceFiscale).valida ? (
                            <span className="text-green-600 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Formato valido
                            </span>
                          ) : (
                            <span className="text-red-500 inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Non valido
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <Input
                      id="codiceFiscale"
                      placeholder="es. RSSMRA80A01H223Z"
                      maxLength={16}
                      value={form.codiceFiscale}
                      onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                    <p className="text-[11px] text-gray-500">
                      I privati cittadini non possiedono Partita IVA. Il Codice Fiscale verrà inserito nella fattura elettronica.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="codiceDestinatarioSdi">Codice Destinatario SDI</Label>
                    <Input
                      id="codiceDestinatarioSdi"
                      value={form.codiceDestinatarioSdi || '0000000'}
                      disabled
                      className="bg-gray-100 font-mono text-gray-600"
                    />
                    <p className="text-[11px] text-gray-400">Preimpostato a 0000000 per privati cittadini</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="partitaIva" className="text-blue-900 font-semibold">
                        Partita IVA * (11 cifre)
                      </Label>
                      {form.partitaIva && (
                        <span className="text-[11px]">
                          {validaPartitaIva(form.partitaIva).valida ? (
                            <span className="text-green-600 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Valida
                            </span>
                          ) : (
                            <span className="text-red-500 inline-flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> Non valida
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <Input
                      id="partitaIva"
                      placeholder="11 cifre numeriche"
                      maxLength={11}
                      value={form.partitaIva}
                      onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="codiceFiscale">
                      Codice Fiscale <span className="text-gray-400 text-xs">(se diverso dalla P.IVA)</span>
                    </Label>
                    <Input
                      id="codiceFiscale"
                      placeholder="16 caratteri o 11 cifre"
                      maxLength={16}
                      value={form.codiceFiscale}
                      onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="codiceDestinatarioSdi">
                      Codice Destinatario SDI {form.tipoSoggetto === 'PA' ? '(6 caratteri)' : '(7 caratteri)'}
                    </Label>
                    <Input
                      id="codiceDestinatarioSdi"
                      placeholder={form.tipoSoggetto === 'PA' ? 'es. UF12AB' : 'es. ABC1234 (o 0000000)'}
                      value={form.codiceDestinatarioSdi}
                      maxLength={form.tipoSoggetto === 'PA' ? 6 : 7}
                      onChange={(e) => setForm({ ...form, codiceDestinatarioSdi: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="indirizzo">Indirizzo sede / residenza</Label>
                <Input
                  id="indirizzo"
                  placeholder="Via, Piazza, Numero civico"
                  value={form.indirizzo}
                  onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cap">CAP</Label>
                <Input
                  id="cap"
                  placeholder="42123"
                  maxLength={5}
                  value={form.cap}
                  onChange={(e) => setForm({ ...form, cap: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comune">Comune</Label>
                <Input
                  id="comune"
                  placeholder="Reggio nell'Emilia"
                  value={form.comune}
                  onChange={(e) => setForm({ ...form, comune: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pec">PEC</Label>
                <Input
                  id="pec"
                  type="email"
                  placeholder="azienda@pec.it"
                  value={form.pec}
                  onChange={(e) => setForm({ ...form, pec: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  placeholder="0522..."
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNuova(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreaAzienda} disabled={salvando || !form.ragioneSociale.trim()}>
              {salvando ? 'Salvataggio...' : 'Crea Azienda'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
