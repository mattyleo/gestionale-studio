// src/lib/pdf/antiriciclaggio-registro-pdf.tsx
// Stampa ufficiale del Registro Cronologico della Clientela ai fini Antiriciclaggio (D.Lgs. 231/2007)

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
    paddingBottom: 30,
    paddingHorizontal: 22,
    fontSize: 7.2,
    fontFamily: 'Helvetica',
    color: '#0f172a',
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
  headerLeft: {
    width: '60%',
  },
  headerRight: {
    width: '40%',
    textAlign: 'right',
  },
  studioTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginTop: 2,
  },
  metaText: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 1,
  },
  table: {
    width: '100%',
    border: '0.5pt solid #cbd5e1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1pt solid #cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.8,
    color: '#0f172a',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 3,
    alignItems: 'center',
  },
  colFasc: { width: '8%', textAlign: 'center' },
  colData: { width: '8%', textAlign: 'center' },
  colRagSoc: { width: '24%' },
  colFiscale: { width: '16%' },
  colSettore: { width: '10%', textAlign: 'center' },
  colDoc: { width: '18%' },
  colRischio: { width: '8%', textAlign: 'center' },
  colStato: { width: '8%', textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 22,
    right: 22,
    borderTop: '0.5pt solid #cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
})

function formatDate(date: any): string {
  if (!date) return '—'
  try {
    return new Intl.DateTimeFormat('it-IT').format(new Date(date))
  } catch {
    return '—'
  }
}

export function AntiriciclaggioRegistroDocument({
  aziende,
  emittente,
}: {
  aziende: any[]
  emittente: any
}) {
  const rawDenom = (emittente?.denominazione || 'Dott. Antonio Tuzio')
    .replace(/^STUDIO\s+COMMERCIALE\s+/i, '')
    .trim()
  const studioNome = rawDenom || 'Dott. Antonio Tuzio'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioComune = emittente?.comune || 'Reggio Emilia'
  const studioPec = emittente?.pec || 'studiotuzio@legalmail.it'
  const studioEmail =
    emittente?.email && !emittente.email.includes('postmaster') && !emittente.email.includes('infooizut')
      ? emittente.email
      : 'antoniotuzio@cafcgnrostanuova.it'

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.studioTitle}>{studioNome} · Dottore Commercialista</Text>
            <Text style={styles.docTitle}>REGISTRO DELLA CLIENTELA — ANTIRICICLAGGIO</Text>
            <Text style={styles.metaText}>
              Adempimento obbligatorio D.Lgs. 21 novembre 2007, n. 231 e Regole Tecniche CNDCEC · Sede: {studioComune} · P.IVA: {studioPIVA} · PEC: {studioPec} · Email: {studioEmail}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.bold, { fontSize: 8.5, color: '#0f172a' }]}>
              Totale Soggetti Censiti: {aziende.length}
            </Text>
            <Text style={styles.metaText}>Data estrazione: {formatDate(new Date())}</Text>
          </View>
        </View>

        {/* Tabella Registro */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colFasc}>FASCICOLO</Text>
            <Text style={styles.colData}>DATA VERIF.</Text>
            <Text style={styles.colRagSoc}>CLIENTE / RAGIONE SOCIALE</Text>
            <Text style={styles.colFiscale}>P.IVA / CODICE FISCALE</Text>
            <Text style={styles.colSettore}>SETTORE</Text>
            <Text style={styles.colDoc}>DOCUMENTO IDENTITÀ</Text>
            <Text style={styles.colRischio}>RISCHIO</Text>
            <Text style={styles.colStato}>STATO</Text>
          </View>

          {aziende.map((az, idx) => {
            const fascicolo = az.antiriciclaggioFascicolo || `ARC-${String(idx + 1).padStart(3, '0')}`
            const dataVerifica = az.antiriciclaggioDataVerifica || az.createdAt
            const rischio = (az.antiriciclaggioRischio || 'BASSO').toUpperCase()
            const rischioColore = rischio.includes('ALTO') ? '#dc2626' : rischio.includes('MEDIO') ? '#d97706' : '#16a34a'

            // Scadenza documento
            const haScadenza = Boolean(az.documentoScadenza)
            const scaduto = haScadenza && new Date(az.documentoScadenza).getTime() < Date.now()
            const docText = az.documentoNumero
              ? `${az.documentoTipo === 'passaporto' ? 'Pass.' : az.documentoTipo === 'patente' ? 'Pat.' : 'C.I.'} ${az.documentoNumero}`
              : 'Non caricato'

            return (
              <View
                key={az.id || idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' },
                ]}
              >
                <Text style={[styles.colFasc, styles.bold, { color: '#1e40af' }]}>
                  {fascicolo}
                </Text>
                <Text style={styles.colData}>{formatDate(dataVerifica)}</Text>
                <View style={styles.colRagSoc}>
                  <Text style={styles.bold}>{az.ragioneSociale}</Text>
                  {az.legaleRappresentante && (
                    <Text style={{ fontSize: 6.2, color: '#64748b' }}>
                      Rappr: {az.legaleRappresentante}
                    </Text>
                  )}
                </View>
                <View style={styles.colFiscale}>
                  {az.partitaIva && <Text>P.I. {az.partitaIva}</Text>}
                  {az.codiceFiscale && <Text style={{ fontSize: 6.2 }}>CF {az.codiceFiscale}</Text>}
                </View>
                <Text style={[styles.colSettore, { color: '#334155' }]}>
                  {az.settoreAttivita || 'CONTABILITÀ'}
                </Text>
                <View style={styles.colDoc}>
                  <Text style={styles.bold}>{docText}</Text>
                  {haScadenza && (
                    <Text style={{ fontSize: 6.2, color: scaduto ? '#dc2626' : '#16a34a' }}>
                      {scaduto ? '⚠️ SCADUTO il ' : 'Scade il '}
                      {formatDate(az.documentoScadenza)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.colRischio, styles.bold, { color: rischioColore }]}>
                  {rischio}
                </Text>
                <View style={styles.colStato}>
                  <Text style={[styles.bold, { color: az.antiriciclaggioStato === 'REGOLARE' ? '#16a34a' : '#ea580c' }]}>
                    {az.antiriciclaggioStato || 'DA VERIF.'}
                  </Text>
                  <Text style={{ fontSize: 5.8, color: az.privacyFirmata ? '#16a34a' : '#94a3b8' }}>
                    {az.privacyFirmata ? '✓ Privacy' : 'No Privacy'}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Studio {studioNome} · Registro conservato ai sensi dell'art. 31 D.Lgs. 231/2007</Text>
          <Text>Pagina stampata il {formatDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaAntiriciclaggioRegistroPDF(aziende: any[], emittente: any): Promise<Buffer> {
  return await renderToBuffer(<AntiriciclaggioRegistroDocument aziende={aziende} emittente={emittente} />)
}
