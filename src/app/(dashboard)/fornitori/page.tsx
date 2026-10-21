'use client'
// src/app/(dashboard)/fornitori/page.tsx
// Gestione Anagrafica Fornitori dello Studio Professionale

import * as React from 'react'
import {
  Plus,
  Search,
  Truck,
  Building,
  RefreshCw,
  Pencil,
  Trash2,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const CATEGORIE_PREDEFINITE = [
  'Software e Licenze',
  'Cancelleria e Materiali',
  'Utenze e Telefonia',
  'Consulenze Esterne',
  'Hardware e Assistenza IT',
  'Formazione Professionale',
  'Banche e Servizi Finanziari',
  'Generale',
]

export default function FornitoriPage() {
  const { toast } = useToast()
  const [fornitori, setFornitori] = React.useState<any[]>([])
  const [categorieDisponibili, setCategorieDisponibili] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [cerca, setCerca] = React.useState('')
  const [stato, setStato] = React.useState('attivi')
  const [filtroCategoria, setFiltroCategoria] = React.useState('TUTTE')

  // Modal Nuovo / Modifica
  const [openModal, setOpenModal] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [fornitoreInModifica, setFornitoreInModifica] = React.useState<any | null>(null)

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
    email: '',
    pec: '',
    telefono: '',
    referente: '',
    codiceDestinatarioSdi: '0000000',
    iban: '',
    categoria: 'Generale',
    note: '',
  })

  const caricaFornitori = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        cerca,
        stato,
        categoria: filtroCategoria,
        perPagina: '50',
      })
      const res = await fetch(`/api/fornitori?${params}`)
      const dati = await res.json()
      setFornitori(dati.fornitori ?? [])
      setCategorieDisponibili(dati.categorie ?? [])
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i fornitori', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [cerca, stato, filtroCategoria, toast])

  React.useEffect(() => {
    caricaFornitori()
  }, [caricaFornitori])

  const apriNuovo = () => {
    setFornitoreInModifica(null)
    setForm({
      ragioneSociale: '',
      tipoSoggetto: 'PERSONA_GIURIDICA',
      partitaIva: '',
      codiceFiscale: '',
      indirizzo: '',
      cap: '',
      comune: '',
      provincia: '',
      paese: 'IT',
      email: '',
      pec: '',
      telefono: '',
      referente: '',
      codiceDestinatarioSdi: '0000000',
      iban: '',
      categoria: 'Generale',
      note: '',
    })
    setOpenModal(true)
  }

  const apriModifica = (f: any) => {
    setFornitoreInModifica(f)
    setForm({
      ragioneSociale: f.ragioneSociale || '',
      tipoSoggetto: f.tipoSoggetto || 'PERSONA_GIURIDICA',
      partitaIva: f.partitaIva || '',
      codiceFiscale: f.codiceFiscale || '',
      indirizzo: f.indirizzo || '',
      cap: f.cap || '',
      comune: f.comune || '',
      provincia: f.provincia || '',
      paese: f.paese || 'IT',
      email: f.email || '',
      pec: f.pec || '',
      telefono: f.telefono || '',
      referente: f.referente || '',
      codiceDestinatarioSdi: f.codiceDestinatarioSdi || '0000000',
      iban: f.iban || '',
      categoria: f.categoria || 'Generale',
      note: f.note || '',
    })
    setOpenModal(true)
  }

  const handleSalva = async () => {
    if (!form.ragioneSociale.trim()) {
      toast({ title: 'Inserisci la Ragione Sociale', variant: 'destructive' })
      return
    }

    setSalvando(true)
    try {
      const url = fornitoreInModifica ? `/api/fornitori/${fornitoreInModifica.id}` : '/api/fornitori'
      const method = fornitoreInModifica ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore salvataggio')

      toast({ title: fornitoreInModifica ? '✅ Fornitore aggiornato' : '✅ Fornitore aggiunto' })
      setOpenModal(false)
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleElimina = async (f: any) => {
    if (!confirm(`Sei sicuro di voler eliminare il fornitore "${f.ragioneSociale}"?`)) return

    try {
      const res = await fetch(`/api/fornitori/${f.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Errore durante l\'eliminazione')

      toast({ title: '✅ Fornitore eliminato' })
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    }
  }

  const handleToggleAttivo = async (f: any) => {
    try {
      const res = await fetch(`/api/fornitori/${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: !f.attivo }),
      })
      if (!res.ok) throw new Error('Errore aggiornamento')
      caricaFornitori()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-indigo-600" />
            Anagrafica Fornitori
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestione dei fornitori di beni e servizi dello studio professionale ({fornitori.length} registrati)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={caricaFornitori}>
            <RefreshCw className="h-4 w-4 mr-1" /> Aggiorna
          </Button>
          <Button onClick={apriNuovo} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Nuovo Fornitore
          </Button>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca fornitore per ragione sociale, P.IVA, CF, città..."
                value={cerca}
                onChange={(e) => setCerca(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TUTTE">Tutte le categorie</SelectItem>
                {Array.from(new Set([...CATEGORIE_PREDEFINITE, ...categorieDisponibili])).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stato} onValueChange={setStato}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attivi">Solo attivi</SelectItem>
                <SelectItem value="archiviati">Archiviati</SelectItem>
                <SelectItem value="tutti">Tutti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabella Fornitori */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : fornitori.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-30 text-indigo-400" />
              <p className="text-base font-medium text-gray-600">Nessun fornitore trovato</p>
              <p className="text-xs text-gray-400 mt-1">Clicca su "Nuovo Fornitore" per aggiungerne uno.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Ragione Sociale</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>P.IVA / C.F.</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Recapiti &amp; SDI</TableHead>
                  <TableHead>Coordinate Bancarie (IBAN)</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fornitori.map((f) => (
                  <TableRow key={f.id} className="hover:bg-slate-50/70">
                    <TableCell>
                      <div className="font-semibold text-gray-900">{f.ragioneSociale}</div>
                      {f.referente && (
                        <div className="text-xs text-gray-500">Ref: {f.referente}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/50">
                        {f.categoria || 'Generale'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {f.partitaIva && <div>P.IVA: {f.partitaIva}</div>}
                      {f.codiceFiscale && <div className="text-gray-500">CF: {f.codiceFiscale}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{f.comune ? `${f.comune} (${f.provincia || ''})` : '—'}</div>
                      {f.indirizzo && <div className="text-xs text-gray-400">{f.indirizzo}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {f.codiceDestinatarioSdi && (
                        <div>SDI: <span className="font-mono font-bold text-gray-700">{f.codiceDestinatarioSdi}</span></div>
                      )}
                      {f.pec && <div className="text-gray-500 truncate max-w-[160px]">{f.pec}</div>}
                      {f.telefono && <div className="text-gray-500">{f.telefono}</div>}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-700">
                      {f.iban || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => apriModifica(f)}
                          title="Modifica scheda fornitore"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleElimina(f)}
                          title="Elimina fornitore"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* Dialog Aggiungi / Modifica Fornitore */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-indigo-600" />
              {fornitoreInModifica ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
            </DialogTitle>
            <DialogDescription>
              Inserisci i dati anagrafici e fiscali del fornitore dello studio.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2 text-sm">
            <div className="col-span-2">
              <Label>Ragione Sociale o Nome Completo *</Label>
              <Input
                value={form.ragioneSociale}
                onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                placeholder="es. TIM Telecom Italia, Buffetti SpA, Studio Tecnico Rossi"
              />
            </div>

            <div>
              <Label>Categoria di Spesa</Label>
              <Input
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="es. Software, Cancelleria, Utenze, Servizi"
              />
            </div>

            <div>
              <Label>Tipo Soggetto</Label>
              <Select
                value={form.tipoSoggetto}
                onValueChange={(val) => setForm({ ...form, tipoSoggetto: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONA_GIURIDICA">Società / Ditta (Persona Giuridica)</SelectItem>
                  <SelectItem value="PERSONA_FISICA">Professionista / Privato (Persona Fisica)</SelectItem>
                  <SelectItem value="PA">Pubblica Amministrazione</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Partita IVA</Label>
              <Input
                value={form.partitaIva}
                onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                placeholder="11 cifre"
              />
            </div>

            <div>
              <Label>Codice Fiscale</Label>
              <Input
                value={form.codiceFiscale}
                onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                placeholder="16 caratteri o 11 cifre"
              />
            </div>

            <div className="col-span-2">
              <Label>Indirizzo (Via / Piazza e N° civico)</Label>
              <Input
                value={form.indirizzo}
                onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                placeholder="es. Via Umberto Poli 9"
              />
            </div>

            <div>
              <Label>Comune</Label>
              <Input
                value={form.comune}
                onChange={(e) => setForm({ ...form, comune: e.target.value })}
                placeholder="es. Reggio Emilia"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>CAP</Label>
                <Input
                  value={form.cap}
                  onChange={(e) => setForm({ ...form, cap: e.target.value })}
                  placeholder="42123"
                />
              </div>
              <div>
                <Label>Provincia</Label>
                <Input
                  value={form.provincia}
                  onChange={(e) => setForm({ ...form, provincia: e.target.value.toUpperCase() })}
                  placeholder="RE"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label>Codice Destinatario SDI</Label>
              <Input
                value={form.codiceDestinatarioSdi}
                onChange={(e) => setForm({ ...form, codiceDestinatarioSdi: e.target.value.toUpperCase() })}
                placeholder="7 caratteri (default 0000000)"
              />
            </div>

            <div>
              <Label>PEC</Label>
              <Input
                type="email"
                value={form.pec}
                onChange={(e) => setForm({ ...form, pec: e.target.value })}
                placeholder="fornitore@pec.it"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@fornitore.it"
              />
            </div>

            <div>
              <Label>Telefono</Label>
              <Input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="es. 0522 123456"
              />
            </div>

            <div className="col-span-2">
              <Label>IBAN per Pagamenti Bonifico</Label>
              <Input
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
                placeholder="IT00X0000000000000000000000"
              />
            </div>

            <div className="col-span-2">
              <Label>Note interne / Condizioni di fornitura</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="es. Pagamento 60 gg data fattura fine mese"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenModal(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button onClick={handleSalva} disabled={salvando} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {salvando ? 'Salvataggio...' : 'Salva Fornitore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
