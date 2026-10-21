import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    width: '50%',
  },
  headerRight: {
    width: '40%',
    textAlign: 'right',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bozzaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    marginBottom: 5,
  },
  infoTesto: {
    marginBottom: 2,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  clientSection: {
    marginBottom: 30,
    paddingLeft: '50%',
  },
  clientBox: {
    border: '1pt solid #ccc',
    padding: 10,
  },
  clientName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  table: {
    width: '100%',
    marginBottom: 20,
    border: '1pt solid #ccc',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottom: '1pt solid #ccc',
    padding: 5,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #eee',
    padding: 5,
  },
  colN: { width: '5%' },
  colDesc: { width: '50%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  summaryBox: {
    width: '50%',
    border: '1pt solid #ccc',
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
    borderTop: '1pt solid #ccc',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  paymentSection: {
    marginBottom: 20,
    padding: 10,
    border: '1pt solid #ccc',
    backgroundColor: '#fafafa',
  },
  noteSmall: {
    fontSize: 8,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1pt solid #eee',
    paddingTop: 10,
  },
});

function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('it-IT').format(d);
}

function formatCurrency(amount: number | string): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(num);
}

function formatNumber(amount: number | string): string {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

const FatturaDocument = ({ fattura }: { fattura: any }) => {
  const isBozza = ['BOZZA', 'DA_APPROVARE', 'PRONTA_EMISSIONE'].includes(fattura.stato);

  // Usa gli snapshot se presenti, altrimenti i dati live
  const emittente =
    typeof fattura.snapshotEmittente === 'string'
      ? JSON.parse(fattura.snapshotEmittente)
      : fattura.snapshotEmittente || fattura.emittente || {};

  const cliente =
    typeof fattura.snapshotCliente === 'string'
      ? JSON.parse(fattura.snapshotCliente)
      : fattura.snapshotCliente || fattura.company || {};

  const lines = fattura.lines || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Emittente / Dati Documento */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, styles.bold]}>
              {emittente.denominazione || 'Dott. Antonio Tuzio'}
            </Text>
            <Text style={styles.infoTesto}>
              {emittente.indirizzo} - {emittente.cap} {emittente.comune} ({emittente.provincia})
            </Text>
            {emittente.codiceFiscale && (
              <Text style={styles.infoTesto}>C.F.: {emittente.codiceFiscale}</Text>
            )}
            {emittente.partitaIva && (
              <Text style={styles.infoTesto}>P.IVA: {emittente.partitaIva}</Text>
            )}
            <Text style={styles.infoTesto}>Regime Fiscale: {emittente.regimeFiscale || 'RF19'} (Forfetario L. 190/2014)</Text>
            <Text style={styles.infoTesto}>
              Cassa Previdenziale: {emittente.cassaPrevidenziale || 'TC02'} (CNPADC 4%)
            </Text>
          </View>
          <View style={styles.headerRight}>
            {isBozza ? (
              <>
                <Text style={[styles.title, { color: '#2563eb' }]}>AVVISO DI PARCELLA</Text>
                <Text style={{ fontSize: 8, color: '#dc2626', marginBottom: 4 }}>
                  (Nota Proforma — Non costituisce fattura fiscale ai sensi dell'art. 21 DPR 633/72)
                </Text>
                <Text style={styles.infoTesto}>Data emissione: {formatDate(fattura.createdAt || fattura.dataDocumento)}</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>FATTURA</Text>
                <Text style={[styles.infoTesto, styles.bold, { fontSize: 12 }]}>
                  {fattura.numeroCompleto || `FT ${fattura.numero}/${fattura.anno}`}
                </Text>
                <Text style={styles.infoTesto}>Data emissione: {formatDate(fattura.dataDocumento)}</Text>
              </>
            )}
            {fattura.periodoDal && fattura.periodoAl && (
              <Text style={styles.infoTesto}>
                Periodo di riferimento: {formatDate(fattura.periodoDal)} - {formatDate(fattura.periodoAl)}
              </Text>
            )}
          </View>
        </View>

        {/* Dati Cliente */}
        <View style={styles.clientSection}>
          <View style={styles.clientBox}>
            <Text style={styles.clientName}>{cliente.ragioneSociale || 'Cliente'}</Text>
            <Text style={styles.infoTesto}>
              {cliente.indirizzo}
            </Text>
            <Text style={styles.infoTesto}>
              {cliente.cap} {cliente.comune} {cliente.provincia ? `(${cliente.provincia})` : ''}
            </Text>
            <Text style={{ marginTop: 5 }} />
            {cliente.codiceFiscale && (
              <Text style={styles.infoTesto}>CF: {cliente.codiceFiscale}</Text>
            )}
            {cliente.partitaIva && (
              <Text style={styles.infoTesto}>P.IVA: {cliente.partitaIva}</Text>
            )}
            {cliente.codiceDestinatarioSdi && (
              <Text style={styles.infoTesto}>Codice SDI: {cliente.codiceDestinatarioSdi}</Text>
            )}
            {!cliente.codiceDestinatarioSdi && cliente.pec && (
              <Text style={styles.infoTesto}>PEC: {cliente.pec}</Text>
            )}
          </View>
        </View>

        {/* Tabella Righe */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colN}>N°</Text>
            <Text style={styles.colDesc}>Descrizione</Text>
            <Text style={styles.colQty}>Q.tà</Text>
            <Text style={styles.colPrice}>Prezzo unitario</Text>
            <Text style={styles.colAmount}>Importo</Text>
          </View>
          {lines.map((line: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colN}>{index + 1}</Text>
              <Text style={styles.colDesc}>{line.descrizione}</Text>
              <Text style={styles.colQty}>{formatNumber(line.quantita)}</Text>
              <Text style={styles.colPrice}>{formatCurrency(line.prezzoUnitario)}</Text>
              <Text style={styles.colAmount}>{formatCurrency(line.importo)}</Text>
            </View>
          ))}
        </View>

        {/* Riepilogo */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Imponibile:</Text>
              <Text>{formatCurrency(fattura.imponibile)}</Text>
            </View>
            {Number(fattura.totaleCassa) > 0 && (
              <View style={styles.summaryRow}>
                <Text>Cassa CNPADC 4%:</Text>
                <Text>{formatCurrency(fattura.totaleCassa)}</Text>
              </View>
            )}
            {Number(fattura.totaleIva) > 0 ? (
              <View style={styles.summaryRow}>
                <Text>IVA:</Text>
                <Text>{formatCurrency(fattura.totaleIva)}</Text>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <Text>IVA:</Text>
                <Text>Esclusa art.1 c.58 L.190/2014</Text>
              </View>
            )}
            {Number(fattura.bollo) > 0 && (
              <View style={styles.summaryRow}>
                <Text>Bollo virtuale ex art.15 DPR 642/72:</Text>
                <Text>{formatCurrency(fattura.bollo)}</Text>
              </View>
            )}
            <View style={styles.summaryTotal}>
              <Text>TOTALE DOCUMENTO:</Text>
              <Text>{formatCurrency(fattura.totaleDocumento)}</Text>
            </View>
          </View>
        </View>

        {/* Dati Pagamento */}
        <View style={styles.paymentSection}>
          <Text style={[styles.bold, { marginBottom: 5 }]}>Dati di pagamento</Text>
          {fattura.modalitaPagamento && (
            <Text style={styles.infoTesto}>Modalità: {fattura.modalitaPagamento}</Text>
          )}
          {fattura.ibanDestinatario && (
            <Text style={styles.infoTesto}>IBAN: {fattura.ibanDestinatario}</Text>
          )}
          {fattura.note && (
            <Text style={{ marginTop: 10, fontStyle: 'italic' }}>{fattura.note}</Text>
          )}
        </View>

        <Text style={styles.noteSmall}>
          Operazione in regime forfetario L.190/2014 art.1 c.58, non soggetta ad IVA
        </Text>

        <Text style={styles.footer}>
          Documento generato il {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
};

export async function generaFatturaPDF(fattura: any): Promise<Buffer> {
  return await renderToBuffer(<FatturaDocument fattura={fattura} />);
}
