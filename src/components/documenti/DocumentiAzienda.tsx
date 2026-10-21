'use client'
// src/components/documenti/DocumentiAzienda.tsx
// Tab documenti azienda: upload, lista, anteprima, download, eliminazione

import * as React from 'react'
import {
  Upload, FileText, Image, Trash2, Download, Eye,
  AlertTriangle, Plus, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatData } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const TIPI_DOC = [
  { value: 'carta_identita', label: 'Carta d\'identità' },
  { value: 'passaporto', label: 'Passaporto' },
  { value: 'patente', label: 'Patente di guida' },
  { value: 'tessera_sanitaria', label: 'Tessera sanitaria' },
  { value: 'visura_camerale', label: 'Visura camerale' },
  { value: 'contratto', label: 'Contratto' },
  { value: 'delega', label: 'Delega / Procura' },
  { value: 'altro', label: 'Altro documento' },
]

function tipoDocLabel(t: string) {
  return TIPI_DOC.find(d => d.value === t)?.label ?? t
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImmagine(mimeType: string) {
  return mimeType.startsWith('image/')
}

function scadenzaColore(scadenza: string | null) {
  if (!scadenza) return ''
  const diff = (new Date(scadenza).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'text-red-600 font-semibold'
  if (diff < 30) return 'text-orange-500 font-semibold'
  return 'text-gray-500'
}

export function DocumentiAzienda({ aziendaId }: { aziendaId: string }) {
  const { toast } = useToast()
  const [documenti, setDocumenti] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploadDialog, setUploadDialog] = React.useState(false)
  const [anteprimaDoc, setAnteprimaDoc] = React.useState<any>(null)
  const [eliminaId, setEliminaId] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [eliminando, setEliminando] = React.useState(false)

  // Form upload
  const [file, setFile] = React.useState<File | null>(null)
  const [tipoDoc, setTipoDoc] = React.useState('carta_identita')
  const [note, setNote] = React.useState('')
  const [scadenza, setScadenza] = React.useState('')
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const carica = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/documenti`)
      const dati = await res.json()
      setDocumenti(dati.documenti ?? [])
    } catch {
      toast({ title: 'Errore caricamento documenti', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [aziendaId, toast])

  React.useEffect(() => { carica() }, [carica])

  const handleFileSelect = (f: File) => {
    const AMMESSI = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
    if (!AMMESSI.includes(f.type)) {
      toast({ title: 'Tipo file non valido', description: 'Carica solo JPG, PNG, WEBP o PDF', variant: 'destructive' })
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: 'File troppo grande', description: 'Massimo 10 MB', variant: 'destructive' })
      return
    }
    setFile(f)
    // Auto-seleziona tipo da nome file
    const nome = f.name.toLowerCase()
    if (nome.includes('carta') || nome.includes('identit') || nome.includes('cie')) setTipoDoc('carta_identita')
    else if (nome.includes('passaporto')) setTipoDoc('passaporto')
    else if (nome.includes('visura')) setTipoDoc('visura_camerale')
    else if (nome.includes('patente')) setTipoDoc('patente')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('tipoDoc', tipoDoc)
      fd.append('note', note)
      if (scadenza) fd.append('scadenza', scadenza)

      const res = await fetch(`/api/aziende/${aziendaId}/documenti`, { method: 'POST', body: fd })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)

      toast({ title: '✅ Documento caricato', description: dati.messaggio })
      setUploadDialog(false)
      resetForm()
      carica()
    } catch (e: any) {
      toast({ title: 'Errore upload', description: e.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleElimina = async () => {
    if (!eliminaId) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/aziende/${aziendaId}/documenti/${eliminaId}`, { method: 'DELETE' })
      const dati = await res.json()
      if (!res.ok) throw new Error(dati.error)
      toast({ title: 'Documento eliminato' })
      setEliminaId(null)
      carica()
    } catch (e: any) {
      toast({ title: 'Errore', description: e.message, variant: 'destructive' })
    } finally {
      setEliminando(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setTipoDoc('carta_identita')
    setNote('')
    setScadenza('')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {documenti.length === 0 ? 'Nessun documento caricato' : `${documenti.length} documento${documenti.length !== 1 ? 'i' : ''}`}
        </p>
        <Button size="sm" onClick={() => setUploadDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Carica documento
        </Button>
      </div>

      {/* Lista documenti */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : documenti.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => setUploadDialog(true)}
        >
          <Upload className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Nessun documento</p>
          <p className="text-xs text-gray-400 mt-1">Clicca o trascina qui carte d'identità, PDF e altri documenti</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documenti.map((doc) => (
            <div
              key={doc.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-colors group"
            >
              {/* Icona */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                {isImmagine(doc.mimeType) ? (
                  <Image className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate" title={doc.nomeFile}>
                  {doc.nomeFile}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="secondary" className="text-xs py-0">
                    {tipoDocLabel(doc.tipoDoc)}
                  </Badge>
                  <span className="text-xs text-gray-400">{formatBytes(doc.dimensione)}</span>
                </div>
                {doc.scadenza && (
                  <p className={`text-xs mt-0.5 ${scadenzaColore(doc.scadenza)}`}>
                    Scade: {formatData(doc.scadenza)}
                  </p>
                )}
                {doc.note && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.note}</p>
                )}
                <p className="text-xs text-gray-300 mt-0.5">
                  {formatData(doc.createdAt)} · {doc.uploadedByUser?.name ?? 'Sistema'}
                </p>
              </div>

              {/* Azioni */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImmagine(doc.mimeType) && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setAnteprimaDoc(doc)}
                    title="Anteprima"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  onClick={() => window.open(`/api/aziende/${aziendaId}/documenti/${doc.id}`, '_blank')}
                  title="Scarica"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => setEliminaId(doc.id)}
                  title="Elimina"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Upload */}
      <Dialog open={uploadDialog} onOpenChange={(o) => { setUploadDialog(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Carica documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Zona drop */}
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  {isImmagine(file.type) ? (
                    <Image className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-400">({formatBytes(file.size)})</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Clicca o trascina il file qui</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, HEIC, PDF · max 10 MB</p>
                </>
              )}
            </div>

            {/* Tipo documento */}
            <div className="space-y-1.5">
              <Label>Tipo documento</Label>
              <select
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={tipoDoc}
                onChange={e => setTipoDoc(e.target.value)}
              >
                {TIPI_DOC.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Scadenza (opzionale) */}
            <div className="space-y-1.5">
              <Label>Data scadenza <span className="text-gray-400 text-xs">(opzionale)</span></Label>
              <Input
                type="date"
                value={scadenza}
                onChange={e => setScadenza(e.target.value)}
                placeholder="es. data scadenza CI"
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label>Note <span className="text-gray-400 text-xs">(opzionale)</span></Label>
              <Input
                placeholder="es. fronte e retro, referente Rossi Mario…"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialog(false); resetForm() }}>Annulla</Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Caricamento…</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Carica</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Anteprima immagine */}
      <Dialog open={!!anteprimaDoc} onOpenChange={(o) => !o && setAnteprimaDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{anteprimaDoc?.nomeFile}</DialogTitle>
          </DialogHeader>
          {anteprimaDoc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/aziende/${aziendaId}/documenti/${anteprimaDoc.id}?inline=1`}
              alt={anteprimaDoc.nomeFile}
              className="max-h-[70vh] object-contain mx-auto rounded"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnteprimaDoc(null)}>Chiudi</Button>
            <Button onClick={() => window.open(`/api/aziende/${aziendaId}/documenti/${anteprimaDoc?.id}`, '_blank')}>
              <Download className="h-4 w-4 mr-2" /> Scarica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma eliminazione */}
      <Dialog open={!!eliminaId} onOpenChange={(o) => !o && setEliminaId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Eliminare il documento?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Il file verrà eliminato definitivamente dal server. L'operazione non può essere annullata.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminaId(null)}>Annulla</Button>
            <Button variant="destructive" onClick={handleElimina} disabled={eliminando}>
              {eliminando ? 'Eliminazione…' : 'Sì, elimina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
