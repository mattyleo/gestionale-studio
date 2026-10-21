'use client'
// src/app/login/page.tsx

import * as React from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail] = React.useState('infooizut@gmail.com')
  const [password, setPassword] = React.useState('Admin1234!')
  const [errore, setErrore] = React.useState<string | null>(
    errorParam === 'CredentialsSignin' ? 'Credenziali non valide. Riprova.' : null
  )
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrore(null)
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setErrore('Credenziali non valide. Controlla email e password.')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setErrore('Si è verificato un errore. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Errore globale */}
      {errore && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{errore}</p>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="mario.rossi@studio.it"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" required>
            Password
          </Label>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loading || !email || !password}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Accesso in corso...
          </>
        ) : (
          'Accedi al Gestionale'
        )}
      </Button>

      {/* Demo helper */}
      <div className="pt-2 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-500">Credenziali demo precompilate (Dott. Tuzio)</p>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Titolo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4 shadow-md">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gestionale Studio</h1>
          <p className="mt-1 text-sm text-gray-500">Dott. Antonio Tuzio — Commercialista</p>
        </div>

        {/* Card form con Suspense */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <React.Suspense fallback={<div className="py-12 text-center text-sm text-gray-400">Caricamento...</div>}>
            <LoginForm />
          </React.Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Sviluppato da Leoni Mattia · Reggio Emilia
        </p>
      </div>
    </div>
  )
}
