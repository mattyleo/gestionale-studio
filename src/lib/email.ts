// src/lib/email.ts
// Servizio invio email per fatture e avvisi di parcella dello Studio Dott. Antonio Tuzio

import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

export interface EmailParams {
  to: string
  subject: string
  text: string
  html?: string
  pdfBuffer?: Buffer | Uint8Array
  filename?: string
}

export interface SmtpConfigData {
  host: string
  port: number
  secure: boolean
  user: string
  pass?: string
  from?: string
}

const CONFIG_PATH = path.join(process.cwd(), 'uploads', 'smtp-config.json')

export function getSmtpConfig(): SmtpConfigData {
  // 1. Prova a leggere la configurazione persistita da interfaccia
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      return {
        host: parsed.host || process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(parsed.port) || Number(process.env.SMTP_PORT) || 465,
        secure: parsed.secure !== undefined ? Boolean(parsed.secure) : (process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465 || true),
        user: parsed.user || process.env.SMTP_USER || 'infooizut@gmail.com',
        pass: parsed.pass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '',
        from: parsed.from || process.env.SMTP_FROM || `"Dott. Antonio Tuzio" <${parsed.user || process.env.SMTP_USER || 'infooizut@gmail.com'}>`,
      }
    } catch (e) {
      console.warn('Errore lettura smtp-config.json:', e)
    }
  }

  // 2. Fallback su process.env
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = parseInt(process.env.SMTP_PORT || '465', 10)
  const secure = process.env.SMTP_SECURE === 'true' || port === 465
  const user = process.env.SMTP_USER || 'infooizut@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || ''
  const from = process.env.SMTP_FROM || `"Dott. Antonio Tuzio" <${user}>`

  return { host, port, secure, user, pass, from }
}

export function saveSmtpConfig(config: Partial<SmtpConfigData>): SmtpConfigData {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const current = getSmtpConfig()
  const updated: SmtpConfigData = {
    host: (config.host || current.host || 'smtp.gmail.com').trim(),
    port: Number(config.port) || current.port || 465,
    secure: config.secure !== undefined ? Boolean(config.secure) : current.secure,
    user: (config.user !== undefined ? config.user : current.user).trim(),
    pass: (config.pass !== undefined && config.pass !== '') ? config.pass.trim() : current.pass,
    from: (config.from || current.from || `"Dott. Antonio Tuzio" <${config.user || current.user}>`).trim(),
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export function isSmtpConfigured(): boolean {
  const conf = getSmtpConfig()
  return Boolean(conf.host && conf.user && conf.pass && conf.pass.trim().length > 0)
}

export function getTransporter(customConfig?: SmtpConfigData) {
  const conf = customConfig || getSmtpConfig()
  if (!conf.host || !conf.user || !conf.pass) {
    return null
  }

  return nodemailer.createTransport({
    host: conf.host,
    port: conf.port,
    secure: conf.secure,
    auth: {
      user: conf.user,
      pass: conf.pass,
    },
  })
}

export async function testSmtpConnection(targetEmail: string, customConfig?: Partial<SmtpConfigData>): Promise<{
  success: boolean
  message: string
}> {
  const conf: SmtpConfigData = customConfig ? { ...getSmtpConfig(), ...customConfig } : getSmtpConfig()

  if (!conf.user || !conf.pass) {
    return {
      success: false,
      message: 'Nome utente o Password SMTP mancanti. Inserisci la Password per le app prima di testare.',
    }
  }

  const transporter = nodemailer.createTransport({
    host: conf.host,
    port: conf.port,
    secure: conf.secure,
    auth: {
      user: conf.user,
      pass: conf.pass,
    },
    // Timeout ragionevole per non bloccare
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })

  try {
    // 1. Verifica autenticazione e connessione socket con il server di posta
    await transporter.verify()

    // 2. Invio email reale di test
    const from = conf.from || `"Dott. Antonio Tuzio" <${conf.user}>`
    const nowStr = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })

    await transporter.sendMail({
      from,
      to: targetEmail,
      subject: '✅ [Gestionale Studio] Test invio email riuscito!',
      text: `Gentile Studio / Dott. Antonio Tuzio,\n\nQuesto messaggio conferma che la configurazione del server SMTP (${conf.host}:${conf.port}) funziona correttamente!\n\nDa questo momento è possibile trasmettere fatture elettroniche e avvisi di parcella ai clienti con il PDF allegato direttamente dal gestionale.\n\nData e ora: ${nowStr}\n\nGestionale Studio Professionale`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <div style="background-color: #22c55e; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; line-height: 36px; text-align: center;">✓</div>
            <h2 style="color: #15803d; margin: 0; font-size: 20px;">Configurazione Email Riuscita!</h2>
          </div>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Gentile Studio / Dott. Antonio Tuzio,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6;">Questo messaggio conferma che il server di posta SMTP (<strong>${conf.host}</strong> sulla porta <strong>${conf.port}</strong>) è attivo e autenticato correttamente.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
            <p style="margin: 0; color: #475569; font-size: 13px;"><strong>Account verificato:</strong> <code style="color: #0f172a;">${conf.user}</code></p>
            <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px;"><strong>Mittente configurato:</strong> <code style="color: #0f172a;">${from}</code></p>
            <p style="margin: 6px 0 0 0; color: #475569; font-size: 13px;"><strong>Data e ora:</strong> ${nowStr}</p>
          </div>

          <p style="color: #334155; font-size: 14px; line-height: 1.6;">Da questo momento puoi trasmettere fatture elettroniche (copie di cortesia) e avvisi di parcella ai clienti con il PDF allegato direttamente con un click dal gestionale.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">Gestionale Studio Professionale Dott. Antonio Tuzio</p>
        </div>
      `,
    })

    return {
      success: true,
      message: `Connessione riuscita! Email di prova inviata a ${targetEmail}.`,
    }
  } catch (error: any) {
    let msg = error.message || 'Errore di connessione SMTP'
    if (msg.includes('Invalid login') || msg.includes('535') || msg.includes('Username and Password not accepted')) {
      msg = 'Autenticazione fallita (535): Username o Password non accettati. Per Gmail devi usare una "Password per le app" a 16 caratteri generata dal tuo account Google (non la solita password della casella).'
    } else if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      msg = `Impossibile raggiungere il server SMTP (${conf.host}:${conf.port}). Verifica la connessione o prova a cambiare porta (465 SSL o 587 STARTTLS).`
    }
    return {
      success: false,
      message: msg,
    }
  }
}

export async function inviaDocumentoEmail(params: EmailParams): Promise<{
  success: boolean
  inviataSmtp: boolean
  errore?: string
}> {
  const conf = getSmtpConfig()
  const transporter = getTransporter(conf)

  if (!transporter) {
    return {
      success: false,
      inviataSmtp: false,
      errore: 'SMTP non configurato. Vai in Impostazioni > Email & Posta (SMTP) per inserire le credenziali di invio.',
    }
  }

  const from = conf.from || `"Dott. Antonio Tuzio" <${conf.user || 'infooizut@gmail.com'}>`

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
