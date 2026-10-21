'use client'
// src/app/(dashboard)/report/page.tsx

import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatEuro } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const COLORI = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#dc2626', '#d97706']

export default function ReportPage() {
  const { toast } = useToast()
  const [dati, setDati] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [anno, setAnno] = React.useState(String(new Date().getFullYear()))

  const anni = Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i))

  const carica = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/report?anno=${anno}`)
      if (!res.ok) throw new Error()
      setDati(await res.json())
    } catch {
      toast({ title: 'Errore caricamento report', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [anno, toast])

  React.useEffect(() => { carica() }, [carica])

  const aziende: any[] = dati?.aziende ?? []
  const mensile: any[] = dati?.mensile ?? []
  const totEmesso = aziende.reduce((s: number, a: any) => s + (a.emesso ?? 0), 0)
  const totIncassato = aziende.reduce((s: number, a: any) => s + (a.incassato ?? 0), 0)
  const totResiduo = totEmesso - totIncassato

  const esportaCsv = () => {
    const righe = [
      ['Azienda', 'Emesso', 'Incassato', 'Residuo', 'N° Fatture'],
      ...aziende.map((a: any) => [
        a.ragioneSociale,
        a.emesso.toFixed(2).replace('.', ','),
        a.incassato.toFixed(2).replace('.', ','),
        (a.emesso - a.incassato).toFixed(2).replace('.', ','),
        String(a.nFatture ?? 0),
      ]),
      ['TOTALE', totEmesso.toFixed(2).replace('.', ','), totIncassato.toFixed(2).replace('.', ','), totResiduo.toFixed(2).replace('.', ','), ''],
    ]
    const csv = righe.map(r => r.map(c => `"${c}"`).join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `report_${anno}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report</h2>
          <p className="text-sm text-gray-500 mt-0.5">Analisi fatturato per azienda e periodo</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={anno} onValueChange={setAnno}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anni.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={carica}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={esportaCsv} disabled={aziende.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Fatturato emesso {anno}</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{loading ? '…' : formatEuro(totEmesso)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Incassato {anno}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{loading ? '…' : formatEuro(totIncassato)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Residuo</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{loading ? '…' : formatEuro(totResiduo)}</p>
        </CardContent></Card>
      </div>

      {/* Grafico mensile + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Andamento mensile {anno}</CardTitle></CardHeader>
          <CardContent>
            {loading || mensile.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                {loading ? 'Caricamento…' : 'Nessun dato'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mensile}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [formatEuro(Number(v)), '']} contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="emesso" name="Emesso" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="incassato" name="Incassato" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Ripartizione per azienda</CardTitle></CardHeader>
          <CardContent>
            {loading || aziende.length === 0 ? (
              <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
                {loading ? 'Caricamento…' : 'Nessun dato'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={aziende.map((a: any, i: number) => ({ name: a.ragioneSociale, value: a.emesso }))}
                    cx="50%" cy="50%" outerRadius={80}
                    dataKey="value"
                    label={({ percent }) => percent != null ? `${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {aziende.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORI[i % COLORI.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatEuro(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabella per azienda */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dettaglio per azienda — {anno}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Caricamento…</div>
          ) : aziende.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nessuna fattura emessa nel {anno}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Azienda</TableHead>
                  <TableHead className="text-right">N° Fatture</TableHead>
                  <TableHead className="text-right">Emesso</TableHead>
                  <TableHead className="text-right">Incassato</TableHead>
                  <TableHead className="text-right">Residuo</TableHead>
                  <TableHead className="text-right">% Incassato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aziende.map((a: any, i: number) => {
                  const residuo = a.emesso - a.incassato
                  const pct = a.emesso > 0 ? Math.round((a.incassato / a.emesso) * 100) : 0
                  return (
                    <TableRow key={a.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORI[i % COLORI.length] }} />
                          <span className="font-medium">{a.ragioneSociale}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-500">{a.nFatture ?? 0}</TableCell>
                      <TableCell className="text-right">{formatEuro(a.emesso)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatEuro(a.incassato)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatEuro(residuo)}</TableCell>
                      <TableCell className="text-right">
                        <span className={pct === 100 ? 'text-green-600 font-semibold' : pct < 50 ? 'text-red-500' : 'text-gray-700'}>
                          {pct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-gray-50 font-bold border-t-2">
                  <TableCell>Totale</TableCell>
                  <TableCell className="text-right text-gray-500">{aziende.reduce((s: number, a: any) => s + (a.nFatture ?? 0), 0)}</TableCell>
                  <TableCell className="text-right">{formatEuro(totEmesso)}</TableCell>
                  <TableCell className="text-right text-green-600">{formatEuro(totIncassato)}</TableCell>
                  <TableCell className="text-right text-red-500">{formatEuro(totResiduo)}</TableCell>
                  <TableCell className="text-right">
                    {totEmesso > 0 ? `${Math.round((totIncassato / totEmesso) * 100)}%` : '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
