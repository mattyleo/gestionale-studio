// src/lib/pdf/antiriciclaggio-valutazione-pdf.tsx
// Scheda di Valutazione del Rischio e Adeguata Verifica della Clientela (CNDCEC - D.Lgs. 231/2007)

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
    borderBottom: '1.5pt solid #4f46e5',
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
    color: '#4f46e5',
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
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  label: {
    width: '35%',
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  value: {
    width: '65%',
    color: '#0f172a',
  },
  riskBadgeBox: {
    marginVertical: 6,
    padding: 8,
    borderRadius: 4,
    border: '1.5pt solid',
    textAlign: 'center',
  },
  riskTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  riskSub: {
    fontSize: 7.5,
  },
  table: {
    width: '100%',
    border: '0.5pt solid #cbd5e1',
    borderRadius: 2,
    marginTop: 4,
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
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    fontSize: 7.5,
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

export function AntiriciclaggioValutazioneDocument({
  azienda,
  emittente,
}: {
  azienda: any
  emittente: any
}) {
  const studioNome = emittente?.denominazione || 'Dott. Antonio Tuzio'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioComune = emittente?.comune || "Reggio nell'Emilia"

  const rischio = (azienda.antiriciclaggioRischio || 'BASSO').toUpperCase()
  const isBasso = rischio === 'BASSO' || rischio === 'NON_SIGNIFICATIVO'
  const isMedio = rischio === 'MEDIO' || rischio === 'POCO_SIGNIFICATIVO'
  const isAlto = rischio === 'ALTO' || rischio === 'MOLTO_SIGNIFICATIVO'

  const badgeColor = isBasso ? '#16a34a' : isMedio ? '#d97706' : '#dc2626'
  const badgeBg = isBasso ? '#f0fdf4' : isMedio ? '#fffbeb' : '#fef2f2'
  const classeRischioDesc = isBasso
    ? 'RISCHIO NON SIGNIFICATIVO (BASSO)'
    : isMedio
    ? 'RISCHIO POCO SIGNIFICATIVO (MEDIO)'
    : 'RISCHIO SIGNIFICATIVO / ALTO'

  const misura = isBasso ? 'Adeguata Verifica Ordinaria / Semplificata' : isMedio ? 'Adeguata Verifica Ordinaria' : 'Adeguata Verifica Rafforzata'
  const cadenza = isBasso ? 'Ogni 3 anni' : isMedio ? 'Ogni 2 anni' : 'Annuale (12 mesi)'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerStudio}>{studioNome} · Studio Professionale</Text>
            <Text style={styles.headerSub}>Fascicolo Antiriciclaggio e Valutazione del Rischio</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={[styles.bold, { fontSize: 8 }]}>FASCICOLO N°</Text>
            <Text style={{ fontSize: 7.5, color: '#4f46e5' }}>
              {azienda.antiriciclaggioFascicolo || `ARC-${new Date().getFullYear()}-${azienda.id.slice(0, 5).toUpperCase()}`}
            </Text>
          </View>
        </View>

        {/* Titolo */}
        <Text style={styles.docTitle}>Scheda di Valutazione del Rischio e Adeguata Verifica</Text>
        <Text style={styles.docNorma}>
          Regole Tecniche CNDCEC n. 1 e n. 2 emanate ai sensi dell'art. 11, co. 2 del D.Lgs. 231/2007
        </Text>

        {/* Anagrafica Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Anagrafica del Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ragione Sociale / Ditta:</Text>
            <Text style={[styles.value, styles.bold]}>{azienda.ragioneSociale}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Codice Fiscale / Partita IVA:</Text>
            <Text style={styles.value}>
              {azienda.partitaIva ? `P.IVA: ${azienda.partitaIva}` : ''} {azienda.codiceFiscale ? ` · C.F.: ${azienda.codiceFiscale}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sede / Ubicazione:</Text>
            <Text style={styles.value}>
              {azienda.indirizzo || ''} - {azienda.comune || ''} ({azienda.provincia || ''}) - {azienda.paese || 'IT'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Legale Rappresentante:</Text>
            <Text style={styles.value}>{azienda.legaleRappresentante || azienda.referente || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Documento d'Identità:</Text>
            <Text style={styles.value}>
              {azienda.documentoTipo || "Carta d'identità"} n° {azienda.documentoNumero || '—'}
              {azienda.documentoScadenza ? ` (Scadenza: ${formatDate(azienda.documentoScadenza)})` : ''}
            </Text>
          </View>
        </View>

        {/* Criteri di Valutazione Soggettivi e Oggettivi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Analisi dei Fattori di Rischio (CNDCEC)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ width: '50%' }}>FATTORE DI RISCHIO</Text>
              <Text style={{ width: '35%' }}>PARAMETRO RILEVATO</Text>
              <Text style={{ width: '15%', textAlign: 'center' }}>LIVELLO</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '50%' }}>Forma giuridica del cliente</Text>
              <Text style={{ width: '35%' }}>{azienda.tipoSoggetto === 'PERSONA_GIURIDICA' ? 'Società di capitali / persone' : 'Ditta individuale / persona fisica'}</Text>
              <Text style={{ width: '15%', textAlign: 'center', color: '#16a34a' }}>Basso</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '50%' }}>Area geografica di operatività</Text>
              <Text style={{ width: '35%' }}>Italia / Unione Europea ({azienda.comune || 'Reggio Emilia'})</Text>
              <Text style={{ width: '15%', textAlign: 'center', color: '#16a34a' }}>Basso</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '50%' }}>Tipologia prestazione richiesta</Text>
              <Text style={{ width: '35%' }}>{azienda.settoreAttivita || 'Contabilità e adempimenti periodici'}</Text>
              <Text style={{ width: '15%', textAlign: 'center', color: '#16a34a' }}>Basso</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '50%' }}>Presenza Titolare Effettivo / PEP</Text>
              <Text style={{ width: '35%' }}>{azienda.antiriciclaggioPep ? 'PEP presente' : 'Nessun PEP rilevato'}</Text>
              <Text style={{ width: '15%', textAlign: 'center', color: azienda.antiriciclaggioPep ? '#dc2626' : '#16a34a' }}>
                {azienda.antiriciclaggioPep ? 'Elevato' : 'Basso'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={{ width: '50%' }}>Modalità svolgimento prestazione</Text>
              <Text style={{ width: '35%' }}>Incontro diretto e identificazione de visu</Text>
              <Text style={{ width: '15%', textAlign: 'center', color: '#16a34a' }}>Basso</Text>
            </View>
          </View>
        </View>

        {/* Esito Sintetico e Badge Rischio */}
        <View style={[styles.riskBadgeBox, { borderColor: badgeColor, backgroundColor: badgeBg }]}>
          <Text style={[styles.riskTitle, { color: badgeColor }]}>{classeRischioDesc}</Text>
          <Text style={[styles.riskSub, { color: '#334155' }]}>
            Punteggio sintetico di rischio attribuito: <Text style={styles.bold}>{azienda.antiriciclaggioPunteggio || 1} su 4</Text>
          </Text>
        </View>

        {/* 3. Misure di Adeguata Verifica Adottate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Determinazione degli Obblighi e Monitoraggio</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Procedura Applicata:</Text>
            <Text style={[styles.value, styles.bold]}>{misura}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data Prima Identificazione:</Text>
            <Text style={styles.value}>{formatDate(azienda.antiriciclaggioDataVerifica || azienda.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Periodicità di Revisione:</Text>
            <Text style={[styles.value, styles.bold]}>{cadenza}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Prossima Scadenza Revisione:</Text>
            <Text style={styles.value}>
              {formatDate(
                azienda.antiriciclaggioDataScadenza ||
                  new Date(new Date().setFullYear(new Date().getFullYear() + (isBasso ? 3 : isMedio ? 2 : 1)))
              )}
            </Text>
          </View>
          {azienda.antiriciclaggioNote && (
            <View style={[styles.row, { marginTop: 3 }]}>
              <Text style={styles.label}>Note e Valutazioni:</Text>
              <Text style={styles.value}>{azienda.antiriciclaggioNote}</Text>
            </View>
          )}
        </View>

        {/* Firme */}
        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text>Data della Valutazione</Text>
            <Text style={{ marginTop: 2 }}>
              {studioComune}, {formatDate(azienda.antiriciclaggioDataVerifica || new Date())}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Firma del Professionista Incaricato</Text>
            <Text style={{ marginTop: 15 }}>{studioNome}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Fascicolo di Studio · Conservazione decennale art. 31 D.Lgs. 231/2007</Text>
          <Text>Documento riservato e ad uso interno</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaAntiriciclaggioValutazionePDF(azienda: any, emittente: any): Promise<Buffer> {
  return await renderToBuffer(<AntiriciclaggioValutazioneDocument azienda={azienda} emittente={emittente} />)
}
