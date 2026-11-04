// src/lib/pdf/antiriciclaggio-mandato-pdf.tsx
// LETTERE D'INCARICO PROFESSIONALI DELLO STUDIO DOTT. ANTONIO TUZIO — LAYOUT ESECUTIVO MODERNO & AUTOCOMPILATO DAL BOT
// Supporta i 3 Modelli Ufficiali dello Studio:
// 1. PAGHE:       "LETTERA D'INCARICO PER AMMINISTRAZIONE DEL PERSONALE E CONSULENZA DEL LAVORO"
// 2. CONTABILITA: "LETTERA D'INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA E BILANCIO"
// 3. FORFETTARI:  "LETTERA D'INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO"

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import {
  calcolaZonaERischioBot,
  arricchisciDatiClienteBot,
} from '@/lib/antiriciclaggio-engine'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.2,
    color: '#1e293b',
    paddingTop: 24,
    paddingBottom: 46,
    paddingHorizontal: 30,
    lineHeight: 1.34,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  // Top Banner Studio
  headerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 7,
    marginBottom: 8,
  },
  studioName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11.5,
    color: '#1e3a8a',
    letterSpacing: 0.3,
  },
  studioSub: {
    fontSize: 7.3,
    color: '#475569',
    marginTop: 1.5,
  },
  badgeBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'flex-end',
  },
  badgeTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.8,
    color: '#1e3a8a',
  },
  badgeSub: {
    fontSize: 6.8,
    color: '#3b82f6',
    marginTop: 1,
  },
  // Main Document Title
  titleBox: {
    backgroundColor: '#1e3a8a',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 7,
  },
  titleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.8,
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  subtitleText: {
    fontSize: 7.3,
    color: '#dbeafe',
    textAlign: 'center',
    marginTop: 1.5,
  },
  // Callout Box (Stile Guida Operativa)
  calloutBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a8a',
    backgroundColor: '#f8fafc',
    borderTopWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: '#e2e8f0',
    borderRightColor: '#e2e8f0',
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 7,
    borderRadius: 2,
  },
  // 2-Column Party Cards
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  partyCard: {
    width: '49%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  partyCardHeader: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.8,
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  partyCardBody: {
    padding: 6,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  dataLabel: {
    width: '36%',
    fontSize: 7.1,
    color: '#64748b',
  },
  dataVal: {
    width: '64%',
    fontSize: 7.7,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  // Section Container
  sectionCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 3,
    paddingHorizontal: 7,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  sectionBody: {
    padding: 6,
  },
  // Styled Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 7.5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 3,
    paddingHorizontal: 6,
    fontSize: 7.5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  bulletText: {
    flex: 1,
    fontSize: 7.6,
    color: '#1e293b',
  },
  // Checkbox Row
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  checkBoxChecked: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
    marginRight: 4,
    textAlign: 'center',
    fontSize: 6.5,
    lineHeight: 1.1,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  checkBoxEmpty: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: '#94a3b8',
    marginRight: 4,
  },
  // Signatures
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  signatureCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 6,
    backgroundColor: '#f8fafc',
  },
  signatureLabelTop: {
    fontSize: 7,
    color: '#475569',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  signaturePartyName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 18,
    marginBottom: 2,
  },
  signatureSub: {
    fontSize: 6.8,
    color: '#64748b',
    textAlign: 'center',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 6.8,
    color: '#475569',
  },
})

function CorporateHeader({
  fascicolo,
  zonaLabel,
  dataOggi,
}: {
  fascicolo: string
  zonaLabel: string
  dataOggi: string
}) {
  return (
    <View style={styles.headerBanner}>
      <View>
        <Text style={styles.studioName}>
          STUDIO COMMERCIALE DOTT. ANTONIO TUZIO
        </Text>
        <Text style={styles.studioSub}>
          Dottore Commercialista · Albo ODCEC di Reggio Emilia n. 742/A · C.F. TZUNTN69A16D612E
        </Text>
        <Text style={styles.studioSub}>
          Via Umberto Poli 9/B — 42123 Reggio Emilia (RE) · Tel. 0522 331628 · Cell. 328 6781837 · PEC: studiotuzio@legalmail.it
        </Text>
      </View>
      <View style={styles.badgeBox}>
        <Text style={styles.badgeTitle}>FASCICOLO: {fascicolo}</Text>
        <Text style={styles.badgeSub}>{zonaLabel}</Text>
        <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 1 }}>Data: {dataOggi}</Text>
      </View>
    </View>
  )
}

function CorporateFooter({ pagina }: { pagina: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.bold}>Tuzio Antonio — Dottore Commercialista</Text> · Via Umberto Poli 9/B, 42123 Reggio Emilia (RE) · info@studiotuzio.it · postmaster@studiotuzio.it
      </Text>
      <Text style={styles.bold}>{pagina}</Text>
    </View>
  )
}

function PartiesCards({
  ragSoc,
  isSocieta,
  viaSede,
  capSede,
  comuneSede,
  provSede,
  cfAzienda,
  pivaAzienda,
  pecAzienda,
  rapprNome,
  cfPersona,
  luogoNascita,
  dataNascitaIt,
  docInfo,
  ibanStudio,
}: {
  ragSoc: string
  isSocieta: boolean
  viaSede: string
  capSede: string
  comuneSede: string
  provSede: string
  cfAzienda: string
  pivaAzienda: string
  pecAzienda: string
  rapprNome: string
  cfPersona: string
  luogoNascita: string
  dataNascitaIt: string
  docInfo: string
  ibanStudio: string
}) {
  return (
    <View style={styles.partiesRow}>
      {/* Card 1: IL CLIENTE CONFERENTE */}
      <View style={styles.partyCard}>
        <Text style={styles.partyCardHeader}>1. Il Cliente Conferente (Autocompilato)</Text>
        <View style={styles.partyCardBody}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Denominazione:</Text>
            <Text style={styles.dataVal}>{ragSoc}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Qualifica Soggetto:</Text>
            <Text style={styles.dataVal}>
              {isSocieta ? 'Società / Ente (Persona Giuridica)' : 'Impresa Individuale / Professionista'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>C.F. / Partita IVA:</Text>
            <Text style={styles.dataVal}>
              C.F. {cfAzienda} · P.IVA {pivaAzienda}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sede Legale:</Text>
            <Text style={styles.dataVal}>
              {viaSede} — {capSede} {comuneSede} ({provSede})
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>PEC / Email:</Text>
            <Text style={styles.dataVal}>{pecAzienda}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>
              {isSocieta ? 'Legale Rappresentante:' : 'Titolare Firmatario:'}
            </Text>
            <Text style={styles.dataVal}>{rapprNome}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>C.F. Firmatario:</Text>
            <Text style={styles.dataVal}>{cfPersona}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nascita Firmatario:</Text>
            <Text style={styles.dataVal}>
              {luogoNascita}, il {dataNascitaIt}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Doc. Riconoscimento:</Text>
            <Text style={styles.dataVal}>{docInfo}</Text>
          </View>
        </View>
      </View>

      {/* Card 2: IL PROFESSIONISTA INCARICATO */}
      <View style={styles.partyCard}>
        <Text style={styles.partyCardHeader}>2. Il Professionista Incaricato</Text>
        <View style={styles.partyCardBody}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Professionista:</Text>
            <Text style={styles.dataVal}>Dott. Antonio Tuzio</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Codice Fiscale:</Text>
            <Text style={styles.dataVal}>TZUNTN69A16D612E</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Iscrizione Albo:</Text>
            <Text style={styles.dataVal}>Dottori Commercialisti Reggio Emilia n. 742/A</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sede Studio:</Text>
            <Text style={styles.dataVal}>Via Umberto Poli 9/B — 42123 Reggio Emilia (RE)</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Recapiti Telefonici:</Text>
            <Text style={styles.dataVal}>Tel. 0522 331628 · Cell. 328 6781837</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email / PEC Studio:</Text>
            <Text style={styles.dataVal}>postmaster@studiotuzio.it · studiotuzio@legalmail.it</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Polizza RC Prof.:</Text>
            <Text style={styles.dataVal}>LLOYD&apos;S Insurance Company (in corso di validità)</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Regime Fiscale:</Text>
            <Text style={styles.dataVal}>Forfetario RF19 (Art. 1 co. 54-89 L. 190/2014)</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>IBAN Tracciabile:</Text>
            <Text style={[styles.dataVal, { color: '#1e3a8a' }]}>{ibanStudio}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function SecondaPaginaPrivacyEF24({
  fascicolo,
  zonaLabel,
  oggi,
  ragSoc,
  isSocieta,
  rapprNome,
  cfPersona,
  luogoNascita,
  dataNascitaIt,
  viaSede,
  capSede,
  comuneSede,
  provSede,
  pivaAzienda,
  ibanCliente,
  botMotivo,
  titolareEffettivo,
}: {
  fascicolo: string
  zonaLabel: string
  oggi: string
  ragSoc: string
  isSocieta: boolean
  rapprNome: string
  cfPersona: string
  luogoNascita: string
  dataNascitaIt: string
  viaSede: string
  capSede: string
  comuneSede: string
  provSede: string
  pivaAzienda: string
  ibanCliente: string
  botMotivo: string
  titolareEffettivo: string
}) {
  return (
    <Page size="A4" style={styles.page}>
      <CorporateHeader fascicolo={fascicolo} zonaLabel={zonaLabel} dataOggi={oggi} />

      {/* SEZIONE PRIVACY GDPR */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>
          Informativa sul Trattamento dei Dati Personali (Policy Privacy — Artt. 13-21 Reg. UE 2016/679 GDPR)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>1. Principi generali e Titolare del Trattamento: </Text>
            Tutti i dati personali sono trattati in modo lecito, corretto e trasparente nel rispetto dell&apos;Art. 5
            del GDPR, con misure di sicurezza idonee a prevenire perdita, usi illeciti o accessi non autorizzati. Il
            Titolare del Trattamento è lo scrivente Studio <Text style={styles.bold}>Dott. Tuzio Antonio</Text> – Via
            Umberto Poli 9/B – 42123 Reggio Emilia (RE) – Tel: 0522 331628 – Email: studiotuzio@gmail.com /
            postmaster@studiotuzio.it – PEC: studiotuzio@legalmail.it, presso il quale l&apos;interessato può esercitare
            i diritti previsti dagli artt. 15-21 del GDPR (accesso, rettifica, cancellazione, limitazione, portabilità,
            opposizione, reclamo al Garante).
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>2. Oggetto, Finalità e Base Giuridica (Art. 6, co. 1, lett. b, c, f GDPR): </Text>
            Lo Studio tratta dati identificativi, anagrafici, fiscali, contabili, retributivi e bancari di clienti,
            dipendenti e referenti operativi per: concludere ed eseguire rapporti contrattuali/professionali; adempiere
            agli obblighi fiscali, previdenziali e <Text style={styles.bold}>Antiriciclaggio (D.Lgs. 231/2007)</Text>{' '}
            derivanti dai rapporti in essere; tutelare le posizioni creditorie e le esigenze gestionali/contabili. Il
            mancato conferimento dei dati rende impossibile l&apos;instaurazione del rapporto professionale.
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 4 }}>
            <Text style={styles.bold}>3. Modalità, Ambito (Art. 29 GDPR) e Conservazione: </Text>
            Il trattamento avviene con strumenti manuali, informatici e telematici da parte di soggetti interni
            autorizzati ed istruiti per il tempo necessario ad adempiere alle finalità contrattuali e agli obblighi di
            legge (10 anni ex art. 2220 c.c. e art. 31 D.Lgs. 231/2007).
          </Text>

          <View style={[styles.calloutBox, { marginBottom: 2 }]}>
            <Text style={[styles.bold, { fontSize: 7.6, color: '#1e3a8a', marginBottom: 2 }]}>
              ESPRESSIONE DI CONSENSO (Art. 23 D.Lgs. 196/2003 e Art. 7 Regolamento UE n. 679/2016)
            </Text>
            <Text style={{ fontSize: 7.3, marginBottom: 3 }}>
              Preso atto dell&apos;informativa sopra riportata e dichiarando di averne ricevuto copia, il sottoscritto{' '}
              <Text style={styles.bold}>{rapprNome}</Text> (per <Text style={styles.bold}>{ragSoc}</Text>):
            </Text>
            <View style={styles.checkRow}>
              <Text style={styles.checkBoxChecked}>X</Text>
              <Text style={{ fontSize: 7.3, marginRight: 12, fontFamily: 'Helvetica-Bold' }}>AUTORIZZO</Text>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.3, flex: 1 }}>
                NON AUTORIZZO in modo esplicito il trattamento dei dati personali, inclusi quelli particolari, per l&apos;esecuzione del mandato e l&apos;elaborazione di rapporti (&ldquo;reports&rdquo;) e processi di valutazione.
              </Text>
            </View>
            <View style={styles.checkRow}>
              <Text style={styles.checkBoxChecked}>X</Text>
              <Text style={{ fontSize: 7.3, marginRight: 12, fontFamily: 'Helvetica-Bold' }}>AUTORIZZO</Text>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.3, flex: 1 }}>
                NON AUTORIZZO la comunicazione dei dati limitatamente agli ambiti ed organi (Agenzia Entrate, INPS, INAIL, CCIAA, Cassa Edile) specificati nell&apos;informativa.
              </Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Consenso Privacy e Presa Visione — Il Cliente</Text>
              <Text style={styles.signaturePartyName}>{rapprNome}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Luogo e Data: Reggio Emilia, {oggi} — Firma dell&apos;Interessato</Text>
            </View>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Il Titolare del Trattamento — Lo Studio</Text>
              <Text style={styles.signaturePartyName}>Dott. Antonio Tuzio</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SEZIONE DELEGA F24 TELEMATICO ENTRATEL */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>
          Autorizzazione alla Trasmissione Telematica dei Modelli di Versamento Unificato F24 (Servizio Entratel)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 4 }}>
            Il sottoscritto <Text style={styles.bold}>{rapprNome}</Text>, nato a{' '}
            <Text style={styles.bold}>{luogoNascita}</Text> il <Text style={styles.bold}>{dataNascitaIt}</Text>, C.F.{' '}
            <Text style={styles.bold}>{cfPersona}</Text>, domiciliato in{' '}
            <Text style={styles.bold}>
              {viaSede} — {capSede} {comuneSede} ({provSede})
            </Text>
            , in qualità di{' '}
            <Text style={styles.bold}>
              {isSocieta ? `Rappresentante Legale di ${ragSoc}` : `Titolare di ${ragSoc}`}
            </Text>{' '}
            (P.IVA/C.F. <Text style={styles.bold}>{pivaAzienda}</Text>),{' '}
            <Text style={styles.bold}>AUTORIZZA</Text> il <Text style={styles.bold}>Dott. Tuzio Antonio</Text> (C.F.
            TZUNTN69A16D612E, Dottore Commercialista in Reggio Emilia iscritto al n. 742/A, intermediario abilitato al
            servizio Entratel) a disporre gli ordini di pagamento delle imposte, contributi, tasse e versamenti vari
            effettuabili tramite modello F24 sul conto corrente bancario/postale intestato al Cliente:
          </Text>

          <View style={[styles.calloutBox, { marginBottom: 4 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.bold, { fontSize: 7.8, color: '#1e3a8a', width: '32%' }]}>
                COORDINATE IBAN DEL CLIENTE:
              </Text>
              <Text style={[styles.bold, { fontSize: 8.5, color: '#0f172a', width: '68%' }]}>
                {ibanCliente}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 7.3, textAlign: 'justify', marginBottom: 3 }}>
            Il professionista si impegna a presentare al cliente le singole elaborazioni periodiche mettendolo al
            corrente degli obblighi di pagamento e delle scadenze relative. Nell&apos;eventualità in cui il cliente
            richieda anche verbalmente al professionista di sospendere il pagamento telematico di una o più deleghe F24,
            il professionista si limiterà ad astenersi dall&apos;invio e sarà esonerato da qualsiasi responsabilità per
            omesso o ritardato versamento. In caso di richiesta successiva di pagamento con ravvedimento operoso di
            importi in precedenza sospesi, sarà cura del cliente avvertire per iscritto il professionista all&apos;email{' '}
            <Text style={styles.bold}>postmaster@studiotuzio.it</Text>.{' '}
            <Text style={styles.italic}>
              (Informativa ex art. 13 D.Lgs. 196/2003 e GDPR &ldquo;F24 Telematico Entratel&rdquo;: i dati sono
              trasmessi in via telematica cifrata all&apos;Agenzia delle Entrate per l&apos;addebito presso la
              banca/Poste Italiane depositaria del conto indicato).
            </Text>
          </Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Autorizzazione Addebito Telematico F24 — Il Cliente</Text>
              <Text style={styles.signaturePartyName}>{rapprNome}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Reggio Emilia, lì {oggi} — Firma del Cliente</Text>
            </View>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Intermediario Entratel Abilitato — Lo Studio</Text>
              <Text style={styles.signaturePartyName}>Dott. Antonio Tuzio</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
            </View>
          </View>
        </View>
      </View>

      {/* BOX ATTESTAZIONE INQUADRAMENTO ANTIRICICLAGGIO D.LGS. 231/2007 */}
      <View style={[styles.calloutBox, { backgroundColor: '#eff6ff', borderLeftColor: '#1d4ed8', marginBottom: 0 }]}>
        <Text style={[styles.bold, { fontSize: 7.8, color: '#1e3a8a' }]}>
          ATTESTAZIONE DI INQUADRAMENTO ANTIRICICLAGGIO DEL MANDATO (D.Lgs. 231/2007 — Regole Tecniche CNDCEC/CNOCDL)
        </Text>
        <Text style={{ fontSize: 7.2, color: '#1e293b', marginTop: 1.5 }}>
          • <Text style={styles.bold}>Fascicolo:</Text> {fascicolo} · <Text style={styles.bold}>Qualificazione AML:</Text> {zonaLabel} · <Text style={styles.bold}>Titolare Effettivo dichiarato (Art. 20):</Text> {titolareEffettivo}{'\n'}
          • <Text style={styles.bold}>Presidio applicato:</Text> {botMotivo}
        </Text>
      </View>

      <CorporateFooter pagina="Pagina 2 di 2" />
    </Page>
  )
}

export async function generaLetteraIncaricoMandatoPDF(
  azienda: any,
  emittente: any,
  varianteRichiesta?: string
): Promise<Buffer> {
  const bot = calcolaZonaERischioBot(azienda)
  const auto = arricchisciDatiClienteBot(azienda)
  const oggi = new Date().toLocaleDateString('it-IT')

  const fascicolo = azienda.antiriciclaggioFascicolo || `ARC-${new Date().getFullYear()}`
  const ragSoc = auto.ragSoc
  const isSocieta = auto.isSocieta
  const rapprNome = auto.rapprNome
  const cfPersona = auto.cfPersona || (isSocieta ? 'Da indicare su C.I.' : auto.cfNorm || 'N/D')
  const luogoNascita = auto.luogoNascita
  const dataNascitaIt = auto.dataNascitaIt

  const comuneSede = azienda.comune || "Reggio nell'Emilia"
  const provSede = azienda.provincia || 'RE'
  const capSede = azienda.cap || '42121'
  const viaSede = azienda.indirizzo || 'Sede legale come da visura'
  const cfAzienda = auto.cfNorm || auto.pivaNorm || 'N/D'
  const pivaAzienda = auto.pivaNorm || cfAzienda
  const pecAzienda = azienda.pec || azienda.emailAmministrativa || 'Come da registro INI-PEC'
  const ibanCliente = azienda.iban || 'IT __ _ _____ _____ ________________________ (da comunicare per F24)'
  const ibanStudio = emittente?.iban || 'IT 89E 03032 12804 0100 00063104'

  const docInfo = azienda.documentoNumero
    ? `${azienda.documentoTipo === 'passaporto' ? 'Passaporto' : azienda.documentoTipo === 'patente' ? 'Patente' : "Carta d'Identità"} n. ${azienda.documentoNumero}${
        azienda.documentoScadenza ? ` (Scad. ${new Date(azienda.documentoScadenza).toLocaleDateString('it-IT')})` : ''
      }`
    : "Carta d'Identità in acquisizione nel fascicolo"

  // Selezione automatica o esplicita del Modello (PAGHE, CONTABILITA, FORFETTARI)
  const vReq = (varianteRichiesta || '').toUpperCase()
  let modello: 'PAGHE' | 'CONTABILITA' | 'FORFETTARI' = 'PAGHE'

  if (vReq === 'CONTABILITA') {
    modello = 'CONTABILITA'
  } else if (vReq === 'FORFETTARI' || vReq === 'FORFETTARIO' || vReq === 'CONSULENZA') {
    modello = 'FORFETTARI'
  } else if (vReq === 'PAGHE') {
    modello = 'PAGHE'
  } else {
    if (azienda.settoreAttivita === 'FORFETTARI') {
      modello = 'FORFETTARI'
    } else if (
      azienda.settoreAttivita === 'CONTABILITA' ||
      (bot.zona === 'ZONA_3' && !azienda.antiriciclaggioPrestazione?.toLowerCase().includes('verbale ispettivo'))
    ) {
      modello = 'CONTABILITA'
    } else {
      modello = 'PAGHE'
    }
  }

  // Titolo e sottotitolo in base al modello
  const titolo =
    modello === 'CONTABILITA'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA E BILANCIO'
      : modello === 'FORFETTARI'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO'
      : "LETTERA D'INCARICO PER AMMINISTRAZIONE DEL PERSONALE DIPENDENTE E CONSULENZA DEL LAVORO"

  const sottotitolo =
    modello === 'CONTABILITA'
      ? 'Mandato professionale continuativo comprensivo di Delega Cassetto Fiscale/LUL, Policy Privacy GDPR e Delega Telematica F24'
      : modello === 'FORFETTARI'
      ? 'Assistenza fiscale Regime Forfetario (Art. 1 co. 54-89 L. 190/2014), Delega Cassetto Fiscale, Policy Privacy GDPR e Delega F24'
      : 'Gestione Buste Paga, Tenuta Libro Unico del Lavoro (LUL), Pratiche UNILAV/INPS/INAIL, Policy Privacy GDPR e Delega F24'

  const doc = (
    <Document title={`Lettera_Incarico_${modello}_${ragSoc}`}>
      {/* ==================== PAGINA 1: PARTI CONTRAENTI, OGGETTO, TARIFFARIO E CLAUSOLE ==================== */}
      <Page size="A4" style={styles.page}>
        <CorporateHeader fascicolo={fascicolo} zonaLabel={bot.zonaLabel} dataOggi={oggi} />

        <View style={styles.titleBox}>
          <Text style={styles.titleText}>{titolo}</Text>
          <Text style={styles.subtitleText}>{sottotitolo}</Text>
        </View>

        <PartiesCards
          ragSoc={ragSoc}
          isSocieta={isSocieta}
          viaSede={viaSede}
          capSede={capSede}
          comuneSede={comuneSede}
          provSede={provSede}
          cfAzienda={cfAzienda}
          pivaAzienda={pivaAzienda}
          pecAzienda={pecAzienda}
          rapprNome={rapprNome}
          cfPersona={cfPersona}
          luogoNascita={luogoNascita}
          dataNascitaIt={dataNascitaIt}
          docInfo={docInfo}
          ibanStudio={ibanStudio}
        />

        {/* ART. 1 — OGGETTO DELL'INCARICO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            Art. 1 — Oggetto e Complessità dell&apos;Incarico Professionale Conferito allo Studio
          </Text>
          <View style={styles.sectionBody}>
            {modello === 'CONTABILITA' ? (
              <View>
                <Text style={[styles.bold, { fontSize: 7.8, color: '#1e3a8a', marginBottom: 2 }]}>
                  1.1 Impianto e tenuta delle scritture contabili:
                </Text>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Registrazione movimenti contabili da prima nota fornita dal Cliente, fatture di acquisto, vendita e corrispettivi; elaborazione liquidazioni IVA periodiche (LIPE) e predisposizione/invio telematico modelli F24.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Scritture di assestamento e chiusura, formazione del Bilancio d&apos;esercizio, stampa e consegna dei registri contabili (libro giornale, inventari, registri IVA acquisti/vendite/corrispettivi, beni ammortizzabili), gestione previdenziale soci/titolare e Certificazioni Uniche (CU).
                  </Text>
                </View>

                <Text style={[styles.bold, { fontSize: 7.8, color: '#1e3a8a', marginTop: 3, marginBottom: 2 }]}>
                  1.2 Consulenza e assistenza nella redazione del Bilancio d&apos;esercizio &amp; 1.3 Dichiarazioni Fiscali:
                </Text>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Riclassificazione del bilancio ex artt. 2423 e ss. c.c., Rendiconto finanziario (se dovuto), Nota integrativa ex artt. 2427-2427 bis c.c., assistenza sulla Relazione sulla gestione ex art. 2428 c.c. e deposito telematico presso il Registro delle Imprese.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Predisposizione e invio telematico di Dichiarazione annuale IVA, Dichiarazione dei Redditi, IRAP, comunicazione ISA / studi di settore, liquidazione imposte e trasmissione telematica modelli F24.
                  </Text>
                </View>
                <Text style={[styles.italic, { fontSize: 7.1, color: '#475569', marginTop: 2 }]}>
                  Nota sulla tenuta documentale: Lo Studio non opera servizio di domiciliazione né di custodia delle scritture contabili; il Professionista trasmetterà periodicamente gli elaborati via mail o cartella informatica e la documentazione sarà conservata dal Cliente presso la propria sede legale sotto la responsabilità diretta dell&apos;amministratore/legale rappresentante, esonerando lo Studio da responsabilità per smarrimento.
                </Text>
              </View>
            ) : modello === 'FORFETTARI' ? (
              <View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Consulenza fiscale continuativa per soggetti in Regime Forfetario RF19 (operazione senza applicazione dell&apos;IVA ai sensi dell&apos;art. 1, co. 54-89, Legge n. 190/2014, come modificato dalla L. 208/2015 e L. 145/2018).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Predisposizione e invio telematico della dichiarazione di apertura della Partita IVA e iscrizione al Registro delle Imprese / Gestione previdenziale INPS e INAIL.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Predisposizione e invio telematico della Dichiarazione dei Redditi (Mod. Redditi PF - Quadro LM), gestione del Cassetto Fiscale e Previdenziale, liquidazione imposte sostitutive e contributi e invio telematico modelli F24.
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1. Elaborazione Buste Paga e LUL:</Text> elaborazione mensile dei prospetti paga per i dipendenti, tenuta del Libro Unico del Lavoro (LUL) e invio telematico dei flussi retributivi e denunce UniEmens INPS / Cassa Edile.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>2. Gestione Rapporto di Lavoro:</Text> pratiche di assunzione, trasformazione, variazione e cessazione e relative Comunicazioni Obbligatorie telematiche (UNILAV, INPS, INAIL).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>3. Adempimenti Annuali e Consulenza:</Text> Autoliquidazione annuale INAIL, elaborazione Certificazioni Uniche (CU), Modello 770 e consulenza in materia di diritto del lavoro.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ART. 2 — PROSPETTO COMPENSI E TARIFFARIO DI STUDIO */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            Art. 2 — Compensi Professionali, Tariffario Applicato e Modalità di Pagamento Tracciabile
          </Text>
          {modello === 'CONTABILITA' ? (
            <View>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 4.5 }}>VOCE DI PRESTAZIONE CONTABILE / SOCIETARIA / FISCALE</Text>
                <Text style={{ flex: 2.5 }}>CRITERIO</Text>
                <Text style={{ flex: 1.5, textAlign: 'right' }}>COMPENSO ANNUO</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 4.5 }}>1.1 Attività di tenuta contabilità ordinaria e liquidazioni periodiche IVA</Text>
                <Text style={{ flex: 2.5 }}>Modulabile per complessità</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 873,60</Text>
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={{ flex: 4.5 }}>1.2 Consulenza, redazione e deposito Bilancio d&apos;esercizio (artt. 2423-2428 c.c.)</Text>
                <Text style={{ flex: 2.5 }}>Modulabile per complessità</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 873,60</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 4.5 }}>1.3 Consulenza e predisposizione Dichiarazioni Fiscali (IVA, Redditi, IRAP, ISA)</Text>
                <Text style={{ flex: 2.5 }}>Modulabile per complessità</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 873,60</Text>
              </View>
              <View style={[styles.tableRowAlt, { backgroundColor: '#eff6ff' }]}>
                <Text style={{ flex: 4.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' }}>
                  TOTALE COMPENSI ANNUALI BASE (escluso contributo integrativo 4% — adeguamento ISTAT dic.)
                </Text>
                <Text style={{ flex: 2.5, fontFamily: 'Helvetica-Bold', color: '#1e3a8a' }}>Regime Forfetario RF19</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: '#1e3a8a' }}>
                  € 2.620,80
                </Text>
              </View>
            </View>
          ) : modello === 'FORFETTARI' ? (
            <View>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 5 }}>PRESTAZIONE PROFESSIONALE REGIME FORFETARIO (L. 190/2014)</Text>
                <Text style={{ flex: 2 }}>PERIODICITÀ</Text>
                <Text style={{ flex: 1.5, textAlign: 'right' }}>COMPENSO</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 5 }}>Apertura Partita IVA e iscrizione al Registro delle Imprese</Text>
                <Text style={{ flex: 2 }}>Una tantum</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 90,00</Text>
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={{ flex: 5 }}>Compenso annuale per attività ordinaria (Consulenza fiscale, Dichiarazione Redditi, F24)</Text>
                <Text style={{ flex: 2 }}>Annuale</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 420,00</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 5 }}>Eventuale pratica di iscrizione INAIL e autoliquidazione annuale</Text>
                <Text style={{ flex: 2 }}>Se dovuta</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 90,00</Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.tableHeader}>
                <Text style={{ flex: 4.5 }}>TARIFFARIO PER LA GESTIONE DELLE PAGHE E PRATICHE LAVORO</Text>
                <Text style={{ flex: 2.5 }}>UNITÀ DI CALCOLO</Text>
                <Text style={{ flex: 1.5, textAlign: 'right' }}>TARIFFA</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 4.5 }}>Buste paga settore Edilizia / Ditte 1-20 dip. / Ditte 21-30 dip.</Text>
                <Text style={{ flex: 2.5 }}>Per singolo cedolino mensile</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 35 / € 25 / € 20</Text>
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={{ flex: 4.5 }}>Pratica di assunzione / Pratica cessazione Edile / Cessazione Ordinaria</Text>
                <Text style={{ flex: 2.5 }}>A singola pratica</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 60 / € 60 / € 35</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={{ flex: 4.5 }}>Autoliquidazione INAIL (€ 50) · Variazioni INAIL/Unilav/INPS (€ 25)</Text>
                <Text style={{ flex: 2.5 }}>A pratica / adempimento</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 50,00 / € 25,00</Text>
              </View>
              <View style={styles.tableRowAlt}>
                <Text style={{ flex: 4.5 }}>Pratica Mod. 770 · Budget costo personale · Congedi / Maternità / NASpI</Text>
                <Text style={{ flex: 2.5 }}>A pratica / a domanda</Text>
                <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>€ 60,00 cad.</Text>
              </View>
            </View>
          )}
          <View style={{ paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#f8fafc' }}>
            <Text style={{ fontSize: 7.2, color: '#334155' }}>
              I compensi sono esclusi da IVA e ritenuta d&apos;acconto (Regime Forfetario RF19 ex art. 1 co. 54-89 L.
              190/2014) e maggiorati del contributo integrativo previdenziale (4%). Pagamento tracciabile entro 10 gg
              dal ricevimento parcella su <Text style={styles.bold}>IBAN Studio: {ibanStudio}</Text>.
            </Text>
          </View>
        </View>

        {/* ART. 3, 4, 5, 6, 7 — DURATA, OBBLIGHI, FORO E DELEGA CASSETTO FISCALE / LUL */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>
            Artt. 3–7 — Durata, Obblighi delle Parti, Polizza LLOYD&apos;S, Foro CCIAA e Delega Cassetto Fiscale / LUL
          </Text>
          <View style={styles.sectionBody}>
            <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 2.5 }}>
              • <Text style={styles.bold}>Art. 3 (Durata e Recesso):</Text> L&apos;incarico decorre dalla sottoscrizione
              ed è valido in forma continuativa con rinnovo tacito annuale automatico, salvo recesso da comunicarsi via
              PEC (<Text style={styles.bold}>studiotuzio@legalmail.it</Text>) o raccomandata AR{' '}
              {modello === 'FORFETTARI' ? 'entro il 31 ottobre di ogni anno solare' : 'con preavviso di 90 giorni'}.{'\n'}
              • <Text style={styles.bold}>Artt. 4–5 (Obblighi del Professionista e del Cliente &amp; Antiriciclaggio):</Text>{' '}
              Il Professionista opera con diligenza professionale, trasparenza e segreto professionale ed è assicurato
              con polizza RC professionale <Text style={styles.bold}>LLOYD&apos;S Insurance Company</Text>. Il Cliente
              garantisce completezza, esattezza e autenticità dei documenti forniti e comunica tempestivamente ogni
              variazione rilevante anche ai sensi del <Text style={styles.bold}>D.Lgs. 231/2007</Text> (Titolare
              Effettivo, compagine sociale, documento d&apos;identità).{'\n'}
              • <Text style={styles.bold}>Art. 6 (Foro Competente) &amp; Art. 7 (Delega Cassetto Fiscale e LUL):</Text>{' '}
              Ogni controversia sarà sottoposta all&apos;Organismo di Mediazione della C.C.I.A.A. di Reggio Emilia
              (Piazza della Vittoria 3). Il Cliente autorizza lo Studio ad accedere ai sistemi informatici di{' '}
              <Text style={styles.bold}>Agenzia delle Entrate, Uni-riscossioni, INPS e INAIL</Text> e alla tenuta e
              conservazione del <Text style={styles.bold}>Libro Unico del Lavoro (LUL)</Text> e delle scritture fiscali.
            </Text>

            <View style={styles.signatureRow}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureLabelTop}>Per Conferimento e Accettazione Mandato — Il Cliente</Text>
                <Text style={styles.signaturePartyName}>{rapprNome} ({ragSoc.slice(0, 28)})</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureSub}>Reggio Emilia, lì {oggi} — Firma del Cliente</Text>
              </View>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureLabelTop}>Per Accettazione Incarico — Il Professionista</Text>
                <Text style={styles.signaturePartyName}>Dott. Antonio Tuzio</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
              </View>
            </View>
          </View>
        </View>

        <CorporateFooter pagina="Pagina 1 di 2" />
      </Page>

      {/* ==================== PAGINA 2: POLICY PRIVACY GDPR + DELEGA F24 ENTRATEL + INQUADRAMENTO AML ==================== */}
      <SecondaPaginaPrivacyEF24
        fascicolo={fascicolo}
        zonaLabel={bot.zonaLabel}
        oggi={oggi}
        ragSoc={ragSoc}
        isSocieta={isSocieta}
        rapprNome={rapprNome}
        cfPersona={cfPersona}
        luogoNascita={luogoNascita}
        dataNascitaIt={dataNascitaIt}
        viaSede={viaSede}
        capSede={capSede}
        comuneSede={comuneSede}
        provSede={provSede}
        pivaAzienda={pivaAzienda}
        ibanCliente={ibanCliente}
        botMotivo={bot.motivoBot}
        titolareEffettivo={auto.titolareEffettivo}
      />
    </Document>
  )

  return await renderToBuffer(doc)
}
