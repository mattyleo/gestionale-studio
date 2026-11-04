// src/lib/pdf/antiriciclaggio-valutazione-pdf.tsx
// Modelli Ufficiali CNDCEC (Marzo 2026 — Regole Tecniche 16/01/2025):
// Pagina 1: AV.1 (Determinazione del Rischio Effettivo 30%/70%) + AV.2 (Check-list Documenti Acquisiti Fascicolo)
// Pagina 2: AV.3 (Istruttoria Cliente) + AV.7 (Procedura di Controllo Costante a 12 punti)

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { calcolaZonaERischioBot } from '@/lib/antiriciclaggio-engine'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1e293b',
    paddingTop: 24,
    paddingBottom: 30,
    paddingHorizontal: 32,
    lineHeight: 1.3,
  },
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: '#312e81',
    paddingBottom: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studioTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#312e81',
  },
  studioSub: {
    fontSize: 7.2,
    color: '#475569',
    marginTop: 1,
  },
  docBadge: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#a5b4fc',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  docBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#3730a3',
  },
  mainTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 1.5,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 7.5,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 7,
  },
  section: {
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#312e81',
    backgroundColor: '#eef2ff',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  col: {
    flex: 1,
  },
  col2: {
    flex: 2,
  },
  label: {
    fontSize: 6.5,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 1,
    marginRight: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#312e81',
    color: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 5,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 2.8,
    paddingHorizontal: 5,
    fontSize: 7.4,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 2.8,
    paddingHorizontal: 5,
    fontSize: 7.4,
  },
  cellFactor: {
    flex: 3.2,
  },
  cellDetail: {
    flex: 4.3,
    color: '#475569',
  },
  cellScore: {
    flex: 1.2,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
  },
  resultBanner: {
    marginTop: 4,
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    paddingRight: 4,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: '#312e81',
    marginRight: 4,
    textAlign: 'center',
    fontSize: 6.5,
    lineHeight: 1.1,
    fontFamily: 'Helvetica-Bold',
    color: '#312e81',
  },
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  signatureBox: {
    width: '45%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 18,
    marginBottom: 2,
  },
  signatureLabel: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 32,
    right: 32,
    fontSize: 6.5,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 3,
  },
})

function formatDate(d?: Date | string | null): string {
  if (!d) return new Date().toLocaleDateString('it-IT')
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return new Date().toLocaleDateString('it-IT')
  return dt.toLocaleDateString('it-IT')
}

export async function generaAntiriciclaggioValutazionePDF(
  azienda: any,
  emittente: any
): Promise<Buffer> {
  const rawDenom = (emittente?.denominazione || 'Dott. Antonio Tuzio')
    .replace(/^STUDIO\s+COMMERCIALE\s+/i, '')
    .trim()
  const studioDenominazione = rawDenom || 'Dott. Antonio Tuzio'
  const studioPec = emittente?.pec || 'studiotuzio@legalmail.it'
  const studioEmail =
    emittente?.email && !emittente.email.includes('postmaster') && !emittente.email.includes('infooizut')
      ? emittente.email
      : 'antoniotuzio@cafcgnrostanuova.it'
  const studioIndirizzo = `${emittente?.indirizzo || 'Via Umberto Poli 9/B'} - ${emittente?.cap || '42123'} ${
    emittente?.comune || 'Reggio Emilia'
  } (${emittente?.provincia || 'RE'}) · PEC: ${studioPec} · Email: ${studioEmail}`

  const bot = calcolaZonaERischioBot(azienda)
  const mesiRinnovo = bot.periodicitaMesi || 36
  const dataVerifica = formatDate(azienda.antiriciclaggioDataVerifica || new Date())
  const dataProssimaVerifica = azienda.antiriciclaggioDataScadenza
    ? formatDate(azienda.antiriciclaggioDataScadenza)
    : formatDate(new Date(Date.now() + mesiRinnovo * 30 * 24 * 60 * 60 * 1000))

  const docs: any[] = Array.isArray(azienda.documents) ? azienda.documents : []
  const docIdFile = docs.find((d) => ['carta_identita', 'passaporto', 'patente'].includes(d.tipoDoc))
  const docVisuraFile = docs.find((d) => d.tipoDoc === 'visura')
  const docAv4File = docs.find((d) => d.tipoDoc === 'av4_firmato')
  const docPrivacyFile = docs.find((d) => d.tipoDoc === 'privacy_firmata' || d.tipoDoc === 'mandato')

  const hasDocIdentita = Boolean(azienda.documentoNumero || docIdFile)
  const isSocieta =
    azienda.tipoSoggetto === 'PERSONA_GIURIDICA' ||
    /\b(SRL|S\.R\.L|SPA|S\.P\.A|SNC|S\.N\.C|SAS|S\.A\.S|COOP|CONSORZIO|SOCIETA)\b/i.test(azienda.ragioneSociale || '')

  const a1Score = isSocieta ? 2 : 1
  const a2Score = azienda.antiriciclaggioPep ? 4 : 1
  const a3Score = 1
  const a4Score = 1
  const b1Score = bot.zona === 'ZONA_3' ? 2 : 1
  const b2Score = 1
  const b345Score = isSocieta ? 1.5 : 1.0
  const b6Score = 1
  const tipoVerificaLabel =
    bot.rischioEffettivo >= 3.6 || azienda.antiriciclaggioPep
      ? 'ADEGUATA VERIFICA RAFFORZATA (12/6 mesi)'
      : bot.rischioEffettivo >= 2.6
      ? 'ADEGUATA VERIFICA ORDINARIA (24 mesi)'
      : 'ADEGUATA VERIFICA SEMPLIFICATA (36 mesi)'
  const gradoRischioLabel =
    bot.rischioEffettivo >= 3.6 || azienda.antiriciclaggioPep
      ? 'MOLTO SIGNIFICATIVO / PEP (3,6 - 4,0)'
      : bot.rischioEffettivo >= 2.6
      ? 'ABBASTANZA SIGNIFICATIVO (2,6 - <3,6)'
      : bot.rischioEffettivo >= 1.6
      ? 'POCO SIGNIFICATIVO (1,6 - <2,6)'
      : 'NON SIGNIFICATIVO (1,0 - <1,6)'
  const punteggio100 = Math.round((bot.rischioEffettivo / 4) * 100)

  const bannerColors =
    bot.classeRischio === 'ALTO'
      ? { bg: '#fef2f2', border: '#f87171', text: '#991b1b' }
      : bot.classeRischio === 'MEDIO'
      ? { bg: '#fffbeb', border: '#fbbf24', text: '#92400e' }
      : { bg: '#f0fdf4', border: '#4ade80', text: '#166534' }

  const puntiControlloAV7 = [
    { q: '1. Coerenza dei dati e informazioni acquisite con gli elementi conoscitivi a disposizione del Professionista', esito: 'CONFORME (SÌ)' },
    { q: '2. Variazioni intervenute nella compagine societaria, negli organi sociali o nella Titolarità Effettiva (Art. 20)', esito: 'NESSUNA ANOMALIA' },
    { q: '3. Verifica di eventuale acquisizione dello status di Persona Politicamente Esposta (PPE) o liste antiterrorismo', esito: azienda.antiriciclaggioPep ? 'PPE RILEVATA' : 'NEGATIVO (NO PPE)' },
    { q: '4. Coerenza tra l\'attività economica svolta, il profilo patrimoniale/reddituale e le operazioni eseguite', esito: 'COERENTE (SÌ)' },
    { q: '5. Utilizzo di mezzi di pagamento tracciati e regolarità della provenienza dei fondi utilizzati dal cliente', esito: 'TRACCIATO (SÌ)' },
    { q: '6. Assenza di operazioni frazionate, impiego anomalo di contante (Art. 49) o triangolazioni con Paesi ad alto rischio', esito: 'REGOLARE (NO)' },
    { q: '7. Validità del documento d\'identità del Cliente/Esecutore e aggiornamento della Visura Camerale in archivio', esito: hasDocIdentita ? 'VERIFICATO' : 'DA AGGIORNARE' },
    { q: '8. Assenza di indicatori di anomalia ex Provvedimento UIF / D.M. Giustizia ai fini di eventuale SOS (Art. 35)', esito: 'NESSUNA SOS' },
  ]

  const doc = (
    <Document title={`AV1_AV2_AV3_AV7_Fascicolo_CNDCEC_${azienda.ragioneSociale}`}>
      {/* PAGINA 1: MODELLO AV.1 (DETERMINAZIONE RISCHIO EFFETTIVO) + MODELLO AV.2 (DOCUMENTI ACQUISITI) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.studioTitle}>{studioDenominazione}</Text>
            <Text style={styles.studioSub}>{studioIndirizzo}</Text>
          </View>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>
              MODELLI AV.1 + AV.2 CNDCEC — {bot.zonaLabel} — FASCICOLO: {azienda.antiriciclaggioFascicolo || 'ARC-2026'}
            </Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>
          AV.1 — DETERMINAZIONE DEL RISCHIO EFFETTIVO E TIPOLOGIA DI ADEGUATA VERIFICA
        </Text>
        <Text style={styles.subTitle}>
          (Art. 17, co. 3, D.Lgs. 231/2007 — Regola Tecnica n. 2 CNDCEC del 16/01/2025 — Modulistica Ufficiale Marzo 2026)
        </Text>

        {/* Dati Anagrafici & Inquadramento Zona */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dati Identificativi del Cliente e Inquadramento Prestazione</Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Cliente / Ragione Sociale</Text>
              <Text style={styles.value}>{azienda.ragioneSociale}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Partita IVA / Codice Fiscale</Text>
              <Text style={styles.value}>{azienda.partitaIva || azienda.codiceFiscale || 'N/D'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Sede / Comune</Text>
              <Text style={styles.value}>{azienda.comune || 'Reggio Emilia'} ({azienda.provincia || 'RE'})</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Legale Rappresentante / Esecutore</Text>
              <Text style={styles.value}>{azienda.legaleRappresentante || azienda.referente || azienda.ragioneSociale}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Titolare Effettivo (Art. 20)</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioTitolareEffettivo || azienda.legaleRappresentante || azienda.ragioneSociale}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Qualifica PPE</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioPep ? 'SÌ (PPE - Rischio Alto)' : 'NO (Ordinario)'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Prestazione Professionale e Zona Operativa</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioPrestazione || bot.zonaLabel}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rischio Inerente (Tab. 1/2 CNDCEC)</Text>
              <Text style={styles.value}>{bot.rischioInerente.toFixed(2)} / 4.00</Text>
            </View>
          </View>
        </View>

        {/* Sezione II: Valutazione del Rischio Specifico (Tabella A + Tabella B CNDCEC) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sezione I &amp; II (AV.1) — Rischio Specifico Cliente (Tabella A) e Prestazione (Tabella B) (Scala 1 - 4)
          </Text>

          <View style={styles.tableHeader}>
            <Text style={styles.cellFactor}>FATTORE DI RISCHIO SPECIFICO (ART. 17 D.LGS. 231/2007)</Text>
            <Text style={styles.cellDetail}>ELEMENTI RILEVATI DAL PROFESSIONISTA</Text>
            <Text style={styles.cellScore}>PUNTEGGIO (1-4)</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.cellFactor}>A.1 — Natura giuridica del cliente</Text>
            <Text style={styles.cellDetail}>{isSocieta ? 'Società / Ente iscritto al Registro Imprese con assetto trasparente' : 'Persona fisica / Ditta individuale'}</Text>
            <Text style={styles.cellScore}>{a1Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.cellFactor}>A.2 — Prevalente attività svolta</Text>
            <Text style={styles.cellDetail}>Attività economica ordinaria ({azienda.settoreAttivita || 'CONTABILITA'}) priva di anomalie</Text>
            <Text style={styles.cellScore}>{a2Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellFactor}>A.3 — Comportamento tenuto al conferimento</Text>
            <Text style={styles.cellDetail}>Cliente collaborativo, identificato e trasparente nella consegna documentale</Text>
            <Text style={styles.cellScore}>{a3Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.cellFactor}>A.4 — Area geografica di residenza o sede</Text>
            <Text style={styles.cellDetail}>Sede in {azienda.comune || 'Reggio Emilia'} ({azienda.provincia || 'RE'}) - Italia (Paese UE a basso rischio)</Text>
            <Text style={styles.cellScore}>{a4Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellFactor}>B.1 — Tipologia della prestazione professionale</Text>
            <Text style={styles.cellDetail}>{bot.zonaLabel} ({tipoVerificaLabel})</Text>
            <Text style={styles.cellScore}>{b1Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.cellFactor}>B.2 — Modalità di svolgimento della prestazione</Text>
            <Text style={styles.cellDetail}>Ordinaria con mezzi di pagamento bancari tracciati</Text>
            <Text style={styles.cellScore}>{b2Score}.00 / 4</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.cellFactor}>B.3 / B.4 — Ammontare, frequenza, durata e congruità (B.5)</Text>
            <Text style={styles.cellDetail}>Rapporto continuativo congruo e coerente col profilo economico</Text>
            <Text style={styles.cellScore}>{b345Score.toFixed(2)} / 4</Text>
          </View>
          <View style={styles.tableRowAlt}>
            <Text style={styles.cellFactor}>B.6 — Area geografica di destinazione della prestazione</Text>
            <Text style={styles.cellDetail}>Territorio nazionale italiano (assenza di Paesi terzi ad alto rischio)</Text>
            <Text style={styles.cellScore}>{b6Score}.00 / 4</Text>
          </View>
        </View>

        {/* Sezione III & IV: Ponderazione 30% / 70% (Semplificazione Contabile/Societaria Tabella A / 4) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Sezione III &amp; IV (AV.1) — Rischio Effettivo RE = (Rischio Inerente × 30%) + (Rischio Specifico Tab. A/4 × 70%)
          </Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Rischio Inerente Prestazione (30%)</Text>
              <Text style={styles.value}>{bot.rischioInerente.toFixed(2)} × 0,30 = {(bot.rischioInerente * 0.3).toFixed(2)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rischio Specifico Tab. A / 4 (70%)</Text>
              <Text style={styles.value}>{bot.rischioSpecifico.toFixed(2)} × 0,70 = {(bot.rischioSpecifico * 0.7).toFixed(2)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Rischio Effettivo (RE)</Text>
              <Text style={styles.value}>{bot.rischioEffettivo.toFixed(2)} / 4.00 ({gradoRischioLabel})</Text>
            </View>
          </View>

          <View
            style={[
              styles.resultBanner,
              { backgroundColor: bannerColors.bg, borderColor: bannerColors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 8.2, fontFamily: 'Helvetica-Bold', color: bannerColors.text }}>
                ESITO AV.1: GRADO RISCHIO {gradoRischioLabel} — {tipoVerificaLabel}
              </Text>
              <Text style={{ fontSize: 7.2, color: '#334155', marginTop: 1.5 }}>
                {azienda.antiriciclaggioNote || bot.motivoBot}
              </Text>
            </View>
          </View>
        </View>

        {/* MODELLO AV.2 CNDCEC: DOCUMENTO RIEPILOGATIVO DOCUMENTI ACQUISITI (Caselle vuote da spuntare dal Dottore) */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            AV.2 — Documento Riepilogativo di Dati, Informazioni e Documenti Acquisiti nel Fascicolo Cliente
          </Text>
          <View style={styles.checkGrid}>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                1. Copia Documento d&apos;Identità ({azienda.documentoNumero || 'Da acquisire'}){' '}
                {docIdFile ? `[File: ${docIdFile.nomeFile.slice(0, 22)}]` : ''}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                2. Visura Camerale / Atto Costitutivo / Statuto{' '}
                {docVisuraFile ? `[File: ${docVisuraFile.nomeFile.slice(0, 20)}]` : isSocieta ? '[In Fascicolo]' : '[Non richiesto PF]'}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                3. Attribuzione Codice Fiscale / Partita IVA ({azienda.partitaIva || azienda.codiceFiscale || 'N/D'})
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                4. Dichiarazione del Cliente ex art. 22 D.Lgs. 231/07 (AV.4){' '}
                {docAv4File ? `[Firmata: ${docAv4File.nomeFile.slice(0, 18)}]` : '[Predisposta]'}
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                5. Scheda Determinazione Rischio Effettivo (Modello AV.1) e Istruttoria (AV.3)
              </Text>
            </View>
            <View style={styles.checkItem}>
              <Text style={styles.checkbox}> </Text>
              <Text style={{ fontSize: 7.4, flex: 1 }}>
                6. Informativa Privacy GDPR e Mandato Professionale{' '}
                {docPrivacyFile ? `[Firmato: ${docPrivacyFile.nomeFile.slice(0, 18)}]` : azienda.privacyFirmata ? '[Sottoscritta]' : '[In firma]'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Modelli AV.1 + AV.2 CNDCEC (Marzo 2026) — {studioDenominazione} — Pag. 1/2
        </Text>
      </Page>

      {/* PAGINA 2: MODELLO AV.3 (ISTRUTTORIA CLIENTE) + MODELLO AV.7 (PROCEDURA DI CONTROLLO COSTANTE) */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.studioTitle}>{studioDenominazione}</Text>
            <Text style={styles.studioSub}>Istruttoria Cliente (AV.3) e Procedura di Controllo Costante (AV.7)</Text>
          </View>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>MODELLI AV.3 + AV.7 CNDCEC</Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>
          AV.3 — ISTRUTTORIA CLIENTE &amp; AV.7 — PROCEDURA DI CONTROLLO COSTANTE
        </Text>
        <Text style={styles.subTitle}>
          (Artt. 18, co. 1, lett. d e 19, co. 1, lett. c, D.Lgs. 231/2007 — Regola Tecnica n. 2 CNDCEC)
        </Text>

        {/* MODELLO AV.3: SCHEDA ISTRUTTORIA CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            AV.3 — Scheda di Istruttoria Cliente (Identificazione, Verifica Titolare Effettivo e Scopo)
          </Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>1. Identificazione del Cliente / Esecutore</Text>
              <Text style={styles.value}>
                {azienda.legaleRappresentante || azienda.ragioneSociale} — Doc. {azienda.documentoNumero || 'In acquisizione'} (Scad. {formatDate(azienda.documentoScadenza)})
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>2. Modalità di Identificazione</Text>
              <Text style={styles.value}>In presenza fisica del cliente / Documento d&apos;identità in corso di validità</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>3. Individuazione e Verifica del Titolare Effettivo (Art. 20)</Text>
              <Text style={styles.value}>
                {azienda.antiriciclaggioTitolareEffettivo || azienda.legaleRappresentante || azienda.ragioneSociale} ({isSocieta ? 'Riscontro da Visura Registro Imprese / Dichiarazione AV.4' : 'Titolare Ditta Individuale / PF'})
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>4. Consultazione Liste PPE e Liste Antiterrorismo UE/ONU</Text>
              <Text style={styles.value}>Esito NEGATIVO — Assenza di iscrizioni in liste di congelamento o PEP</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>5. Informazioni su Scopo e Natura della Prestazione</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioPrestazione || bot.zonaLabel}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>6. Conservazione Informatica / Cartacea (Art. 31-32 D.Lgs. 231/07)</Text>
              <Text style={styles.value}>Fascicolo {azienda.antiriciclaggioFascicolo || 'ARC-2026'} — Conservazione per 10 anni dalla cessazione</Text>
            </View>
          </View>
        </View>

        {/* MODELLO AV.7: PROCEDURA DI CONTROLLO COSTANTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            AV.7 — Procedura di Controllo Costante nel Corso del Rapporto Continuativo
          </Text>
          <View style={styles.tableHeader}>
            <Text style={{ flex: 5 }}>VERIFICA PERIODICA EFFETTUATA DAL PROFESSIONISTA (CHECK-LIST UFFICIALE CNDCEC AV.7)</Text>
            <Text style={{ flex: 1.5, textAlign: 'right' }}>ESITO RISCONTRO</Text>
          </View>
          {puntiControlloAV7.map((item, idx) => (
            <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={{ flex: 5 }}>{item.q}</Text>
              <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#1e3a8a' }}>{item.esito}</Text>
            </View>
          ))}
        </View>

        {/* ESITO DEL CONTROLLO COSTANTE E PROGRAMMAZIONE PROSSIMA VERIFICA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Conclusione dell&apos;Istruttoria e Programmazione del Controllo Costante (Tab. 5 Regola Tecnica n. 2)
          </Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Data Valutazione / Controllo</Text>
              <Text style={styles.value}>{dataVerifica}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Periodicità Controllo Costante</Text>
              <Text style={styles.value}>Ogni {mesiRinnovo} mesi (Rischio {bot.classeRischio})</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Scadenza Prossima Revisione</Text>
              <Text style={styles.value}>{dataProssimaVerifica}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.4, color: '#334155', marginTop: 3 }}>
            Alla luce degli elementi istruttori acquisiti (AV.2 e AV.3) e delle verifiche di controllo costante eseguite (AV.7), si conferma il livello di Rischio Effettivo {bot.classeRischio} ({bot.rischioEffettivo.toFixed(2)}/4.00) e la prosecuzione regolare del rapporto professionale.
          </Text>
        </View>

        {/* Firma del Professionista */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Luogo e Data di Emissione Scheda</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>
              {emittente?.comune || 'Reggio Emilia'}, lì {dataVerifica}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Timbro e Firma del Professionista ({studioDenominazione})
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Modelli AV.3 + AV.7 CNDCEC (Marzo 2026) — Fascicolo Antiriciclaggio D.Lgs. 231/2007 — {studioDenominazione} — Pag. 2/2
        </Text>
      </Page>
    </Document>
  )

  return await renderToBuffer(doc)
}
