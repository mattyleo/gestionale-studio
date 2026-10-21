'use client'
// src/components/aruba/ImportaArubaModal.tsx
// Modal per l'importazione diretta dal browser di file ZIP o XML esportati da Aruba

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileArchive, Building2 } from 'lucide-react'
import { formatEuro } from '@/lib/utils'

interface ImportaArubaModalProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function ImportaArubaModal({ trigger, onSuccess }: ImportaArubaModalProps) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [segnaSaldate, setSegnaSaldate] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [errore, setErrore] = React.useState<string | null>(null)
  const [esito, setEsito] = React.useState<any | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setErrore(null)
      setEsito(null)
    }
  }

  const handleImporta = async () => {
    if (!file) {
      setErrore('Seleziona prima un file ZIP o XML')
      return
    }

    setLoading(true)
    setErrore(null)
    setEsito(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('saldate', String(segnaSaldate))

      const res = await fetch('/api/aruba/importa', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'importazione')
      }

      setEsito(data)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setErrore(err.message || 'Errore imprevisto durante l\'elaborazione del file')
    } finally {
      setLoading(false)
    }
  }

  const chiudiERicarica = () => {
    setOpen(false)
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            <UploadCloud className="h-4 w-4 mr-2 text-orange-600" />
            Importa da Aruba (ZIP / XML)
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
            <FileArchive className="h-5 w-5 text-orange-600" />
            Importazione Storico Aruba
          </DialogTitle>
          <DialogDescription>
            Carica il file <strong>.ZIP</strong> massivo o i singoli file <strong>.XML / .p7m</strong> esportati da Aruba.
          </DialogDescription>
        </DialogHeader>

        {!esito ? (
          <div className="space-y-4 py-2">
            {/* Box drag and drop */}
            <label className="border-2 border-dashed border-gray-300 hover:border-orange-500 bg-gray-50 hover:bg-orange-50/30 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <UploadCloud className="h-10 w-10 text-orange-500 mb-2" />
              <span className="font-medium text-gray-800 text-sm">
                {file ? file.name : 'Clicca qui per selezionare il file ZIP o XML'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Supporta archivi ZIP completi con tutte le fatture'}
              </span>
              <input
                type="file"
                accept=".zip,.xml,.p7m"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>

            {/* Opzione saldate */}
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
              <input
                type="checkbox"
                id="segnaSaldateCheck"
                checked={segnaSaldate}
                onChange={(e) => setSegnaSaldate(e.target.checked)}
                className="h-4 w-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                disabled={loading}
              />
              <label htmlFor="segnaSaldateCheck" className="text-gray-700 text-xs cursor-pointer select-none">
                Segna le fatture storiche importate come <strong>già saldate/incassate</strong> (consigliato per lo storico)
              </label>
            </div>

            {/* Messaggio di errore */}
            {errore && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errore}</span>
              </div>
            )}
          </div>
        ) : (
          /* Esito completato */
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-green-900">Importazione Completata con Successo!</h3>
              <p className="text-sm text-green-700 mt-1">Tutti i dati storici sono stati integrati nel database.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-gray-500">Fatture Importate</div>
                <div className="text-xl font-bold text-gray-900">{esito.fattureImportate}</div>
                {esito.fattureSaltate > 0 && (
                  <div className="text-xs text-amber-600">({esito.fattureSaltate} già presenti saltate)</div>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-gray-500">Clienti Aggiunti/Aggiornati</div>
                <div className="text-xl font-bold text-gray-900">{esito.clientiCreati + esito.clientiAggiornati}</div>
              </div>
              <div className="col-span-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-700">Volume Totale Storico Fatturato</div>
                <div className="text-xl font-bold text-blue-900">{formatEuro(esito.totaleImporto)}</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {!esito ? (
            <div className="flex justify-end gap-2 w-full">
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Annulla
              </Button>
              <Button
                onClick={handleImporta}
                disabled={!file || loading}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Elaborazione in corso...
                  </>
                ) : (
                  'Avvia Importazione'
                )}
              </Button>
            </div>
          ) : (
            <Button onClick={chiudiERicarica} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Vedi i Dati Importati
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
