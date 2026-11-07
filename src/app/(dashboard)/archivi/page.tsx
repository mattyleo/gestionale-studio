'use client'
// src/app/(dashboard)/archivi/page.tsx
// Archivio Documentale Studio: cartelle per ciascun cliente, codici univoci e data certa

import * as React from 'react'
import {
  FolderArchive,
  Search,
  Upload,
  FolderOpen,
  FileText,
  FileCheck,
  CreditCard,
  Landmark,
  UserCheck,
  Receipt,
  FileSearch,
  Calculator,
  Folder,
  Download,
  Trash2,
  Eye,
  Loader2,
  Copy,
  Check,
  Building2,
  ExternalLink,
  Plus,
  HardDrive,
  Calendar,
  Tag,
  AlertCircle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatData } from '@/lib/utils'

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getCategoryIcon(catId: string) {
  switch (catId) {
    case 'documenti_identita':
      return <UserCheck className="h-4 w-4 text-blue-600" />
    case 'visure_catasto':
      return <FileSearch className="h-4 w-4 text-amber-600" />
    case 'terreni_fabbricati':
      return <Landmark className="h-4 w-4 text-emerald-600" />
    case 'dichiarazioni_fiscali':
      return <FileText className="h-4 w-4 text-indigo-600" />
    case 'f24_pagamenti':
      return <CreditCard className="h-4 w-4 text-rose-600" />
    case 'lipe_iva':
      return <Receipt className="h-4 w-4 text-violet-600" />
    case 'contratti_incarichi':
      return <FileCheck className="h-4 w-4 text-teal-600" />
    case 'contabilita_bilanci':
      return <Calculator className="h-4 w-4 text-orange-600" />
    default:
      return <Folder className="h-4 w-4 text-gray-500" />
  }
}

export default function ArchiviPage() {
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [aziende, setAziende] = React.useState<any[]>([])
  const [categorie, setCategorie] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedAziendaId, setSelectedAziendaId] = React.useState<string | null>(null)

  // Documenti dell'azienda selezionata
  const [loadingDocs, setLoadingDocs] = React.useState(false)
  const [documenti, setDocumenti] = React.useState<any[]>([])
  const [filtroCategoria, setFiltroCategoria] = React.useState<string>('tutte')
  const [searchDocQuery, setSearchDocQuery] = React.useState('')

  // Dialogs
  const [uploadModalOpen, setUploadModalOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [uploadCategoria, setUploadCategoria] = React.useState('visure_catasto')
  const [uploadNote, setUploadNote] = React.useState('')
  const [uploadAnno, setUploadAnno] = React.useState(new Date().getFullYear().toString())
  const [uploadScadenza, setUploadScadenza] = React.useState('')

  // Preview & Delete
  const [previewDoc, setPreviewDoc] = React.useState<any>(null)
  const [deleteDocId, setDeleteDocId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null)
  const [aprendoCartella, setAprendoCartella] = React.useState(false)

  // Carica panoramica aziende
  const caricaArchivi = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/archivi?q=${encodeURIComponent(searchQuery)}`)
      const dati = await res.json()
      if (dati.successo) {
        setAziende(dati.aziende || [])
        setCategorie(dati.categorie || [])
        // Seleziona la prima azienda se nessuna selezionata
        if (!selectedAziendaId && dati.aziende.length > 0) {
          setSelectedAziendaId(dati.aziende[0].id)
        }
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare gli archivi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedAziendaId, toast])

  React.useEffect(() => {
    caricaArchivi()
  }, [caricaArchivi])

  // Carica documenti azienda selezionata
  const caricaDocumentiAzienda = React.useCallback(async (aziendaId: string) => {
    setLoadingDocs(true)
    try {
      const url = `/api/archivi/${aziendaId}?categoria=${encodeURIComponent(filtroCategoria)}&q=${encodeURIComponent(searchDocQuery)}`
      const res = await fetch(url)
      const dati = await res.json()
      if (dati.successo) {
        setDocumenti(dati.documenti || [])
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare i documenti del cliente', variant: 'destructive' })
    } finally {
      setLoadingDocs(false)
    }
  }, [filtroCategoria, searchDocQuery, toast])

  React.useEffect(() => {
    if (selectedAziendaId) {
      caricaDocumentiAzienda(selectedAziendaId)
    }
  }, [selectedAziendaId, caricaDocumentiAzienda])

  const selectedAzienda = aziende.find((a) => a.id === selectedAziendaId)

  // Copia codice documento
  const handleCopyCode = (codice: string) => {
    navigator.clipboard.writeText(codice)
    setCopiedCode(codice)
    toast({ title: 'Codice copiato', description: codice })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Upload file
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !selectedAziendaId) {
      toast({ title: 'Attenzione', description: 'Seleziona un file da caricare', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('categoria', uploadCategoria)
      formData.append('note', uploadNote)
      if (uploadAnno) formData.append('annoCompetenza', uploadAnno)
      if (uploadScadenza) formData.append('scadenza', uploadScadenza)

      const res = await fetch(`/api/archivi/${selectedAziendaId}`, {
        method: 'POST',
        body: formData,
      })
      const dati = await res.json()

      if (!res.ok || !dati.successo) {
        throw new Error(dati.error || 'Errore durante il caricamento')
      }

      toast({
        title: '✅ File archiviato con successo',
        description: `Codice assegnato: ${dati.documento.codiceUnivoco}`,
      })

      setUploadModalOpen(false)
      setUploadFile(null)
      setUploadNote('')
      setUploadScadenza('')
      await caricaDocumentiAzienda(selectedAziendaId)
      await caricaArchivi()
    } catch (err: any) {
      toast({ title: 'Errore caricamento', description: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  // Elimina file
  const handleEliminaDoc = async () => {
    if (!deleteDocId || !selectedAziendaId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/archivi/${selectedAziendaId}/${deleteDocId}`, {
        method: 'DELETE',
      })
      const dati = await res.json()
      if (!res.ok || !dati.successo) throw new Error(dati.error || 'Errore eliminazione')

      toast({ title: 'Documento eliminato', description: 'File rimosso dall\'archivio' })
      setDeleteDocId(null)
      await caricaDocumentiAzienda(selectedAziendaId)
      await caricaArchivi()
    } catch (err: any) {
      toast({ title: 'Errore', description: err.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  // Apri cartella fisica nel PC
  const handleApriCartellaFisica = async (aziendaId?: string) => {
    setAprendoCartella(true)
    try {
      const res = await fetch('/api/archivi/apri-cartella', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: aziendaId || selectedAziendaId }),
      })
      const dati = await res.json()
      if (dati.successo) {
        toast({ title: 'Cartella aperta sul PC', description: dati.percorso })
      } else {
        toast({ title: 'Info percorso', description: dati.percorso || 'Cartella creata nel server' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile aprire la cartella locale', variant: 'destructive' })
    } finally {
      setAprendoCartella(false)
    }
  }

  // Conteggi complessivi
  const totaleDocStudio = aziende.reduce((acc, a) => acc + (a.totaleDocumenti || 0), 0)
  const totaleSpazio = aziende.reduce((acc, a) => acc + (a.totaleBytes || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header Pagina */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <FolderArchive className="h-7 w-7 text-blue-600" />
            Archivio Documentale Clienti
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Conservazione e catalogazione file per singolo cliente con data certa e codice alfanumerico univoco.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleApriCartellaFisica()}
            disabled={aprendoCartella}
            className="flex items-center gap-2"
            title="Apre la cartella dell'archivio sul computer"
          >
            <FolderOpen className="h-4 w-4 text-amber-600" />
            Apri Cartella nel PC
          </Button>

          {selectedAzienda && (
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Carica Documento
            </Button>
          )}
        </div>
      </div>

      {/* KPI Riassuntivi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border border-gray-200">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Cartelle Clienti Attive</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{aziende.length}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-gray-200">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Documenti Catalogati</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{totaleDocStudio}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border border-gray-200">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Spazio Occupato su Disco</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatBytes(totaleSpazio)}</p>
          </div>
        </Card>
      </div>

      {/* Layout Split: Sinistra Clienti / Destra Contenuto Archivio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLONNA SINISTRA: Lista Clienti */}
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cerca cliente per nome, CF o P.IVA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>CLIENTE</span>
              <span>FILE</span>
            </div>

            <div className="max-h-[640px] overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Caricamento archivi clienti...
                </div>
              ) : aziende.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Nessun cliente trovato.
                </div>
              ) : (
                aziende.map((az) => {
                  const isSelected = az.id === selectedAziendaId
                  return (
                    <button
                      key={az.id}
                      onClick={() => setSelectedAziendaId(az.id)}
                      className={`w-full text-left p-3.5 transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 border-l-4 border-blue-600 pl-2.5 text-blue-950 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate text-gray-900">{az.ragioneSociale}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {az.partitaIva ? `P.IVA ${az.partitaIva}` : az.codiceFiscale || 'N/D'}
                        </p>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <Badge
                          variant={az.totaleDocumenti > 0 ? 'default' : 'secondary'}
                          className={`text-xs ${
                            az.totaleDocumenti > 0
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {az.totaleDocumenti}
                        </Badge>
                        {az.totaleBytes > 0 && (
                          <span className="text-[10px] text-gray-400 mt-1">{formatBytes(az.totaleBytes)}</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* COLONNA DESTRA: Esploratore Documenti del Cliente Selezionato */}
        <div className="lg:col-span-8 space-y-4">
          {selectedAzienda ? (
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/70 border-b border-gray-200 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-amber-600" />
                      {selectedAzienda.ragioneSociale}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                      <span><strong>CF/P.IVA:</strong> {selectedAzienda.partitaIva || selectedAzienda.codiceFiscale || 'N/D'}</span>
                      <span>•</span>
                      <span><strong>Cartella Server:</strong> <code className="bg-gray-200 px-1 rounded text-gray-800">{selectedAzienda.cartellaFisica}</code></span>
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApriCartellaFisica(selectedAzienda.id)}
                      disabled={aprendoCartella}
                      title="Apre la cartella di questo cliente nel file manager del PC"
                    >
                      <FolderOpen className="h-4 w-4 mr-1 text-amber-600" />
                      Cartella PC
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setUploadModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Carica File
                    </Button>
                  </div>
                </div>

                {/* Filtro Categorie e Ricerca Interna */}
                <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-60">
                    <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Tutte le categorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutte">📁 Tutte le sottocartelle</SelectItem>
                        {categorie.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cerca documento per nome, codice univoco o note..."
                      value={searchDocQuery}
                      onChange={(e) => setSearchDocQuery(e.target.value)}
                      className="pl-9 bg-white"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {loadingDocs ? (
                  <div className="p-12 text-center text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Lettura documenti cliente...
                  </div>
                ) : documenti.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 space-y-3">
                    <FolderOpen className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="text-sm font-medium text-gray-700">Nessun documento in questa cartella</p>
                    <p className="text-xs text-gray-500">
                      Trascina qui i file o usa il pulsante &quot;Carica File&quot; per depositare visure, documenti d&apos;identità, contratti o F24.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setUploadModalOpen(true)}
                      className="bg-blue-600 text-white mt-2"
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      Deposita primo file
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow>
                          <TableHead className="w-12 text-center">TIPO</TableHead>
                          <TableHead>NOME FILE & NOTE</TableHead>
                          <TableHead>CODICE UNIVOCO</TableHead>
                          <TableHead>DATA CERTA DEPOSITO</TableHead>
                          <TableHead>DIMENSIONE</TableHead>
                          <TableHead className="text-right">AZIONI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documenti.map((doc) => {
                          const catInfo = categorie.find((c) => c.id === doc.cartella)
                          return (
                            <TableRow key={doc.id} className="hover:bg-gray-50/80">
                              <TableCell className="text-center">
                                <div className="p-2 bg-gray-100 rounded-lg inline-flex items-center justify-center">
                                  {getCategoryIcon(doc.cartella)}
                                </div>
                              </TableCell>

                              <TableCell>
                                <div className="space-y-0.5">
                                  <p className="text-sm font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                                    {doc.nomeFile}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-gray-50">
                                      {catInfo?.label || doc.cartella || 'Altro'}
                                    </Badge>
                                    {doc.annoCompetenza && (
                                      <span className="text-[10px] text-gray-500">Anno {doc.annoCompetenza}</span>
                                    )}
                                    {doc.note && (
                                      <span className="text-gray-600 italic truncate max-w-xs">
                                        &quot;{doc.note}&quot;
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(doc.codiceUnivoco || doc.id)}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-mono text-xs font-medium border border-blue-200 transition-colors"
                                  title="Clicca per copiare il codice univoco"
                                >
                                  {copiedCode === (doc.codiceUnivoco || doc.id) ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-blue-500" />
                                  )}
                                  <span>{doc.codiceUnivoco || 'DOC-GEN'}</span>
                                </button>
                              </TableCell>

                              <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{new Date(doc.createdAt).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' })}</span>
                                </div>
                              </TableCell>

                              <TableCell className="text-xs text-gray-600 font-mono whitespace-nowrap">
                                {formatBytes(doc.dimensione)}
                              </TableCell>

                              <TableCell className="text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                    onClick={() => setPreviewDoc(doc)}
                                    title="Anteprima rapida"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <a
                                    href={`/api/archivi/${selectedAziendaId}/${doc.id}?download=1`}
                                    download={doc.nomeFile}
                                  >
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                      title="Scarica documento originale"
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </a>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => setDeleteDocId(doc.id)}
                                    title="Elimina documento"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-gray-400 border border-gray-200">
              <FolderArchive className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Seleziona un cliente dalla lista</p>
              <p className="text-xs text-gray-500 mt-1">
                Visualizzerai tutte le sue cartelle e potrai depositare e ricercare file con data certa.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* DIALOG UPLOAD DOCUMENTO */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Carica Documento in Archivio
            </DialogTitle>
            <DialogDescription>
              Il file verrà salvato nella cartella del cliente con <strong>data certa</strong> e <strong>codice alfanumerico univoco</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Cliente / Cartella di Destinazione</Label>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>{selectedAzienda?.ragioneSociale}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="upload-categoria" className="text-xs font-semibold text-gray-700">
                Sottocartella / Categoria Documento *
              </Label>
              <Select value={uploadCategoria} onValueChange={setUploadCategoria}>
                <SelectTrigger id="upload-categoria" className="mt-1">
                  <SelectValue placeholder="Seleziona sottocartella" />
                </SelectTrigger>
                <SelectContent>
                  {categorie.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="upload-anno" className="text-xs font-semibold text-gray-700">
                  Anno di Competenza
                </Label>
                <Input
                  id="upload-anno"
                  type="number"
                  value={uploadAnno}
                  onChange={(e) => setUploadAnno(e.target.value)}
                  placeholder="2026"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="upload-scadenza" className="text-xs font-semibold text-gray-700">
                  Data Scadenza (es. C.I.)
                </Label>
                <Input
                  id="upload-scadenza"
                  type="date"
                  value={uploadScadenza}
                  onChange={(e) => setUploadScadenza(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upload-note" className="text-xs font-semibold text-gray-700">
                Descrizione / Note Interne
              </Label>
              <Input
                id="upload-note"
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                placeholder="es. Visura camerale storica, Contratto di locazione..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">File da Caricare * (PDF, Immagini, DOCX)</Label>
              <div className="mt-1 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-gray-50/50">
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0])
                    }
                  }}
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  {uploadFile ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-blue-600">{uploadFile.name}</p>
                      <p className="text-xs text-gray-500">{formatBytes(uploadFile.size)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Clicca per selezionare il file dal tuo computer</p>
                      <p className="text-xs text-gray-400 mt-1">Formati supportati: PDF, JPG, PNG, WEBP, DOCX, ZIP (Max 50 MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={uploading || !uploadFile} className="bg-blue-600 text-white">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Archiviazione in corso...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Archivia Documento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG ANTEPRIMA DOCUMENTO */}
      {previewDoc && (
        <Dialog open={Boolean(previewDoc)} onOpenChange={() => setPreviewDoc(null)}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-4">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="truncate">{previewDoc.nomeFile}</span>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-semibold text-blue-800">
                  {previewDoc.codiceUnivoco}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 w-full bg-gray-100 rounded-lg overflow-hidden my-2 flex items-center justify-center">
              {previewDoc.mimeType === 'application/pdf' ? (
                <iframe
                  src={`/api/archivi/${selectedAziendaId}/${previewDoc.id}`}
                  className="w-full h-full border-none"
                  title={previewDoc.nomeFile}
                />
              ) : previewDoc.mimeType.startsWith('image/') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/archivi/${selectedAziendaId}/${previewDoc.id}`}
                  alt={previewDoc.nomeFile}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                  <p className="text-sm font-medium text-gray-700">Anteprima inline non disponibile per questo tipo di file.</p>
                  <a
                    href={`/api/archivi/${selectedAziendaId}/${previewDoc.id}?download=1`}
                    download={previewDoc.nomeFile}
                  >
                    <Button className="bg-blue-600 text-white mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica il file ({formatBytes(previewDoc.dimensione)})
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-2 flex items-center justify-between sm:justify-between">
              <div className="text-xs text-gray-500">
                Depositato il {new Date(previewDoc.createdAt).toLocaleString('it-IT')}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/archivi/${selectedAziendaId}/${previewDoc.id}?download=1`}
                  download={previewDoc.nomeFile}
                >
                  <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" />
                    Scarica
                  </Button>
                </a>
                <Button size="sm" onClick={() => setPreviewDoc(null)}>
                  Chiudi
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* DIALOG CONFERMA ELIMINAZIONE */}
      <Dialog open={Boolean(deleteDocId)} onOpenChange={() => setDeleteDocId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Elimina Documento dall&apos;Archivio
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler rimuovere questo documento? Il file verrà rimosso sia dal database dello studio che dal disco fisico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDeleteDocId(null)} disabled={deleting}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleEliminaDoc} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Elimina Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
