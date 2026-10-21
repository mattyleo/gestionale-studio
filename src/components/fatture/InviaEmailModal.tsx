'use client'
// src/components/fatture/InviaEmailModal.tsx
// Modal per l'invio via email di Avviso di Parcella o Fattura con PDF allegato

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Send, Loader2, CheckCircle2, AlertCircle, ExternalLink, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InviaEmailModalProps {
  fatturaId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function InviaEmailModal({ fatturaId, trigger, onSuccess }: InviaEmailModalProps) {
  const { toast } = useToast()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [inviando, setInviando] = React.useState(false)
  const [dati, setDati] = React.useState<any>(null)

  const [to, setTo] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [message, setMessage] = React.useState('')

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fatture/${fatturaId}/invia-email`)
      const d = await res.json()
      if (res.ok) {
        setDati(d)
        setTo(d.emailDestinatario || '')
        setSubject(d.oggetto || '')
        setMessage(d.testo || '')
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile preparare l\'email', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [fatturaId, toast])

  React.useEffect(() => {
    if (open) {
      caricaDati()
    }
  }, [open, caricaDati])

  const handleInviaSmtp = async () => {
    if (!to.trim()) {
      toast({ title: 'Inserisci un\'email destinatario', variant: 'destructive' })
      return
    }

    setInviando(true)
    try {
      const res = await fetch(`/api/fatture/${fatturaId}/invia-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          subject,
          message,
        }),
      })

      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.errore || 'Errore durante l\'invio')
      }

      toast({ title: '✅ Email inviata con successo!', description: `Documento inviato a ${to}` })
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      toast({
        title: 'Invio non riuscito',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setInviando(false)
    }
  }

  const apriClientPosta = () => {
    if (dati?.mailtoUrl) {
      window.location.href = dati.mailtoUrl
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <Mail className="h-4 w-4 mr-2 text-blue-600" /> Invia Email
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Invia Documento via Email
          </DialogTitle>
          <DialogDescription>
            Invia direttamente {dati?.isBozza ? "l'Avviso di Parcella (Proforma)" : 'la copia di cortesia della Fattura'} con il PDF allegato.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-2 text-sm">
            <div>
              <Label>Destinatario Email *</Label>
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="cliente@azienda.it"
              />
              {!to && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Il cliente non ha ancora un'email inserita in anagrafica. Inseriscila qui per inviarla subito.
                </p>
              )}
            </div>

            <div>
              <Label>Oggetto</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div>
              <Label>Messaggio di cortesia</Label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 p-2.5 text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-gray-700">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Allegato:</strong> Il PDF ufficiale del documento verrà generato e allegato automaticamente alla spedizione.
              </span>
            </div>

            {!dati?.smtpConfigurato && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">SMTP server non ancora configurato nel file .env</p>
                  <p className="mt-0.5 text-amber-800">
                    Puoi inviare subito la mail aprendola precompilata nel tuo programma di posta (Outlook, Thunderbird, Apple Mail o Gmail Web), oppure inserire i dati SMTP in Impostazioni.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-between items-center w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={apriClientPosta}
            className="text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
            title="Apre la mail precompilata nel programma di posta predefinito del computer"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Apri nel Client di Posta (Outlook/Gmail)
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={inviando}>
              Chiudi
            </Button>
            {dati?.smtpConfigurato && (
              <Button
                onClick={handleInviaSmtp}
                disabled={inviando || !to.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {inviando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Invia Subito
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
