'use client'
// src/components/antiriciclaggio/AntiriciclaggioDettaglioModal.tsx
// Modal per consultare e aggiornare il fascicolo Antiriciclaggio & Privacy del cliente

import * as React from 'react'
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
      toast({ title: '✅ Fascicolo Antiriciclaggio aggiornato con successo' })
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Errore salvataggio', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleUploadDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !aziendaId) return
    const file = e.target.files[0]
    setUploadingDoc(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipoDoc', form.documentoTipo)
      if (form.documentoScadenza) fd.append('scadenza', form.documentoScadenza)
      fd.append('note', `Documento di riconoscimento: ${form.documentoNumero || file.name}`)

      const res = await fetch(`/api/aziende/${aziendaId}/documenti`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast({ title: '✅ Documento PDF caricato e collegato all\'anagrafica' })
      carica()
    } catch (err: any) {
      toast({ title: 'Errore caricamento', description: err.message, variant: 'destructive' })
    } finally {
      setUploadingDoc(false)
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
                    onValueChange={(val) => setForm({ ...form, settoreAttivita: val })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTABILITA">Contabilità &amp; Bilancio</SelectItem>
                      <SelectItem value="PAGHE">Consulenza Lavoro &amp; Paghe</SelectItem>
                      <SelectItem value="CAF">CAF / Dichiarazioni (Privati)</SelectItem>
                      <SelectItem value="MISTO">Misto (Contabilità + Paghe)</SelectItem>
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
                <div className="sm:col-span-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {azienda?.documents?.find((d: any) => d.tipoDoc === 'carta_identita' || d.tipoDoc === 'passaporto' || d.tipoDoc === 'patente')
                          ? `Documento caricato: ${azienda.documents[0].nomeFile}`
                          : 'Carica PDF o foto fronte/retro della carta d\'identità'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Consente il monitoraggio immediato in anagrafica
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {azienda?.documents && azienda.documents.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/aziende/${aziendaId}/documenti/${azienda.documents[0].id}`, '_blank')}
                      >
                        Visualizza PDF
                      </Button>
                    )}
                    <label className="cursor-pointer">
                      <Button type="button" size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                        <span>
                          {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                          Carica PDF
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        className="hidden"
                        onChange={handleUploadDocumento}
                        disabled={uploadingDoc}
                      />
                    </label>
                  </div>
                </div>
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

            {/* Sezione 5: Stampe e Download Modulistica Ufficiale */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Printer className="h-4 w-4 text-blue-600" />
                Stampe e Modulistica Precompilata (PDF con 1 Click)
              </h4>
              <p className="text-xs text-blue-800">
                Genera istantaneamente i documenti conformi già intestati allo Studio Dott. Antonio Tuzio e precompilati con i dati del cliente:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=dichiarazione`, '_blank')}
                  className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300"
                >
                  <FileText className="h-4 w-4 mr-1.5 text-blue-600" />
                  Dichiarazione Cliente (D.Lgs. 231)
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=privacy`, '_blank')}
                  className="bg-white hover:bg-teal-50 text-teal-700 border-teal-300"
                >
                  <FileText className="h-4 w-4 mr-1.5 text-teal-600" />
                  Informativa Privacy GDPR
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=valutazione`, '_blank')}
                  className="bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-300"
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5 text-indigo-600" />
                  Scheda Valutazione Rischio CNDCEC
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=dichiarazione`, '_blank')
                    setTimeout(() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=privacy`, '_blank'), 300)
                    setTimeout(() => window.open(`/api/antiriciclaggio/${aziendaId}/pdf?tipo=valutazione`, '_blank'), 600)
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  title="Apre in 3 schede tutti i documenti necessari per l'acquisizione del nuovo cliente"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  Stampa Kit Completo (Tutti i 3 Documenti)
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Annulla
          </Button>
          <Button onClick={handleSalva} disabled={salvando} className="bg-blue-600 hover:bg-blue-700 text-white">
            {salvando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvataggio...
              </>
            ) : (
              'Salva Modifiche Fascicolo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
