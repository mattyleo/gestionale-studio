// src/lib/pdf/elenco-clienti-pdf.tsx
// Generatore PDF Elenco Anagrafico Clienti dello Studio

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
    paddingHorizontal: 25,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  header: {
    borderBottom: '1.5pt solid #2563eb',
    paddingBottom: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLeft: {
    width: '65%',
  },
  headerRight: {
    width: '35%',
    textAlign: 'right',
  },
  studioTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  docTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginTop: 2,
  },
  metaText: {
    fontSize: 7.5,
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
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: '#0f172a',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e2e8f0',
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  colNr: { width: '4%', textAlign: 'center' },
  colRagSoc: { width: '28%' },
  colFiscale: { width: '18%' },
  colSede: { width: '22%' },
  colRecapiti: { width: '18%' },
  colStato: { width: '10%', textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    borderTop: '0.5pt solid #cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.5,
    color: '#94a3b8',
  },
})

function formatDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('it-IT').format(date)
}

export function ElencoClientiDocument({
  clienti,
  emittente,
}: {
  clienti: any[]
  emittente: any
}) {
  const studioNome = emittente?.denominazione || 'Dott. Antonio Tuzio'
  const studioPIVA = emittente?.partitaIva || '05389400481'
  const studioComune = emittente?.comune || "Reggio nell'Emilia"

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.studioTitle}>{studioNome} · Studio Professionale</Text>
            <Text style={styles.docTitle}>ELENCO ANAGRAFICO CLIENTI</Text>
            <Text style={styles.metaText}>
              Sede: {studioComune} · P.IVA: {studioPIVA}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.bold, { fontSize: 9, color: '#0f172a' }]}>
              Totale Clienti in Anagrafica: {clienti.length}
            </Text>
            <Text style={styles.metaText}>Data estrazione: {formatDate()}</Text>
          </View>
        </View>

        {/* Tabella Clienti */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNr}>N°</Text>
            <Text style={styles.colRagSoc}>RAGIONE SOCIALE / NOME</Text>
            <Text style={styles.colFiscale}>CODICE FISCALE / P.IVA</Text>
            <Text style={styles.colSede}>SEDE LEGALE / RESIDENZA</Text>
            <Text style={styles.colRecapiti}>RECAPITI (SDI / PEC / EMAIL)</Text>
            <Text style={styles.colStato}>STATO / PAG.</Text>
          </View>

          {clienti.map((c, idx) => (
            <View
              key={c.id || idx}
              style={[
                styles.tableRow,
                { backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff' },
              ]}
            >
              <Text style={styles.colNr}>{idx + 1}</Text>
              <View style={styles.colRagSoc}>
                <Text style={styles.bold}>{c.ragioneSociale}</Text>
                <Text style={{ fontSize: 6.5, color: '#64748b' }}>
                  {c.tipoSoggetto === 'PA' ? 'Pubblica Amministrazione' : c.tipoSoggetto === 'PERSONA_FISICA' ? 'Persona Fisica' : 'Società / Ditta'}
                  {c.referente ? ` · Ref: ${c.referente}` : ''}
                </Text>
              </View>
              <View style={styles.colFiscale}>
                {c.codiceFiscale && <Text>C.F.: {c.codiceFiscale}</Text>}
                {c.partitaIva && <Text>P.IVA: {c.partitaIva}</Text>}
              </View>
              <View style={styles.colSede}>
                <Text>{c.indirizzo || '—'}</Text>
                <Text style={{ fontSize: 6.5, color: '#475569' }}>
                  {c.cap || ''} {c.comune ? `${c.comune} (${c.provincia || ''})` : ''}
                </Text>
              </View>
              <View style={styles.colRecapiti}>
                {c.codiceDestinatarioSdi && (
                  <Text>SDI: <Text style={styles.bold}>{c.codiceDestinatarioSdi}</Text></Text>
                )}
                {c.pec && <Text style={{ fontSize: 6.5 }}>PEC: {c.pec}</Text>}
                {c.emailAmministrativa && !c.pec && (
                  <Text style={{ fontSize: 6.5 }}>Email: {c.emailAmministrativa}</Text>
                )}
                {c.telefono && <Text style={{ fontSize: 6.5 }}>Tel: {c.telefono}</Text>}
              </View>
              <View style={styles.colStato}>
                <Text style={[styles.bold, { color: c.attivo ? '#16a34a' : '#64748b' }]}>
                  {c.attivo ? 'ATTIVO' : 'ARCHIVIATO'}
                </Text>
                <Text style={{ fontSize: 6.5, color: '#64748b' }}>
                  {c.modalitaPagamento || 'MP05'} ({c.terminiPagamento ?? 30} gg)
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Studio {studioNome} · Documento ad uso interno amministrativo</Text>
          <Text>Stampato il {formatDate()}</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaElencoClientiPDF(clienti: any[], emittente: any): Promise<Buffer> {
  return await renderToBuffer(<ElencoClientiDocument clienti={clienti} emittente={emittente} />)
}
