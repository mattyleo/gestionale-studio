// src/lib/pdf/scheda-cliente-pdf.tsx
// Generatore PDF Scheda Conto Cliente / Partitario dello Studio
// Conforme al modello operativo richiesto dal Dott. Antonio Tuzio

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
    padding: 35,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    paddingBottom: 12,
  },
  headerLeft: {
    width: '60%',
  },
  headerRight: {
    width: '38%',
    textAlign: 'right',
  },
  studioTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  studioSub: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 1.5,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  clientBox: {
    fontSize: 8.5,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionTitlePaid: {
    color: '#166534',
  },
  sectionTitlePending: {
    color: '#9a3412',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    fontSize: 8,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  colDesc: { width: '48%' },
  colPeriodo: { width: '22%' },
  colImponibile: { width: '10%', textAlign: 'right' },
  colCassa: { width: '10%', textAlign: 'right' },
  colTotale: { width: '10%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },

  summaryTable: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#1e40af',
    marginTop: 12,
    marginBottom: 15,
  },
  summaryHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8.5,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  colSumLabel: { width: '55%' },
  colSumVal: { width: '15%', textAlign: 'right' },
  colSumTot: { width: '15%', textAlign: 'right' },

  ibanBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    marginTop: 10,
    fontSize: 8,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
  },
})

function formatEuro(val: number): string {
  return val.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function formatDate(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('it-IT')
}

export interface VoceScheda {
  descrizione: string
  periodo: string
  imponibile: number
  cassa: number
  totale: number
}

export interface DatiSchedaCliente {
  emittente: {
    denominazione: string
    indirizzo: string
    cap: string
    comune: string
    provincia: string
    partitaIva: string
    codiceFiscale: string
    iban?: string | null
  }
  cliente: {
    codice?: string
    ragioneSociale: string
    codiceFiscale?: string | null
    partitaIva?: string | null
  }
  dataEstrazione: Date
  vociIncassate: VoceScheda[]
  vociDaIncassare: VoceScheda[]
}

export function SchedaClienteDocument({ data }: { data: DatiSchedaCliente }) {
  const { emittente, cliente, vociIncassate, vociDaIncassare, dataEstrazione } = data

  // Calcoli Incassato
  const totImpInc = vociIncassate.reduce((acc, v) => acc + v.imponibile, 0)
  const totCasInc = vociIncassate.reduce((acc, v) => acc + v.cassa, 0)
  const totDocInc = vociIncassate.reduce((acc, v) => acc + v.totale, 0)

  // Calcoli Da Incassare
  const totImpDai = vociDaIncassare.reduce((acc, v) => acc + v.imponibile, 0)
  const totCasDai = vociDaIncassare.reduce((acc, v) => acc + v.cassa, 0)
  const totDocDai = vociDaIncassare.reduce((acc, v) => acc + v.totale, 0)

  // Totali Generali
  const totImpGen = totImpInc + totImpDai
  const totCasGen = totCasInc + totCasDai
  const totDocGen = totDocInc + totDocDai

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Intestazione */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.studioTitle}>{emittente.denominazione}</Text>
            <Text style={styles.studioSub}>
              {emittente.indirizzo} - {emittente.cap} {emittente.comune} ({emittente.provincia})
            </Text>
            <Text style={styles.studioSub}>
              P.IVA: {emittente.partitaIva} - C.F.: {emittente.codiceFiscale}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>SCHEDA CONTO CLIENTE</Text>
            <Text style={styles.clientBox}>
              Cliente: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{cliente.ragioneSociale}</Text>
            </Text>
            {(cliente.partitaIva || cliente.codiceFiscale) && (
              <Text style={styles.clientBox}>
                CF/P.IVA: {cliente.partitaIva || cliente.codiceFiscale}
              </Text>
            )}
            <Text style={styles.clientBox}>Data estrazione: {formatDate(dataEstrazione)}</Text>
          </View>
        </View>

        {/* 1. Prestazioni Fatturate e Incassate */}
        <Text style={[styles.sectionTitle, styles.sectionTitlePaid]}>
          1. PRESTAZIONI FATTURATE E INCASSATE (PAGATO)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descrizione Servizio / Documento</Text>
            <Text style={styles.colPeriodo}>Periodo / Data</Text>
            <Text style={styles.colImponibile}>Imponibile</Text>
            <Text style={styles.colCassa}>Cassa 4%</Text>
            <Text style={styles.colTotale}>Totale</Text>
          </View>
          {vociIncassate.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={{ width: '100%', fontStyle: 'italic', color: '#64748b' }}>
                Nessuna prestazione incassata registrata.
              </Text>
            </View>
          ) : (
            vociIncassate.map((v, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
              >
                <Text style={styles.colDesc}>{v.descrizione}</Text>
                <Text style={styles.colPeriodo}>{v.periodo}</Text>
                <Text style={styles.colImponibile}>{formatEuro(v.imponibile)}</Text>
                <Text style={styles.colCassa}>{formatEuro(v.cassa)}</Text>
                <Text style={styles.colTotale}>{formatEuro(v.totale)}</Text>
              </View>
            ))
          )}
        </View>

        {/* 2. Prestazioni da Fatturare e Incassare */}
        <Text style={[styles.sectionTitle, styles.sectionTitlePending]}>
          2. PRESTAZIONI DA FATTURARE E INCASSARE (DA INCASSARE)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Descrizione Servizio / Documento</Text>
            <Text style={styles.colPeriodo}>Periodo / Data</Text>
            <Text style={styles.colImponibile}>Imponibile</Text>
            <Text style={styles.colCassa}>Cassa 4%</Text>
            <Text style={styles.colTotale}>Totale</Text>
          </View>
          {vociDaIncassare.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={{ width: '100%', fontStyle: 'italic', color: '#64748b' }}>
                Nessuna prestazione aperta o da incassare.
              </Text>
            </View>
          ) : (
            vociDaIncassare.map((v, idx) => (
              <View
                key={idx}
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowEven : {}]}
              >
                <Text style={styles.colDesc}>{v.descrizione}</Text>
                <Text style={styles.colPeriodo}>{v.periodo}</Text>
                <Text style={styles.colImponibile}>{formatEuro(v.imponibile)}</Text>
                <Text style={styles.colCassa}>{formatEuro(v.cassa)}</Text>
                <Text style={styles.colTotale}>{formatEuro(v.totale)}</Text>
              </View>
            ))
          )}
        </View>

        {/* 3. Quadro Riepilogativo Generale */}
        <Text style={styles.sectionTitle}>3. QUADRO RIEPILOGATIVO GENERALE</Text>
        <View style={styles.summaryTable}>
          <View style={styles.summaryHeader}>
            <Text style={styles.colSumLabel}>Riepilogo Posizione Contabile</Text>
            <Text style={styles.colSumVal}>Imponibile</Text>
            <Text style={styles.colSumVal}>Cassa 4%</Text>
            <Text style={styles.colSumTot}>Totale Generale</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.colSumLabel}>Totale Incassato (PAGATO)</Text>
            <Text style={styles.colSumVal}>{formatEuro(totImpInc)}</Text>
            <Text style={styles.colSumVal}>{formatEuro(totCasInc)}</Text>
            <Text style={styles.colSumTot}>{formatEuro(totDocInc)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.colSumLabel}>Totale da Incassare (DA INCASSARE)</Text>
            <Text style={styles.colSumVal}>{formatEuro(totImpDai)}</Text>
            <Text style={styles.colSumVal}>{formatEuro(totCasDai)}</Text>
            <Text style={[styles.colSumTot, { color: '#b91c1c' }]}>{formatEuro(totDocDai)}</Text>
          </View>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.colSumLabel}>TOTALE COMPLESSIVO CLIENTE</Text>
            <Text style={styles.colSumVal}>{formatEuro(totImpGen)}</Text>
            <Text style={styles.colSumVal}>{formatEuro(totCasGen)}</Text>
            <Text style={styles.colSumTot}>{formatEuro(totDocGen)}</Text>
          </View>
        </View>

        {/* Coordinate di pagamento dello studio se presente residuo */}
        {emittente.iban && totDocDai > 0 && (
          <View style={styles.ibanBox}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>
              Coordinate Bancarie per il Saldo:
            </Text>
            <Text>IBAN: {emittente.iban} - Intestato a: {emittente.denominazione}</Text>
            <Text style={{ marginTop: 2, fontStyle: 'italic' }}>
              Causale: Saldo prestazioni studio professionale
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Estratto Conto generato automaticamente da Gestionale Studio</Text>
          <Text>Pagina 1 di 1</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function generaSchedaClientePDF(data: DatiSchedaCliente): Promise<Buffer> {
  const buffer = await renderToBuffer(<SchedaClienteDocument data={data} />)
  return buffer
}
