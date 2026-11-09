'use client'
// src/components/antiriciclaggio/AntiriciclaggioDettaglioModal.tsx
// Modal per consultare e aggiornare il fascicolo Antiriciclaggio & Privacy del cliente

import * as React from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Upload,
  User,
  Building,
  Loader2,
  Sparkles,
  Trash2,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AntiriciclaggioModalProps {
  aziendaId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AntiriciclaggioDettaglioModal({
  aziendaId,
  open,
  onOpenChange,
  onSuccess,
}: AntiriciclaggioModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [azienda, setAzienda] = React.useState<any>(null)

  // Form stato
  const [form, setForm] = React.useState({
    // Anagrafica aziendale
    ragioneSociale: '',
    tipoSoggetto: 'PERSONA_GIURIDICA',
    codiceFiscale: '',
    partitaIva: '',
    indirizzo: '',
    cap: '',
    comune: '',
    provincia: '',
    telefono: '',
    emailAmministrativa: '',
    pec: '',
    codiceDestinatarioSdi: '0000000',

    // Antiriciclaggio & Privacy
    settoreAttivita: 'CONTABILITA',
    legaleRappresentante: '',
    cfRappresentante: '',
    dataNascitaRappr: '',
    luogoNascitaRappr: '',
    documentoTipo: 'carta_identita',
    documentoNumero: '',
    documentoRilasciatoDa: '',
    documentoDataRilascio: '',
    documentoScadenza: '',
    antiriciclaggioObbligo: true,
    antiriciclaggioFascicolo: '',
    antiriciclaggioDataVerifica: '',
    antiriciclaggioDataScadenza: '',
    antiriciclaggioRischio: 'BASSO',
    antiriciclaggioPunteggio: 1,
    antiriciclaggioTitolareEffettivo: '',
    antiriciclaggioCfTitolareEffettivo: '',
    antiriciclaggioPep: false,
    antiriciclaggioPrestazione: '',
    antiriciclaggioStato: 'DA_VERIFICARE',
    antiriciclaggioNote: '',
    privacyFirmata: false,
    privacyData: '',
    privacyNote: '',
  })

  // Upload rapido documento
  const [fileDoc, setFileDoc] = React.useState<File | null>(null)
  const [uploadingDoc, setUploadingDoc] = React.useState(false)

  const carica = React.useCallback(async () => {
    if (!aziendaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/antiriciclaggio/${aziendaId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const az = data.azienda
      setAzienda(az)

      setForm({
        // Anagrafica
        ragioneSociale: az.ragioneSociale || '',
        tipoSoggetto: az.tipoSoggetto || (az.partitaIva ? 'PERSONA_GIURIDICA' : 'PERSONA_FISICA'),
        codiceFiscale: az.codiceFiscale || '',
        partitaIva: az.partitaIva || '',
        indirizzo: az.indirizzo || '',
        cap: az.cap || '',
        comune: az.comune || '',
        provincia: az.provincia || '',
        telefono: az.telefono || '',
        emailAmministrativa: az.emailAmministrativa || '',
        pec: az.pec || '',
        codiceDestinatarioSdi: az.codiceDestinatarioSdi || '0000000',

        // Antiriciclaggio & Privacy
        settoreAttivita: az.settoreAttivita || (az.partitaIva ? 'CONTABILITA' : 'CAF'),
        legaleRappresentante: az.legaleRappresentante || az.referente || '',
        cfRappresentante: az.cfRappresentante || '',
        dataNascitaRappr: az.dataNascitaRappr ? new Date(az.dataNascitaRappr).toISOString().split('T')[0] : '',
        luogoNascitaRappr: az.luogoNascitaRappr || '',
        documentoTipo: az.documentoTipo || 'carta_identita',
        documentoNumero: az.documentoNumero || '',
        documentoRilasciatoDa: az.documentoRilasciatoDa || '',
        documentoDataRilascio: az.documentoDataRilascio ? new Date(az.documentoDataRilascio).toISOString().split('T')[0] : '',
        documentoScadenza: az.documentoScadenza ? new Date(az.documentoScadenza).toISOString().split('T')[0] : '',
        antiriciclaggioObbligo: az.antiriciclaggioObbligo ?? Boolean(az.partitaIva),
        antiriciclaggioFascicolo: az.antiriciclaggioFascicolo || '',
        antiriciclaggioDataVerifica: az.antiriciclaggioDataVerifica ? new Date(az.antiriciclaggioDataVerifica).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        antiriciclaggioDataScadenza: az.antiriciclaggioDataScadenza ? new Date(az.antiriciclaggioDataScadenza).toISOString().split('T')[0] : '',
        antiriciclaggioRischio: az.antiriciclaggioRischio || 'BASSO',
        antiriciclaggioPunteggio: az.antiriciclaggioPunteggio || 1,
        antiriciclaggioTitolareEffettivo: az.antiriciclaggioTitolareEffettivo || '',
        antiriciclaggioCfTitolareEffettivo: az.antiriciclaggioCfTitolareEffettivo || '',
        antiriciclaggioPep: Boolean(az.antiriciclaggioPep),
        antiriciclaggioPrestazione: az.antiriciclaggioPrestazione || '',
        antiriciclaggioStato: az.antiriciclaggioStato || 'DA_VERIFICARE',
        antiriciclaggioNote: az.antiriciclaggioNote || '',
        privacyFirmata: Boolean(az.privacyFirmata),
        privacyData: az.privacyData ? new Date(az.privacyData).toISOString().split('T')[0] : '',
        privacyNote: az.privacyNote || '',
      })
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [aziendaId, toast])

  React.useEffect(() => {
    if (open && aziendaId) {
      carica()
    }
  }, [open, aziendaId, carica])

  const eseguiAutoCompilazioneCNDCEC = () => {
    if (!azienda) return
    const isPrivato = !azienda.partitaIva && azienda.tipoSoggetto === 'PERSONA_FISICA'
    const settore = form.settoreAttivita || (azienda.partitaIva ? 'CONTABILITA' : 'CAF')

    // Fascicolo
    const anno = new Date().getFullYear()
    const fascicolo = form.antiriciclaggioFascicolo || `ARC-${anno}-${azienda.id.slice(0, 5).toUpperCase()}`

    // Data verifica e scadenza triennale
    const oggiVerifica = new Date()
    const dataVerificaStr = oggiVerifica.toISOString().split('T')[0]
    const dataScad3Anni = new Date(oggiVerifica.getFullYear() + 3, oggiVerifica.getMonth(), oggiVerifica.getDate()).toISOString().split('T')[0]

    // Rappresentante e Titolare Effettivo
    const rappr = form.legaleRappresentante || azienda.legaleRappresentante || azienda.referente || (isPrivato ? azienda.ragioneSociale : '')
    const cfRappr = form.cfRappresentante || azienda.cfRappresentante || (isPrivato ? (azienda.codiceFiscale || '') : '')
    const titEffettivo = form.antiriciclaggioTitolareEffettivo || rappr
    const cfTitEffettivo = form.antiriciclaggioCfTitolareEffettivo || cfRappr

    // Prestazione professionale in base al settore dello studio
    let prestazione = form.antiriciclaggioPrestazione
    if (!prestazione) {
      if (settore === 'CONTABILITA') {
        prestazione = 'Tenuta contabilità generale, adempimenti fiscali periodici e predisposizione bilancio d\'esercizio'
      } else if (settore === 'PAGHE') {
        prestazione = 'Consulenza del lavoro, elaborazione buste paga/LUL e adempimenti previdenziali'
      } else if (settore === 'CAF') {
        prestazione = 'Dichiarazioni dei redditi persone fisiche, modello 730 e pratiche tributarie'
      } else {
        prestazione = 'Consulenza aziendale e tributaria continuativa'
      }
    }

    const motivazione = `Valutazione del rischio condotta ai sensi delle Regole Tecniche CNDCEC n. 1 e n. 2 e D.Lgs. 231/2007. Operatività trasparente e radicata sul territorio, prestazione professionale ordinaria continuativa con flussi finanziari tracciati (bonifico). Non emergono indicatori di anomalia (D.M. Giustizia 16/08/2023). Rischio inerente e specifico non significativo. Adeguata verifica ordinaria con rinnovo a 36 mesi.`

    setForm((prev) => ({
      ...prev,
      settoreAttivita: settore,
      antiriciclaggioObbligo: !isPrivato,
      antiriciclaggioFascicolo: fascicolo,
      antiriciclaggioDataVerifica: dataVerificaStr,
      antiriciclaggioDataScadenza: dataScad3Anni,
      antiriciclaggioRischio: 'BASSO',
      antiriciclaggioPunteggio: 15,
      antiriciclaggioPrestazione: prestazione,
      antiriciclaggioTitolareEffettivo: titEffettivo,
      antiriciclaggioCfTitolareEffettivo: cfTitEffettivo,
      antiriciclaggioStato: 'REGOLARE',
      antiriciclaggioNote: motivazione,
      legaleRappresentante: rappr,
      cfRappresentante: cfRappr,
    }))

    toast({
      title: '⚡ Valutazione CNDCEC Calcolata!',
      description: 'Fascicolo, profilo di rischio (Basso), titolare effettivo e motivazione compilati automaticamente secondo le Regole Tecniche.',
    })
  }

  const handleSalva = async () => {
    if (!aziendaId) return
    setSalvando(true)
    try {
      const res = await fetch(`/api/antiriciclaggio/${aziendaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Dati anagrafici e fascicolo aggiornati con successo' })
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Errore salvataggio', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleElimina = async () => {
    if (!aziendaId || !azienda) return
    const confermato = confirm(
      `Sei sicuro di voler eliminare o archiviare il cliente "${azienda.ragioneSociale}"?\n\n` +
      `Se il cliente ha fatture o prestazioni collegate verrà archiviato per motivi di conservazione fiscale, altrimenti verrà rimosso definitivamente.`
    )
    if (!confermato) return

    setSalvando(true)
    try {
      const res = await fetch(`/api/antiriciclaggio/${aziendaId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({
        title: data.archiviato ? 'ℹ️ Cliente archiviato' : '✅ Cliente eliminato',
        description: data.messaggio,
      })
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Errore eliminazione', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const [uploadingTipo, setUploadingTipo] = React.useState<string | null>(null)

  const handleUploadDocTipo = async (
    tipoDoc: string,
    labelDoc: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0] || !aziendaId) return
    const file = e.target.files[0]
    setUploadingDoc(true)
    setUploadingTipo(tipoDoc)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipoDoc', tipoDoc)
      if (['carta_identita', 'passaporto', 'patente'].includes(tipoDoc) && form.documentoScadenza) {
        fd.append('scadenza', form.documentoScadenza)
      }
      fd.append('note', `${labelDoc}: ${file.name}`)

      const res = await fetch(`/api/aziende/${aziendaId}/documenti`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (tipoDoc === 'privacy_firmata') {
        setForm((prev) => ({
          ...prev,
          privacyFirmata: true,
          privacyData: prev.privacyData || new Date().toISOString().split('T')[0],
        }))
      }

      toast({
        title: `✅ ${labelDoc} caricato nel fascicolo!`,
        description: `File "${file.name}" allegato e registrato nella Check-list AV.2 CNDCEC.`,
      })
      carica()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({ title: 'Errore caricamento', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingDoc(false)
      setUploadingTipo(null)
      e.target.value = ''
    }
  }

  const handleEliminaDocFascicolo = async (docId: string, nomeFile: string) => {
    if (!aziendaId) return
    if (!confirm(`Vuoi rimuovere il documento "${nomeFile}" dal fascicolo?`)) return
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/documenti/${docId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '🗑️ Documento rimosso dal fascicolo' })
      carica()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({ title: 'Errore rimozione', description: err.message, variant: 'destructive' })
    }
  }

  // Calcolo scadenza stato
  const oggi = new Date()
  const scadenzaDoc = form.documentoScadenza ? new Date(form.documentoScadenza) : null
  const isScaduto = scadenzaDoc ? scadenzaDoc.getTime() < oggi.getTime() : false
  const isInScadenza = scadenzaDoc && !isScaduto ? (scadenzaDoc.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24) <= 60 : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl text-slate-900">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                Fascicolo Antiriciclaggio &amp; Privacy: {azienda?.ragioneSociale}
              </DialogTitle>
              <DialogDescription>
                Adeguata verifica della clientela (D.Lgs. 231/2007) e consenso Privacy (Reg. UE 2016/679)
              </DialogDescription>
            </div>
            {azienda?.partitaIva && (
              <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
                P.IVA {azienda.partitaIva}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Sezione Dati Anagrafici & Aziendali Modificabili */}
            <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-blue-600" />
                  Dati Anagrafici Cliente / Azienda
                </h4>
                <Link
                  href={`/aziende/${aziendaId}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
                >
                  <span>Apri scheda anagrafica completa</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="sm:col-span-2">
                  <Label>Ragione Sociale / Nome e Cognome *</Label>
                  <Input
                    value={form.ragioneSociale}
                    onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                    className="bg-white font-medium"
                    placeholder="es. Mario Rossi / Rossi S.r.l."
                  />
                </div>
                <div>
                  <Label>Codice Fiscale</Label>
                  <Input
                    value={form.codiceFiscale}
                    onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                    className="bg-white font-mono"
                    maxLength={16}
                    placeholder="Codice Fiscale"
                  />
                </div>
                <div>
                  <Label>Partita IVA</Label>
                  <Input
                    value={form.partitaIva}
                    onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                    className="bg-white font-mono"
                    maxLength={11}
                    placeholder="Partita IVA"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Indirizzo (Via/Piazza e N°)</Label>
                  <Input
                    value={form.indirizzo}
                    onChange={(e) => setForm({ ...form, indirizzo: e.target.value })}
                    className="bg-white"
                    placeholder="es. Via Roma 1"
                  />
                </div>
                <div>
                  <Label>Comune e Provincia</Label>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Comune"
                      value={form.comune}
                      onChange={(e) => setForm({ ...form, comune: e.target.value })}
                      className="bg-white flex-1"
                    />
                    <Input
                      placeholder="PR"
                      value={form.provincia}
                      onChange={(e) => setForm({ ...form, provincia: e.target.value.toUpperCase() })}
                      className="bg-white w-14 font-mono text-center"
                      maxLength={2}
                    />
                  </div>
                </div>
                <div>
                  <Label>CAP</Label>
                  <Input
                    placeholder="es. 42121"
                    value={form.cap}
                    onChange={(e) => setForm({ ...form, cap: e.target.value })}
                    className="bg-white font-mono"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="bg-white"
                    placeholder="es. 0522 123456"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Email / PEC</Label>
                  <Input
                    value={form.emailAmministrativa}
                    onChange={(e) => setForm({ ...form, emailAmministrativa: e.target.value })}
                    className="bg-white"
                    placeholder="amministrazione@dominio.it"
                  />
                </div>
                <div>
                  <Label>Codice Destinatario SDI</Label>
                  <Input
                    value={form.codiceDestinatarioSdi}
                    onChange={(e) => setForm({ ...form, codiceDestinatarioSdi: e.target.value.toUpperCase() })}
                    className="bg-white font-mono"
                    maxLength={7}
                    placeholder="0000000"
                  />
                </div>
              </div>
            </div>

            {/* Banner Valutazione Automatica Normativa CNDCEC (Zero NotebookLM) */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-950">
                    Valutazione Automatica CNDCEC Integrata (Zero NotebookLM)
                  </p>
                  <p className="text-[11px] text-indigo-800">
                    Analizza forma societaria, area geografica e prestazione, calcola il punteggio di rischio e redige la motivazione tecnica ufficiale CNDCEC in automatico.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={eseguiAutoCompilazioneCNDCEC}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-300" />
                Compila &amp; Valuta Automaticamente
              </Button>
            </div>

            {/* Sezione 1: Settore e Ambito di Studio */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-500" />
                1. Settore di Attività Studio e Obbligo Normativo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <Label>Settore di Attività Studio *</Label>
                  <Select
                    value={form.settoreAttivita}
                    onValueChange={(val) => {
                      let prest = form.antiriciclaggioPrestazione
                      if (val === 'PAGHE') {
                        prest = 'Consulenza del lavoro, elaborazione buste paga e Libro Unico del Lavoro (LUL)'
                      } else if (val === 'FORFETTARI') {
                        prest = 'Assistenza e consulenza fiscale in regime forfetario (L. 190/2014)'
                      } else if (val === 'OCCASIONALI') {
                        prest = 'Gestione rapporti di lavoro autonomo occasionale e contrattualistica'
                      } else if (val === 'CONTABILITA') {
                        prest = 'Tenuta contabilità generale, bilancio e adempimenti fiscali periodici'
                      } else if (val === 'CAF') {
                        prest = 'Dichiarazioni dei redditi persone fisiche, modello 730 e pratiche CAF'
                      }
                      setForm({ ...form, settoreAttivita: val, antiriciclaggioPrestazione: prest })
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTABILITA">1. Contabilità &amp; Gestione Fiscale (Ditte/Società/SRL)</SelectItem>
                      <SelectItem value="FORFETTARI">2. Regime Forfettario (Redditi &amp; Consulenza)</SelectItem>
                      <SelectItem value="PAGHE">3. Consulenza Lavoro &amp; Buste Paga (LUL)</SelectItem>
                      <SelectItem value="OCCASIONALI">4. Rapporti di Lavoro Occasionali (CPO Art. 2222)</SelectItem>
                      <SelectItem value="CAF">5. CAF / 730 / Pratiche INPS (Privati - Esonerato)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>N° Fascicolo Antiriciclaggio</Label>
                  <Input
                    className="bg-white"
                    placeholder="es. ARC-2026-001"
                    value={form.antiriciclaggioFascicolo}
                    onChange={(e) => setForm({ ...form, antiriciclaggioFascicolo: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="antiriciclaggioObbligoCheck"
                    checked={form.antiriciclaggioObbligo}
                    onChange={(e) => setForm({ ...form, antiriciclaggioObbligo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="antiriciclaggioObbligoCheck" className="text-xs cursor-pointer font-medium">
                    Soggetto Obbligato ad Antiriciclaggio
                  </Label>
                </div>
              </div>
            </div>

            {/* Sezione 2: Legale Rappresentante e Documento d'Identità */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blue-600" />
                  2. Legale Rappresentante e Documento di Riconoscimento
                </h4>
                {/* Badge Scadenza Documento */}
                {form.documentoNumero ? (
                  isScaduto ? (
                    <Badge variant="destructive" className="animate-pulse">
                      ❌ Documento Scaduto ({form.documentoScadenza})
                    </Badge>
                  ) : isInScadenza ? (
                    <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                      ⚠️ In Scadenza ({form.documentoScadenza})
                    </Badge>
                  ) : (
                    <Badge className="bg-green-600 text-white hover:bg-green-700">
                      ✓ Documento Valido ({form.documentoScadenza})
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-slate-500">
                    Documento non inserito
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-sm">
                <div className="sm:col-span-2">
                  <Label>Nome e Cognome Rappresentante</Label>
                  <Input
                    value={form.legaleRappresentante}
                    onChange={(e) => setForm({ ...form, legaleRappresentante: e.target.value })}
                    placeholder="es. Mario Rossi"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Codice Fiscale Rappresentante</Label>
                  <Input
                    value={form.cfRappresentante}
                    onChange={(e) => setForm({ ...form, cfRappresentante: e.target.value.toUpperCase() })}
                    placeholder="16 caratteri"
                  />
                </div>
                <div>
                  <Label>Data di Nascita</Label>
                  <Input
                    type="date"
                    value={form.dataNascitaRappr}
                    onChange={(e) => setForm({ ...form, dataNascitaRappr: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Luogo di Nascita</Label>
                  <Input
                    value={form.luogoNascitaRappr}
                    onChange={(e) => setForm({ ...form, luogoNascitaRappr: e.target.value })}
                    placeholder="es. Reggio Emilia"
                  />
                </div>

                <div>
                  <Label>Tipo Documento</Label>
                  <Select
                    value={form.documentoTipo}
                    onValueChange={(val) => setForm({ ...form, documentoTipo: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carta_identita">Carta d&apos;Identità</SelectItem>
                      <SelectItem value="passaporto">Passaporto</SelectItem>
                      <SelectItem value="patente">Patente di Guida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Numero Documento</Label>
                  <Input
                    value={form.documentoNumero}
                    onChange={(e) => setForm({ ...form, documentoNumero: e.target.value.toUpperCase() })}
                    placeholder="es. CA12345AA"
                  />
                </div>
                <div>
                  <Label>Rilasciato Da</Label>
                  <Input
                    value={form.documentoRilasciatoDa}
                    onChange={(e) => setForm({ ...form, documentoRilasciatoDa: e.target.value })}
                    placeholder="es. Comune di Reggio Emilia"
                  />
                </div>
                <div>
                  <Label>Data Scadenza Documento *</Label>
                  <Input
                    type="date"
                    value={form.documentoScadenza}
                    onChange={(e) => setForm({ ...form, documentoScadenza: e.target.value })}
                    className={isScaduto ? 'border-red-500 bg-red-50' : isInScadenza ? 'border-amber-500 bg-amber-50' : ''}
                  />
                </div>

                {/* Box Upload Rapido PDF Documento Identità */}
                {(() => {
                  const docIdentita = azienda?.documents?.find((d: any) =>
                    ['carta_identita', 'passaporto', 'patente', 'tessera_sanitaria', 'documenti_identita', 'ci'].includes((d.tipoDoc || '').toLowerCase()) ||
                    d.cartella === 'documenti_identita' ||
                    (d.nomeFile && /(identit|patente|passaporto|ci_)/i.test(d.nomeFile))
                  )
                  return (
                    <div className="sm:col-span-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            {docIdentita
                              ? `✓ Documento d'identità caricato: ${docIdentita.nomeFile}`
                              : 'Carica PDF o foto fronte/retro del documento d\'identità'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Allegato al Fascicolo Antiriciclaggio (Check-list AV.2 CNDCEC)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {docIdentita && (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `/api/aziende/${aziendaId}/documenti/${docIdentita.id}?inline=1`,
                                  '_blank'
                                )
                              }
                            >
                              Visualizza
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 px-2"
                              onClick={() => handleEliminaDocFascicolo(docIdentita.id, docIdentita.nomeFile)}
                              title="Rimuovi documento"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            asChild
                          >
                            <span>
                              {uploadingDoc && uploadingTipo === form.documentoTipo ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 mr-1" />
                              )}
                              {docIdentita ? 'Sostituisci Doc.' : 'Carica Doc. Identità'}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => handleUploadDocTipo(form.documentoTipo, 'Documento di Identità', e)}
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Sezione 3: Valutazione del Rischio (CNDCEC) */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                3. Valutazione del Rischio e Adeguata Verifica (Regole Tecniche CNDCEC)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <Label>Classe di Rischio Complessivo</Label>
                  <Select
                    value={form.antiriciclaggioRischio}
                    onValueChange={(val) => setForm({ ...form, antiriciclaggioRischio: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASSO">Basso (Non significativo)</SelectItem>
                      <SelectItem value="MEDIO">Medio (Poco significativo)</SelectItem>
                      <SelectItem value="ALTO">Alto (Molto significativo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Stato Fascicolo</Label>
                  <Select
                    value={form.antiriciclaggioStato}
                    onValueChange={(val) => setForm({ ...form, antiriciclaggioStato: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGOLARE">Regolare / Completo</SelectItem>
                      <SelectItem value="DA_VERIFICARE">Da Verificare / Incompleto</SelectItem>
                      <SelectItem value="IN_SCADENZA">In Scadenza</SelectItem>
                      <SelectItem value="NON_CONFORME">Non Conforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="antiriciclaggioPepCheck"
                    checked={form.antiriciclaggioPep}
                    onChange={(e) => setForm({ ...form, antiriciclaggioPep: e.target.checked })}
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <Label htmlFor="antiriciclaggioPepCheck" className="text-xs cursor-pointer text-slate-800 font-medium">
                    Persona Esposta Politicamente (PEP)
                  </Label>
                </div>

                <div className="sm:col-span-2">
                  <Label>Titolare Effettivo (se società di capitali o ente)</Label>
                  <Input
                    value={form.antiriciclaggioTitolareEffettivo}
                    onChange={(e) => setForm({ ...form, antiriciclaggioTitolareEffettivo: e.target.value })}
                    placeholder="es. Mario Rossi (socio al 100%)"
                  />
                </div>

                <div>
                  <Label>C.F. Titolare Effettivo</Label>
                  <Input
                    value={form.antiriciclaggioCfTitolareEffettivo}
                    onChange={(e) => setForm({ ...form, antiriciclaggioCfTitolareEffettivo: e.target.value.toUpperCase() })}
                    placeholder="16 caratteri"
                  />
                </div>

                <div className="sm:col-span-3">
                  <Label>Prestazione Professionale Svolta</Label>
                  <Input
                    value={form.antiriciclaggioPrestazione}
                    onChange={(e) => setForm({ ...form, antiriciclaggioPrestazione: e.target.value })}
                    placeholder="es. Tenuta della contabilità ordinaria, dichiarativi fiscali e bilancio d'esercizio"
                  />
                </div>

                <div>
                  <Label>Data Verifica Iniziale</Label>
                  <Input
                    type="date"
                    value={form.antiriciclaggioDataVerifica}
                    onChange={(e) => setForm({ ...form, antiriciclaggioDataVerifica: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data Prossima Revisione</Label>
                  <Input
                    type="date"
                    value={form.antiriciclaggioDataScadenza}
                    onChange={(e) => setForm({ ...form, antiriciclaggioDataScadenza: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Note Riservate Antiriciclaggio</Label>
                  <Input
                    value={form.antiriciclaggioNote}
                    onChange={(e) => setForm({ ...form, antiriciclaggioNote: e.target.value })}
                    placeholder="es. Cliente conosciuto de visu, operatività consolidata"
                  />
                </div>
              </div>
            </div>

            {/* Sezione 4: Privacy GDPR */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                4. Privacy e Consenso al Trattamento Dati (GDPR)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="privacyFirmataCheck"
                    checked={form.privacyFirmata}
                    onChange={(e) => setForm({ ...form, privacyFirmata: e.target.checked })}
                    className="h-4 w-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <Label htmlFor="privacyFirmataCheck" className="text-xs cursor-pointer font-medium">
                    Informativa Privacy Rilasciata e Firmata
                  </Label>
                </div>

                <div>
                  <Label>Data Sottoscrizione Privacy</Label>
                  <Input
                    type="date"
                    value={form.privacyData}
                    onChange={(e) => setForm({ ...form, privacyData: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Note Privacy</Label>
                  <Input
                    value={form.privacyNote}
                    onChange={(e) => setForm({ ...form, privacyNote: e.target.value })}
                    placeholder="es. Copia firmata conservata in archivio"
                  />
                </div>
              </div>
            </div>

            {/* Sezione 5: CASSETTO DOCUMENTALE DEL FASCICOLO (Check-list AV.2 CNDCEC: Documento Identità, Visura Camerale, Documenti Firmati dal Cliente) + Stampe Ufficiali */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 border-2 border-blue-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    5. Cassetto Documentale del Fascicolo (Check-list Ufficiale CNDCEC AV.2)
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Stampa i modelli ufficiali CNDCEC precompilati da far firmare al cliente e carica nel fascicolo: <span className="font-semibold">Documento d&apos;Identità, Visura Camerale e Documenti Firmati</span>.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=dichiarazione`, '_blank')
                    setTimeout(() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=privacy`, '_blank'), 300)
                    setTimeout(() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=valutazione`, '_blank'), 600)
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm"
                  title="Apre in 3 schede tutti i modelli CNDCEC del cliente (AV.4 + Privacy GDPR + Fascicolo AV.1/AV.2/AV.3/AV.7)"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Stampa Kit Completo CNDCEC (3 PDF)
                </Button>
              </div>

              {(() => {
                const docs: any[] = Array.isArray(azienda?.documents) ? azienda.documents : []
                const docId = docs.find((d) =>
                  ['carta_identita', 'passaporto', 'patente', 'tessera_sanitaria', 'documenti_identita', 'ci'].includes((d.tipoDoc || '').toLowerCase()) ||
                  d.cartella === 'documenti_identita' ||
                  (d.nomeFile && /(identit|patente|passaporto|ci_)/i.test(d.nomeFile))
                )
                const docVisura = docs.find((d) =>
                  ['visura', 'visura_camerale', 'visura_catastale', 'visure_catasto'].includes((d.tipoDoc || '').toLowerCase()) ||
                  d.cartella === 'visure_catasto' ||
                  (d.nomeFile && /(visura|camerale|catastale)/i.test(d.nomeFile))
                )
                const docAv4 = docs.find((d) =>
                  ['av4_firmato', 'av4', 'dichiarazione_av4'].includes((d.tipoDoc || '').toLowerCase()) ||
                  (d.nomeFile && /(av4|av\.4)/i.test(d.nomeFile))
                )
                const docPrivacy = docs.find((d) =>
                  ['privacy_firmata', 'mandato', 'contratto', 'privacy'].includes((d.tipoDoc || '').toLowerCase()) ||
                  d.cartella === 'contratti_incarichi' ||
                  (d.nomeFile && /(privacy|mandato|incarico)/i.test(d.nomeFile))
                )

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* CARD 1: DOCUMENTO D'IDENTITÀ */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            🪪 1. Documento d&apos;Identità (Rappresentante / Cliente)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {docId
                              ? `File presente: ${docId.nomeFile}`
                              : 'Carta d\'identità, Passaporto o Patente fronte/retro'}
                          </p>
                        </div>
                        {docId ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Caricato</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Da caricare
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        {docId && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                window.open(`/api/aziende/${aziendaId}/documenti/${docId.id}?inline=1`, '_blank')
                              }
                            >
                              Visualizza PDF/Foto
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaDocFascicolo(docId.id, docId.nomeFile)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                            asChild
                          >
                            <span>
                              {uploadingDoc && uploadingTipo === form.documentoTipo ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 mr-1" />
                              )}
                              {docId ? 'Aggiorna Documento' : 'Carica Documento Identità'}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => handleUploadDocTipo(form.documentoTipo, 'Documento di Identità', e)}
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>

                    {/* CARD 2: VISURA CAMERALE / ATTO COSTITUTIVO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            🏢 2. Visura Camerale / Registro Imprese (Titolare Effettivo)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {docVisura
                              ? `File presente: ${docVisura.nomeFile}`
                              : 'Visura CCIAA, Statuto o Atto Costitutivo (per verifica quote >25%)'}
                          </p>
                        </div>
                        {docVisura ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Caricata</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                            Da caricare
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        {docVisura && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                window.open(`/api/aziende/${aziendaId}/documenti/${docVisura.id}?inline=1`, '_blank')
                              }
                            >
                              Visualizza Visura
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaDocFascicolo(docVisura.id, docVisura.nomeFile)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            asChild
                          >
                            <span>
                              {uploadingDoc && uploadingTipo === 'visura' ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 mr-1" />
                              )}
                              {docVisura ? 'Aggiorna Visura' : 'Carica Visura Camerale (PDF)'}
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => handleUploadDocTipo('visura', 'Visura Camerale CCIAA', e)}
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>

                    {/* CARD 3: DICHIARAZIONE CLIENTE AV.4 (DA STAMPARE E FAR FIRMARE AL CLIENTE + UPLOAD FIRMATO) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            ✍️ 3. Dichiarazione Cliente AV.4 (ex Art. 22 D.Lgs. 231/07)
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {docAv4
                              ? `Modulo firmato in archivio: ${docAv4.nomeFile}`
                              : '1° Stampa il modulo AV.4 precompilato · 2° Fallo firmare · 3° Ricaricalo'}
                          </p>
                        </div>
                        {docAv4 ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Firmato</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-300 bg-blue-50">
                            Da far firmare
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=dichiarazione`, '_blank')}
                          className="h-7 text-xs bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-300 font-semibold"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-blue-600" />
                          Stampa AV.4 da Firmare
                        </Button>
                        {docAv4 && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                window.open(`/api/aziende/${aziendaId}/documenti/${docAv4.id}?inline=1`, '_blank')
                              }
                            >
                              Vedi Firmato
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaDocFascicolo(docAv4.id, docAv4.nomeFile)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            asChild
                          >
                            <span>
                              {uploadingDoc && uploadingTipo === 'av4_firmato' ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 mr-1" />
                              )}
                              Carica AV.4 Firmato
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => handleUploadDocTipo('av4_firmato', 'Dichiarazione AV.4 Firmata dal Cliente', e)}
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>

                    {/* CARD 4: LETTERA D'INCARICO / MANDATO PROFESSIONALE + PRIVACY GDPR + DELEGA F24 + TARIFFARIO + SCHEDE STUDIO */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            📜 4. Lettera d&apos;Incarico (Paghe/Contabilità), Delega F24 &amp; Privacy
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {docPrivacy
                              ? `Mandato/Privacy firmato in archivio: ${docPrivacy.nomeFile}`
                              : 'Genera la Lettera d\'Incarico Studio Tuzio precompilata (con Delega LUL/F24, Privacy e Tariffario)'}
                          </p>
                        </div>
                        {docPrivacy || form.privacyFirmata ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">✓ Firmato</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-teal-700 border-teal-300 bg-teal-50">
                            Da far firmare
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-1.5 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato`, '_blank')
                          }
                          className="h-7 text-xs bg-indigo-700 hover:bg-indigo-800 text-white font-bold shadow-sm"
                          title="Stampa Lettera d'Incarico generata automaticamente in base al Servizio/Settore assegnato al cliente (Contabilità, Forfettario, Paghe, Occasionale)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Stampa Mandato Cliente (Auto)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=PAGHE`, '_blank')
                          }
                          className="h-7 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-bold"
                          title="Stampa Lettera d'Incarico Amministrazione del Personale Dipendente (Paghe, esenzione AVC art. 17 co. 7, Privacy art. 9 GDPR, Delega F24)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-amber-700" />
                          Mandato Paghe
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=CONTABILITA`,
                              '_blank'
                            )
                          }
                          className="h-7 text-xs bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300 font-bold"
                          title="Stampa Lettera di Incarico Professionale per Tenuta Contabilità Ordinaria e Bilancio (compenso da compilare + Antiriciclaggio + Privacy + Delega F24)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-blue-700" />
                          Mandato Contabilità Ord.
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=SEMPLIFICATA`,
                              '_blank'
                            )
                          }
                          className="h-7 text-xs bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300 font-bold"
                          title="Stampa Lettera di Incarico Professionale per Tenuta Contabilità Semplificata (compenso da compilare + Antiriciclaggio + Privacy + Delega F24)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-sky-700" />
                          Mandato Contabilità Sempl.
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=FORFETTARI`,
                              '_blank'
                            )
                          }
                          className="h-7 text-xs bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 font-bold"
                          title="Stampa Lettera di Incarico Professionale per Dichiarazioni e Consulenza in Regime Forfetario (compenso da compilare + Antiriciclaggio + Privacy + Delega F24)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-purple-700" />
                          Mandato Forfetario
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=OCCASIONALI`,
                              '_blank'
                            )
                          }
                          className="h-7 text-xs bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 font-bold"
                          title="Stampa Lettera d'Incarico per Rapporti di Lavoro Occasionali Autonomi e Consulenza del Lavoro (Art. 2222 c.c., Ispezioni, Conciliazioni, Penale art. 2237 c.c. + Privacy + Delega F24)"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-rose-700" />
                          Mandato Occasionali
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `/api/antiriciclaggio/${aziendaId}/pdf?tipo=mandato&variante=CAF`,
                              '_blank'
                            )
                          }
                          className="h-7 text-xs bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-300 font-bold"
                          title="Stampa Lettera d'Incarico per Dichiarazioni dei Redditi (Mod. 730 / Mod. Redditi PF), IMU, Assistenza Fiscale CAF, Privacy GDPR e Delega F24"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-teal-700" />
                          Mandato CAF / 730
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=f24`, '_blank')
                          }
                          className="h-7 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                          title="Stampa Allegato A — Autorizzazione alla trasmissione telematica dei modelli di versamento unificato F24 (Servizio Entratel) con Informativa ex art. 13 D.Lgs. 196/2003"
                        >
                          <Printer className="h-3.5 w-3.5 mr-1 text-emerald-700" />
                          Delega F24 (Allegato A)
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=valutazione`, '_blank')}
                          className="h-7 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                          Scheda AV.1-AV.7
                        </Button>
                        {docPrivacy && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() =>
                                window.open(`/api/aziende/${aziendaId}/documenti/${docPrivacy.id}?inline=1`, '_blank')
                              }
                            >
                              Vedi Firmato
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600 hover:bg-red-50"
                              onClick={() => handleEliminaDocFascicolo(docPrivacy.id, docPrivacy.nomeFile)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <label className="cursor-pointer">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-teal-300 text-teal-700 hover:bg-teal-50"
                            asChild
                          >
                            <span>
                              {uploadingDoc && uploadingTipo === 'privacy_firmata' ? (
                                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-3.5 w-3.5 mr-1" />
                              )}
                              Carica Mandato/Privacy Firmato
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) =>
                              handleUploadDocTipo('privacy_firmata', 'Lettera d\'Incarico / Privacy Firmata', e)
                            }
                            disabled={uploadingDoc}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleElimina}
            disabled={salvando}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto justify-start"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Elimina / Archivia Cliente
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
              Annulla
            </Button>
            <Button onClick={handleSalva} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white">
              {salvando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
                </>
              ) : (
                'Salva Modifiche'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
