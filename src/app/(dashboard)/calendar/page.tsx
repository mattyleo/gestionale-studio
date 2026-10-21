'use client'
// src/app/(dashboard)/calendar/page.tsx
// Placeholder Calendar — Google OAuth da configurare

import { Calendar, Settings, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Google Calendar</h2>
        <p className="text-sm text-gray-500 mt-0.5">Importa eventi da Google Calendar come attività</p>
      </div>

      <Card className="border-blue-100 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-blue-900">Integrazione non ancora configurata</p>
              <p className="text-sm text-blue-700">
                Per collegare Google Calendar occorre configurare le credenziali OAuth 2.0
                nella Google Cloud Console e inserirle nelle Impostazioni dell'applicazione.
              </p>
              <p className="text-sm text-blue-700">
                Tutte le altre funzionalità (aziende, attività manuali, fatture, pagamenti)
                sono pienamente operative senza questa integrazione.
              </p>
              <div className="pt-2">
                <Link href="/impostazioni?tab=google-calendar">
                  <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                    <Settings className="h-4 w-4 mr-2" /> Configura in Impostazioni
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Come funzionerà</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-gray-600">
            {[
              'Configura le credenziali OAuth 2.0 di Google Cloud in Impostazioni',
              'Autorizza l\'accesso ai calendari che vuoi importare',
              'Seleziona quali calendari sincronizzare (es. escludi quello personale)',
              'Gli eventi vengono importati come attività in stato "Da classificare"',
              'Per ogni evento assegna: azienda, tipo prestazione, quantità fatturabile',
              'Le attività classificate diventano "Da verificare" e poi "Approvate"',
              'Un evento cancellato dopo l\'approvazione viene segnalato, non cancellato automaticamente',
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formato eventi consigliato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>Per il riconoscimento automatico azienda/prestazione, usa questo formato nel titolo degli eventi:</p>
          <code className="block bg-gray-100 rounded-lg px-4 py-3 text-xs font-mono text-gray-800">
            [AZIENDA:XYZ] [ATTIVITA:BUSTE_PAGA] quantità=12
          </code>
          <p className="text-xs text-gray-400">
            Le regole di parsing sono configurabili. Se il riconoscimento è ambiguo, l'evento va in "Da classificare".
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
