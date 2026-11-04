'use client'
// src/components/aziende/RicercaClienteRapida.tsx
// Ricerca rapida intelligente con autocompletamento e reindirizzamento immediato alla scheda cliente

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Building2,
  User,
  ArrowRight,
  CornerDownLeft,
  X,
  Loader2,
  Landmark,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface RicercaClienteRapidaProps {
  placeholder?: string
  className?: string
  variant?: 'header' | 'page'
  onSelect?: (azienda: any) => void
  onCercaChange?: (text: string) => void
}

export function RicercaClienteRapida({
  placeholder = 'Scrivi il nome del cliente o azienda (es. Rossi, Bar, Edil...)',
  className = '',
  variant = 'page',
  onSelect,
  onCercaChange,
}: RicercaClienteRapidaProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [risultati, setRisultati] = React.useState<any[]>([])
  const [caricamento, setCaricamento] = React.useState(false)
  const [aperto, setAperto] = React.useState(false)
  const [indiceSelezionato, setIndiceSelezionato] = React.useState(0)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Scorciatoia globale da tastiera (Ctrl+K o Cmd+K o "/")
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Chiusura al click esterno
  React.useEffect(() => {
    const handleClickEsterno = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    document.addEventListener('mousedown', handleClickEsterno)
    return () => document.removeEventListener('mousedown', handleClickEsterno)
  }, [])

  // Ricerca con debounce
  React.useEffect(() => {
    if (!query.trim()) {
      setRisultati([])
      setCaricamento(false)
      setAperto(false)
      return
    }

    setCaricamento(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/aziende?cerca=${encodeURIComponent(query.trim())}&perPagina=10&stato=tutte`)
        if (res.ok) {
          const data = await res.json()
          const items = data.aziende ?? []
          setRisultati(items)
          setIndiceSelezionato(0)
          setAperto(true)
        }
      } catch (err) {
        console.error('Errore ricerca rapida clienti:', err)
      } finally {
        setCaricamento(false)
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  // Navigazione verso il cliente
  const vaiAlCliente = (azienda: any) => {
    setAperto(false)
    if (onSelect) {
      onSelect(azienda)
    } else {
      router.push(`/aziende/${azienda.id}`)
    }
  }

  // Gestione tastiera (Invio, Freccia Giù, Freccia Su, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (risultati.length > 0) {
        setIndiceSelezionato((prev) => (prev + 1) % risultati.length)
        setAperto(true)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (risultati.length > 0) {
        setIndiceSelezionato((prev) => (prev - 1 + risultati.length) % risultati.length)
        setAperto(true)
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (risultati.length > 0) {
        const target = risultati[indiceSelezionato] || risultati[0]
        if (target) {
          vaiAlCliente(target)
        }
      }
    } else if (e.key === 'Escape') {
      setAperto(false)
      inputRef.current?.blur()
    }
  }

  const isHeader = variant === 'header'

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input di Ricerca */}
      <div className="relative flex items-center">
        <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isHeader ? 'h-4 w-4 text-gray-400' : 'h-5 w-5 text-indigo-500'}`} />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            if (onCercaChange) onCercaChange(val)
          }}
          onFocus={() => {
            if (risultati.length > 0) setAperto(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-20 transition-all ${
            isHeader
              ? 'h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg'
              : 'h-12 text-base bg-white border-2 border-indigo-100 hover:border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl shadow-sm'
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {caricamento && (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 mr-1" />
          )}

          {query && !caricamento && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setRisultati([])
                setAperto(false)
                if (onCercaChange) onCercaChange('')
                inputRef.current?.focus()
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              title="Cancella ricerca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {isHeader ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded">
              Ctrl+K
            </kbd>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded-md">
              <CornerDownLeft className="h-3 w-3" /> Invio per aprire
            </span>
          )}
        </div>
      </div>

      {/* Menu a Tendina Risultati Immediati */}
      {aperto && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-gray-100 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-3.5 py-2 bg-gradient-to-r from-gray-50 to-indigo-50/30 flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {risultati.length > 0
                ? `${risultati.length} clienti trovati per "${query}"`
                : 'Nessuna corrispondenza trovata'}
            </span>
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              Usa <span className="font-mono bg-white px-1 border rounded">↑</span> <span className="font-mono bg-white px-1 border rounded">↓</span> ed <span className="font-mono bg-white px-1 border rounded">Invio</span> per aprire subito
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {risultati.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Nessun cliente o azienda trovato con "<strong>{query}</strong>".
                <p className="text-xs text-gray-400 mt-1">
                  Verifica l'ortografia oppure inserisci la Partita IVA o il Codice Fiscale.
                </p>
              </div>
            ) : (
              risultati.map((azienda, idx) => {
                const selezionato = idx === indiceSelezionato
                const isPersonaFisica = azienda.tipoSoggetto === 'PERSONA_FISICA'

                return (
                  <div
                    key={azienda.id}
                    onClick={() => vaiAlCliente(azienda)}
                    onMouseEnter={() => setIndiceSelezionato(idx)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                      selezionato
                        ? 'bg-indigo-50/80 text-indigo-900 border-l-4 border-l-indigo-600 pl-3'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isPersonaFisica
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isPersonaFisica ? (
                          <User className="h-5 w-5" />
                        ) : azienda.tipoSoggetto === 'PA' ? (
                          <Landmark className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 group-hover:text-indigo-600 truncate">
                            {azienda.ragioneSociale}
                          </span>
                          {azienda.archiviata && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 bg-gray-200">
                              Archiviata
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                          {azienda.partitaIva && <span>P.IVA: {azienda.partitaIva}</span>}
                          {azienda.codiceFiscale && azienda.codiceFiscale !== azienda.partitaIva && (
                            <span>CF: {azienda.codiceFiscale}</span>
                          )}
                          {azienda.comune && (
                            <span className="font-sans text-gray-400">
                              · {azienda.comune} {azienda.provincia ? `(${azienda.provincia})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {selezionato ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-md">
                          Apri scheda <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {risultati.length > 0 && (
            <div className="p-2.5 bg-gray-50/90 text-center border-t border-gray-100">
              <button
                type="button"
                onClick={() => vaiAlCliente(risultati[indiceSelezionato] || risultati[0])}
                className="w-full text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1.5 py-1"
              >
                <span>Premi <strong>Invio</strong> per andare direttamente a <strong>{(risultati[indiceSelezionato] || risultati[0])?.ragioneSociale}</strong></span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
