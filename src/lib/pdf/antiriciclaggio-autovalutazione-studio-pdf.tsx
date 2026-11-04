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
  const rawDenom = (emittente?.denominazione || 'Dott. Antonio Tuzio')
    .replace(/^STUDIO\s+COMMERCIALE\s+/i, '')
    .trim()
  const studioNome = rawDenom || 'Dott. Antonio Tuzio'
  const studioCF = emittente?.codiceFiscale || 'TZUNTN69A16D612E'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioPec = emittente?.pec || 'studiotuzio@legalmail.it'
  const studioEmail =
    emittente?.email && !emittente.email.includes('postmaster') && !emittente.email.includes('infooizut')
      ? emittente.email
      : 'antoniotuzio@cafcgnrostanuova.it'
  const studioSede = `${emittente?.indirizzo || 'Via Umberto Poli 9/B'} - ${emittente?.cap || '42123'} ${
    emittente?.comune || 'Reggio Emilia'
  } (${emittente?.provincia || 'RE'}) · PEC: ${studioPec} · Email: ${studioEmail}`
  const dataOggi = new Intl.DateTimeFormat('it-IT').format(new Date())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Intestazione */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerStudio}>{studioNome} · Dottore Commercialista</Text>
            <Text style={styles.headerSub}>P.IVA {studioPIVA} · C.F. {studioCF} · {studioSede}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={[styles.bold, { fontSize: 8, color: '#1d4ed8' }]}>MODELLO AV.0 - CNDCEC (MARZO 2026)</Text>
            <Text style={{ fontSize: 7, color: '#475569' }}>Data redazione: {dataOggi}</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>
          AV.0 — Scheda di Autovalutazione del Rischio dello Studio Professionale
        </Text>
        <Text style={styles.docNorma}>
          Ai sensi degli artt. 15, 16 e 16-ter D.Lgs. 231/2007 e Regola Tecnica n. 1 CNDCEC del 16/01/2025 (Modulistica Ufficiale Marzo 2026)
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

        {/* 3. Calcolo Matrice CNDCEC Rischio Residuo dello Studio (Modello AV.0 Sezioni I, II, III) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Determinazione del Rischio Inerente (Sez. I), Vulnerabilità (Sez. II) e Rischio Residuo (Sez. III - AV.0)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '58%' }}>FATTORI UFFICIALI MODELLO AV.0 CNDCEC (SCALA D&apos;INTENSITÀ 1 - 4)</Text>
              <Text style={{ width: '24%' }}>VALUTAZIONE RILEVATA</Text>
              <Text style={{ width: '18%', textAlign: 'center' }}>INDICE (1-4)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '58%' }}>Sez. I — Rischio Inerente (1. Tipologia clientela: 1,50 · 2. Area geografica RE: 1,00 · 3. Canali distributivi de visu: 1,00 · 4. Servizi offerti: 1,90)</Text>
              <Text style={{ width: '24%' }}>Media A (Peso 40%)</Text>
              <Text style={{ width: '18%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>1,35 / 4,00</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '58%' }}>Sez. II — Vulnerabilità Studio (1. Formazione: 1,00 · 2. Org. Adeguata Verifica AV.1-AV.7: 1,40 · 3. Conservazione fascicolo: 1,20 · 4. Presidio SOS/Contante: 1,20)</Text>
              <Text style={{ width: '24%' }}>Media B (Peso 60%)</Text>
              <Text style={{ width: '18%', textAlign: 'center', fontFamily: 'Helvetica-Bold' }}>1,20 / 4,00</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '58%', fontFamily: 'Helvetica-Bold' }}>Sez. III — RISCHIO RESIDUO DELLO STUDIO (A × 0,40 + B × 0,60 = 0,54 + 0,72)</Text>
              <Text style={{ width: '24%', fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>RISCHIO MINIMO / BASSO</Text>
              <Text style={{ width: '18%', textAlign: 'center', fontFamily: 'Helvetica-Bold', color: '#16a34a' }}>1,26 / 4,00</Text>
            </View>
          </View>
        </View>

        <View style={styles.badgeBox}>
          <Text style={[styles.bold, { fontSize: 9.5, color: '#16a34a' }]}>
            ESITO AUTOVALUTAZIONE STUDIO (MOD. AV.0): RISCHIO RESIDUO NON SIGNIFICATIVO (1,26 su 4,00 — Fascia 1,0 &lt; 1,6)
          </Text>
          <Text style={{ fontSize: 7.2, color: '#334155', marginTop: 2 }}>
            Clienti totali in anagrafica: {stats.totaleClienti} · Soggetti nel Registro Antiriciclaggio: {stats.totaleObbligati} · Pratiche CAF/730 esenti ex art. 17 co. 7: {stats.totaleEsoneratiCaf} · Prossimo aggiornamento CSF entro: 27/05/2026
          </Text>
        </View>

        {/* 4. Presidi Adottati e Struttura dei Fascicoli a 2 Livelli (RT n. 3) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Griglia Rischio Residuo, Struttura Fascicoli a 2 Livelli (RT n. 3) e Conservazione Decennale</Text>
          <Text style={{ fontSize: 7.2, color: '#334155' }}>
            • Fasce Rischio Residuo Studio (CNDCEC/CNOCDL): Da 1,0 a &lt;1,6 Non Significativo (Presidi ordinari base) · Da 1,6 a &lt;2,6 Poco Significativo · Da 2,6 a &lt;3,6 Abbastanza Significativo · Da 3,6 a 4,0 Molto Significativo.{'\n'}
            • Livello 1 — Fascicolo Generale di Studio (Trasversale): Modello AV.0 (scad. 27/05/2026), Attestati di formazione del personale e dei collaboratori, Procedure organizzative interne e Guida Operativa Antiriciclaggio di Studio.{'\n'}
            • Livello 2 — Fascicolo Specifico del Cliente (Individuale, conservazione 10 anni): Documenti d&apos;identità e C.F. (Cliente, Esecutore, TE), Visura Camerale ed estratto Registro TE, Dichiarazione ex art. 22 (Mod. AV.4) sottoscritta, Scheda Rischio Effettivo (Mod. AV.1), Check-list (Mod. AV.2), Istruttoria (Mod. AV.3) e Controllo Costante (Mod. AV.7).
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
