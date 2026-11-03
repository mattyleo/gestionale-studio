// src/lib/pdf/antiriciclaggio-dichiarazione-pdf.tsx
// Modulo Dichiarazione del Cliente ai fini dell'Adeguata Verifica Antiriciclaggio (D.Lgs. 231/2007, art. 22)

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
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.35,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  header: {
    borderBottom: '1.5pt solid #1e40af',
    paddingBottom: 6,
    marginBottom: 10,
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
    color: '#1e40af',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
  },
  docNorma: {
    fontSize: 7.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 12,
  },
  section: {
    marginBottom: 9,
    padding: 7,
    border: '1pt solid #cbd5e1',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderBottom: '0.5pt solid #cbd5e1',
    paddingBottom: 3,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  label: {
    width: '32%',
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  value: {
    width: '68%',
    color: '#0f172a',
  },
  boxCheck: {
    border: '1pt solid #94a3b8',
    width: 10,
    height: 10,
    marginRight: 5,
    marginTop: 1,
  },
  textParagraph: {
    fontSize: 7.5,
    color: '#334155',
    marginBottom: 4,
    textAlign: 'justify',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
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

export function AntiriciclaggioDichiarazioneDocument({
  azienda,
  emittente,
}: {
  azienda: any
  emittente: any
}) {
  const studioNome = emittente?.denominazione || 'Dott. Antonio Tuzio'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioIndirizzo = emittente?.indirizzo || 'Viale Risorgimento 70'
  const studioComune = emittente?.comune || "Reggio nell'Emilia"

  const docTipoStr =
    azienda.documentoTipo === 'passaporto'
      ? 'Passaporto'
      : azienda.documentoTipo === 'patente'
      ? 'Patente di guida'
      : "Carta d'Identità"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerStudio}>{studioNome}</Text>
            <Text style={styles.headerSub}>
              Dottore Commercialista e Tributarista · C.F./P.IVA: {studioPIVA}
            </Text>
            <Text style={styles.headerSub}>
              {studioIndirizzo} · {studioComune} (RE)
            </Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={[styles.bold, { fontSize: 8 }]}>FASCICOLO CLIENTE</Text>
            <Text style={{ fontSize: 7.5, color: '#1e40af' }}>
              {azienda.antiriciclaggioFascicolo || `ARC-${new Date().getFullYear()}-${azienda.id.slice(0, 5).toUpperCase()}`}
            </Text>
          </View>
        </View>

        {/* Titolo */}
        <Text style={styles.docTitle}>Dichiarazione del Cliente ai fini Antiriciclaggio</Text>
        <Text style={styles.docNorma}>
          Articolo 22 del D.Lgs. 21 novembre 2007, n. 231 e successive modificazioni e integrazioni
        </Text>

        {/* Sezione 1: Dati Impresa / Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Dati del Cliente / Impresa</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ragione Sociale / Ditta:</Text>
            <Text style={[styles.value, styles.bold]}>{azienda.ragioneSociale}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Partita IVA / Codice Fiscale:</Text>
            <Text style={styles.value}>
              {azienda.partitaIva ? `P.IVA: ${azienda.partitaIva}` : ''}
              {azienda.codiceFiscale ? ` · C.F.: ${azienda.codiceFiscale}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sede Legale / Operativa:</Text>
            <Text style={styles.value}>
              {azienda.indirizzo || ''} - {azienda.cap || ''} {azienda.comune || ''} ({azienda.provincia || ''})
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Settore di Attività Studio:</Text>
            <Text style={styles.value}>{azienda.settoreAttivita || 'CONTABILITA'}</Text>
          </View>
        </View>

        {/* Sezione 2: Dichiarante / Legale Rappresentante */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Soggetto Dichiarante (Titolare / Legale Rappresentante)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome e Cognome:</Text>
            <Text style={[styles.value, styles.bold]}>
              {azienda.legaleRappresentante || azienda.referente || '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Codice Fiscale:</Text>
            <Text style={styles.value}>{azienda.cfRappresentante || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data e Luogo di Nascita:</Text>
            <Text style={styles.value}>
              {azienda.dataNascitaRappr ? formatDate(azienda.dataNascitaRappr) : '—'} {azienda.luogoNascitaRappr ? `a ${azienda.luogoNascitaRappr}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Documento di Riconoscimento:</Text>
            <Text style={styles.value}>
              {docTipoStr} n° <Text style={styles.bold}>{azienda.documentoNumero || '—'}</Text>
              {azienda.documentoRilasciatoDa ? ` rilasciata da ${azienda.documentoRilasciatoDa}` : ''}
              {azienda.documentoScadenza ? ` · Scadenza: ${formatDate(azienda.documentoScadenza)}` : ''}
            </Text>
          </View>
        </View>

        {/* Sezione 3: Titolare Effettivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Identificazione del Titolare Effettivo (Art. 20 D.Lgs. 231/2007)</Text>
          <Text style={styles.textParagraph}>
            Il sottoscritto dichiara, sotto la propria responsabilità e consapevole delle sanzioni penali previste dall'art. 55 del D.Lgs. 231/2007 in caso di dichiarazioni false o reticenti, che il titolare effettivo della società/ente è:
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Titolare Effettivo:</Text>
            <Text style={[styles.value, styles.bold]}>
              {azienda.antiriciclaggioTitolareEffettivo || azienda.legaleRappresentante || 'Coincidente con il Legale Rappresentante sopra generalizzato'}
            </Text>
          </View>
          {azienda.antiriciclaggioCfTitolareEffettivo && (
            <View style={styles.row}>
              <Text style={styles.label}>C.F. Titolare Effettivo:</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioCfTitolareEffettivo}</Text>
            </View>
          )}
        </View>

        {/* Sezione 4: Persona Politicamente Esposta (PEP) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Persona Esposta Politicamente (P.E.P.)</Text>
          <Text style={styles.textParagraph}>
            Il sottoscritto dichiara che né il legale rappresentante né il titolare effettivo:
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Qualifica PEP:</Text>
            <Text style={[styles.value, styles.bold]}>
              {azienda.antiriciclaggioPep
                ? 'SÌ — Riveste o ha rivestito importanti cariche pubbliche'
                : 'NO — NON è Persona Politicamente Esposta (art. 1 c. 2 lett. dd)'}
            </Text>
          </View>
        </View>

        {/* Sezione 5: Scopo e Natura della Prestazione */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Scopo e Natura della Prestazione Professionale</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Prestazione Richiesta:</Text>
            <Text style={[styles.value, styles.bold]}>
              {azienda.antiriciclaggioPrestazione || `Incarico continuativo di ${azienda.settoreAttivita || 'assistenza contabile e fiscale'}`}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Origine dei Fondi:</Text>
            <Text style={styles.value}>
              Proventi derivanti dall'ordinario esercizio dell'attività d'impresa / lavoro autonomo lecita.
            </Text>
          </View>
        </View>

        {/* Firme */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text>Data e Luogo</Text>
            <Text style={{ marginTop: 2 }}>
              {studioComune}, {formatDate(azienda.antiriciclaggioDataVerifica || new Date())}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Firma del Cliente / Dichiarante</Text>
            <Text style={{ marginTop: 15 }}>____________________________________</Text>
          </View>
        </View>

        <View style={[styles.signatureRow, { marginTop: 10 }]}>
          <View style={[styles.signatureBox, { width: '100%', borderTop: '1pt solid #cbd5e1' }]}>
            <Text style={[styles.bold, { marginBottom: 2 }]}>
              Attestazione dell'Avvenuta Identificazione (a cura del Professionista)
            </Text>
            <Text style={styles.textParagraph}>
              Il sottoscritto {studioNome} attesta di aver provveduto in data odierna all'identificazione del cliente e alla verifica del documento d'identità in corso di validità allegato al fascicolo.
            </Text>
            <Text style={{ marginTop: 8 }}>Firma del Professionista: ____________________________________</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Fascicolo Antiriciclaggio Studio {studioNome} · D.Lgs. 231/2007</Text>
          <Text>Generato il {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaAntiriciclaggioDichiarazionePDF(azienda: any, emittente: any): Promise<Buffer> {
  return await renderToBuffer(<AntiriciclaggioDichiarazioneDocument azienda={azienda} emittente={emittente} />)
}
