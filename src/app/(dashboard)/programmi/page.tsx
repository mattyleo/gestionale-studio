'use client'
// src/app/(dashboard)/programmi/page.tsx
// Gestione e avvio programmi ministeriali ed esterni dello studio

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

  // Auto-rilevamento percorsi sul PC
  const handleRilevaSoftware = async () => {
    setRilevando(true)
    try {
      const res = await fetch('/api/programmi/rileva', { method: 'POST' })
      const dati = await res.json()
      if (dati.successo) {
        toast({
          title: dati.trovati?.length > 0 ? '🔍 Rilevamento completato!' : 'Nessun percorso standard trovato',
          description: dati.messaggio,
        })
        await caricaProgrammi()
      } else {
        throw new Error(dati.error)
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
  })

  // Carica lista programmi
  const caricaProgrammi = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/programmi')
      const dati = await res.json()
      if (dati.successo) {
        setProgrammi(dati.programmi || [])
        setOs(dati.sistemaOperativo || 'linux')
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

  // Avvia programma
  const handleAvviaProgramma = async (prog: any) => {
    setAvviandoId(prog.id)
    try {
      const res = await fetch(`/api/programmi/${prog.id}/avvia`, { method: 'POST' })
      const dati = await res.json()

      if (!res.ok || !dati.successo) {
        // Se non configurato o errore, se c'è webUrl apri web
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
            Lancia con un clic i software ministeriali dell&apos;Agenzia delle Entrate e INPS, e salva le ricevute direttamente negli archivi dei clienti.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRilevaSoftware}
            disabled={rilevando}
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            title="Cerca automaticamente dove sono installati Desktop Telematico e gli altri software sul computer"
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
            Integrazione diretta con il Sistema Operativo ({os === 'linux' ? 'Ubuntu Linux' : 'Windows'})
          </p>
          <p>
            Premendo <strong>&quot;Avvia Software&quot;</strong>, il gestionale lancia l&apos;eseguibile sul computer. Puoi salvare i file di output (es. F24 quietanzati, ricevute Entratel, attestazioni UniEMens) direttamente nell&apos;Archivio Documentale del cliente corrispondente.
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
            const cmd = os === 'windows' ? prog.comandoWindows : prog.comandoLinux
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
                    <Badge variant="outline" className="text-xs font-semibold text-gray-700 bg-gray-50">
                      {prog.categoria}
                    </Badge>
                  </div>

                  <CardTitle className="text-base font-bold text-gray-900 mt-3 leading-snug">
                    {prog.nome}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {prog.descrizione || 'Software di studio professionale'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-3">
                  {cmd ? (
                    <div className="p-2 bg-gray-50 rounded text-[11px] font-mono text-gray-600 truncate border border-gray-200" title={cmd}>
                      <span className="text-gray-400">cmd: </span>{cmd}
                    </div>
                  ) : prog.webUrl ? (
                    <div className="p-2 bg-blue-50/50 rounded text-[11px] text-blue-700 truncate border border-blue-100" title={prog.webUrl}>
                      <span className="text-blue-400">web: </span>{prog.webUrl}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => handleAvviaProgramma(prog)}
                      disabled={isAvviando}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
                    >
                      {isAvviando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Avvio in corso...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 fill-current" />
                          Avvia Software
                        </>
                      )}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditProgram(prog)
                          setEditModalOpen(true)
                        }}
                        className="w-full text-xs text-gray-700 flex items-center justify-center gap-1.5"
                        title="Modifica percorso o impostazioni"
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

      {/* MODAL CONFIGURAZIONE PROGRAMMA */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              {editProgram.id ? 'Configura Software' : 'Aggiungi Nuovo Software'}
            </DialogTitle>
            <DialogDescription>
              Configura il comando o il percorso del programma per lanciarlo direttamente dal gestionale.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProgram} className="space-y-4 py-2">
            <div>
              <Label htmlFor="prog-nome" className="text-xs font-semibold">Nome Software *</Label>
              <Input
                id="prog-nome"
                required
                value={editProgram.nome}
                onChange={(e) => setEditProgram({ ...editProgram, nome: e.target.value })}
                placeholder="es. Desktop Telematico, LIPE, Redditi..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="prog-desc" className="text-xs font-semibold">Descrizione</Label>
              <Input
                id="prog-desc"
                value={editProgram.descrizione || ''}
                onChange={(e) => setEditProgram({ ...editProgram, descrizione: e.target.value })}
                placeholder="es. Software invio telematico Agenzia delle Entrate"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select
                  value={editProgram.categoria}
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

              <div>
                <Label className="text-xs font-semibold">Icona</Label>
                <Select
                  value={editProgram.icona || 'Monitor'}
                  onValueChange={(val) => setEditProgram({ ...editProgram, icona: val })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monitor">Monitor / PC</SelectItem>
                    <SelectItem value="Users">Persone / INPS</SelectItem>
                    <SelectItem value="FileSpreadsheet">Dichiarazioni</SelectItem>
                    <SelectItem value="Receipt">Ricevuta / LIPE</SelectItem>
                    <SelectItem value="Award">Certificazioni / CU</SelectItem>
                    <SelectItem value="CreditCard">F24 / Pagamenti</SelectItem>
                    <SelectItem value="Landmark">Catasto / Fabbricati</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="prog-cmd-linux" className="text-xs font-semibold">Comando o Percorso su Ubuntu / Linux</Label>
              <Input
                id="prog-cmd-linux"
                value={editProgram.comandoLinux || ''}
                onChange={(e) => setEditProgram({ ...editProgram, comandoLinux: e.target.value })}
                placeholder="es. desktoptelematico o /opt/DesktopTelematico/DesktopTelematico"
                className="mt-1 font-mono text-xs"
              />
            </div>

            <div>
              <Label htmlFor="prog-cmd-win" className="text-xs font-semibold">Percorso Eseguibile su Windows</Label>
              <Input
                id="prog-cmd-win"
                value={editProgram.comandoWindows || ''}
                onChange={(e) => setEditProgram({ ...editProgram, comandoWindows: e.target.value })}
                placeholder="es. C:\DesktopTelematico\DesktopTelematico.exe"
                className="mt-1 font-mono text-xs"
              />
            </div>

            <div>
              <Label htmlFor="prog-url" className="text-xs font-semibold">URL Portale Web Ufficiale (Alternativo)</Label>
              <Input
                id="prog-url"
                value={editProgram.webUrl || ''}
                onChange={(e) => setEditProgram({ ...editProgram, webUrl: e.target.value })}
                placeholder="https://telematici.agenziaentrate.gov.it/"
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={salvando} className="bg-blue-600 text-white">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Salva Software
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
