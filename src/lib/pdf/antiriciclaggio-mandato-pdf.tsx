// src/lib/pdf/antiriciclaggio-mandato-pdf.tsx
// LETTERE D'INCARICO PROFESSIONALI — DOTT. ANTONIO TUZIO
// 4 Modelli: PAGHE | CONTABILITA | FORFETTARI | OCCASIONALI
// Layout Esecutivo su 2 Pagine A4 calibrate, Autocompilazione Anagrafica Cliente, Senza Tariffario Fisso, Caselle [ ] vuote da spuntare

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
    paddingBottom: 38,
    paddingHorizontal: 30,
    lineHeight: 1.35,
    backgroundColor: '#ffffff',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },

  // HEADER BANNER
  headerBanner: {
    backgroundColor: '#1e3a8a',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studioName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  studioSub: {
    fontSize: 7.4,
    color: '#dbeafe',
    marginTop: 1.5,
  },
  studioPecHighlight: {
    fontSize: 7.6,
    fontFamily: 'Helvetica-Bold',
    color: '#fde047',
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
    color: '#334155',
    marginTop: 1,
  },

  // DOCUMENT TITLE
  titleBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 7,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 9.6,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 7.2,
    color: '#475569',
    textAlign: 'center',
    marginTop: 1.5,
  },

  // 2-COLUMN PARTIES CARDS
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
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  partyCardHeader: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    fontSize: 7.6,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  partyCardBody: {
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 2.2,
  },
  dataLabel: {
    width: '36%',
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
  },
  dataVal: {
    width: '64%',
    fontSize: 7.5,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },

  // SECTION CARDS
  sectionCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 6.5,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  sectionBody: {
    paddingVertical: 5.5,
    paddingHorizontal: 8,
  },

  // BULLETS
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 9,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  bulletText: {
    flex: 1,
    fontSize: 7.6,
    color: '#1e293b',
    textAlign: 'justify',
  },

  // CALLOUT BOX
  calloutBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a8a',
    borderRadius: 3,
    paddingVertical: 4.5,
    paddingHorizontal: 7,
    marginTop: 3,
    marginBottom: 3,
  },

  // CHECKBOXES (SEMPRE VUOTE PER SPUNTA MANUALE DEL DOTTORE / CLIENTE)
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3.5,
  },
  checkBoxEmpty: {
    width: 10,
    height: 10,
    borderWidth: 1.2,
    borderColor: '#1e3a8a',
    backgroundColor: '#ffffff',
    borderRadius: 1.5,
    marginRight: 5,
  },

  // SIGNATURES
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 4,
  },
  signatureCard: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f8fafc',
  },
  signatureLabelTop: {
    fontSize: 6.8,
    color: '#475569',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  signaturePartyName: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 15,
    marginBottom: 2.5,
  },
  signatureSub: {
    fontSize: 6.6,
    color: '#64748b',
    textAlign: 'center',
  },

  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 30,
    right: 30,
    borderTopWidth: 0.8,
    borderTopColor: '#cbd5e1',
    paddingTop: 3.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.8,
    color: '#475569',
  },
})

interface StudioInfo {
  denominazione: string
  cf: string
  piva: string
  indirizzo: string
  telefono: string
  email: string
  pec: string
  iban: string
}

function CorporateHeader({
  fascicolo,
  zonaLabel,
  dataOggi,
  studio,
}: {
  fascicolo: string
  zonaLabel: string
  dataOggi: string
  studio: StudioInfo
}) {
  return (
    <View style={styles.headerBanner} wrap={false}>
      <View>
        <Text style={styles.studioName}>{studio.denominazione.toUpperCase()}</Text>
        <Text style={styles.studioSub}>
          Dottore Commercialista · Albo ODCEC di Reggio Emilia n. 742/A · C.F. {studio.cf} · P.IVA {studio.piva}
        </Text>
        <Text style={styles.studioSub}>
          {studio.indirizzo} · Tel. {studio.telefono}
        </Text>
        <Text style={styles.studioPecHighlight}>
          PEC: {studio.pec} · Email: {studio.email}
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

function CorporateFooter({ pagina, studio }: { pagina: string; studio: StudioInfo }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.bold}>{studio.denominazione}</Text> · Dottore Commercialista · {studio.indirizzo} · PEC:{' '}
        <Text style={styles.bold}>{studio.pec}</Text> · Email: {studio.email}
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
  studio,
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
  studio: StudioInfo
}) {
  return (
    <View style={styles.partiesRow} wrap={false}>
      {/* Card 1: IL CLIENTE CONFERENTE */}
      <View style={styles.partyCard}>
        <Text style={styles.partyCardHeader}>1. Il Cliente Conferente</Text>
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
            <Text style={styles.dataLabel}>Sede / Residenza:</Text>
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
            <Text style={styles.dataLabel}>Doc. Identità:</Text>
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
            <Text style={styles.dataVal}>{studio.denominazione}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>C.F. / P.IVA:</Text>
            <Text style={styles.dataVal}>
              C.F. {studio.cf} · P.IVA {studio.piva}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Iscrizione Albo:</Text>
            <Text style={styles.dataVal}>Dottori Commercialisti Reggio Emilia n. 742/A</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Sede Studio:</Text>
            <Text style={styles.dataVal}>{studio.indirizzo}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Telefono:</Text>
            <Text style={styles.dataVal}>{studio.telefono}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>PEC (Domicilio Dig.):</Text>
            <Text style={[styles.dataVal, { color: '#1e3a8a' }]}>{studio.pec}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Email Studio:</Text>
            <Text style={styles.dataVal}>{studio.email}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Polizza RC Prof.:</Text>
            <Text style={styles.dataVal}>LLOYD&apos;S Insurance Company</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>IBAN Studio:</Text>
            <Text style={[styles.dataVal, { color: '#1e3a8a' }]}>{studio.iban}</Text>
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
  studio,
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
  studio: StudioInfo
}) {
  return (
    <Page size="A4" style={styles.page}>
      <CorporateHeader fascicolo={fascicolo} zonaLabel={zonaLabel} dataOggi={oggi} studio={studio} />

      {/* SEZIONE PRIVACY GDPR */}
      <View style={styles.sectionCard} wrap={false}>
        <Text style={styles.sectionHeader}>
          Informativa sul Trattamento dei Dati Personali (Policy Privacy — Artt. 13-21 Reg. UE 2016/679 GDPR)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>1. Principi generali e Titolare del Trattamento: </Text>
            Tutti i dati personali sono trattati in modo lecito, corretto e trasparente nel rispetto dell&apos;Art. 5
            del GDPR, con misure di sicurezza idonee a prevenire perdita, usi illeciti o accessi non autorizzati. Il
            Titolare del Trattamento è <Text style={styles.bold}>{studio.denominazione}</Text> – {studio.indirizzo} –
            Tel: {studio.telefono} – Email: <Text style={styles.bold}>{studio.email}</Text> – PEC:{' '}
            <Text style={styles.bold}>{studio.pec}</Text>, presso il quale l&apos;interessato può esercitare i diritti
            previsti dagli artt. 15-21 del GDPR (accesso, rettifica, cancellazione, limitazione, portabilità,
            opposizione, reclamo al Garante).
          </Text>
          <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>2. Oggetto, Finalità e Base Giuridica (Art. 6, co. 1, lett. b, c, f GDPR): </Text>
            Lo Studio tratta dati identificativi, anagrafici, fiscali, contabili, retributivi e bancari di clienti,
            dipendenti e referenti operativi per: concludere ed eseguire rapporti contrattuali/professionali; adempiere
            agli obblighi fiscali, previdenziali e <Text style={styles.bold}>Antiriciclaggio (D.Lgs. 231/2007)</Text>{' '}
            derivanti dai rapporti in essere; tutelare le posizioni creditorie e le esigenze gestionali/contabili. Il
            mancato conferimento dei dati rende impossibile l&apos;instaurazione del rapporto professionale.
          </Text>
          <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 4 }}>
            <Text style={styles.bold}>3. Modalità, Ambito (Art. 29 GDPR) e Conservazione: </Text>
            Il trattamento avviene con strumenti manuali, informatici e telematici da parte di soggetti interni
            autorizzati ed istruiti per il tempo necessario ad adempiere alle finalità contrattuali e agli obblighi di
            legge (10 anni ex art. 2220 c.c. e art. 31 D.Lgs. 231/2007).
          </Text>

          <View style={[styles.calloutBox, { marginBottom: 3 }]}>
            <Text style={[styles.bold, { fontSize: 7.6, color: '#1e3a8a', marginBottom: 3 }]}>
              ESPRESSIONE DI CONSENSO (Art. 23 D.Lgs. 196/2003 e Art. 7 Regolamento UE n. 679/2016) — Da barrare a cura del Cliente/Dottore
            </Text>
            <Text style={{ fontSize: 7.3, marginBottom: 4 }}>
              Preso atto dell&apos;informativa sopra riportata e dichiarando di averne ricevuto copia, il sottoscritto{' '}
              <Text style={styles.bold}>{rapprNome}</Text> (per <Text style={styles.bold}>{ragSoc}</Text>):
            </Text>
            <View style={styles.checkRow}>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 12, fontFamily: 'Helvetica-Bold' }}>AUTORIZZO</Text>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 8, fontFamily: 'Helvetica-Bold' }}>NON AUTORIZZO</Text>
              <Text style={{ fontSize: 7.3, flex: 1 }}>
                il trattamento dei dati personali, inclusi quelli particolari, per l&apos;esecuzione del mandato e l&apos;elaborazione di rapporti (&ldquo;reports&rdquo;) e processi di valutazione.
              </Text>
            </View>
            <View style={styles.checkRow}>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 12, fontFamily: 'Helvetica-Bold' }}>AUTORIZZO</Text>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 8, fontFamily: 'Helvetica-Bold' }}>NON AUTORIZZO</Text>
              <Text style={{ fontSize: 7.3, flex: 1 }}>
                la comunicazione dei dati limitatamente agli ambiti ed organi (Agenzia Entrate, INPS, INAIL, CCIAA, Cassa Edile) specificati nell&apos;informativa.
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
              <Text style={styles.signatureLabelTop}>Il Titolare del Trattamento — Il Professionista</Text>
              <Text style={styles.signaturePartyName}>{studio.denominazione}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SEZIONE DELEGA F24 TELEMATICO ENTRATEL (ALLEGATO A) */}
      <View style={styles.sectionCard} wrap={false}>
        <Text style={styles.sectionHeader}>
          Allegato A — Autorizzazione alla Trasmissione Telematica dei Modelli di Versamento Unificato F24 (Servizio Entratel)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 4 }}>
            Il sottoscritto <Text style={styles.bold}>{rapprNome}</Text>, nato a{' '}
            <Text style={styles.bold}>{luogoNascita}</Text> il <Text style={styles.bold}>{dataNascitaIt}</Text>, C.F.{' '}
            <Text style={styles.bold}>{cfPersona}</Text>, residente/domiciliato in{' '}
            <Text style={styles.bold}>
              {comuneSede} ({provSede}), {viaSede} ({capSede})
            </Text>
            , in qualità di{' '}
            <Text style={styles.bold}>
              {isSocieta ? `Rappresentante Legale di ${ragSoc}` : `Titolare di ${ragSoc}`}
            </Text>{' '}
            (P.IVA/C.F. <Text style={styles.bold}>{pivaAzienda}</Text>),{' '}
            <Text style={styles.bold}>AUTORIZZA</Text> il <Text style={styles.bold}>{studio.denominazione}</Text> (C.F.{' '}
            {studio.cf} — P.IVA {studio.piva}, Dottore Commercialista in Reggio Emilia iscritto al n. 742/A,
            intermediario abilitato al servizio Entratel) a disporre gli ordini di pagamento delle imposte, contributi,
            tasse e versamenti vari effettuabili tramite modello F24, <Text style={styles.bold}>a valere sul conto corrente bancario o postale intestato allo stesso soggetto che effettua la trasmissione telematica</Text>, ovvero sul conto corrente intestato al Cliente (<Text style={styles.bold}>IBAN: {ibanCliente}</Text>), relativamente alle deleghe:
          </Text>

          <View style={styles.checkRow}>
            <View style={styles.checkBoxEmpty} />
            <Text style={{ fontSize: 7.4, flex: 1 }}>
              <Text style={styles.bold}>del ____/____/________</Text> — estremi del singolo versamento autorizzato: ________________________________________;
            </Text>
          </View>
          <View style={[styles.checkRow, { marginBottom: 4 }]}>
            <View style={styles.checkBoxEmpty} />
            <Text style={{ fontSize: 7.4, flex: 1 }}>
              <Text style={styles.bold}>dal ____/____/________ al ____/____/________</Text> (ovvero fino a revoca/cessazione dell&apos;incarico) — periodo di riferimento autorizzato.
            </Text>
          </View>

          <Text style={{ fontSize: 7.1, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>Informativa ex art. 13 D.Lgs. 196/2003 e GDPR (&ldquo;F24 on line&rdquo; Agenzia delle Entrate): </Text>
            I dati conferiti tramite questo modello sono raccolti esclusivamente per l&apos;espletamento del servizio &ldquo;F24 on line&rdquo; dagli intermediari abilitati Entratel e trasmessi con sistemi di cifratura all&apos;Agenzia delle Entrate, che li invierà alla banca/Poste Italiane depositaria del conto corrente indicato per richiedere l&apos;addebito delle somme dovute (diritti ex art. 7 D.Lgs. 196/2003 e artt. 15-22 GDPR su www.agenziaentrate.gov.it). In caso di richiesta anche verbale del Cliente di sospendere il pagamento telematico di una o più deleghe F24, il professionista è esonerato da ogni responsabilità per omesso/ritardato versamento (eventuali ravvedimenti vanno richiesti per iscritto a <Text style={styles.bold}>{studio.email}</Text> o PEC <Text style={styles.bold}>{studio.pec}</Text>).
          </Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Autorizzazione Addebito Telematico F24 (Allegato A) — Il Cliente</Text>
              <Text style={styles.signaturePartyName}>{rapprNome}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Reggio Emilia, lì {oggi} — Firma del Cliente</Text>
            </View>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Intermediario Entratel Abilitato — Il Professionista</Text>
              <Text style={styles.signaturePartyName}>{studio.denominazione}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
            </View>
          </View>
        </View>
      </View>

      {/* BOX ATTESTAZIONE INQUADRAMENTO ANTIRICICLAGGIO D.LGS. 231/2007 */}
      <View style={[styles.calloutBox, { backgroundColor: '#eff6ff', borderLeftColor: '#1d4ed8', marginBottom: 0 }]} wrap={false}>
        <Text style={[styles.bold, { fontSize: 7.6, color: '#1e3a8a' }]}>
          ATTESTAZIONE DI INQUADRAMENTO ANTIRICICLAGGIO DEL MANDATO (D.Lgs. 231/2007 — Regole Tecniche CNDCEC/CNOCDL)
        </Text>
        <Text style={{ fontSize: 7.1, color: '#1e293b', marginTop: 1.5 }}>
          • <Text style={styles.bold}>Fascicolo:</Text> {fascicolo} · <Text style={styles.bold}>Qualificazione AML:</Text> {zonaLabel} · <Text style={styles.bold}>Titolare Effettivo (Art. 20):</Text> {titolareEffettivo}{'\n'}
          • <Text style={styles.bold}>Presidio applicato:</Text> {botMotivo}
        </Text>
      </View>

      <CorporateFooter pagina="Pagina 2 di 2" studio={studio} />
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
  const ibanCliente = azienda.iban || azienda.ibanRiferimento || '________________________________________________'
  const ibanStudio = emittente?.iban || 'IT 89E 03032 12804 0100 00063104'

  // Rimuove eventuale prefisso "Studio Commerciale" per lasciare solo "Dott. Antonio Tuzio"
  const rawDenom = (emittente?.denominazione || 'Dott. Antonio Tuzio')
    .replace(/^STUDIO\s+COMMERCIALE\s+/i, '')
    .trim()

  const studio: StudioInfo = {
    denominazione: rawDenom || 'Dott. Antonio Tuzio',
    cf: emittente?.codiceFiscale || 'N/D',
    piva: emittente?.partitaIva || 'N/D',
    indirizzo: emittente?.indirizzo
      ? `${emittente.indirizzo} — ${emittente.cap || '42123'} ${emittente.comune || 'Reggio Emilia'} (${emittente.provincia || 'RE'})`
      : 'Via Umberto Poli 9/B — 42123 Reggio Emilia (RE)',
    telefono: emittente?.telefono || '0522 331628',
    email:
      emittente?.email && !emittente.email.includes('postmaster') && !emittente.email.includes('infooizut')
        ? emittente.email
        : 'antoniotuzio@cafcgnrostanuova.it',
    pec: emittente?.pec || 'studiotuzio@legalmail.it',
    iban: ibanStudio,
  }

  const docInfo = azienda.documentoNumero
    ? `${azienda.documentoTipo === 'passaporto' ? 'Passaporto' : azienda.documentoTipo === 'patente' ? 'Patente' : "Carta d'Identità"} n. ${azienda.documentoNumero}${
        azienda.documentoScadenza ? ` (Scad. ${new Date(azienda.documentoScadenza).toLocaleDateString('it-IT')})` : ''
      }`
    : "Carta d'Identità in acquisizione nel fascicolo"

  // Selezione automatica o esplicita del Modello (PAGHE, CONTABILITA, FORFETTARI, OCCASIONALI)
  const vReq = (varianteRichiesta || '').toUpperCase()
  let modello: 'PAGHE' | 'CONTABILITA' | 'FORFETTARI' | 'OCCASIONALI' = 'PAGHE'

  if (vReq === 'CONTABILITA') {
    modello = 'CONTABILITA'
  } else if (vReq === 'FORFETTARI' || vReq === 'FORFETTARIO' || vReq === 'CONSULENZA') {
    modello = 'FORFETTARI'
  } else if (vReq === 'OCCASIONALI' || vReq === 'OCCASIONALE') {
    modello = 'OCCASIONALI'
  } else if (vReq === 'PAGHE') {
    modello = 'PAGHE'
  } else {
    const prestLower = (azienda.antiriciclaggioPrestazione || '').toLowerCase()
    if (prestLower.includes('occasion') || prestLower.includes('verbale ispettivo')) {
      modello = 'OCCASIONALI'
    } else if (azienda.settoreAttivita === 'FORFETTARI') {
      modello = 'FORFETTARI'
    } else if (
      azienda.settoreAttivita === 'CONTABILITA' ||
      (bot.zona === 'ZONA_3' && !prestLower.includes('verbale ispettivo'))
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
      : modello === 'OCCASIONALI'
      ? "LETTERA D'INCARICO PER RAPPORTI DI LAVORO OCCASIONALI AUTONOMI E CONSULENZA DEL LAVORO"
      : "LETTERA D'INCARICO PER AMMINISTRAZIONE DEL PERSONALE DIPENDENTE E CONSULENZA DEL LAVORO"

  const sottotitolo =
    modello === 'CONTABILITA'
      ? 'Mandato professionale continuativo comprensivo di Delega Cassetto Fiscale/LUL, Policy Privacy GDPR e Delega Telematica F24'
      : modello === 'FORFETTARI'
      ? 'Assistenza fiscale Regime Forfetario (Art. 1 co. 54-89 L. 190/2014), Delega Cassetto Fiscale, Policy Privacy GDPR e Delega F24'
      : modello === 'OCCASIONALI'
      ? 'Gestione Rapporti di Lavoro Occasionali Autonomi (Art. 2222 c.c.), Prospetti Paga, Conciliazioni, Assistenza Ispettiva, Privacy GDPR e Delega F24'
      : 'Gestione Buste Paga, Tenuta Libro Unico del Lavoro (LUL), Pratiche UNILAV/INPS/INAIL, Policy Privacy GDPR e Delega F24'

  const doc = (
    <Document title={`Lettera_Incarico_${modello}_${ragSoc}`}>
      {/* ==================== PAGINA 1: PARTI CONTRAENTI, OGGETTO, COMPENSO (SENZA TARIFFARIO) E CLAUSOLE ==================== */}
      <Page size="A4" style={styles.page}>
        <CorporateHeader fascicolo={fascicolo} zonaLabel={bot.zonaLabel} dataOggi={oggi} studio={studio} />

        <View style={styles.titleBox} wrap={false}>
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
          studio={studio}
        />

        {/* ART. 1 — OGGETTO DELL'INCARICO */}
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.sectionHeader}>
            Art. 1 — Oggetto e Complessità dell&apos;Incarico Professionale Conferito
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
                <Text style={[styles.italic, { fontSize: 7.2, color: '#475569', marginTop: 2 }]}>
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
            ) : modello === 'OCCASIONALI' ? (
              <View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.1 Rapporti di Lavoro Occasionali Autonomi e Adempimenti Previdenziali:</Text>{' '}
                    assistenza, consulenza e adempimenti in ambito di diritto del lavoro, diritto sindacale e previdenza/assistenza sociale; formazione, instaurazione, svolgimento ed estinzione dei <Text style={styles.bold}>rapporti di lavoro occasionali autonomi (art. 2222 c.c.)</Text>, comunicazioni preventive obbligatorie (art. 14 D.Lgs. 81/2008), elaborazione prospetti paga / ricevute di compenso occasionale, invio telematico flussi retributivi e denunce assicurative e previdenziali (inclusa Gestione Separata INPS).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.2 Procedimenti Disciplinari, Controversie, Conciliazioni e Accertamenti Ispettivi:</Text>{' '}
                    consulenza in materia di procedimenti e sanzioni disciplinari, assistenza nelle controversie di lavoro in sede extragiudiziale e tentativi di conciliazione, assistenza in <Text style={styles.bold}>accertamenti ispettivi (INL/INPS/INAIL)</Text>, analisi del costo del lavoro, stime budget personale e consulenza in ambito di incentivi e sgravi.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.3 Consulenza Ricorrente e Incontri Periodici:</Text> consulenza telefonica su procedure ricorrenti legate alle specifiche problematiche del Cliente e incontro regolare periodico presso la sede del Cliente o dello Studio per l&apos;intera durata dell&apos;incarico. Sono escluse le attività di verifica mirate a individuare falsificazioni o altre anomalie.
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

        {/* ART. 2 — COMPENSO E MODALITÀ DI PAGAMENTO (SENZA TARIFFARIO PRECOMPILATO) */}
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.sectionHeader}>
            Art. 2 — Determinazione del Compenso e Modalità di Pagamento Tracciabile
          </Text>
          <View style={styles.sectionBody}>
            {modello === 'OCCASIONALI' ? (
              <View>
                <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 4 }}>
                  Per lo svolgimento delle prestazioni oggetto del suddetto incarico, le parti concordano che al Professionista spetteranno i seguenti compensi (da compilare in sede di conferimento):
                </Text>
                <Text style={{ fontSize: 7.5, marginBottom: 2.5 }}>
                  • Per l&apos;attività di consulenza: <Text style={styles.bold}>€ ____________________</Text> · Per l&apos;elaborazione di ogni prospetto paga: <Text style={styles.bold}>€ ______________</Text> per ______ mensilità;
                </Text>
                <Text style={{ fontSize: 7.5, marginBottom: 3.5 }}>
                  • Per la redazione delle dichiarazioni fiscali: <Text style={styles.bold}>€ ____________________</Text> · Per i servizi contabili: <Text style={styles.bold}>€ ______________</Text> per ______ mensilità;
                </Text>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 3.5 }}>
                  Per lo svolgimento delle prestazioni oggetto del presente incarico, le parti concordano che al Professionista spetteranno i compensi pattuiti tra le parti in ragione della natura e della complessità delle attività svolte:
                </Text>
                <Text style={{ fontSize: 7.6, marginBottom: 3.5 }}>
                  • <Text style={styles.bold}>Compenso pattuito / Periodico concordato:</Text> € ____________________________________ (Cadenza: ________________________)
                </Text>
              </View>
            )}
            <Text style={{ fontSize: 7.3, color: '#334155', textAlign: 'justify' }}>
              I compensi sono esclusi dall&apos;applicazione dell&apos;IVA e della ritenuta d&apos;acconto in quanto il Professionista adotta il Regime Forfetario RF19 ai sensi dell&apos;art. 1, co. 54-89, L. 190/2014, e sono soggetti al contributo integrativo previdenziale nella misura del 4%, oltre al rimborso delle spese documentate. Annualmente gli importi saranno adeguati in base alla variazione dell&apos;indice ISTAT dei prezzi al consumo. Il pagamento dovrà avvenire con modalità tracciabile entro i termini pattuiti dalla presentazione della fattura o avviso di parcella su <Text style={styles.bold}>IBAN: {studio.iban}</Text>.
            </Text>
          </View>
        </View>

        {/* ART. 3, 4, 5, 6, 7 — DURATA, OBBLIGHI, FORO E DELEGA CASSETTO FISCALE / LUL */}
        <View style={styles.sectionCard} wrap={false}>
          <Text style={styles.sectionHeader}>
            Artt. 3–7 — Durata, Obblighi delle Parti, Polizza LLOYD&apos;S, Foro Competente e Delega Cassetto Fiscale / LUL
          </Text>
          <View style={styles.sectionBody}>
            <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
              • <Text style={styles.bold}>Art. 3 (Durata, Recesso e Risoluzione):</Text> L&apos;incarico decorre dalla
              sottoscrizione con durata annuale e rinnovo tacito automatico per eguale periodo, salvo disdetta tramite
              PEC (<Text style={styles.bold}>{studio.pec}</Text>) o raccomandata A/R{' '}
              {modello === 'FORFETTARI' ? 'entro il 31 ottobre di ogni anno solare' : 'almeno 3 mesi (90 gg) prima della scadenza'}.
              {modello === 'OCCASIONALI'
                ? " In caso di recesso del Cliente senza il rispetto dei termini ex art. 2237 c.c., è dovuta una penale pari agli onorari maturandi fino a scadenza naturale calcolati sulla media dei 6 mesi precedenti. Il mancato pagamento costituisce giusta causa di risoluzione e facoltà di rinuncia immediata al mandato."
                : ''}{'\n'}
              • <Text style={styles.bold}>Artt. 4–5 (Obblighi del Professionista e del Cliente &amp; Antiriciclaggio):</Text>{' '}
              Il Professionista opera con diligenza, segreto professionale, facoltà di avvalersi di sostituti o
              collaboratori sotto la propria responsabilità ed è assicurato con polizza RC professionale{' '}
              <Text style={styles.bold}>LLOYD&apos;S Insurance Company</Text>. Il Cliente garantisce completezza,
              esattezza e autenticità dei documenti forniti e comunica tempestivamente ogni variazione rilevante anche
              ai sensi del <Text style={styles.bold}>D.Lgs. 231/2007</Text> (Titolare Effettivo, compagine sociale,
              documento d&apos;identità) a <Text style={styles.bold}>{studio.email}</Text> o PEC <Text style={styles.bold}>{studio.pec}</Text>.{'\n'}
              • <Text style={styles.bold}>Art. 6 (Foro Competente) &amp; Art. 7 (Delega Cassetto Fiscale e LUL):</Text>{' '}
              Per ogni controversia sull&apos;interpretazione ed esecuzione del contratto è competente il{' '}
              <Text style={styles.bold}>Foro di Reggio Emilia</Text> (e Organismo di Mediazione C.C.I.A.A. di Reggio
              Emilia). Il Cliente autorizza il Professionista ad accedere ai sistemi di{' '}
              <Text style={styles.bold}>Agenzia delle Entrate, Uni-riscossioni, INPS, INAIL e Ispettorato del Lavoro</Text>{' '}
              e alla tenuta del <Text style={styles.bold}>Libro Unico del Lavoro (LUL)</Text>.
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
                <Text style={styles.signaturePartyName}>{studio.denominazione}</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureSub}>Timbro e Firma del Professionista</Text>
              </View>
            </View>
          </View>
        </View>

        <CorporateFooter pagina="Pagina 1 di 2" studio={studio} />
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
        studio={studio}
      />
    </Document>
  )

  return await renderToBuffer(doc)
}
