'use client'
// src/app/(dashboard)/dashboard/page.tsx — con dati reali dall'API

import * as React from 'react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, FileEdit, Clock, TrendingUp, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatEuro } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PERIODI = [
  { value: 'mese-corrente', label: 'Questo mese' },
  { value: 'mese-precedente', label: 'Mese scorso' },
  { value: 'trimestre', label: 'Ultimo trimestre' },
  { value: 'anno', label: 'Anno corrente' },
]

export default function DashboardPage() {
  const [periodo, setPeriodo] = React.useState('mese-corrente')
  const [dati, setDati] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const caricaDati = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?periodo=${periodo}`)
      if (!res.ok) throw new Error('Errore API')
      setDati(await res.json())
    } catch {
      // fallback silenzioso
    } finally {
      setLoading(false)
    }
  }, [periodo])

  React.useEffect(() => { caricaDati() }, [caricaDati])

  const kpi = dati?.kpi ?? {}
  const grafico = dati?.grafico ?? []
  const aziende = dati?.aziende ?? []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">Panoramica attività e fatturazione</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODI.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={caricaDati}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/attivita?stato=DA_VERIFICARE">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Da verificare</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {loading ? '…' : kpi.attivitaDaVerificare ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">attività</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/attivita?stato=APPROVATA">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Non fatturato</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {loading ? '…' : formatEuro(kpi.valoreNonFatturato ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">attività approvate</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fatture/bozze">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Bozze</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    {loading ? '…' : kpi.bozzeBcount ?? kpi.bozzeCount ?? 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {loading ? '' : formatEuro(kpi.bozzeImporto ?? 0)}
                  </p>
                </div>
                <FileEdit className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/fatture/da-incassare">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Da incassare</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {loading ? '…' : formatEuro(kpi.daIncassare ?? 0)}
                  </p>
                  {(kpi.scaduto ?? 0) > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      di cui {formatEuro(kpi.scaduto)} scaduto
                    </p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Grafico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Andamento mensile</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Caricamento…</div>
          ) : grafico.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grafico} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [formatEuro(Number(value)), '']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }} />
                <Bar dataKey="emesso" name="Emesso" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="incassato" name="Incassato" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabella per azienda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Riepilogo per azienda</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Caricamento…</div>
          ) : aziende.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nessuna fattura emessa nel periodo selezionato</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead className="text-right">Emesso</TableHead>
                  <TableHead className="text-right">Incassato</TableHead>
                  <TableHead className="text-right">Residuo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aziende.map((a: any) => (
                  <TableRow key={a.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{a.ragioneSociale}</TableCell>
                    <TableCell className="text-right">{formatEuro(a.emesso)}</TableCell>
                    <TableCell className="text-right text-green-600">{formatEuro(a.incassato)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatEuro(a.residuo)}</TableCell>
                  </TableRow>
                ))}
                {/* Totali */}
                <TableRow className="bg-gray-50 font-bold border-t-2">
                  <TableCell>Totale</TableCell>
                  <TableCell className="text-right">{formatEuro(kpi.fatturatoEmesso ?? 0)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatEuro(kpi.fatturatoIncassato ?? 0)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatEuro(kpi.daIncassare ?? 0)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
