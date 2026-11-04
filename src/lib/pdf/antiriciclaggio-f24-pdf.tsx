// src/lib/pdf/antiriciclaggio-f24-pdf.tsx
// Allegato A — Autorizzazione alla trasmissione telematica dei modelli di versamento unificato F24 (Servizio Entratel)
// Con Autocompilazione Intelligente (Decodifica Codice Fiscale, Estrazione Titolare, P.IVA 11 cifre) e Layout Esecutivo

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { arricchisciDatiClienteBot } from '@/lib/antiriciclaggio-engine'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.6,
    color: '#1e293b',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 30,
    lineHeight: 1.38,
    backgroundColor: '#ffffff',
  },
  headerBanner: {
    backgroundColor: '#1e3a8a',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studioTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  studioSub: {
    fontSize: 7.4,
    color: '#dbeafe',
    marginTop: 1.5,
  },
  badgeBox: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  badgeTitle: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  badgeSub: {
    fontSize: 6.8,
    color: '#475569',
    marginTop: 1,
  },
  titleStrip: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 9,
    alignItems: 'center',
  },
  allegatoTag: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    marginBottom: 1.5,
  },
  mainTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 7.6,
    color: '#475569',
    marginTop: 1.5,
    textAlign: 'center',
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 4,
    paddingHorizontal: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderText: {
    fontSize: 8.2,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  sectionHeaderBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
  },
  sectionBody: {
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
    paddingRight: 6,
  },
  col2: {
    flex: 2,
    paddingRight: 6,
  },
  fieldLabel: {
    fontSize: 6.7,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 8.6,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    borderWidth: 0.7,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  autorizzaBanner: {
    backgroundColor: '#1e3a8a',
    borderRadius: 4,
    paddingVertical: 3.5,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginVertical: 5,
  },
  autorizzaText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 8.2,
    color: '#1e293b',
    textAlign: 'justify',
    marginBottom: 5,
    lineHeight: 1.38,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  optionBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  optionBoxActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: '#1e3a8a',
    borderRadius: 2,
    marginRight: 6,
    marginTop: 1,
    textAlign: 'center',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    width: 11,
    height: 11,
    borderWidth: 1.2,
    borderColor: '#1e3a8a',
    borderRadius: 2,
    marginRight: 6,
    marginTop: 1,
    textAlign: 'center',
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    backgroundColor: '#1e3a8a',
  },
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  signatureCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
  },
  signatureTitle: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 18,
    marginBottom: 3,
  },
  signatureSub: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 5,
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  infoTitle: {
    fontSize: 8.3,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 7.3,
    color: '#334155',
    textAlign: 'justify',
    marginBottom: 3,
    lineHeight: 1.32,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 30,
    right: 30,
    borderTopWidth: 0.7,
    borderTopColor: '#cbd5e1',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.8,
    color: '#64748b',
  },
})

function formatDate(d?: Date | string | null): string {
  if (!d) return '____/____/________'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '____/____/________'
  return dt.toLocaleDateString('it-IT')
}

export async function generaAutorizzazioneF24PDF(
  azienda: any,
  emittente: any
): Promise<Buffer> {
  const botDati = arricchisciDatiClienteBot(azienda)

  const studioDenominazione = emittente?.denominazione || 'STUDIO PROFESSIONALE COMMERCIALE'
  const studioIndirizzo = emittente?.indirizzo
    ? `${emittente.indirizzo} — ${emittente.cap || '42123'} ${emittente.comune || 'Reggio Emilia'} (${emittente.provincia || 'RE'})`
    : 'Sede Studio Professionale — Reggio Emilia (RE)'
  const studioCf = emittente?.codiceFiscale || 'N/D'
  const studioPiva = emittente?.partitaIva || 'N/D'
  const studioIban = emittente?.iban || 'IBAN Studio come da profilo emittente'

  const oggi = formatDate(azienda.mandatoData || azienda.antiriciclaggioDataVerifica || new Date())
  const fascicolo = azienda.antiriciclaggioFascicolo || `ARC-${new Date().getFullYear()}`

  const rapprNome = botDati.rapprNome || '________________________________________'
  const rapprCf = botDati.cfPersona || '________________________'
  const luogoNascita = botDati.luogoNascita || azienda.comune || '________________________'
  const dataNascita = botDati.dataNascitaIt || formatDate(azienda.dataNascitaRappr)
  const pivaNorm = botDati.pivaNorm || azienda.partitaIva || 'Non applicabile (Privato)'
  const cfAzienda = botDati.cfNorm || azienda.codiceFiscale || pivaNorm
  const isSocieta = botDati.isSocieta

  const comuneRes = azienda.comune || 'Reggio Emilia'
  const provRes = azienda.provincia || 'RE'
  const indirizzoRes = azienda.indirizzo || '____________________________________'
  const capRes = azienda.cap || '42121'
  const ibanCliente = azienda.ibanRiferimento || '________________________________________________'

  const doc = (
    <Document title={`Allegato_A_Autorizzazione_F24_${azienda.ragioneSociale}`}>
      <Page size="A4" style={styles.page}>
        {/* Banner Studio */}
        <View style={styles.headerBanner}>
          <View>
            <Text style={styles.studioTitle}>{studioDenominazione}</Text>
            <Text style={styles.studioSub}>
              Dottore Commercialista e Revisore Legale (Iscr. ODCEC Reggio Emilia n. 742/A)
            </Text>
            <Text style={styles.studioSub}>
              {studioIndirizzo} • C.F. {studioCf} • P.IVA {studioPiva}
            </Text>
          </View>
          <View style={styles.badgeBox}>
            <Text style={styles.badgeTitle}>ALLEGATO A — DELEGA F24</Text>
            <Text style={styles.badgeSub}>Fascicolo: {fascicolo}</Text>
            <Text style={styles.badgeSub}>Servizio Telematico Entratel</Text>
          </View>
        </View>

        {/* Titolo Allegato A */}
        <View style={styles.titleStrip}>
          <Text style={styles.allegatoTag}>Allegato A – Fac-simile autorizzazione</Text>
          <Text style={styles.mainTitle}>
            Autorizzazione alla trasmissione telematica dei modelli di versamento unificato F24
          </Text>
          <Text style={styles.subTitle}>
            (Conferimento delega all&apos;intermediario abilitato al servizio Entratel per l&apos;invio e l&apos;addebito dei Modelli F24)
          </Text>
        </View>

        {/* Sezione 1: Dati del Sottoscritto e Soggetto Rappresentato */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              1. Dati Identificativi del Delegante (Titolare / Rappresentante Legale)
            </Text>
            <Text style={styles.sectionHeaderBadge}>Campi autocompilati da Anagrafica e C.F.</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.gridRow}>
              <View style={styles.col2}>
                <Text style={styles.fieldLabel}>Il/La Sottoscritto/a (Nome e Cognome)</Text>
                <Text style={styles.fieldValue}>{rapprNome}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Codice Fiscale Dichiarante</Text>
                <Text style={styles.fieldValue}>{rapprCf}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Nato/a a (Comune / Stato Estero)</Text>
                <Text style={styles.fieldValue}>{luogoNascita}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Il (Data di Nascita)</Text>
                <Text style={styles.fieldValue}>{dataNascita}</Text>
              </View>
              <View style={styles.col2}>
                <Text style={styles.fieldLabel}>Residente / Domiciliato in (Comune, Prov., Via, CAP)</Text>
                <Text style={styles.fieldValue}>
                  {comuneRes} ({provRes}) — {indirizzoRes} ({capRes})
                </Text>
              </View>
            </View>

            <View style={[styles.gridRow, { marginBottom: 0 }]}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>In qualità di</Text>
                <Text style={styles.fieldValue}>
                  {isSocieta ? 'Rappresentante Legale / Amministratore' : 'Titolare / Contribuente Diretto'}
                </Text>
              </View>
              <View style={styles.col2}>
                <Text style={styles.fieldLabel}>Della Ditta / Società / Contribuente</Text>
                <Text style={styles.fieldValue}>{azienda.ragioneSociale}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Partita IVA / Codice Fiscale</Text>
                <Text style={styles.fieldValue}>{pivaNorm !== 'Non applicabile (Privato)' ? `P.IVA ${pivaNorm}` : `C.F. ${cfAzienda}`}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Banner AUTORIZZA */}
        <View style={styles.autorizzaBanner}>
          <Text style={styles.autorizzaText}>AUTORIZZA</Text>
        </View>

        {/* Sezione 2: Oggetto dell'Autorizzazione e Modalità di Addebito */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              2. Intermediario Abilitato Entratel e Disposizione degli Ordini di Pagamento F24
            </Text>
            <Text style={styles.sectionHeaderBadge}>Servizio &ldquo;F24 on line&rdquo; — Agenzia delle Entrate</Text>
          </View>
          <View style={styles.sectionBody}>
            <Text style={styles.paragraph}>
              lo Studio <Text style={styles.bold}>{studioDenominazione}</Text> (C.F. <Text style={styles.bold}>{studioCf}</Text> — P.IVA <Text style={styles.bold}>{studioPiva}</Text>, con studio in {studioIndirizzo}, iscritto all&apos;Albo ODCEC di Reggio Emilia al n. 742/A), <Text style={styles.bold}>intermediario abilitato al servizio telematico Entratel</Text>, a disporre gli ordini di pagamento delle imposte, contributi, tasse, premi e versamenti vari effettuabili tramite <Text style={styles.bold}>modello di versamento unificato F24</Text>, secondo la seguente modalità di addebito concordata:
            </Text>

            {/* Modalità A: Conto Intermediario (come da fac-simile Allegato A) */}
            <View style={styles.optionBoxActive}>
              <View style={styles.checkRow}>
                <Text style={styles.checkboxChecked}>X</Text>
                <Text style={{ fontSize: 7.9, flex: 1, color: '#1e293b' }}>
                  <Text style={styles.bold}>Addebito su conto corrente dell&apos;Intermediario (Allegato A standard): </Text>
                  a valere sul conto corrente bancario o postale intestato allo stesso soggetto che effettua la trasmissione telematica (<Text style={styles.bold}>{studioDenominazione}</Text> — IBAN Studio: <Text style={styles.bold}>{studioIban}</Text>), previo versamento/accredito della relativa provvista da parte del Cliente prima della scadenza di legge;
                </Text>
              </View>
            </View>

            {/* Modalità B: Conto diretto del Cliente (opzionale se fornito IBAN) */}
            <View style={styles.optionBox}>
              <View style={styles.checkRow}>
                <Text style={styles.checkbox}>{azienda.ibanRiferimento ? 'X' : ' '}</Text>
                <Text style={{ fontSize: 7.9, flex: 1, color: '#1e293b' }}>
                  <Text style={styles.bold}>Ovvero addebito diretto su conto corrente intestato al Contribuente (F24 I24): </Text>
                  a valere sul conto corrente bancario/postale intestato a <Text style={styles.bold}>{azienda.ragioneSociale}</Text> — Codice IBAN: <Text style={styles.bold}>{ibanCliente}</Text>.
                </Text>
              </View>
            </View>

            <Text style={[styles.paragraph, { marginBottom: 4, marginTop: 2 }]}>
              <Text style={styles.bold}>Relativamente alle deleghe di pagamento F24:</Text>
            </Text>

            {/* Opzione 1: Singolo versamento */}
            <View style={styles.optionBox}>
              <View style={styles.checkRow}>
                <Text style={styles.checkbox}> </Text>
                <Text style={{ fontSize: 7.9, flex: 1, color: '#334155' }}>
                  <Text style={styles.bold}>del ____/____/________ </Text>
                  (indicare gli estremi del singolo versamento autorizzato): Scadenza ________________________ — Saldo € ____________________;
                </Text>
              </View>
            </View>

            {/* Opzione 2: Periodo continuativo (pre-spuntato per i clienti in mandato continuativo) */}
            <View style={[styles.optionBoxActive, { marginBottom: 0 }]}>
              <View style={styles.checkRow}>
                <Text style={styles.checkboxChecked}>X</Text>
                <Text style={{ fontSize: 7.9, flex: 1, color: '#0f172a' }}>
                  <Text style={styles.bold}>dal {oggi} al revoca / cessazione dell&apos;incarico professionale </Text>
                  (ovvero fino al ____/____/________) — periodo di riferimento autorizzato in via continuativa per tutti i versamenti unificati F24 periodici (mensili, trimestrali e annuali) predisposti dallo Studio.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Firma Autorizzazione F24 */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureCard}>
            <Text style={styles.signatureTitle}>Luogo e Data di Sottoscrizione</Text>
            <Text style={{ fontSize: 8.8, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 8 }}>
              Reggio Emilia (RE), lì {oggi}
            </Text>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 4 }}>
              Conferimento delega F24 — {azienda.ragioneSociale}
            </Text>
          </View>
          <View style={styles.signatureCard}>
            <Text style={styles.signatureTitle}>Firma del Delegante (per Autorizzazione F24)</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSub}>
              {rapprNome} ({isSocieta ? 'Legale Rappresentante' : 'Titolare'})
            </Text>
          </View>
        </View>

        {/* Informativa sul trattamento dei dati personali ex art. 13 D.Lgs. 196/2003 e GDPR */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Informativa sul trattamento dei dati personali ex art. 13 D.Lgs. 196/2003 e art. 13 Reg. UE 2016/679 (GDPR)
          </Text>
          <Text style={styles.infoText}>
            Gentile contribuente, l&apos;<Text style={styles.bold}>Agenzia delle entrate</Text> La informa che i dati conferiti tramite questo modello sono raccolti esclusivamente per l&apos;espletamento del servizio <Text style={styles.bold}>&ldquo;F24 on line&rdquo;</Text>, che permette il pagamento on line delle imposte.
          </Text>
          <Text style={styles.infoText}>
            Le informazioni vengono raccolte dagli intermediari abilitati al servizio <Text style={styles.bold}>Entratel</Text>, mediante la presente delega e vengono trasmessi per via telematica all&apos;Agenzia delle entrate, la quale li invierà alla banca o a Poste Italiane, depositarie del conto corrente indicato dall&apos;intermediario che effettua la trasmissione, per richiedere l&apos;addebito delle somme dovute relative ai modelli F24 inviati telematicamente.
          </Text>
          <Text style={styles.infoText}>
            L&apos;Agenzia delle entrate, gli intermediari, la banca e Poste Italiane SpA gestiranno le informazioni acquisite, ciascuno per la propria sfera di competenza, in qualità di titolari del trattamento, prevalentemente con l&apos;ausilio di mezzi elettronici o, comunque automatizzati, attuando idonee misure di sicurezza per garantire che i Suoi dati personali siano accurati, completi ed aggiornati per le finalità per cui vengono gestiti, ed impiegando misure amministrative, tecniche e fisiche per tutelare le informazioni dall&apos;alterazione, la distruzione, la perdita, il furto o l&apos;utilizzo improprio o illegittimo.
          </Text>
          <Text style={styles.infoText}>
            Le informazioni contenute nella delega di pagamento sono trasmesse dall&apos;Agenzia delle entrate alla banca o a Poste Italiane SpA, con sistemi di <Text style={styles.bold}>&ldquo;cifratura&rdquo;</Text>, tali cioè da renderne impossibile la lettura a soggetti esterni non coinvolti nell&apos;erogazione del servizio.
          </Text>
          <Text style={[styles.infoText, { marginBottom: 0 }]}>
            Per conoscere in modo più approfondito le politiche di tutela e salvaguardia delle informazioni da Lei fornite nonché l&apos;indirizzo cui rivolgersi per l&apos;esercizio dei diritti riconosciuti dall&apos;articolo 7 del D.Lgs. 196/2003 e dagli artt. 15–22 del Reg. UE 2016/679, La invitiamo a visitare il sito <Text style={styles.bold}>www.agenziaentrate.gov.it</Text>.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Allegato A — Autorizzazione Trasmissione Telematica Modelli F24 (Entratel) — {studioDenominazione}</Text>
          <Text>Cliente: {azienda.ragioneSociale} — Pag. 1/1</Text>
        </View>
      </Page>
    </Document>
  )

  return await renderToBuffer(doc)
}
