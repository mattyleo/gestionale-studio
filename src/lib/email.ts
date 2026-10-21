// src/lib/email.ts
// Servizio invio email per fatture e avvisi di parcella dello Studio

import nodemailer from 'nodemailer'

export interface EmailParams {
  to: string
  subject: string
  text: string
  html?: string
  pdfBuffer?: Buffer | Uint8Array
  filename?: string
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)
  )
}

export function getTransporter() {
  if (!isSmtpConfigured()) {
    return null
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER || 'infooizut@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export async function inviaDocumentoEmail(params: EmailParams): Promise<{
  success: boolean
  inviataSmtp: boolean
  errore?: string
}> {
  const transporter = getTransporter()

  if (!transporter) {
    return {
      success: false,
      inviataSmtp: false,
      errore: 'SMTP non configurato. Puoi configurare SMTP_HOST, SMTP_USER e SMTP_PASS in .env per l\'invio automatico.',
    }
  }

  const from = process.env.SMTP_FROM || `"Dott. Antonio Tuzio" <${process.env.SMTP_USER || 'infooizut@gmail.com'}>`

  const attachments: any[] = []
  if (params.pdfBuffer && params.filename) {
    attachments.push({
      filename: params.filename,
      content: Buffer.from(params.pdfBuffer),
      contentType: 'application/pdf',
    })
  }

  try {
    await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text.replace(/\n/g, '<br/>'),
      attachments,
    })

    return {
      success: true,
      inviataSmtp: true,
    }
  } catch (error: any) {
    console.error('Errore durante l\'invio email:', error)
    return {
      success: false,
      inviataSmtp: false,
      errore: error.message || 'Errore durante l\'invio della mail',
    }
  }
}
