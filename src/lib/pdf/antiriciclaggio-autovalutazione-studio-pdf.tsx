// src/lib/pdf/antiriciclaggio-autovalutazione-studio-pdf.tsx
// Modello AV1 CNDCEC — Documento di Autovalutazione del Rischio dello Studio Professionale
// (Art. 15 e 16 D.Lgs. 231/2007 - Regola Tecnica n. 1 CNDCEC e Regole Tecniche CdL 2025)

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 32,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.35,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  header: {
    borderBottom: '1.5pt solid #1d4ed8',
    paddingBottom: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerStudio: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 7.5,
    color: '#475569',
  },
  docTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 2,
  },
  docNorma: {
    fontSize: 7.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  section: {
    marginBottom: 6,
    padding: 6,
    border: '0.5pt solid #cbd5e1',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: '36%',
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  value: {
    width: '64%',
    color: '#0f172a',
  },
  table: {
    width: '100%',
    border: '0.5pt solid #cbd5e1',
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  tableRow: {
    flexDirection: 'row',
    borderTop: '0.5pt solid #e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 4,
    fontSize: 7.2,
  },
  badgeBox: {
    marginVertical: 5,
    padding: 6,
    borderRadius: 4,
    border: '1.2pt solid #16a34a',
    backgroundColor: '#f0fdf4',
    textAlign: 'center',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  signatureBox: {
    width: '45%',
    borderTop: '0.5pt solid #64748b',
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 7.5,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 32,
    right: 32,
    borderTop: '0.5pt solid #cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
})

export function AutovalutazioneStudioDocument({
  emittente,
  stats,
}: {
  emittente: any
  stats: {
    totaleClienti: number
    totaleObbligati: number
    totalePaghe: number
    totaleForfettari: number
    totaleContabilita: number
    totaleSuccessioni: number
    totaleEsoneratiCaf: number
  }
}) {
  const studioNome = emittente?.denominazione || 'Dott. Antonio Tuzio'
  const studioCF = emittente?.codiceFiscale || 'TZUNTN66B16F839U'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioSede = `${emittente?.indirizzo || 'Via Roma'} - ${emittente?.cap || '42121'} ${emittente?.comune || "Reggio nell'Emilia"} (${emittente?.provincia || 'RE'})`
  const dataOggi = new Intl.DateTimeFormat('it-IT').format(new Date())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Intestazione */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerStudio}>{studioNome} · Studio Commercialista e Consulenza del Lavoro</Text>
            <Text style={styles.headerSub}>P.IVA {studioPIVA} · C.F. {studioCF} · {studioSede}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={[styles.bold, { fontSize: 8, color: '#1d4ed8' }]}>MODELLO AV1 - CNDCEC</Text>
            <Text style={{ fontSize: 7, color: '#475569' }}>Data redazione: {dataOggi}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>
          Scheda di Autovalutazione del Rischio dello Studio Professionale
        </Text>
        <Text style={styles.docNorma}>
          Ai sensi degli artt. 15 e 16 D.Lgs. 231/2007 (mod. D.Lgs. 90/2017 e D.Lgs. 125/2019) e Regola Tecnica n. 1 CNDCEC / CdL (Agg. 2025)
        </Text>

        {/* 1. Dati Identificativi del Soggetto Obbligato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identificazione del Professionista e Struttura Organizzativa</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Titolare dello Studio:</Text>
            <Text style={[styles.value, styles.bold]}>{studioNome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Codice Fiscale / Partita IVA:</Text>
            <Text style={styles.value}>C.F. {studioCF} · P.IVA {studioPIVA}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sede Operativa:</Text>
            <Text style={styles.value}>{studioSede}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Assetto Organizzativo:</Text>
            <Text style={styles.value}>Studio professionale monoprofessionale con gestione informatica centralizzata dei fascicoli</Text>
          </View>
        </View>

        {/* 2. Mappatura delle 6 Discipline dello Studio e Regole Tecniche */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Ambiti di Attività dello Studio e Classificazione Normativa (Regola Tecnica n. 2)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '44%' }}>DISCIPLINA / ATTIVITÀ SVOLTA DALLO STUDIO</Text>
              <Text style={{ width: '32%' }}>INQUADRAMENTO D.LGS. 231/2007 E CNDCEC</Text>
              <Text style={{ width: '12%', textAlign: 'center' }}>CLIENTI</Text>
              <Text style={{ width: '12%', textAlign: 'center' }}>RISCHIO</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '44%' }}>1-2. Elaborazione buste paga (LUL), assunzioni UNILAV, INAIL, Mod. 770 e consulenza del lavoro</Text>
              <Text style={{ width: '32%' }}>Art. 17 co. 7 D.Lgs. 231/2007 e Regole Tecniche CdL/CNDCEC (Verifica Semplificata/Ordinaria)</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{stats.totalePaghe}</Text>
              <Text style={{ width: '12%', textAlign: 'center', color: '#16a34a' }}>Basso (1)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '44%' }}>3. Gestione fiscale, civilistica, societaria e contabile (Ditte, Società di persone, S.r.l., Consorzi)</Text>
              <Text style={{ width: '32%' }}>Regola Tecnica n. 2 Tab. 2 CNDCEC (Adeguata Verifica Ordinaria + Titolare Effettivo)</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{stats.totaleContabilita}</Text>
              <Text style={{ width: '12%', textAlign: 'center', color: '#16a34a' }}>Basso (1,5)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '44%' }}>4. Persone fisiche: Mod. 730, pratiche CAF, IMU, maternità, NASpI, dimissioni online</Text>
              <Text style={{ width: '32%' }}>Regola Tecnica n. 2 Tab. 1 CNDCEC (Attività ESCLUSE da adeguata verifica)</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{stats.totaleEsoneratiCaf}</Text>
              <Text style={{ width: '12%', textAlign: 'center', color: '#64748b' }}>Esonerato</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '44%' }}>5. Dichiarazione redditi Ditte Individuali e Professionisti in Regime Forfettario (L. 190/2014)</Text>
              <Text style={{ width: '32%' }}>Regola Tecnica n. 2 Tab. 1-2 CNDCEC (Rischio non significativo - Verifica Semplificata)</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{stats.totaleForfettari}</Text>
              <Text style={{ width: '12%', textAlign: 'center', color: '#16a34a' }}>Basso (1)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '44%' }}>6. Pratiche di Dichiarazione di Successione e volture catastali</Text>
              <Text style={{ width: '32%' }}>Adeguata verifica identificativa eredi/dichiarante e consistenza asse ereditario</Text>
              <Text style={{ width: '12%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>{stats.totaleSuccessioni}</Text>
              <Text style={{ width: '12%', textAlign: 'center', color: '#16a34a' }}>Basso (1)</Text>
            </View>
          </View>
        </View>

        {/* 3. Calcolo Matrice CNDCEC Rischio Residuo dello Studio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Determinazione del Rischio Inerente, Vulnerabilità e Rischio Residuo (Regola Tecnica n. 1)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '55%' }}>COMPONENTE DI VALUTAZIONE (SCALA 1 - 4 CNDCEC)</Text>
              <Text style={{ width: '25%' }}>CRITERIO RILEVATO</Text>
              <Text style={{ width: '20%', textAlign: 'center' }}>PUNTEGGIO</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '55%' }}>A. Rischio Inerente (Tipologia clientela locale, operatività ordinaria, assenza PEP/Paesi terzi ad alto rischio)</Text>
              <Text style={{ width: '25%' }}>Non Significativo / Poco Significativo</Text>
              <Text style={{ width: '20%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>1,35 / 4,00</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '55%' }}>B. Livello di Vulnerabilità Organizzativa (Presenza gestionale dedicato, fascicolo informatico, alert scadenze CI)</Text>
              <Text style={{ width: '25%' }}>Presidi Adeguati (Vulnerabilità Bassa)</Text>
              <Text style={{ width: '20%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>1,20 / 4,00</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '55%', fontFamily: 'Helvetica-Bold' }}>C. RISCHIO RESIDUO COMPLESSIVO DELLO STUDIO (40% Rischio Inerente + 60% Vulnerabilità)</Text>
              <Text style={{ width: '25%', fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>RISCHIO BASSO (NON SIGNIFICATIVO)</Text>
              <Text style={{ width: '20%', textAlign: 'center', fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>1,26 / 4,00</Text>
            </View>
          </View>
        </View>

        <View style={styles.badgeBox}>
          <Text style={[styles.bold, { fontSize: 9.5, color: '#16a34a' }]}>
            ESITO AUTOVALUTAZIONE STUDIO: RISCHIO RESIDUO BASSO (1,26 su 4,00)
          </Text>
          <Text style={{ fontSize: 7.2, color: '#334155', marginTop: 2 }}>
            Clienti totali in anagrafica: {stats.totaleClienti} · Soggetti iscritti nel Registro Antiriciclaggio: {stats.totaleObbligati} · Pratiche CAF/730 esonerate ex Tab. 1 Regola Tecnica n. 2: {stats.totaleEsoneratiCaf}
          </Text>
        </View>

        {/* 4. Presidi Adottati e Regolarizzazione */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Presidi Organizzativi e Regolarizzazione Fascicoli (Allineamento Verifiche GdF)</Text>
          <Text style={{ fontSize: 7.3, color: '#334155' }}>
            • Conservazione Informatica (Art. 31-32 D.Lgs. 231/2007 e Regola Tecnica n. 3 CNDCEC): lo Studio utilizza un sistema gestionale dedicato con numerazione progressiva dei fascicoli (ARC-YYYY-NNN), archiviazione digitale dei documenti di riconoscimento, alert automatico di scadenza a 60 giorni e conservazione decennale.{'\n'}
            • Ricognizione e Regolarizzazione Periodica: per i rapporti continuativi in essere, lo Studio ha provveduto alla ricognizione integrale delle anagrafiche, all&apos;aggiornamento dei documenti d&apos;identità, alla verifica del Titolare Effettivo (S.r.l., S.r.l.s., Consorzi e Società di persone) e al ricalcolo del profilo di rischio secondo le Regole Tecniche CNDCEC 2025.
          </Text>
        </View>

        {/* Firme */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text>Luogo e Data di Approvazione</Text>
            <Text style={{ marginTop: 3 }}>
              {emittente?.comune || "Reggio nell'Emilia"}, {dataOggi}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Il Professionista Titolare dello Studio</Text>
            <Text style={{ marginTop: 14, fontFamily: 'Helvetica-Bold' }}>{studioNome}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Modello AV1 CNDCEC · Autovalutazione periodica art. 15-16 D.Lgs. 231/2007 (Aggiornamento triennale)</Text>
          <Text>Documento ufficiale per verifiche ispettive Guardia di Finanza / Ordine Professionale</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaAutovalutazioneStudioPDF(emittente: any, stats: any): Promise<Buffer> {
  return await renderToBuffer(<AutovalutazioneStudioDocument emittente={emittente} stats={stats} />)
}
