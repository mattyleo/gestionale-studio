// src/lib/pdf/antiriciclaggio-privacy-pdf.tsx
// Modulo Informativa Privacy e Consenso al Trattamento Dati (Regolamento UE 2016/679 - GDPR)

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
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 35,
    fontSize: 7.8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.35,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  header: {
    borderBottom: '1.5pt solid #0d9488',
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
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0d9488',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
  },
  docNorma: {
    fontSize: 7.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 7,
    padding: 6,
    border: '0.5pt solid #cbd5e1',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  textParagraph: {
    fontSize: 7.5,
    color: '#334155',
    textAlign: 'justify',
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: '30%',
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  value: {
    width: '70%',
    color: '#0f172a',
  },
  consentBox: {
    marginTop: 6,
    padding: 7,
    border: '1pt solid #0d9488',
    borderRadius: 3,
    backgroundColor: '#f0fdfa',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
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
    bottom: 15,
    left: 35,
    right: 35,
    borderTop: '0.5pt solid #cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
})

function formatDate(d: any): string {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('it-IT').format(new Date(d))
  } catch {
    return '—'
  }
}

export function AntiriciclaggioPrivacyDocument({
  azienda,
  emittente,
}: {
  azienda: any
  emittente: any
}) {
  const studioNome = emittente?.denominazione || 'Dott. Antonio Tuzio'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioCF = emittente?.codiceFiscale || 'TZUNTN69A16D612E'
  const studioIndirizzo = emittente?.indirizzo || 'Viale Risorgimento 70'
  const studioComune = emittente?.comune || "Reggio nell'Emilia"
  const studioEmail = emittente?.email || 'infooizut@gmail.com'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerStudio}>{studioNome}</Text>
            <Text style={styles.headerSub}>
              Titolare del Trattamento Dati · C.F.: {studioCF} · P.IVA: {studioPIVA}
            </Text>
            <Text style={styles.headerSub}>
              {studioIndirizzo} · {studioComune} (RE)
            </Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={[styles.bold, { fontSize: 8 }]}>PRIVACY &amp; GDPR</Text>
            <Text style={{ fontSize: 7.5, color: '#0d9488' }}>Reg. UE 2016/679</Text>
          </View>
        </View>

        {/* Titolo */}
        <Text style={styles.docTitle}>Informativa sul Trattamento dei Dati Personali</Text>
        <Text style={styles.docNorma}>
          Articoli 13 e 14 del Regolamento Europeo 2016/679 (GDPR) e D.Lgs. 196/2003 e ss.mm.ii.
        </Text>

        {/* Dati Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interessato / Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente / Ragione Sociale:</Text>
            <Text style={[styles.value, styles.bold]}>{azienda.ragioneSociale}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Legale Rappresentante:</Text>
            <Text style={styles.value}>{azienda.legaleRappresentante || azienda.referente || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Partita IVA / C.F.:</Text>
            <Text style={styles.value}>
              {azienda.partitaIva ? `P.IVA ${azienda.partitaIva}` : ''} {azienda.codiceFiscale ? `C.F. ${azienda.codiceFiscale}` : ''}
            </Text>
          </View>
        </View>

        {/* 1. Titolare del Trattamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Titolare del Trattamento</Text>
          <Text style={styles.textParagraph}>
            Il Titolare del trattamento è lo studio professionale <Text style={styles.bold}>{studioNome}</Text>, con sede in {studioIndirizzo}, {studioComune} (RE), C.F. {studioCF}, Email: {studioEmail}.
          </Text>
        </View>

        {/* 2. Finalità e Base Giuridica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Finalità del Trattamento e Basi Giuridiche</Text>
          <Text style={styles.textParagraph}>
            I dati personali dell'Interessato (inclusi dati anagrafici, fiscali, bancari e documenti di identità del titolare/legale rappresentante) sono trattati per:
          </Text>
          <Text style={styles.textParagraph}>
            a) <Text style={styles.bold}>Esecuzione dell'incarico professionale</Text> (tenuta della contabilità, adempimenti tributari, gestione del personale e paghe, consulenza aziendale e fiscale);
          </Text>
          <Text style={styles.textParagraph}>
            b) <Text style={styles.bold}>Adempimento degli obblighi di legge</Text>, in particolare contabili, fiscali e gli obblighi di adeguata verifica della clientela previsti dalla normativa <Text style={styles.bold}>Antiriciclaggio (D.Lgs. 231/2007)</Text>;
          </Text>
          <Text style={styles.textParagraph}>
            c) Gestione dei pagamenti, fatturazione e tutela dei diritti del Titolare.
          </Text>
        </View>

        {/* 3. Modalità e Tempi di Conservazione */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Modalità e Periodo di Conservazione</Text>
          <Text style={styles.textParagraph}>
            Il trattamento avviene mediante strumenti informatici e cartacei con misure di sicurezza adeguate a prevenire accessi non autorizzati. I dati saranno conservati per tutta la durata dell'incarico professionale e successivamente per <Text style={styles.bold}>10 anni</Text> per adempiere agli obblighi civilistici, fiscali e antiriciclaggio.
          </Text>
        </View>

        {/* 4. Diritti dell'Interessato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Diritti dell'Interessato (Artt. 15-22 GDPR)</Text>
          <Text style={styles.textParagraph}>
            L'Interessato ha il diritto di richiedere l'accesso ai propri dati, la rettifica, la cancellazione (ove applicabile), la limitazione del trattamento o la portabilità, nonché di proporre reclamo all'Autorità Garante per la Protezione dei Dati Personali.
          </Text>
        </View>

        {/* Riquadro Consenso */}
        <View style={styles.consentBox}>
          <Text style={[styles.sectionTitle, { color: '#0f766e' }]}>Dichiarazione di Consenso al Trattamento</Text>
          <Text style={styles.textParagraph}>
            Il sottoscritto, acquisite le informazioni fornite dal titolare del trattamento ai sensi dell'art. 13 del Reg. UE 2016/679:
          </Text>
          <Text style={[styles.textParagraph, styles.bold, { color: '#0f172a' }]}>
            [ X ] DICHIARA di aver ricevuto e letto la presente informativa e PRESTA IL CONSENSO al trattamento dei propri dati personali, inclusi i documenti di riconoscimento allegati, per le finalità legate all'incarico professionale e agli obblighi normativi antiriciclaggio.
          </Text>
        </View>

        {/* Firme */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text>Data e Luogo</Text>
            <Text style={{ marginTop: 2 }}>
              {studioComune}, {formatDate(azienda.privacyData || new Date())}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Firma per Ricevuta e Consenso dell'Interessato</Text>
            <Text style={{ marginTop: 15 }}>____________________________________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Informativa Privacy Studio {studioNome} · Conforme GDPR Reg. UE 2016/679</Text>
          <Text>Generato il {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaAntiriciclaggioPrivacyPDF(azienda: any, emittente: any): Promise<Buffer> {
  return await renderToBuffer(<AntiriciclaggioPrivacyDocument azienda={azienda} emittente={emittente} />)
}
