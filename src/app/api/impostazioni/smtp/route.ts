// src/app/api/impostazioni/smtp/route.ts
// Lettura e salvataggio configurazione server di posta SMTP

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSmtpConfig, saveSmtpConfig, isSmtpConfigured } from '@/lib/email'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const conf = getSmtpConfig()
  return NextResponse.json({
    host: conf.host,
    port: conf.port,
    secure: conf.secure,
    user: conf.user,
    from: conf.from,
    hasPassword: Boolean(conf.pass && conf.pass.trim().length > 0),
    isConfigured: isSmtpConfigured(),
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  try {
    const body = await req.json()
    const { host, port, secure, user, pass, from } = body

    if (!user || !user.trim()) {
      return NextResponse.json({ error: 'Inserisci un indirizzo email utente' }, { status: 400 })
    }

    const saved = saveSmtpConfig({
      host,
      port: Number(port) || 465,
      secure: Boolean(secure),
      user: user.trim(),
      pass: pass !== undefined ? pass.trim() : undefined,
      from: from ? from.trim() : undefined,
    })

    return NextResponse.json({
      success: true,
      message: 'Configurazione SMTP salvata con successo',
      isConfigured: isSmtpConfigured(),
      hasPassword: Boolean(saved.pass && saved.pass.trim().length > 0),
    })
  } catch (err: any) {
    console.error('Errore salvataggio SMTP:', err)
    return NextResponse.json({ error: err.message || 'Errore nel salvataggio' }, { status: 500 })
  }
}
