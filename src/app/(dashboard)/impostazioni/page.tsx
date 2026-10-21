'use client'
// src/app/(dashboard)/impostazioni/page.tsx — con dati reali e gestione numerazione/emittente

import * as React from 'react'
import {
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Wifi,
  Calendar,
  Building2,
  UserCheck,
  RefreshCw,
  Info,
  GitBranch,
  ArrowUpCircle,
  ShieldCheck,
} from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ImportaArubaModal } from '@/components/aruba/ImportaArubaModal'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

export default function ImpostazioniPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [salvandoStudio, setSalvandoStudio] = React.useState(false)
  const [salvandoNumerazione, setSalvandoNumerazione] = React.useState(false)

  // Dati studio reale
  const [studio, setStudio] = React.useState<any>({
    denominazione: '',
    codiceFiscale: '',
    partitaIva: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    email: '',
    pec: '',
    telefono: '',
    regimeFiscale: 'RF19',
    cassaPrevidenziale: 'TC02',
    aliquotaCassa: 4,
    aliquotaIva: '0',
    naturaIva: 'N2.2',
    importoBollo: 2.0,
    sogliaBollo: 77.47,
    iban: '',
  })

  // Dati numerazione sequenza
  const [numerazione, setNumerazione] = React.useState<any>(null)
  const [nuovoUltimoNumero, setNuovoUltimoNumero] = React.useState('')

  // Aggiornamenti software
  const [statoAggiornamento, setStatoAggiornamento] = React.useState<any>(null)
  const [verificandoAggiornamenti, setVerificandoAggiornamenti] = React.useState(false)
  const [applicandoAggiornamento, setApplicandoAggiornamento] = React.useState(false)
  const [dettagliAggiornamento, setDettagliAggiornamento] = React.useState<string[]>([])

  const controllaAggiornamenti = async () => {
    setVerificandoAggiornamenti(true)
    try {
      const res = await fetch('/api/sistema/aggiornamento')
      const dati = await res.json()
      setStatoAggiornamento(dati)
      if (dati.aggiornamentoDisponibile) {
        toast({
          title: '🚀 Aggiornamento disponibile!',
          description: `Trovati ${dati.nuoviCommit} commit di aggiornamento disponibili.`,
        })
      } else if (dati.configurato && !dati.offline) {
        toast({ title: '✅ Sistema aggiornato', description: 'Stai già utilizzando l\'ultima versione disponibile.' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile verificare gli aggiornamenti', variant: 'destructive' })
    } finally {
      setVerificandoAggiornamenti(false)
    }
  }

  const applicaAggiornamento = async () => {
    setApplicandoAggiornamento(true)
    setDettagliAggiornamento(['Avvio download aggiornamento da GitHub...'])
    try {
      const res = await fetch('/api/sistema/aggiornamento', { method: 'POST' })
      const dati = await res.json()
      if (!res.ok || !dati.successo) {
        throw new Error(dati.errore || 'Errore durante l\'aggiornamento')
      }
      setDettagliAggiornamento(dati.dettagli || ['Aggiornamento completato con successo!'])
      toast({
        title: '🎉 Aggiornamento completato!',
        description: 'Il gestionale è stato aggiornato. Ricarica la pagina per applicare le novità.',
      })
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (e: any) {
      toast({ title: 'Errore aggiornamento', description: e.message, variant: 'destructive' })
    } finally {
      setApplicandoAggiornamento(false)
    }
  }

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const [resStudio, resNum] = await Promise.all([
        fetch('/api/impostazioni/emittente'),
        fetch('/api/impostazioni/numerazione'),
      ])

      if (resStudio.ok) {
        const dStudio = await resStudio.json()
        setStudio({
          ...dStudio,
          aliquotaCassa: Number(dStudio.aliquotaCassa ?? 4),
          importoBollo: Number(dStudio.importoBollo ?? 2.0),
          sogliaBollo: Number(dStudio.sogliaBollo ?? 77.47),
        })
      }

      if (resNum.ok) {
        const dNum = await resNum.json()
        setNumerazione(dNum)
        if (dNum.corrente) {
          setNuovoUltimoNumero(String(dNum.corrente.ultimoNumero))
        }
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare le impostazioni', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    caricaDati()
  }, [caricaDati])

  const handleSalvaStudio = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoStudio(true)
    try {
      const res = await fetch('/api/impostazioni/emittente', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studio),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Dati studio aggiornati con successo' })
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore salvataggio', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoStudio(false)
    }
  }

  const handleSalvaNumerazione = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nuovoUltimoNumero === '' || isNaN(parseInt(nuovoUltimoNumero))) {
      toast({ title: 'Inserisci un numero valido', variant: 'destructive' })
      return
    }

    setSalvandoNumerazione(true)
    try {
      const res = await fetch('/api/impostazioni/numerazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anno: numerazione?.annoCorrente ?? new Date().getFullYear(),
          sezionale: 'FT',
          ultimoNumero: parseInt(nuovoUltimoNumero),
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Contatore aggiornato', description: dati.messaggio })
      caricaDati()
    } catch (e: any) {
      toast({ title: 'Errore aggiornamento', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoNumerazione(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Intestazione */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Impostazioni di Sistema</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configurazione studio professionale emittente, numerazione e parametri fiscali
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={caricaDati}>
          <RefreshCw className="h-4 w-4 mr-1" /> Ricarica
        </Button>
      </div>

      <Tabs defaultValue="studio">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="studio">Studio Emittente</TabsTrigger>
          <TabsTrigger value="numerazione">Numerazione Fatture</TabsTrigger>
          <TabsTrigger value="aruba">Integrazione Aruba</TabsTrigger>
          <TabsTrigger value="calendar">Google Calendar</TabsTrigger>
          <TabsTrigger value="aggiornamenti" className="relative">
            Aggiornamenti Software
            {statoAggiornamento?.aggiornamentoDisponibile && (
              <span className="ml-1.5 flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="info">Informazioni & Sviluppatore</TabsTrigger>
        </TabsList>

        {/* TAB: Studio */}
        <TabsContent value="studio">
          <Card>
            <CardHeader>
              <CardTitle>Dati Emittente (Dott. Antonio Tuzio)</CardTitle>
              <CardDescription>
                Questi dati vengono inseriti nell'XML della FatturaPA, nel PDF e negli avvisi di parcella.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : (
                <form onSubmit={handleSalvaStudio} className="space-y-6">
                  {/* Dati anagrafici */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="denominazione">Denominazione / Titolo Professionale *</Label>
                      <Input
                        id="denominazione"
                        value={studio.denominazione}
                        onChange={(e) => setStudio({ ...studio, denominazione: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="regimeFiscale">Regime Fiscale</Label>
                      <Select
                        value={studio.regimeFiscale}
                        onValueChange={(v) => setStudio({ ...studio, regimeFiscale: v })}
                      >
                        <SelectTrigger id="regimeFiscale">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RF19">RF19 - Forfetario (L. 190/2014)</SelectItem>
                          <SelectItem value="RF01">RF01 - Ordinario</SelectItem>
                          <SelectItem value="RF02">RF02 - Semplificato professionisti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="partitaIva">Partita IVA</Label>
                      <Input
                        id="partitaIva"
                        value={studio.partitaIva || ''}
                        onChange={(e) => setStudio({ ...studio, partitaIva: e.target.value })}
                        maxLength={11}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
                      <Input
                        id="codiceFiscale"
                        value={studio.codiceFiscale}
                        onChange={(e) => setStudio({ ...studio, codiceFiscale: e.target.value.toUpperCase() })}
                        required
                        maxLength={16}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="iban">IBAN per accrediti</Label>
                      <Input
                        id="iban"
                        value={studio.iban || ''}
                        onChange={(e) => setStudio({ ...studio, iban: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Sede */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="indirizzo">Indirizzo Studio</Label>
                      <Input
                        id="indirizzo"
                        value={studio.indirizzo}
                        onChange={(e) => setStudio({ ...studio, indirizzo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cap">CAP</Label>
                      <Input
                        id="cap"
                        value={studio.cap}
                        onChange={(e) => setStudio({ ...studio, cap: e.target.value })}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="provincia">Provincia</Label>
                      <Input
                        id="provincia"
                        value={studio.provincia}
                        onChange={(e) => setStudio({ ...studio, provincia: e.target.value.toUpperCase() })}
                        maxLength={2}
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="comune">Comune</Label>
                      <Input
                        id="comune"
                        value={studio.comune}
                        onChange={(e) => setStudio({ ...studio, comune: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="telefono">Telefono Studio</Label>
                      <Input
                        id="telefono"
                        value={studio.telefono || ''}
                        onChange={(e) => setStudio({ ...studio, telefono: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={studio.email || ''}
                        onChange={(e) => setStudio({ ...studio, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Cassa & Bollo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="cassa">Cassa Previdenziale</Label>
                      <Input
                        id="cassa"
                        value={studio.cassaPrevidenziale || 'TC02'}
                        disabled
                        className="bg-gray-100 font-mono text-gray-700"
                      />
                      <span className="text-[11px] text-gray-500">TC02 - CNPADC (Dottori Commercialisti)</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="aliquotaCassa">Aliquota Cassa (%)</Label>
                      <Input
                        id="aliquotaCassa"
                        type="number"
                        step="0.1"
                        value={studio.aliquotaCassa}
                        onChange={(e) => setStudio({ ...studio, aliquotaCassa: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-[11px] text-gray-500">Applicata al 100% dell'imponibile</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bollo">Bollo Virtuale (€)</Label>
                      <Input
                        id="bollo"
                        type="number"
                        step="0.01"
                        value={studio.importoBollo}
                        onChange={(e) => setStudio({ ...studio, importoBollo: parseFloat(e.target.value) || 0 })}
                      />
                      <span className="text-[11px] text-gray-500">2,00 € se totale &gt; 77,47 € ex DPR 642/72</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="noteDefaultFattura">Dicitura Legale / Causale Predefinita nelle Fatture</Label>
                    <Input
                      id="noteDefaultFattura"
                      value={studio.noteDefaultFattura || ''}
                      onChange={(e) => setStudio({ ...studio, noteDefaultFattura: e.target.value })}
                      placeholder="es. Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, l. n. 190 del 2014 e successive modificazioni"
                    />
                    <span className="text-[11px] text-gray-500">
                      Viene stampata in automatico nei PDF delle fatture, negli avvisi di parcella e inserita nella causale dell'XML per lo SdI.
                    </span>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={salvandoStudio}>
                      {salvandoStudio ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" /> Salva Dati Studio
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Numerazione Fatture (Contatore modificabile) */}
        <TabsContent value="numerazione">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-blue-600" />
                  Contatore e Sequenza Numerazione Fatture
                </CardTitle>
                <CardDescription>
                  Se prima di iniziare a usare questo gestionale hai già emesso fatture quest'anno con un altro software, puoi impostare qui il contatore di partenza.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Come funziona la numerazione sequenziale</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Il programma assegna automaticamente i numeri alle fatture emesse secondo la formula:{' '}
                        <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-blue-950">
                          FT [Numero] / [Anno]
                        </code>
                        . Se hai già emesso fatture (es. da 1 a 14), imposta l'ultimo numero emesso su <strong>14</strong>: la prossima fattura emessa dal gestionale sarà automaticamente la <strong>FT 15/{numerazione?.annoCorrente ?? new Date().getFullYear()}</strong>.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSalvaNumerazione} className="flex flex-col sm:flex-row items-end gap-3 pt-2">
                    <div className="space-y-1.5 w-full sm:w-60">
                      <Label htmlFor="ultimoNum" className="font-semibold text-gray-900 text-xs">
                        Ultimo numero fattura già emessa:
                      </Label>
                      <Input
                        id="ultimoNum"
                        type="number"
                        min="0"
                        value={nuovoUltimoNumero}
                        onChange={(e) => setNuovoUltimoNumero(e.target.value)}
                        className="bg-white font-mono font-bold text-lg text-blue-900"
                        placeholder="es. 14"
                      />
                    </div>

                    <div className="space-y-1.5 w-full sm:w-64">
                      <Label className="text-xs text-gray-500">Prossima fattura generata:</Label>
                      <div className="h-10 px-3 py-2 bg-white rounded-md border border-gray-300 font-mono font-bold text-green-700 flex items-center">
                        FT {(parseInt(nuovoUltimoNumero) || 0) + 1} / {numerazione?.annoCorrente ?? new Date().getFullYear()}
                      </div>
                    </div>

                    <Button type="submit" disabled={salvandoNumerazione} className="bg-blue-600 hover:bg-blue-700">
                      {salvandoNumerazione ? 'Salvataggio...' : 'Aggiorna Contatore'}
                    </Button>
                  </form>
                </div>

                {/* Storico sequenze per anno */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Riepilogo Sezionali e Anni nel Database</h4>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Sezionale</TableHead>
                        <TableHead>Anno</TableHead>
                        <TableHead className="text-right">Ultimo Numero Emesso</TableHead>
                        <TableHead className="text-right">Prossimo Numero Disponibile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {numerazione?.sequenze?.map((s: any) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono font-bold text-blue-700">{s.sezionale}</TableCell>
                          <TableCell className="font-semibold">{s.anno}</TableCell>
                          <TableCell className="text-right font-mono text-gray-700">{s.ultimoNumero}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-green-700">
                            {s.prossimoNumeroCompleto}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Aruba */}
        <TabsContent value="aruba" className="space-y-6">
          <Card className="border-orange-200">
            <CardHeader className="bg-orange-50/50 border-b border-orange-100">
              <CardTitle className="flex items-center gap-2 text-orange-950">
                <Wifi className="h-5 w-5 text-orange-600" />
                Importazione Massiva Storico da Aruba
              </CardTitle>
              <CardDescription>
                Importa tutte le fatture pregresse e crea in automatico le anagrafiche dei tuoi clienti a partire dal file ZIP o XML scaricato da Aruba.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-gray-600">
                Puoi caricare l'archivio ZIP massivo esportato dal portale di Aruba Fatturazione Elettronica. Il programma estrarrà le anagrafiche complete (P.IVA, Codice Fiscale, Indirizzo, Codice SDI, PEC) e tutte le fatture con i relativi dettagli e pagamenti.
              </p>
              <div>
                <ImportaArubaModal />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-gray-500" />
                Integrazione Aruba Fatturazione Elettronica SdI
              </CardTitle>
              <CardDescription>
                Stato del collegamento per l'invio telematico delle fatture allo SdI tramite Aruba API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900">Modalità Manuale Attiva (Download XML)</p>
                  <p className="text-sm text-orange-700">
                    L'integrazione diretta API di Aruba richiede la verifica contrattuale del pacchetto abilitato.
                    Attualmente il programma genera il file <strong>XML FatturaPA v1.2 standard</strong>, pronto per essere caricato direttamente sul portale web di Aruba con un semplice drag&amp;drop.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Google Calendar */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Sincronizzazione Google Calendar
              </CardTitle>
              <CardDescription>
                Collega il tuo account Google Workspace per importare automaticamente gli appuntamenti come attività
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm text-blue-800">
                  <p className="font-semibold">Credenziali OAuth 2.0</p>
                  <p>
                    Inserisci le credenziali del tuo progetto Google Cloud Console (Client ID e Client Secret) nel file <code>.env</code> per attivare la sincronizzazione automatica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Info Sviluppatore */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Informazioni sul Software e Sviluppatore
              </CardTitle>
              <CardDescription>Riferimenti dell'autore e licenza</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Card sviluppatore */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg shadow">
                    LM
                  </div>
                  <div className="space-y-2 flex-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Leoni Mattia</h3>
                      <p className="text-sm font-medium text-blue-700">Sviluppo Software & Soluzioni Digitali</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-700 pt-1">
                      <div>
                        <span className="font-semibold text-gray-900">P. IVA:</span> IT02801150356
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Codice Fiscale:</span> LNEMTT75D13H223Z
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Sede:</span> Via Città di Pemba, 21 — 42100 Reggio Emilia (RE)
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Telefono:</span>{' '}
                        <a href="tel:3770933621" className="text-blue-600 hover:underline">
                          3770933621
                        </a>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Sito web:</span>{' '}
                        <a
                          href="https://leonimattia.it"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          leonimattia.it
                        </a>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Email:</span>{' '}
                        <a href="mailto:info@leonimattia.it" className="text-blue-600 hover:underline">
                          info@leonimattia.it
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dettagli tecnici applicazione */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Dettagli Modulo Base</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Applicazione</p>
                    <p className="font-medium text-gray-900 mt-0.5">Gestionale Studio</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Versione</p>
                    <p className="font-medium text-gray-900 mt-0.5">1.1.0 Beta</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Fatturazione Elettronica</p>
                    <p className="font-medium text-gray-900 mt-0.5">FatturaPA v1.2 SdI</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500">Architettura</p>
                    <p className="font-medium text-gray-900 mt-0.5">Next.js 16 + PostgreSQL</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center pt-2">
                © {new Date().getFullYear()} Leoni Mattia — Tutti i diritti riservati.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Aggiornamenti Software */}
        <TabsContent value="aggiornamenti">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                    Aggiornamenti Software
                  </CardTitle>
                  <CardDescription>
                    Verifica e installa le nuove versioni del gestionale direttamente da GitHub senza perdere alcun dato contabile.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={controllaAggiornamenti}
                  disabled={verificandoAggiornamenti || applicandoAggiornamento}
                >
                  {verificandoAggiornamenti ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifica in corso...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verifica Aggiornamenti
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Protezione database banner */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Protezione Totale dei Dati:</strong> Gli aggiornamenti modificano esclusivamente il codice del gestionale (nuove funzioni, calcoli, miglioramenti grafici). Il database PostgreSQL con tutte le fatture, anagrafiche e pagamenti è conservato su un volume isolato e <strong>non viene mai toccato né cancellato</strong>.
                </div>
              </div>

              {/* Box Stato versione */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Versione Installata</p>
                  <p className="text-lg font-mono font-bold text-gray-900 mt-1">
                    {statoAggiornamento?.versioneCorrente || 'v1.1.0'}
                  </p>
                  {statoAggiornamento?.dataVersione && (
                    <p className="text-xs text-gray-500 mt-0.5">{statoAggiornamento.dataVersione}</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Ramo Attivo</p>
                  <p className="text-lg font-mono font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                    <GitBranch className="h-4 w-4 text-blue-600" />
                    {statoAggiornamento?.branch || 'main'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Produzione</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Stato del Sistema</p>
                  <div className="mt-1">
                    {statoAggiornamento?.aggiornamentoDisponibile ? (
                      <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                        Aggiornamento Disponibile
                      </Badge>
                    ) : statoAggiornamento?.configurato ? (
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                        Sistema Aggiornato
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        In attesa di verifica
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {statoAggiornamento?.ultimoControllo ? `Controllato alle ${new Date(statoAggiornamento.ultimoControllo).toLocaleTimeString('it-IT')}` : 'Premi "Verifica Aggiornamenti"'}
                  </p>
                </div>
              </div>

              {/* Se c'è aggiornamento disponibile */}
              {statoAggiornamento?.aggiornamentoDisponibile && (
                <div className="p-5 border-2 border-blue-200 bg-blue-50/60 rounded-xl space-y-4">
                  <div className="flex items-start gap-3">
                    <ArrowUpCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-blue-950">
                        🚀 È disponibile una nuova versione ({statoAggiornamento.nuoviCommit} commit più recente)
                      </h4>
                      <p className="text-sm text-blue-800 mt-1">
                        <strong>Novità:</strong> {statoAggiornamento.messaggioNuovaVersione}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={applicaAggiornamento}
                      disabled={applicandoAggiornamento}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
                    >
                      {applicandoAggiornamento ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Installazione aggiornamento in corso...
                        </>
                      ) : (
                        <>
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Aggiorna Gestionale Ora
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Log di avanzamento se in corso */}
              {applicandoAggiornamento && (
                <div className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-lg space-y-1">
                  <p className="text-gray-400"># Avanzamento aggiornamento:</p>
                  {dettagliAggiornamento.map((r, i) => (
                    <p key={i}>{r}</p>
                  ))}
                  <div className="flex items-center gap-2 text-white pt-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Download e ricompilazione in corso, attendere circa 30-40 secondi...</span>
                  </div>
                </div>
              )}

              {/* Se non configurato git */}
              {statoAggiornamento?.configurato === false && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                  <strong>Nota:</strong> {statoAggiornamento.errore || 'Collega il gestionale a GitHub per attivare gli aggiornamenti automatici dal web.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
