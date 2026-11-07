'use client'

import * as React from 'react'
import { Search, Building2, User, Check, X, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface AziendaOption {
  id: string
  ragioneSociale: string
  codiceFiscale?: string | null
  partitaIva?: string | null
  comune?: string | null
  provincia?: string | null
  tipoSoggetto?: string | null
}

interface SelettoreClienteComboboxProps {
  value?: string | null
  onValueChange: (aziendaId: string, azienda?: AziendaOption | null) => void
  aziende?: AziendaOption[]
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  includeAllOption?: boolean
  allOptionLabel?: string
}

export function SelettoreClienteCombobox({
  value,
  onValueChange,
  aziende = [],
  placeholder = 'Digita il nome del cliente o azienda...',
  required = false,
  disabled = false,
  className = '',
  includeAllOption = false,
  allOptionLabel = 'Tutte le aziende',
}: SelettoreClienteComboboxProps) {
  const [aperto, setAperto] = React.useState(false)
  const [ricerca, setRicerca] = React.useState('')
  const [risultatiRemoti, setRisultatiRemoti] = React.useState<AziendaOption[]>([])
  const [caricamento, setCaricamento] = React.useState(false)
  const [indiceSelezionato, setIndiceSelezionato] = React.useState(0)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Trova l'azienda selezionata tra quelle precaricate o remote
  const aziendaSelezionata = React.useMemo(() => {
    if (!value || value === 'TUTTE') return null
    return (
      aziende.find((a) => a.id === value) ||
      risultatiRemoti.find((a) => a.id === value) ||
      null
    )
  }, [value, aziende, risultatiRemoti])

  // Chiusura al clic fuori dal componente
  React.useEffect(() => {
    const handleClickEsterno = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickEsterno)
    return () => document.removeEventListener('mousedown', handleClickEsterno)
  }, [])

  // Ricerca remota di supporto se la lista locale non ha risultati o se si digita
  React.useEffect(() => {
    if (!ricerca.trim() || ricerca.length < 2) {
      setRisultatiRemoti([])
      setCaricamento(false)
      return
    }

    setCaricamento(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/aziende?cerca=${encodeURIComponent(ricerca.trim())}&perPagina=30&stato=tutte`)
        if (res.ok) {
          const data = await res.json()
          setRisultatiRemoti(data.aziende ?? [])
          setIndiceSelezionato(0)
        }
      } catch (err) {
        console.error('Errore ricerca aziende combobox:', err)
      } finally {
        setCaricamento(false)
      }
    }, 150)

    return () => clearTimeout(timer)
  }, [ricerca])

  // Lista unificata e filtrata
  const opzioniFiltrate = React.useMemo(() => {
    const q = ricerca.trim().toLowerCase()
    
    // Mappa unificata per ID per evitare duplicati tra locali e remote
    const mappa = new Map<string, AziendaOption>()
    
    // Prima quelle locali
    for (const az of aziende) {
      mappa.set(az.id, az)
    }
    // Poi quelle remote
    for (const az of risultatiRemoti) {
      mappa.set(az.id, az)
    }

    const unione = Array.from(mappa.values())

    if (!q) {
      return unione
    }

    return unione.filter((a) => {
      const matchNome = (a.ragioneSociale || '').toLowerCase().includes(q)
      const matchCf = (a.codiceFiscale || '').toLowerCase().includes(q)
      const matchPiva = (a.partitaIva || '').toLowerCase().includes(q)
      const matchComune = (a.comune || '').toLowerCase().includes(q)
      return matchNome || matchCf || matchPiva || matchComune
    })
  }, [aziende, risultatiRemoti, ricerca])

  const selezionaAzienda = (az: AziendaOption | null) => {
    if (az) {
      onValueChange(az.id, az)
    } else {
      onValueChange(includeAllOption ? 'TUTTE' : '', null)
    }
    setAperto(false)
    setRicerca('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!aperto) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        setAperto(true)
      }
      return
    }

    const totalCount = opzioniFiltrate.length + (includeAllOption ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (totalCount > 0) {
        setIndiceSelezionato((prev) => (prev + 1) % totalCount)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (totalCount > 0) {
        setIndiceSelezionato((prev) => (prev - 1 + totalCount) % totalCount)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (includeAllOption && indiceSelezionato === 0) {
        selezionaAzienda(null)
      } else {
        const offset = includeAllOption ? 1 : 0
        const az = opzioniFiltrate[indiceSelezionato - offset]
        if (az) {
          selezionaAzienda(az)
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAperto(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full min-w-0', className)}>
      {/* Box di visualizzazione / input di ricerca */}
      {aziendaSelezionata && !aperto ? (
        <div
          onClick={() => {
            if (!disabled) {
              setAperto(true)
              setTimeout(() => inputRef.current?.focus(), 50)
            }
          }}
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-2 border rounded-md bg-white text-sm cursor-pointer transition-colors shadow-sm w-full min-w-0 overflow-hidden',
            disabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'hover:border-blue-400 hover:bg-blue-50/20 border-gray-300'
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
            {aziendaSelezionata.tipoSoggetto === 'PERSONA_FISICA' ? (
              <User className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold text-gray-900 truncate shrink min-w-0">
              {aziendaSelezionata.ragioneSociale}
            </span>
            {aziendaSelezionata.comune && (
              <span className="text-xs text-gray-400 truncate shrink-0 hidden sm:inline">
                ({aziendaSelezionata.comune})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  selezionaAzienda(null)
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                title="Rimuovi selezione"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={ricerca}
            onChange={(e) => {
              setRicerca(e.target.value)
              if (!aperto) setAperto(true)
            }}
            onFocus={() => setAperto(true)}
            onKeyDown={handleKeyDown}
            placeholder={
              aziendaSelezionata
                ? aziendaSelezionata.ragioneSociale
                : value === 'TUTTE'
                ? allOptionLabel
                : placeholder
            }
            className={cn(
              'pl-9 pr-8 h-9 text-sm border-gray-300 focus-visible:ring-blue-500 bg-white shadow-sm',
              aperto && 'ring-2 ring-blue-500 border-blue-500'
            )}
          />
          {caricamento ? (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-spin" />
          ) : ricerca ? (
            <button
              type="button"
              onClick={() => {
                setRicerca('')
                inputRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <ChevronsUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          )}
        </div>
      )}

      {/* Dropdown dei risultati */}
      {aperto && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto divide-y divide-gray-100">
          {includeAllOption && (
            <button
              type="button"
              onClick={() => selezionaAzienda(null)}
              className={cn(
                'w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors',
                indiceSelezionato === 0 ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              )}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span>{allOptionLabel}</span>
              </div>
              {(!value || value === 'TUTTE') && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          )}

          {opzioniFiltrate.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              {caricamento ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Ricerca in corso...</span>
                </div>
              ) : (
                <span>Nessuna azienda o cliente trovato con &quot;<strong>{ricerca}</strong>&quot;</span>
              )}
            </div>
          ) : (
            opzioniFiltrate.map((az, idx) => {
              const itemIdx = includeAllOption ? idx + 1 : idx
              const isEvidenziato = indiceSelezionato === itemIdx
              const isSelezionato = value === az.id

              return (
                <button
                  key={az.id}
                  type="button"
                  onClick={() => selezionaAzienda(az)}
                  onMouseEnter={() => setIndiceSelezionato(itemIdx)}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer',
                    isEvidenziato ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-gray-50 text-gray-800',
                    isSelezionato && 'bg-blue-50 font-medium'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {az.tipoSoggetto === 'PERSONA_FISICA' ? (
                        <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      )}
                      <span className="font-semibold text-xs sm:text-sm truncate">
                        {az.ragioneSociale}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 pl-5">
                      {az.partitaIva && (
                        <span>P.IVA: <strong className="font-mono text-gray-600">{az.partitaIva}</strong></span>
                      )}
                      {az.codiceFiscale && !az.partitaIva && (
                        <span>CF: <strong className="font-mono text-gray-600">{az.codiceFiscale}</strong></span>
                      )}
                      {az.comune && (
                        <span>• {az.comune} {az.provincia ? `(${az.provincia})` : ''}</span>
                      )}
                    </div>
                  </div>

                  {isSelezionato && (
                    <Check className="h-4 w-4 text-blue-600 shrink-0 ml-2" />
                  )}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
