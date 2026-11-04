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
  Mail,
  Send,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
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
import { ControlloNumerazioneModal } from '@/components/fatture/ControlloNumerazioneModal'
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

  // Configurazione Email & SMTP
  const [smtp, setSmtp] = React.useState({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'infooizut@gmail.com',
    pass: '',
    from: '"Dott. Antonio Tuzio" <infooizut@gmail.com>',
    hasPassword: false,
    isConfigured: false,
  })
  const [mostraPasswordSmtp, setMostraPasswordSmtp] = React.useState(false)
  const [salvandoSmtp, setSalvandoSmtp] = React.useState(false)
  const [testEmail, setTestEmail] = React.useState('infooizut@gmail.com')
  const [testandoSmtp, setTestandoSmtp] = React.useState(false)
  const [esitoTestSmtp, setEsitoTestSmtp] = React.useState<{ success?: boolean; message?: string } | null>(null)

  const applicaPresetGmail = () => {
    setSmtp((prev) => ({
      ...prev,
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: studio.email || prev.user || 'infooizut@gmail.com',
      from: studio.denominazione ? `"${studio.denominazione}" <${studio.email || prev.user || 'infooizut@gmail.com'}>` : '"Dott. Antonio Tuzio" <infooizut@gmail.com>',
    }))
    toast({ title: 'Configurazione Gmail applicata', description: 'Inserisci la password per le app a 16 caratteri e salva.' })
  }

  const applicaPresetAruba = () => {
    setSmtp((prev) => ({
      ...prev,
      host: 'smtps.aruba.it',
      port: 465,
      secure: true,
    }))
    toast({ title: 'Configurazione Aruba applicata', description: 'Verifica utente e password della tua casella Aruba.' })
  }

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
      const [resStudio, resNum, resSmtp] = await Promise.all([
        fetch('/api/impostazioni/emittente'),
        fetch('/api/impostazioni/numerazione'),
        fetch('/api/impostazioni/smtp'),
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

      if (resSmtp.ok) {
        const dSmtp = await resSmtp.json()
        setSmtp({
          host: dSmtp.host || 'smtp.gmail.com',
          port: dSmtp.port || 465,
          secure: dSmtp.secure !== undefined ? dSmtp.secure : true,
          user: dSmtp.user || 'infooizut@gmail.com',
          pass: '',
          from: dSmtp.from || '"Dott. Antonio Tuzio" <infooizut@gmail.com>',
          hasPassword: dSmtp.hasPassword,
          isConfigured: dSmtp.isConfigured,
        })
        if (dSmtp.user) {
          setTestEmail(dSmtp.user)
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

  const handleSalvaSmtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoSmtp(true)
    try {
      const res = await fetch('/api/impostazioni/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtp),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: '✅ Impostazioni SMTP salvate con successo' })
      setSmtp((prev) => ({
        ...prev,
        pass: '',
        hasPassword: dati.hasPassword,
        isConfigured: dati.isConfigured,
      }))
    } catch (e: any) {
      toast({ title: 'Errore salvataggio SMTP', description: e.message, variant: 'destructive' })
    } finally {
      setSalvandoSmtp(false)
    }
  }

  const handleTestSmtp = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({ title: 'Inserisci un indirizzo email di prova valido', variant: 'destructive' })
      return
    }

    setTestandoSmtp(true)
    setEsitoTestSmtp(null)
    try {
      const res = await fetch('/api/impostazioni/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testEmail,
          config: smtp.pass ? smtp : undefined,
        }),
      })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error || 'Errore durante il test')
      setEsitoTestSmtp({ success: true, message: dati.message })
      toast({ title: '✅ Test riuscito!', description: 'Controlla la casella di posta specificata.' })
    } catch (e: any) {
      setEsitoTestSmtp({ success: false, message: e.message })
      toast({ title: '❌ Test fallito', description: e.message, variant: 'destructive' })
    } finally {
      setTestandoSmtp(false)
    }
  }

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
          <TabsTrigger value="email" className="flex items-center gap-1.5">
            <Mail className="h-4 w-4" /> Email &amp; Posta (SMTP)
          </TabsTrigger>
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
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-blue-600" />
                    Contatore e Sequenza Numerazione Fatture
                  </CardTitle>
                  <CardDescription>
                    Se prima di iniziare a usare questo gestionale hai già emesso fatture quest'anno con un altro software, puoi impostare qui il contatore di partenza.
                  </CardDescription>
                </div>
                <ControlloNumerazioneModal />
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

        {/* TAB: Email & Posta (SMTP) */}
        <TabsContent value="email" className="space-y-6">
          <Card className={smtp.isConfigured ? 'border-green-200' : 'border-amber-200'}>
            <CardHeader className={smtp.isConfigured ? 'bg-green-50/50 border-b border-green-100' : 'bg-amber-50/50 border-b border-amber-100'}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className={`h-5 w-5 ${smtp.isConfigured ? 'text-green-600' : 'text-amber-600'}`} />
                    Configurazione Server di Posta (SMTP)
                  </CardTitle>
                  <CardDescription>
                    Consente di trasmettere direttamente dal programma le fatture elettroniche di cortesia e gli avvisi di parcella ai clienti con il PDF allegato.
                  </CardDescription>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                    smtp.isConfigured
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {smtp.isConfigured ? '✅ SMTP Attivo (Invio Diretto con PDF)' : '⚠️ Da Configurare (Attualmente usa mailto)'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Presets rapidi */}
              <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Impostazione rapida automatica:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applicaPresetGmail}
                  className="text-xs h-8 bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  ⚡ Gmail (smtp.gmail.com - porta 465 SSL)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applicaPresetAruba}
                  className="text-xs h-8 bg-white text-orange-700 border-orange-200 hover:bg-orange-50"
                >
                  ⚡ Aruba Mail (smtps.aruba.it - porta 465 SSL)
                </Button>
              </div>

              {/* Form Configurazione */}
              <form onSubmit={handleSalvaSmtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpHost">Server SMTP (Host)</Label>
                    <Input
                      id="smtpHost"
                      value={smtp.host}
                      onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-gray-500">Es. smtp.gmail.com o smtps.aruba.it</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="smtpPort">Porta</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={smtp.port}
                      onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value) || 465 })}
                      placeholder="465"
                      className="font-mono text-sm"
                    />
                    <span className="text-[11px] text-gray-500">465 (SSL) oppure 587 (TLS/STARTTLS)</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="smtpSecure">Crittografia SSL / TLS</Label>
                    <Select
                      value={smtp.secure ? 'true' : 'false'}
                      onValueChange={(val) => setSmtp({ ...smtp, secure: val === 'true' })}
                    >
                      <SelectTrigger id="smtpSecure">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">SSL / TLS (Consigliato per porta 465)</SelectItem>
                        <SelectItem value="false">STARTTLS / Non sicura (porta 587 o 25)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtpUser">Indirizzo Email / Utente</Label>
                    <Input
                      id="smtpUser"
                      type="email"
                      value={smtp.user}
                      onChange={(e) => setSmtp({ ...smtp, user: e.target.value })}
                      placeholder="infooizut@gmail.com"
                    />
                    <span className="text-[11px] text-gray-500">L'indirizzo email della casella dello studio</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smtpPass">
                        Password / Password per le App
                      </Label>
                      {smtp.hasPassword && (
                        <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                          Password già impostata
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="smtpPass"
                        type={mostraPasswordSmtp ? 'text' : 'password'}
                        value={smtp.pass}
                        onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })}
                        placeholder={smtp.hasPassword ? '•••••••••••••••• (lascia vuoto per non cambiarla)' : 'Inserisci la password di 16 caratteri'}
                        className="font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostraPasswordSmtp(!mostraPasswordSmtp)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {mostraPasswordSmtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      Per Gmail inserire la "Password per le app" a 16 caratteri (vedi riquadro in basso).
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="smtpFrom">Intestazione e Nome Mittente visualizzato</Label>
                  <Input
                    id="smtpFrom"
                    value={smtp.from}
                    onChange={(e) => setSmtp({ ...smtp, from: e.target.value })}
                    placeholder='"Dott. Antonio Tuzio" <infooizut@gmail.com>'
                  />
                  <span className="text-[11px] text-gray-500">
                    Come appare il mittente nella casella di posta dei clienti (es. "Dott. Antonio Tuzio" &lt;infooizut@gmail.com&gt;)
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={salvandoSmtp} className="bg-blue-600 hover:bg-blue-700">
                    {salvandoSmtp ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio in corso...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Salva Configurazione Email
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Card Test Invio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                Test Connessione &amp; Invio Email di Prova
              </CardTitle>
              <CardDescription>
                Verifica che i dati e la password inseriti funzionino correttamente senza dover attendere di emettere una fattura reale.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="testEmailDest">Invia email di prova a:</Label>
                  <Input
                    id="testEmailDest"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="infooizut@gmail.com"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestSmtp}
                  disabled={testandoSmtp}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {testandoSmtp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifica connessione in corso...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Invia Email di Test
                    </>
                  )}
                </Button>
              </div>

              {esitoTestSmtp && (
                <div
                  className={`p-4 rounded-lg border text-sm ${
                    esitoTestSmtp.success
                      ? 'bg-green-50 border-green-200 text-green-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {esitoTestSmtp.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {esitoTestSmtp.success ? 'Connessione Riuscita!' : 'Errore di connessione'}
                      </p>
                      <p className="mt-0.5 text-xs opacity-90">{esitoTestSmtp.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Guida Gmail Password per le app */}
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <Key className="h-4 w-4 text-blue-600" />
                Guida Rapida: Come creare la "Password per le app" per Gmail ({smtp.user || 'infooizut@gmail.com'})
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-700 space-y-2">
              <p>
                Google <strong>non consente più</strong> l'accesso SMTP diretto con la solita password della casella email a causa della verifica a due fattori (2FA). È necessario creare un codice di accesso dedicato a 16 caratteri:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 pl-1 pt-1 font-sans">
                <li>
                  Accedi a <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center gap-0.5">Google Sicurezza Account <ExternalLink className="h-3 w-3" /></a> con l'account <code>{smtp.user || 'infooizut@gmail.com'}</code>.
                </li>
                <li>
                  Assicurati che la <strong>Verifica in due passaggi</strong> sia attiva.
                </li>
                <li>
                  Nella barra di ricerca in alto scrivi <strong>"Password per le app"</strong> (oppure cercala dentro la sezione <i>Verifica in due passaggi</i> in fondo alla pagina).
                </li>
                <li>
                  Inserisci come nome <code>Gestionale Studio</code> e clicca su <strong>Crea</strong>.
                </li>
                <li>
                  Google ti mostrerà un codice giallo di 16 lettere (es. <code>abcd efgh ijkl mnop</code>): selezionalo, incollalo nel campo <strong>Password</strong> qui sopra e clicca <strong>Salva Configurazione Email</strong>.
                </li>
              </ol>
            </CardContent>
          </Card>
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
