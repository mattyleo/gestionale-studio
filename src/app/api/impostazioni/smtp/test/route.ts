// src/app/api/impostazioni/smtp/test/route.ts
// Test connessione e invio email di prova

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testSmtpConnection } from '@/lib/email'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const body = await req.json()
    const { testEmail, config } = body

    if (!testEmail || !testEmail.includes('@')) {
      return NextResponse.json({ error: 'Inserisci un indirizzo email di prova valido' }, { status: 400 })
    }

    const res = await testSmtpConnection(testEmail.trim(), config)

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 })
    }

    return NextResponse.json(res)
  } catch (err: any) {
    console.error('Errore test SMTP:', err)
    return NextResponse.json({ error: err.message || 'Errore durante il test di invio' }, { status: 500 })
  }
}
