'use client'
// src/app/(dashboard)/programmi/page.tsx
// Gestione e avvio programmi ministeriali ed esterni dello studio con supporto multi-anno

import * as React from 'react'
import {
  Monitor,
  Play,
  ExternalLink,
  Settings,
  FolderOpen,
  Plus,
  Users,
  FileSpreadsheet,
  Receipt,
  Award,
  CreditCard,
  Landmark,
  ShieldCheck,
  Cpu,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Calendar,
  Trash2,
  AlertTriangle,
  FolderSearch,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface ProgrammaVersione {
  anno: string
  etichetta: string
  comandoWindows?: string
  comandoLinux?: string
  webUrl?: string
}

function getProgramIcon(icona?: string | null) {
  switch (icona) {
    case 'Users':
      return <Users className="h-6 w-6 text-emerald-600" />
    case 'FileSpreadsheet':
      return <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
    case 'Receipt':
      return <Receipt className="h-6 w-6 text-amber-600" />
    case 'Award':
      return <Award className="h-6 w-6 text-rose-600" />
    case 'CreditCard':
      return <CreditCard className="h-6 w-6 text-blue-600" />
    case 'Landmark':
      return <Landmark className="h-6 w-6 text-purple-600" />
    default:
      return <Monitor className="h-6 w-6 text-blue-600" />
  }
}

export default function ProgrammiPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [programmi, setProgrammi] = React.useState<any[]>([])
  const [os, setOs] = React.useState<'linux' | 'windows'>('linux')
  const [avviandoId, setAvviandoId] = React.useState<string | null>(null)
  const [rilevando, setRilevando] = React.useState(false)
  const [filtroCategoria, setFiltroCategoria] = React.useState('Tutte')

  // Mappa selezione anno per programma: { [programmaId]: '2024' }
  const [selectedYears, setSelectedYears] = React.useState<Record<string, string>>({})

  // Dialog per software non trovato sul disco
  const [missingModal, setMissingModal] = React.useState<{
    open: boolean
    prog: any
    anno: string | null
    percorsoTentato: string
    webUrl?: string | null
    messaggio: string
  }>({
    open: false,
    prog: null,
    anno: null,
    percorsoTentato: '',
    webUrl: null,
    messaggio: '',
  })

  // Auto-rilevamento percorsi sul PC
  const handleRilevaSoftware = async () => {
    setRilevando(true)
    try {
      const res = await fetch('/api/programmi/rileva', { method: 'POST' })
      let dati: any
      try {
        dati = await res.json()
      } catch {
        throw new Error(`Risposta server non valida (HTTP ${res.status})`)
      }

      if (dati?.successo) {
        toast({
          title: dati.trovati?.length > 0 ? '🔍 Rilevamento completato!' : 'Nessun percorso standard trovato',
          description: dati.messaggio,
        })
        await caricaProgrammi()
      } else {
        throw new Error(dati?.error || dati?.messaggio || `Errore rilevamento (HTTP ${res.status})`)
      }
    } catch (e: any) {
      toast({ title: 'Errore rilevamento', description: e.message, variant: 'destructive' })
    } finally {
      setRilevando(false)
    }
  }

  // Edit / Add modal
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [salvando, setSalvando] = React.useState(false)
  const [editProgram, setEditProgram] = React.useState<any>({
    id: null,
    nome: '',
    descrizione: '',
    categoria: 'Fiscale',
    icona: 'Monitor',
    comandoLinux: '',
    comandoWindows: '',
    webUrl: '',
    versioni: [],
  })

  // Carica lista programmi
  const caricaProgrammi = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/programmi')
      const dati = await res.json()
      if (dati.successo) {
        const progs: any[] = dati.programmi || []
        setProgrammi(progs)
        setOs(dati.sistemaOperativo || 'linux')

        // Inizializza l'anno selezionato per ogni programma con versioni
        setSelectedYears((prev) => {
          const next = { ...prev }
          for (const p of progs) {
            const versioni = Array.isArray(p.versioni)
              ? p.versioni
              : typeof p.versioni === 'string'
              ? JSON.parse(p.versioni || '[]')
              : []
            if (versioni.length > 0 && !next[p.id]) {
              // Seleziona la prima versione disponibile
              next[p.id] = versioni[0].anno
            }
          }
          return next
        })
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i programmi dello studio', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    caricaProgrammi()
  }, [caricaProgrammi])

  // Avvia programma con anno opzionale
  const handleAvviaProgramma = async (prog: any, specificAnno?: string) => {
    setAvviandoId(prog.id)
    const annoScelto = specificAnno || selectedYears[prog.id] || undefined

    try {
      const res = await fetch(`/api/programmi/${prog.id}/avvia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anno: annoScelto }),
      })
      const dati = await res.json()

      if (!res.ok || !dati.successo) {
        // Se il programma non è stato trovato sul percorso specificato, mostra finestra guidata
        if (dati.nonTrovato) {
          setMissingModal({
            open: true,
            prog,
            anno: dati.anno || annoScelto || null,
            percorsoTentato: dati.percorsoTentato || '',
            webUrl: dati.webUrl || prog.webUrl || null,
            messaggio: dati.messaggio || dati.errore || 'File non trovato nel percorso configurato.',
          })
          return
        }

        // Se non configurato o errore generico, se c'è webUrl apri web
        if (prog.webUrl) {
          window.open(prog.webUrl, '_blank')
          toast({
            title: '🌐 Portale Web Ministeriale aperto',
            description: `Aperto il portale ufficiale di ${prog.nome}`,
          })
          return
        }
        throw new Error(dati.errore || dati.error || 'Impossibile avviare il software.')
      }

      if (dati.tipo === 'web') {
        window.open(dati.url, '_blank')
        toast({ title: 'Portale Aperto', description: dati.messaggio })
      } else {
        toast({
          title: '🚀 Software avviato con successo!',
          description: dati.messaggio,
        })
      }
    } catch (err: any) {
      toast({
        title: 'Attenzione all\'avvio',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setAvviandoId(null)
    }
  }

  // Salva / Modifica
  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const res = await fetch('/api/programmi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProgram),
      })
      const dati = await res.json()
      if (!res.ok || !dati.successo) throw new Error(dati.error)

      toast({ title: '✅ Configurazione salvata' })
      setEditModalOpen(false)
      await caricaProgrammi()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  // Elimina programma
  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo programma?')) return
    try {
      const res = await fetch(`/api/programmi?id=${id}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok || !dati.successo) throw new Error(dati.error)
      toast({ title: 'Programma eliminato' })
      setEditModalOpen(false)
      await caricaProgrammi()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    }
  }

  // Gestione lista versioni nell'edit modal
  const handleAddVersione = () => {
    const currentVer: ProgrammaVersione[] = Array.isArray(editProgram.versioni)
      ? [...editProgram.versioni]
      : []
    const nuovoAnno = currentVer.length > 0
      ? String(Math.max(...currentVer.map(v => parseInt(v.anno, 10) || 2024)) + 1)
      : '2025'
    currentVer.unshift({
      anno: nuovoAnno,
      etichetta: `${editProgram.nome || 'Software'} ${nuovoAnno}`,
      comandoWindows: `C:\\${editProgram.nome?.replace(/[^a-zA-Z0-9]/g, '') || 'Software'}${nuovoAnno}\\run.exe`,
      comandoLinux: '',
      webUrl: '',
    })
    setEditProgram({ ...editProgram, versioni: currentVer })
  }

  const handleUpdateVersione = (index: number, campo: keyof ProgrammaVersione, valore: string) => {
    const currentVer: ProgrammaVersione[] = Array.isArray(editProgram.versioni)
      ? [...editProgram.versioni]
      : []
    if (currentVer[index]) {
      currentVer[index] = { ...currentVer[index], [campo]: valore }
      setEditProgram({ ...editProgram, versioni: currentVer })
    }
  }

  const handleRemoveVersione = (index: number) => {
    const currentVer: ProgrammaVersione[] = Array.isArray(editProgram.versioni)
      ? [...editProgram.versioni]
      : []
    currentVer.splice(index, 1)
    setEditProgram({ ...editProgram, versioni: currentVer })
  }

  const categorie = ['Tutte', 'Fiscale', 'Previdenziale', 'Catasto', 'Altro']
  const programmiFiltrati = programmi.filter((p) => {
    if (filtroCategoria === 'Tutte') return true
    return p.categoria === filtroCategoria
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Monitor className="h-7 w-7 text-blue-600" />
            Programmi & Software Studio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lancia con un clic i software ministeriali dell&apos;Agenzia delle Entrate e INPS con selezione rapida dell&apos;annata (Redditi, 730, CU, LIPE, F24).
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleRilevaSoftware}
            disabled={rilevando}
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            title="Cerca automaticamente dove sono installati Desktop Telematico, Redditi, LIPE e gli altri software sul computer"
          >
            {rilevando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-blue-600" />}
            Rileva Software nel PC
          </Button>

          <Link href="/archivi">
            <Button variant="outline" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-amber-600" />
              Archivio Documenti
            </Button>
          </Link>

          <Button
            onClick={() => {
              setEditProgram({
                id: null,
                nome: '',
                descrizione: '',
                categoria: 'Fiscale',
                icona: 'Monitor',
                comandoLinux: '',
                comandoWindows: '',
                webUrl: '',
                versioni: [],
              })
              setEditModalOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Aggiungi Software
          </Button>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Cpu className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold text-sm">
            Integrazione diretta con il Sistema Operativo ({os === 'linux' ? 'Ubuntu Linux' : 'Windows'}) con supporto Multi-Anno
          </p>
          <p>
            Per dichiarazioni con versioni distinte (es. <strong>Redditi PF/SP/SC 2024, 2025, Modello 730</strong>), seleziona l&apos;anno desiderato dal menu sulla scheda e premi <strong>&quot;Avvia Software&quot;</strong>. Se hai percorsi personalizzati sul tuo PC, puoi configurarli con un clic da <em>&quot;Configura&quot;</em>.
          </p>
        </div>
      </div>

      {/* Filtri Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categorie.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filtroCategoria === c ? 'default' : 'outline'}
            onClick={() => setFiltroCategoria(c)}
            className={filtroCategoria === c ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}
          >
            {c}
          </Button>
        ))}
      </div>

      {/* Grid Programmi */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
          Caricamento programmi dello studio...
        </div>
      ) : programmiFiltrati.length === 0 ? (
        <Card className="p-12 text-center text-gray-400 border border-gray-200">
          <p>Nessun programma configurato in questa categoria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programmiFiltrati.map((prog) => {
            const isAvviando = avviandoId === prog.id
            const versioni: ProgrammaVersione[] = Array.isArray(prog.versioni)
              ? prog.versioni
              : typeof prog.versioni === 'string'
              ? JSON.parse(prog.versioni || '[]')
              : []
            const hasVersioni = versioni.length > 0
            const currentAnno = selectedYears[prog.id] || (hasVersioni ? versioni[0].anno : null)
            const currentVersione = hasVersioni ? versioni.find((v) => v.anno === currentAnno) || versioni[0] : null

            const cmd = currentVersione
              ? (os === 'windows' ? (currentVersione.comandoWindows || prog.comandoWindows) : (currentVersione.comandoLinux || prog.comandoLinux))
              : (os === 'windows' ? prog.comandoWindows : prog.comandoLinux)

            const targetWebUrl = currentVersione?.webUrl || prog.webUrl

            return (
              <Card
                key={prog.id}
                className="border border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow bg-white flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      {getProgramIcon(prog.icona)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasVersioni && (
                        <Badge className="text-[10px] font-semibold bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
                          {versioni.length} Annate
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs font-semibold text-gray-700 bg-gray-50">
                        {prog.categoria}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-base font-bold text-gray-900 mt-3 leading-snug">
                    {prog.nome}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {prog.descrizione || 'Software di studio professionale'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {/* Selettore Anno / Versione se disponibile */}
                  {hasVersioni && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        Scegli Anno:
                      </Label>
                      <Select
                        value={currentAnno || ''}
                        onValueChange={(val) => setSelectedYears((prev) => ({ ...prev, [prog.id]: val }))}
                      >
                        <SelectTrigger className="h-7 text-xs font-medium bg-white border-slate-300 w-auto min-w-[140px]">
                          <SelectValue placeholder="Seleziona anno" />
                        </SelectTrigger>
                        <SelectContent>
                          {versioni.map((v) => (
                            <SelectItem key={v.anno} value={v.anno} className="text-xs">
                              {v.anno} {v.etichetta ? `• ${v.etichetta}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {cmd ? (
                    <div className="p-2 bg-gray-50 rounded text-[11px] font-mono text-gray-600 truncate border border-gray-200" title={cmd}>
                      <span className="text-gray-400">
                        {currentAnno ? `cmd [${currentAnno}]: ` : 'cmd: '}
                      </span>
                      {cmd}
                    </div>
                  ) : targetWebUrl ? (
                    <div className="p-2 bg-blue-50/50 rounded text-[11px] text-blue-700 truncate border border-blue-100" title={targetWebUrl}>
                      <span className="text-blue-400">web: </span>{targetWebUrl}
                    </div>
                  ) : (
                    <div className="p-2 bg-amber-50/70 rounded text-[11px] text-amber-700 border border-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Percorso non ancora configurato</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleAvviaProgramma(prog, currentAnno || undefined)}
                      disabled={isAvviando}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isAvviando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Avvio in corso...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          Avvia Software {currentAnno ? `(${currentAnno})` : ''}
                        </>
                      )}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      {targetWebUrl ? (
                        <a
                          href={targetWebUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 flex items-center justify-center gap-1.5 border-blue-200"
                            title={`Apri portale web ufficiale${currentAnno ? ` per l'anno ${currentAnno}` : ''}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                            {currentAnno ? `Web ${currentAnno}` : 'Portale Web'}
                          </Button>
                        </a>
                      ) : (
                        <Link href="/archivi" className="w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs text-gray-700 hover:text-blue-600 flex items-center justify-center gap-1.5"
                            title="Vai all'archivio per depositare i file generati"
                          >
                            <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                            Archivio
                          </Button>
                        </Link>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const vList = Array.isArray(prog.versioni)
                            ? prog.versioni
                            : typeof prog.versioni === 'string'
                            ? JSON.parse(prog.versioni || '[]')
                            : []
                          setEditProgram({
                            ...prog,
                            versioni: vList,
                          })
                          setEditModalOpen(true)
                        }}
                        className="w-full text-xs text-gray-700 flex items-center justify-center gap-1.5"
                        title="Modifica percorso, aggiungi annate o cambia impostazioni"
                      >
                        <Settings className="h-3.5 w-3.5 text-gray-500" />
                        Configura
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* MODAL PROGRAMMA NON TROVATO SUL PC */}
      <Dialog
        open={missingModal.open}
        onOpenChange={(open) => setMissingModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Software non trovato sul PC
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {missingModal.prog?.nome} {missingModal.anno ? `• Anno ${missingModal.anno}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 space-y-1.5">
              <p className="font-semibold">Il file non è presente nel percorso specificato:</p>
              <p className="font-mono bg-white p-2 rounded border border-amber-200 text-gray-800 break-all select-all">
                {missingModal.percorsoTentato || 'Nessun percorso impostato'}
              </p>
              <p className="text-gray-600">
                Sul computer del dottore sono presenti diverse annate di questo programma. È sufficiente indicare il percorso corretto dove è installata questa versione.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {missingModal.webUrl && (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  window.open(missingModal.webUrl!, '_blank')
                  setMissingModal((prev) => ({ ...prev, open: false }))
                }}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Apri Portale Web AdE
              </Button>
            )}

            <Button
              type="button"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const targetProg = missingModal.prog
                setMissingModal((prev) => ({ ...prev, open: false }))
                if (targetProg) {
                  const vList = Array.isArray(targetProg.versioni)
                    ? targetProg.versioni
                    : typeof targetProg.versioni === 'string'
                    ? JSON.parse(targetProg.versioni || '[]')
                    : []
                  setEditProgram({
                    ...targetProg,
                    versioni: vList,
                  })
                  setEditModalOpen(true)
                }
              }}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Configura Percorso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL CONFIGURAZIONE PROGRAMMA & ANNATE */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {editProgram.id && !editProgram.id.startsWith('default-')
                ? 'Configura Software & Annate'
                : 'Configura Software dello Studio'}
            </DialogTitle>
            <DialogDescription>
              Imposta i percorsi degli eseguibili installati sul computer ({os === 'windows' ? 'Windows' : 'Linux'}) e gestisci le varie annate fiscali.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProgram} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prog-nome" className="text-xs font-semibold">Nome Software *</Label>
                <Input
                  id="prog-nome"
                  required
                  value={editProgram.nome}
                  onChange={(e) => setEditProgram({ ...editProgram, nome: e.target.value })}
                  placeholder="es. Dichiarazioni dei Redditi..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select
                  value={editProgram.categoria || 'Fiscale'}
                  onValueChange={(val) => setEditProgram({ ...editProgram, categoria: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiscale">Fiscale</SelectItem>
                    <SelectItem value="Previdenziale">Previdenziale</SelectItem>
                    <SelectItem value="Lavoro">Lavoro</SelectItem>
                    <SelectItem value="Catasto">Catasto</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prog-desc" className="text-xs font-semibold">Descrizione</Label>
              <Input
                id="prog-desc"
                value={editProgram.descrizione || ''}
                onChange={(e) => setEditProgram({ ...editProgram, descrizione: e.target.value })}
                placeholder="es. Pacchetto per il calcolo e la trasmissione delle dichiarazioni fiscali"
                className="mt-1"
              />
            </div>

            {/* SEZIONE GESTIONE MULTI-ANNO */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Annate & Versioni Disponibili (Multi-Anno)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Definisci gli anni d&apos;imposta gestiti (es. 2025, 2024, 2023) con il rispettivo percorso eseguibile sul PC.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVersione}
                  className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Aggiungi Anno
                </Button>
              </div>

              {Array.isArray(editProgram.versioni) && editProgram.versioni.length > 0 ? (
                <div className="space-y-3 pt-2">
                  {editProgram.versioni.map((v: ProgrammaVersione, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5">
                            Anno {v.anno}
                          </Badge>
                          <Input
                            value={v.etichetta || ''}
                            onChange={(e) => handleUpdateVersione(idx, 'etichetta', e.target.value)}
                            placeholder="Etichetta (es. Redditi PF 2024)"
                            className="h-7 text-xs font-medium w-64"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVersione(idx)}
                          className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <Label className="text-[11px] font-medium text-gray-600">
                            Percorso Windows (.exe)
                          </Label>
                          <Input
                            value={v.comandoWindows || ''}
                            onChange={(e) => handleUpdateVersione(idx, 'comandoWindows', e.target.value)}
                            placeholder="C:\RedditiOnline2024\redditi.exe"
                            className="mt-0.5 h-7 font-mono text-[11px]"
                          />
                        </div>
                        <div>
                          <Label className="text-[11px] font-medium text-gray-600">
                            URL Portale Web AdE
                          </Label>
                          <Input
                            value={v.webUrl || ''}
                            onChange={(e) => handleUpdateVersione(idx, 'webUrl', e.target.value)}
                            placeholder="https://www.agenziaentrate.gov.it/..."
                            className="mt-0.5 h-7 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-white border border-dashed border-slate-300 rounded-lg text-xs text-slate-500">
                  Nessuna annata specifica configurata. Il programma userà il percorso predefinito generale sottostante.
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVersione}
                      className="text-xs text-blue-600 border-blue-200"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Attiva Gestione Multi-Anno (es. 2024, 2025)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* PERCORSI PREDEFINITI GENERALI */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-gray-700">Percorsi Predefiniti Generali (se non specificato l&apos;anno)</h4>

              <div>
                <Label htmlFor="prog-cmd-win" className="text-xs font-semibold">Percorso Eseguibile Windows (.exe o .bat)</Label>
                <Input
                  id="prog-cmd-win"
                  value={editProgram.comandoWindows || ''}
                  onChange={(e) => setEditProgram({ ...editProgram, comandoWindows: e.target.value })}
                  placeholder="es. C:\ProgrammiStudio\programma.exe"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prog-cmd-linux" className="text-xs font-semibold">Comando o Percorso su Linux</Label>
                <Input
                  id="prog-cmd-linux"
                  value={editProgram.comandoLinux || ''}
                  onChange={(e) => setEditProgram({ ...editProgram, comandoLinux: e.target.value })}
                  placeholder="es. /opt/programma/programma"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prog-url" className="text-xs font-semibold">URL Portale Web Alternativo</Label>
                <Input
                  id="prog-url"
                  value={editProgram.webUrl || ''}
                  onChange={(e) => setEditProgram({ ...editProgram, webUrl: e.target.value })}
                  placeholder="https://telematici.agenziaentrate.gov.it/"
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 flex justify-between items-center sm:justify-between">
              <div>
                {editProgram.id && !editProgram.id.startsWith('default-') ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteProgram(editProgram.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Elimina Software
                  </Button>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={salvando} className="bg-blue-600 text-white hover:bg-blue-700">
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Salva Software
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
