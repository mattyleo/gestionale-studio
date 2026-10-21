// src/lib/pdf/fattura-pdf.tsx
// Generatore PDF fatture ed avvisi di parcella (bozze) conforme agli standard del Dott. Antonio Tuzio

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
    paddingBottom: 40,
    paddingHorizontal: 35,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#222',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  // ── Sezione Header Superiore ──
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  topHeaderLeft: {
    width: '55%',
  },
  topHeaderRight: {
    width: '42%',
    textAlign: 'right',
  },
  docTitleMain: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8', // blue-700
    marginBottom: 3,
  },
  docTitleInvoice: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  docSubProforma: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#b91c1c', // red-700
    marginBottom: 6,
  },
  metaRow: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
  },
  // ── Due Blocchi: Fornitore e Cliente ──
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  partyBox: {
    width: '48.5%',
    backgroundColor: '#f8fafc',
    border: '1pt solid #cbd5e1',
    borderRadius: 4,
    padding: 8,
  },
  partyTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 4,
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  partyText: {
    fontSize: 8,
    color: '#334155',
    marginBottom: 1.5,
  },
  // ── Intestazioni Sezione ──
  sectionHeading: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginVertical: 8,
  },
  // ── Tabelle ──
  table: {
    width: '100%',
    border: '1pt solid #cbd5e1',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderBottom: '1pt solid #cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#1e293b',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e2e8f0',
    paddingVertical: 4.5,
    paddingHorizontal: 4,
    fontSize: 8,
    alignItems: 'center',
  },
  // Colonne Prodotti & Servizi
  colNr: { width: '5%', textAlign: 'center' },
  colDesc: { width: '45%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colAmount: { width: '15%', textAlign: 'right' },
  colIva: { width: '5%', textAlign: 'center' },
  colNatura: { width: '5%', textAlign: 'center' },
  // Colonne Metodo Pagamento
  colPayRata: { width: '8%', textAlign: 'center' },
  colPayMod: { width: '14%' },
  colPayTipo: { width: '22%' },
  colPayBanca: { width: '16%' },
  colPayIban: { width: '20%' },
  colPayScad: { width: '10%', textAlign: 'center' },
  colPayImp: { width: '10%', textAlign: 'right' },
  // ── Riquadri Fiscali e Causali ──
  fiscalBox: {
    border: '1pt solid #e2e8f0',
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    padding: 7,
    marginBottom: 8,
  },
  fiscalLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  fiscalDesc: {
    fontSize: 7.5,
    color: '#475569',
    lineHeight: 1.3,
  },
  // ── Riepilogo e Calcolo Finale ──
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
    gap: 12,
  },
  vatSummaryBox: {
    width: '48.5%',
    border: '1pt solid #cbd5e1',
    borderRadius: 3,
    padding: 7,
    backgroundColor: '#f8fafc',
  },
  calcSummaryBox: {
    width: '48.5%',
    border: '1pt solid #cbd5e1',
    borderRadius: 3,
    padding: 7,
    backgroundColor: '#ffffff',
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 8,
    color: '#334155',
  },
  calcTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1.5pt solid #0f172a',
    marginTop: 4,
    paddingTop: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 35,
    right: 35,
    borderTop: '0.5pt solid #cbd5e1',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 7,
    color: '#64748b',
  },
})

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('it-IT').format(d)
}

function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(num)
}

function formatNumber(amount: number | string | null | undefined): string {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

const FatturaDocument = ({ fattura }: { fattura: any }) => {
  const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato)

  // Emittente
  const emittente =
    typeof fattura.snapshotEmittente === 'string'
      ? JSON.parse(fattura.snapshotEmittente)
      : fattura.snapshotEmittente || fattura.emittente || {}

  // Cliente
  const cliente =
    typeof fattura.snapshotCliente === 'string'
      ? JSON.parse(fattura.snapshotCliente)
      : fattura.snapshotCliente || fattura.company || {}

  const lines = fattura.lines || []

  // Calcoli finanziari
  const imponibile = Number(fattura.imponibile) || 0
  const totaleCassa = Number(fattura.totaleCassa) || 0
  const imponibilePlusCassa = imponibile + totaleCassa

  // Regola bollo: se impostato esplicitamente > 0 o se imponibile + cassa > 77.47 e regime forfettario
  let bollo = Number(fattura.bollo) || 0
  if (bollo === 0 && imponibilePlusCassa > 77.47) {
    bollo = 2.0
  }

  const totaleIva = Number(fattura.totaleIva) || 0
  const totaleDocumento = Number(fattura.totaleDocumento) > 0 ? Number(fattura.totaleDocumento) : (imponibilePlusCassa + totaleIva + bollo)

  const studioNome = emittente.denominazione || 'Dott. Antonio Tuzio'
  const studioIndirizzo = emittente.indirizzo || 'Viale Risorgimento 70'
  const studioCap = emittente.cap || '42123'
  const studioComune = emittente.comune || "Reggio nell'Emilia"
  const studioProv = emittente.provincia || 'RE'
  const studioPaese = emittente.paese || 'IT'
  const studioCF = emittente.codiceFiscale || 'TZUNTN69A16D612E'
  const studioPIVA = emittente.partitaIva || '05389400481'
  const studioTel = emittente.telefono || '0522331628'
  const studioEmail = emittente.email || 'infooizut@gmail.com'
  const studioIban = emittente.iban || 'IT89E0303212804010000063104'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Intestazione Superiore / Tipo Documento ── */}
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <Text style={[styles.bold, { fontSize: 13, color: '#0f172a', marginBottom: 2 }]}>
              {studioNome}
            </Text>
            <Text style={styles.metaRow}>
              {studioIndirizzo} · {studioCap} {studioComune} ({studioProv}) - {studioPaese}
            </Text>
            <Text style={styles.metaRow}>
              C.F.: {studioCF} · P.IVA: {studioPIVA}
            </Text>
            <Text style={styles.metaRow}>
              Tel: {studioTel} · Email: {studioEmail}
            </Text>
          </View>

          <View style={styles.topHeaderRight}>
            {isBozza ? (
              <>
                <Text style={styles.docTitleMain}>AVVISO DI PARCELLA</Text>
                <Text style={styles.docSubProforma}>
                  (Nota Proforma — Non costituisce fattura fiscale ai sensi dell'art. 21 DPR 633/72)
                </Text>
                <Text style={styles.metaRow}>
                  Data emissione: <Text style={styles.bold}>{formatDate(fattura.createdAt || fattura.dataDocumento || new Date())}</Text>
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.docTitleInvoice}>FATTURA ELETTRONICA</Text>
                <Text style={[styles.bold, { fontSize: 11, color: '#0f172a', marginBottom: 2 }]}>
                  N° {fattura.numeroCompleto || `FPR ${fattura.numero}/${fattura.anno}`}
                </Text>
                <Text style={styles.metaRow}>
                  Data documento: <Text style={styles.bold}>{formatDate(fattura.dataDocumento)}</Text>
                </Text>
              </>
            )}

            {fattura.periodoDal && fattura.periodoAl && (
              <Text style={styles.metaRow}>
                Periodo di riferimento: {formatDate(fattura.periodoDal)} - {formatDate(fattura.periodoAl)}
              </Text>
            )}
          </View>
        </View>

        {/* ── Due Colonne: FORNITORE e CLIENTE ── */}
        <View style={styles.partiesRow}>
          {/* Box Fornitore */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Fornitore</Text>
            <Text style={styles.partyName}>{studioNome}</Text>
            <Text style={styles.partyText}>P.IVA: IT{studioPIVA}</Text>
            <Text style={styles.partyText}>C.F.: {studioCF}</Text>
            <Text style={styles.partyText}>{studioIndirizzo}</Text>
            <Text style={styles.partyText}>{studioCap} - {studioComune} ({studioProv}) - {studioPaese}</Text>
            <Text style={styles.partyText}>Telefono: {studioTel}</Text>
            <Text style={styles.partyText}>Email: {studioEmail}</Text>
          </View>

          {/* Box Cliente */}
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Cliente</Text>
            <Text style={styles.partyName}>{cliente.ragioneSociale || 'Cliente'}</Text>
            {cliente.codiceFiscale && (
              <Text style={styles.partyText}>C.F.: {cliente.codiceFiscale}</Text>
            )}
            {cliente.partitaIva && (
              <Text style={styles.partyText}>P.IVA: {cliente.partitaIva}</Text>
            )}
            {cliente.indirizzo && (
              <Text style={styles.partyText}>{cliente.indirizzo}</Text>
            )}
            <Text style={styles.partyText}>
              {cliente.cap || ''} {cliente.comune ? `${cliente.comune} (${cliente.provincia || ''})` : ''} - {cliente.paese || 'IT'}
            </Text>
            {cliente.codiceDestinatarioSdi && (
              <Text style={styles.partyText}>Codice SDI: <Text style={styles.bold}>{cliente.codiceDestinatarioSdi}</Text></Text>
            )}
            {cliente.pec && (
              <Text style={styles.partyText}>PEC: {cliente.pec}</Text>
            )}
          </View>
        </View>

        {/* ── Sezione Prodotti e Servizi ── */}
        <Text style={styles.sectionHeading}>Prodotti e Servizi</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNr}>NR</Text>
            <Text style={styles.colDesc}>DESCRIZIONE</Text>
            <Text style={styles.colQty}>QUANTITÀ</Text>
            <Text style={styles.colPrice}>PREZZO</Text>
            <Text style={styles.colAmount}>IMPORTO</Text>
            <Text style={styles.colIva}>IVA</Text>
            <Text style={styles.colNatura}>NATURA</Text>
          </View>

          {lines.length > 0 ? (
            lines.map((line: any, idx: number) => {
              const aliq = line.aliquotaIva ?? '0'
              const nat = line.naturaIva ?? 'N2.2'
              return (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.colNr}>{idx + 1}</Text>
                  <Text style={styles.colDesc}>{line.descrizione}</Text>
                  <Text style={styles.colQty}>{formatNumber(line.quantita)}</Text>
                  <Text style={styles.colPrice}>{formatCurrency(line.prezzoUnitario)}</Text>
                  <Text style={[styles.colAmount, styles.bold]}>{formatCurrency(line.importo)}</Text>
                  <Text style={styles.colIva}>{aliq}%</Text>
                  <Text style={styles.colNatura}>{nat}</Text>
                </View>
              )
            })
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colNr}>1</Text>
              <Text style={styles.colDesc}>Prestazioni professionali</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colPrice}>{formatCurrency(imponibile)}</Text>
              <Text style={[styles.colAmount, styles.bold]}>{formatCurrency(imponibile)}</Text>
              <Text style={styles.colIva}>0%</Text>
              <Text style={styles.colNatura}>N2.2</Text>
            </View>
          )}
        </View>

        {/* ── Metodo di Pagamento ── */}
        <Text style={styles.sectionHeading}>Metodo di Pagamento</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colPayRata}>NR RATA</Text>
            <Text style={styles.colPayMod}>MODALITÀ</Text>
            <Text style={styles.colPayTipo}>TIPO PAGAMENTO</Text>
            <Text style={styles.colPayBanca}>BANCA APPOGGIO</Text>
            <Text style={styles.colPayIban}>IBAN</Text>
            <Text style={styles.colPayScad}>SCADENZA</Text>
            <Text style={styles.colPayImp}>IMPORTO</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colPayRata}>1</Text>
            <Text style={styles.colPayMod}>{fattura.modalitaPagamento === 'MP05' ? 'Bonifico (MP05)' : (fattura.modalitaPagamento || 'Bonifico')}</Text>
            <Text style={styles.colPayTipo}>Pagamento in unica soluzione</Text>
            <Text style={styles.colPayBanca}>CREDEM</Text>
            <Text style={[styles.colPayIban, { fontSize: 7 }]}>{studioIban}</Text>
            <Text style={styles.colPayScad}>{formatDate(fattura.dataScadenza || new Date(Date.now() + 30 * 86400000))}</Text>
            <Text style={[styles.colPayImp, styles.bold]}>{formatCurrency(totaleDocumento)}</Text>
          </View>
        </View>

        {/* ── Regime Fiscale & Cassa Previdenziale ── */}
        <View style={styles.fiscalBox}>
          <Text style={styles.fiscalLabel}>Regime Fiscale</Text>
          <Text style={styles.fiscalDesc}>
            RF19 - Operazione senza applicazione dell'Iva ai sensi dell' art.1 co. 54-89, della legge n. 190/2014 così come modificato dalla legge n. 208/2015 e dalla legge n. 145/2018
          </Text>
          <View style={{ marginTop: 4 }}>
            <Text style={styles.fiscalLabel}>Cassa Previdenziale</Text>
            <Text style={styles.fiscalDesc}>
              TC02 - Cassa previdenza dottori commercialisti (CNPADC), Aliquota cassa 4% su 100% dell'imponibile, Codice IVA 0% - N2.2 - Non soggette - altri casi
            </Text>
          </View>
        </View>

        {/* ── Dati Aggiuntivi / Causale Documento ── */}
        <View style={styles.fiscalBox}>
          <Text style={styles.fiscalLabel}>Causale Documento &amp; Riferimenti Normativi</Text>
          <Text style={[styles.fiscalDesc, styles.bold, { color: '#0f172a' }]}>
            Operazione non soggetta a ritenuta alla fonte a titolo di acconto ai sensi dell'articolo 1, comma 67, l. n. 190 del 2014 e successive modificazioni.
          </Text>
          {bollo > 0 && (
            <Text style={[styles.fiscalDesc, { marginTop: 2, color: '#1e293b' }]}>
              Imposta di bollo da 2,00 € assolta in modo virtuale ai sensi del D.M. 17 giugno 2014 (art. 15 D.P.R. 642/1972).
            </Text>
          )}
          {fattura.note && (
            <Text style={[styles.fiscalDesc, { marginTop: 3, fontStyle: 'italic' }]}>
              Note: {fattura.note}
            </Text>
          )}
        </View>

        {/* ── Riepilogo IVA e Calcolo Fattura ── */}
        <View style={styles.totalsSection}>
          {/* Riquadro Riepilogo IVA */}
          <View style={styles.vatSummaryBox}>
            <Text style={[styles.bold, { fontSize: 8.5, marginBottom: 5, color: '#0f172a' }]}>
              Riepilogo IVA
            </Text>
            <View style={styles.calcRow}>
              <Text>Aliquota:</Text>
              <Text>0% (Natura N2.2)</Text>
            </View>
            <View style={styles.calcRow}>
              <Text>Imponibile complessivo:</Text>
              <Text>{formatCurrency(imponibilePlusCassa)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text>Imposta totale:</Text>
              <Text>0,00 €</Text>
            </View>
            <View style={[styles.calcRow, { marginTop: 4, borderTop: '0.5pt solid #cbd5e1', paddingTop: 2 }]}>
              <Text style={{ fontSize: 7, color: '#64748b' }}>Esente art.1 c.58 L.190/2014</Text>
              <Text style={{ fontSize: 7, color: '#64748b' }}>Non soggetta</Text>
            </View>
          </View>

          {/* Riquadro Calcolo Fattura */}
          <View style={styles.calcSummaryBox}>
            <Text style={[styles.bold, { fontSize: 8.5, marginBottom: 5, color: '#0f172a' }]}>
              Calcolo Fattura
            </Text>
            <View style={styles.calcRow}>
              <Text>Imponibile prestazioni:</Text>
              <Text>{formatCurrency(imponibile)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text>Cassa Previdenziale (CNPADC 4%):</Text>
              <Text>{formatCurrency(totaleCassa)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text>IVA (0% - N2.2):</Text>
              <Text>0,00 €</Text>
            </View>
            {bollo > 0 && (
              <View style={styles.calcRow}>
                <Text>Bollo virtuale (D.M. 17/06/2014):</Text>
                <Text>{formatCurrency(bollo)}</Text>
              </View>
            )}
            <View style={styles.calcTotalRow}>
              <Text>TOTALE DOCUMENTO:</Text>
              <Text>{formatCurrency(totaleDocumento)}</Text>
            </View>
          </View>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>
          Documento emesso dallo studio {studioNome} · Partita IVA IT{studioPIVA} · Generato il {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  )
}

export async function generaFatturaPDF(fattura: any): Promise<Buffer> {
  return await renderToBuffer(<FatturaDocument fattura={fattura} />)
}
