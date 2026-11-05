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
    fontSize: 7.8,
    color: '#1e293b',
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 26,
    lineHeight: 1.25,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studioHeaderLeft: {
    flex: 1,
    paddingRight: 8,
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
    paddingHorizontal: 7,
    alignItems: 'flex-end',
    width: 175,
    flexShrink: 0,
  },
  badgeTitle: {
    fontSize: 7.6,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    textAlign: 'right',
  },
  badgeSub: {
    fontSize: 6.4,
    color: '#334155',
    marginTop: 1,
    textAlign: 'right',
  },
  badgeDate: {
    fontSize: 6.2,
    color: '#64748b',
    marginTop: 1,
    textAlign: 'right',
  },

  // DOCUMENT TITLE
  titleBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
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
    marginBottom: 5,
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
    paddingVertical: 3.5,
    paddingHorizontal: 6,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  dataLabel: {
    width: '31%',
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
  },
  dataVal: {
    width: '69%',
    fontSize: 7.5,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },

  // SECTION CARDS
  sectionCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 5,
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
    paddingVertical: 3.5,
    paddingHorizontal: 7,
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
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    marginTop: 2,
    marginBottom: 2,
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
    paddingVertical: 3.5,
    paddingHorizontal: 6,
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
    marginTop: 10,
    marginBottom: 2,
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

type ModelloIncarico = 'PAGHE' | 'CONTABILITA' | 'SEMPLIFICATA' | 'FORFETTARI' | 'OCCASIONALI' | 'CAF'

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
  // Sintesi pulita per il badge (evita overflow orizzontale o sovrapposizioni)
  const cleanZona = zonaLabel.includes('ZONA 2')
    ? 'ZONA 2 · Esente AVC (Art. 17 c. 7)'
    : zonaLabel.includes('ZONA 3')
    ? 'ZONA 3 · Soggetta AVC (Mod. AV.1)'
    : zonaLabel.includes('ZONA 1')
    ? 'ZONA 1 · Esente (Privati / CAF)'
    : zonaLabel.length > 34
    ? zonaLabel.slice(0, 32) + '...'
    : zonaLabel

  return (
    <View style={styles.headerBanner} wrap={false}>
      <View style={styles.studioHeaderLeft}>
        <Text style={styles.studioName}>{studio.denominazione.toUpperCase()}</Text>
        <Text style={styles.studioSub}>
          Dottore Commercialista · Albo ODCEC di Reggio Emilia n. 742/A
        </Text>
        <Text style={styles.studioSub}>
          C.F. {studio.cf} · P.IVA {studio.piva}
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
        <Text style={styles.badgeSub}>{cleanZona}</Text>
        <Text style={styles.badgeDate}>Data: {dataOggi}</Text>
      </View>
    </View>
  )
}

function CorporateFooter({ studio }: { studio: StudioInfo }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        <Text style={styles.bold}>{studio.denominazione}</Text> · Dottore Commercialista · PEC:{' '}
        <Text style={styles.bold}>{studio.pec}</Text> · Email: {studio.email}
      </Text>
      <Text
        style={styles.bold}
        render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} di ${totalPages}`}
        fixed
      />
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
              {isSocieta
                ? 'Società / Ente (Persona Giuridica)'
                : cfAzienda && cfAzienda.length === 16 && (!pivaAzienda || pivaAzienda === 'N/D' || pivaAzienda === cfAzienda)
                ? 'Persona Fisica (Privato / Contribuente CAF)'
                : 'Impresa Individuale / Professionista'}
            </Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>C.F. / Partita IVA:</Text>
            <Text style={styles.dataVal}>
              {!pivaAzienda || pivaAzienda === 'N/D' || pivaAzienda === cfAzienda
                ? `C.F. ${cfAzienda}`
                : `C.F. ${cfAzienda} · P.IVA ${pivaAzienda}`}
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
  modello,
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
  modello: ModelloIncarico
}) {
  const esenteAvcPaghe = modello === 'PAGHE' || modello === 'OCCASIONALI'
  const isCaf = modello === 'CAF'
  return (
    <>
    <Page size="A4" style={styles.page}>
      <CorporateHeader fascicolo={fascicolo} zonaLabel={zonaLabel} dataOggi={oggi} studio={studio} />

      {/* ART. 8 — DISCIPLINA ANTIRICICLAGGIO (CLAUSOLARIO STUDIO TUZIO / CNDCEC-CNOCDL 16.01.2025) */}
      <View style={styles.sectionCard} wrap={false}>
        <Text style={styles.sectionHeader}>
          Art. 8 — Disciplina Antiriciclaggio, Titolare Effettivo e Obbligo di Astensione (D.Lgs. 231/2007)
        </Text>
        <View style={styles.sectionBody}>
          {isCaf ? (
            <View style={[styles.calloutBox, { marginTop: 0, marginBottom: 4 }]}>
              <Text style={{ fontSize: 7.3, textAlign: 'justify' }}>
                <Text style={styles.bold}>8.0 Inquadramento Antiriciclaggio — ZONA 1 (Esente AVC ex Tab. 1 RT n. 2 CNDCEC): </Text>
                ai sensi dell&apos;<Text style={styles.bold}>art. 17, comma 7 del D.Lgs. 231/2007</Text> e della Tabella 1 allegata alla Regola Tecnica n. 2 del CNDCEC del 16/01/2025, le prestazioni di mera redazione e trasmissione delle dichiarazioni tributarie (Mod. 730, Mod. Redditi PF privati) e assistenza fiscale CAF/Patronato rientrano nella ZONA 1 esente dall&apos;obbligo di fascicolo formale di adeguata verifica, fermi restando l&apos;identificazione del contribuente, la conservazione decennale della documentazione fiscale e l&apos;obbligo generale di Segnalazione di Operazioni Sospette (SOS).
              </Text>
            </View>
          ) : esenteAvcPaghe ? (
            <View style={[styles.calloutBox, { marginTop: 0, marginBottom: 4 }]}>
              <Text style={{ fontSize: 7.3, textAlign: 'justify' }}>
                <Text style={styles.bold}>8.0 Esenzione per le paghe e riserva di adeguata verifica: </Text>
                ai sensi dell&apos;<Text style={styles.bold}>art. 17, comma 7, del D.Lgs. 231/2007</Text>, gli
                adempimenti di mera amministrazione del personale ed elaborazione dei cedolini (L. 12/1979) sono esenti
                dall&apos;obbligo di adeguata verifica ordinaria. Qualora l&apos;incarico comprenda consulenze
                lavoristiche straordinarie o strategiche, la negoziazione di contratti aziendali straordinari, ovvero
                emergano elementi di sospetto o dubbi sull&apos;identità, lo Studio procederà all&apos;adeguata verifica
                della clientela, fermo restando l&apos;obbligo di Segnalazione di Operazioni Sospette (SOS).
              </Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>8.1 Obbligo di informazione del Cliente (Art. 22): </Text>
            il Cliente si obbliga a fornire per iscritto e sotto la propria responsabilità tutte le informazioni
            necessarie e aggiornate relative all&apos;identificazione del Cliente, dell&apos;Esecutore e del{' '}
            <Text style={styles.bold}>Titolare Effettivo</Text> (criteri di individuazione ex art. 20: proprietà
            {' '}&gt; 25%, controllo o rappresentanza legale), nonché sullo scopo e sulla natura della prestazione e
            sulla provenienza dei fondi, sottoscrivendo contestualmente la{' '}
            <Text style={styles.bold}>Dichiarazione ex art. 22 (Modello AV.4)</Text> e comunicando immediatamente ogni
            successiva variazione. Il Cliente è consapevole delle sanzioni penali previste dall&apos;
            <Text style={styles.bold}>art. 55, comma 3, del D.Lgs. 231/2007</Text> in caso di dichiarazioni mendaci o
            omesse.
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>8.2 Clausola risolutiva espressa e obbligo di astensione (Art. 42): </Text>
            l&apos;impossibilità di effettuare o completare l&apos;adeguata verifica per causa imputabile al Cliente,
            inclusa la mancata sottoscrizione del Modello AV.4 o il mancato conferimento delle informazioni sul
            Titolare Effettivo <Text style={styles.bold}>entro 30 giorni</Text>, costituisce causa di risoluzione di
            diritto del presente mandato <Text style={styles.bold}>ex art. 1456 c.c.</Text> e comporta l&apos;obbligo
            di astensione o interruzione immediata dell&apos;incarico (Modello AV.6), fermo restando il diritto del
            Professionista al compenso per l&apos;attività svolta ed al risarcimento degli eventuali danni.
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify' }}>
            <Text style={styles.bold}>8.3 Conservazione e Fascicolo del Cliente (Art. 31): </Text>
            i dati, i documenti identificativi e i modelli di valutazione del rischio (
            <Text style={styles.bold}>AV.1, AV.4, AV.7</Text>) sono inseriti nel Fascicolo Specifico del Cliente e
            conservati per <Text style={styles.bold}>10 anni</Text> dalla cessazione del rapporto professionale
            (Regola Tecnica n. 3 CNDCEC), garantendone riservatezza e accessibilità alle Autorità di controllo (UIF,
            Guardia di Finanza).
            {modello === 'CONTABILITA' || modello === 'SEMPLIFICATA'
              ? ' Prestazione soggetta ad adeguata verifica (Rischio Inerente Grado 3): il Cliente attesta che le scritture e i documenti trasmessi rispecchiano operazioni gestionali effettive; il controllo costante è effettuato con cadenza biennale o triennale.'
              : modello === 'FORFETTARI'
              ? ' Il Cliente si impegna al rispetto dei requisiti di accesso e permanenza nel regime forfetario; l\u2019adeguata verifica è effettuata in forma semplificata/ordinaria con aggiornamento triennale.'
              : modello === 'CAF'
              ? ' Per le prestazioni di sola assistenza fiscale 730/CAF ai privati si applica la semplificazione per adempimenti standard esenti da fascicolo AVC.'
              : ''}
          </Text>
        </View>
      </View>

      {/* ART. 9 — PRIVACY GDPR */}
      <View style={styles.sectionCard} wrap={false}>
        <Text style={styles.sectionHeader}>
          Art. 9 — Informativa sul Trattamento dei Dati Personali (Artt. 13-22 Reg. UE 2016/679 — GDPR)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>9.1 Titolare del trattamento e basi giuridiche: </Text>
            Titolare del trattamento è <Text style={styles.bold}>{studio.denominazione}</Text> – {studio.indirizzo} –
            PEC <Text style={styles.bold}>{studio.pec}</Text> – Email <Text style={styles.bold}>{studio.email}</Text>.
            La base giuridica è costituita dall&apos;esecuzione del mandato professionale (
            <Text style={styles.bold}>art. 6, par. 1, lett. b GDPR</Text>) e dall&apos;adempimento degli obblighi di
            legge fiscali, contabili e antiriciclaggio (<Text style={styles.bold}>art. 6, par. 1, lett. c GDPR</Text>).
            Per i dati particolari (es. dati sanitari/sindacali dei dipendenti nelle paghe) la base giuridica risiede
            nell&apos;esercizio dei diritti in materia di diritto del lavoro e sicurezza sociale (
            <Text style={styles.bold}>art. 9, par. 2, lett. b GDPR</Text>). Non è richiesto alcun consenso facoltativo
            per il trattamento dei dati strettamente necessari all&apos;esecuzione del mandato.
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 3 }}>
            <Text style={styles.bold}>9.2 Finalità e modalità: </Text>
            i dati sono trattati con strumenti manuali e informatici idonei a garantirne sicurezza e riservatezza, per
            finalità di gestione contabile, fiscale, giuslavoristica, trasmissione telematica ad Agenzia delle
            Entrate/INPS/INAIL e adempimenti antiriciclaggio, e possono essere comunicati a soggetti esterni (banche,
            PA, consulenti tecnici) operanti quali Responsabili o Titolari autonomi.
          </Text>
          <Text style={{ fontSize: 7.4, textAlign: 'justify', marginBottom: 4 }}>
            <Text style={styles.bold}>9.3 Conservazione e diritti: </Text>
            i dati sono conservati per la durata dell&apos;incarico e successivamente per 10 anni (art. 2220 c.c. e
            art. 31 D.Lgs. 231/2007). L&apos;interessato può esercitare i diritti ex artt. 15-22 GDPR (accesso,
            rettifica, cancellazione, limitazione, portabilità, opposizione) via PEC ({studio.pec}) e proporre reclamo
            al Garante per la Protezione dei Dati Personali (art. 77 GDPR).
          </Text>

          <View style={[styles.calloutBox, { marginBottom: 3 }]}>
            <Text style={[styles.bold, { fontSize: 7.6, color: '#1e3a8a', marginBottom: 3 }]}>
              ESPRESSIONE DI CONSENSO PER LE FINALITÀ ULTERIORI — Da barrare a cura del Cliente
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
                l&apos;elaborazione di rapporti (&ldquo;reports&rdquo;) e processi di valutazione non strettamente necessari all&apos;esecuzione del mandato.
              </Text>
            </View>
            <View style={styles.checkRow}>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 12, fontFamily: 'Helvetica-Bold' }}>AUTORIZZO</Text>
              <View style={styles.checkBoxEmpty} />
              <Text style={{ fontSize: 7.4, marginRight: 8, fontFamily: 'Helvetica-Bold' }}>NON AUTORIZZO</Text>
              <Text style={{ fontSize: 7.3, flex: 1 }}>
                la comunicazione dei dati a soggetti diversi da quelli obbligatori per legge (Agenzia Entrate, INPS, INAIL, CCIAA, Cassa Edile).
              </Text>
            </View>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Presa Visione Informativa — Il Cliente</Text>
              <Text style={styles.signaturePartyName}>{rapprNome}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Reggio Emilia, lì ____/____/________ — Firma dell&apos;Interessato</Text>
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

      <CorporateFooter studio={studio} />
    </Page>

    <Page size="A4" style={styles.page}>
      <CorporateHeader fascicolo={fascicolo} zonaLabel={zonaLabel} dataOggi={oggi} studio={studio} />

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

      {/* APPROVAZIONE SPECIFICA CLAUSOLE EX ARTT. 1341-1342 C.C. */}
      <View style={styles.sectionCard} wrap={false}>
        <Text style={styles.sectionHeader}>
          Approvazione Specifica delle Clausole (Artt. 1341 e 1342 c.c.)
        </Text>
        <View style={styles.sectionBody}>
          <Text style={{ fontSize: 7.4, textAlign: 'justify' }}>
            Ai sensi e per gli effetti degli artt. 1341 e 1342 c.c., il Cliente dichiara di aver letto attentamente e di
            approvare specificamente le seguenti clausole: <Text style={styles.bold}>Art. 3</Text> (durata, rinnovo
            tacito, recesso{modello === 'OCCASIONALI' ? ' e penale ex art. 2237 c.c.' : ''});{' '}
            <Text style={styles.bold}>Art. 5</Text> (obblighi e responsabilità del Cliente);{' '}
            <Text style={styles.bold}>Art. 6</Text> (foro competente e mediazione);{' '}
            <Text style={styles.bold}>Art. 8.2</Text> (clausola risolutiva espressa ex art. 1456 c.c. e obbligo di
            astensione); <Text style={styles.bold}>Allegato A</Text> (esonero da responsabilità del Professionista in
            caso di sospensione delle deleghe F24 richiesta dal Cliente).
          </Text>
          <View style={[styles.signatureRow, { justifyContent: 'flex-start' }]}>
            <View style={styles.signatureCard}>
              <Text style={styles.signatureLabelTop}>Per Approvazione Specifica — Il Cliente</Text>
              <Text style={styles.signaturePartyName}>{rapprNome}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureSub}>Reggio Emilia, lì ____/____/________ — Firma del Cliente</Text>
            </View>
          </View>
        </View>
      </View>

      {/* BOX ATTESTAZIONE INQUADRAMENTO ANTIRICICLAGGIO D.LGS. 231/2007 */}
      <View style={[styles.calloutBox, { backgroundColor: '#eff6ff', borderLeftColor: '#1d4ed8', marginBottom: 0 }]} wrap={false}>
        <Text style={[styles.bold, { fontSize: 7.6, color: '#1e3a8a' }]}>
          ATTESTAZIONE DI INQUADRAMENTO ANTIRICICLAGGIO DEL MANDATO (D.Lgs. 231/2007 — Regole Tecniche CNDCEC/CNOCDL 16.01.2025)
        </Text>
        <Text style={{ fontSize: 7.1, color: '#1e293b', marginTop: 1.5 }}>
          • <Text style={styles.bold}>Fascicolo:</Text> {fascicolo} · <Text style={styles.bold}>Qualificazione AML:</Text> {zonaLabel} · <Text style={styles.bold}>Titolare Effettivo (Art. 20):</Text> {titolareEffettivo}{'\n'}
          • <Text style={styles.bold}>Presidio applicato:</Text> {botMotivo}
        </Text>
      </View>

      <CorporateFooter studio={studio} />
    </Page>
    </>
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

  // Selezione automatica o esplicita del Modello (PAGHE, CONTABILITA, SEMPLIFICATA, FORFETTARI, OCCASIONALI)
  const vReq = (varianteRichiesta || '').toUpperCase()
  let modello: ModelloIncarico = 'PAGHE'

  if (vReq === 'CONTABILITA' || vReq === 'ORDINARIA') {
    modello = 'CONTABILITA'
  } else if (vReq === 'SEMPLIFICATA') {
    modello = 'SEMPLIFICATA'
  } else if (vReq === 'FORFETTARI' || vReq === 'FORFETTARIO' || vReq === 'CONSULENZA') {
    modello = 'FORFETTARI'
  } else if (vReq === 'OCCASIONALI' || vReq === 'OCCASIONALE') {
    modello = 'OCCASIONALI'
  } else if (vReq === 'PAGHE') {
    modello = 'PAGHE'
  } else if (vReq === 'CAF' || vReq === '730' || vReq === 'DICHIARAZIONI') {
    modello = 'CAF'
  } else {
    // Risoluzione automatica in base al settore dell'azienda o prestazione
    const settore = (azienda.settoreAttivita || '').toUpperCase().trim()
    const prestLower = (azienda.antiriciclaggioPrestazione || '').toLowerCase()

    // 1. PRIORITÀ ASSOLUTA al settore assegnato esplicitamente all'anagrafica cliente
    if (settore === 'CAF' || prestLower.includes('caf') || prestLower.includes('730') || prestLower.includes('redditi pf') || prestLower.includes('dichiarazione dei redditi')) {
      modello = 'CAF'
    } else if (settore === 'PAGHE') {
      modello = 'PAGHE'
    } else if (settore === 'FORFETTARI' || settore === 'FORFETTARIO') {
      modello = 'FORFETTARI'
    } else if (settore === 'OCCASIONALI' || settore === 'OCCASIONALE') {
      modello = 'OCCASIONALI'
    } else if (settore === 'SEMPLIFICATA') {
      modello = 'SEMPLIFICATA'
    } else if (settore === 'CONTABILITA') {
      modello = 'CONTABILITA'
    // 2. Se settore non è uno di quelli sopra, analizza il testo della prestazione
    } else if (prestLower.includes('paghe') || prestLower.includes('cedolin') || prestLower.includes('dipendent') || prestLower.includes('buste')) {
      modello = 'PAGHE'
    } else if (prestLower.includes('forfet')) {
      modello = 'FORFETTARI'
    } else if (prestLower.includes('occasion') || prestLower.includes('verbale ispettivo')) {
      modello = 'OCCASIONALI'
    } else if (prestLower.includes('semplificat')) {
      modello = 'SEMPLIFICATA'
    } else if (prestLower.includes('contabilit') || prestLower.includes('bilancio') || bot.zona === 'ZONA_3') {
      modello = 'CONTABILITA'
    } else {
      // Default per chi non ha P.IVA è CAF; per chi ha P.IVA è CONTABILITA
      modello = azienda.partitaIva ? 'CONTABILITA' : 'CAF'
    }
  }

  // Titolo e sottotitolo in base al modello
  const titolo =
    modello === 'CAF'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI DEI REDDITI, ASSISTENZA FISCALE CAF E ADEMPIMENTI TRIBUTARI'
      : modello === 'CONTABILITA'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA E BILANCIO'
      : modello === 'SEMPLIFICATA'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ SEMPLIFICATA E CONSULENZA FISCALE'
      : modello === 'FORFETTARI'
      ? 'LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO'
      : modello === 'OCCASIONALI'
      ? "LETTERA D'INCARICO PER RAPPORTI DI LAVORO OCCASIONALI AUTONOMI E CONSULENZA DEL LAVORO"
      : "LETTERA D'INCARICO PER AMMINISTRAZIONE DEL PERSONALE DIPENDENTE E CONSULENZA DEL LAVORO"

  const sottotitolo =
    modello === 'CAF'
      ? 'Modello 730, Modello Redditi PF, IMU, Visto di Conformità, Cassetto Fiscale, Policy Privacy GDPR e Delega F24'
      : modello === 'CONTABILITA'
      ? 'Mandato professionale continuativo comprensivo di Delega Cassetto Fiscale/LUL, Policy Privacy GDPR e Delega Telematica F24'
      : modello === 'SEMPLIFICATA'
      ? 'Registri in contabilità semplificata, Dichiarazioni Redditi/IVA/IRAP, Cassetto Fiscale, Antiriciclaggio, Privacy GDPR e Delega F24'
      : modello === 'FORFETTARI'
      ? 'Assistenza fiscale Regime Forfetario (Art. 1 co. 54-89 L. 190/2014), Delega Cassetto Fiscale, Policy Privacy GDPR e Delega F24'
      : modello === 'OCCASIONALI'
      ? 'Gestione Rapporti di Lavoro Occasionali Autonomi (Art. 2222 c.c.), Prospetti Paga, Conciliazioni, Assistenza Ispettiva, Privacy GDPR e Delega F24'
      : 'Gestione Buste Paga, Tenuta Libro Unico del Lavoro (LUL), Pratiche UNILAV/INPS/INAIL, Policy Privacy GDPR e Delega F24'

  const doc = (
    <Document title={`Lettera_Incarico_${modello}_${ragSoc}`}>
      {/* ==================== PAGINA 1: PARTI CONTRAENTI, OGGETTO, COMPENSO (SENZA TARIFFARIO) E CLAUSOLE ==================== */}
      <Page size="A4" style={styles.page}>
        <CorporateHeader
          fascicolo={fascicolo}
          zonaLabel={modello === 'CAF' ? 'ZONA 1 · Esente (Privati / CAF)' : bot.zonaLabel}
          dataOggi={oggi}
          studio={studio}
        />

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
            {modello === 'CAF' ? (
              <View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.1 Dichiarazioni Fiscali e Visto di Conformità:</Text> assistenza nella raccolta documentale, elaborazione, apposizione del visto di conformità e trasmissione telematica del <Text style={styles.bold}>Modello 730</Text> o <Text style={styles.bold}>Modello Redditi PF</Text> (inclusi quadri RW per monitoraggio fiscale estero, quadri RT plusvalenze e quadri integrativi).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.2 Imposte Locali (IMU) e Deleghe di Pagamento F24:</Text> conteggio dell&apos;Imposta Municipale Propria (IMU) su fabbricati e terreni posseduti, compilazione e invio telematico ovvero rilascio delle <Text style={styles.bold}>deleghe di versamento F24</Text> (acconto e saldo).
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.3 Cassetto Fiscale, Certificazioni Uniche e Assistenza Tributaria:</Text> consultazione del Cassetto Fiscale (Certificazioni Uniche, oneri detraibili, spese sanitarie, bonifici bonus casa), gestione comunicazioni di irregolarità (avvisi bonari ex artt. 36-bis e 36-ter D.P.R. 600/73), cartelle esattoriali e istanze di autotutela.
                  </Text>
                </View>
                <Text style={[styles.italic, { fontSize: 7.2, color: '#475569', marginTop: 2 }]}>
                  Responsabilità documentale: il Cliente garantisce che fatture, scontrini e documentazione probatoria di oneri deducibili e detraibili sono autentici, conformi agli originali e non utilizzati per altre dichiarazioni fiscali.
                </Text>
              </View>
            ) : modello === 'CONTABILITA' ? (
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
            ) : modello === 'SEMPLIFICATA' ? (
              <View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.1 Contabilità semplificata:</Text> impianto e tenuta dei registri contabili in regime di contabilità semplificata (registri IVA acquisti/vendite/corrispettivi, registro beni ammortizzabili), liquidazioni IVA periodiche e comunicazioni LIPE.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.2 Dichiarazioni fiscali:</Text> assistenza nella predisposizione e invio telematico della Dichiarazione dei Redditi, della Dichiarazione annuale IVA e IRAP, comunicazione ISA.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    <Text style={styles.bold}>1.3 Adempimenti telematici:</Text> gestione del Cassetto Fiscale, calcolo delle imposte e predisposizione/trasmissione dei modelli F24.
                  </Text>
                </View>
                <Text style={[styles.italic, { fontSize: 7.2, color: '#475569', marginTop: 2 }]}>
                  1.4 Esclusione domiciliazione: le scritture e i documenti fiscali rimangono custoditi direttamente dal Cliente presso la propria sede, sotto la sua responsabilità.
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
            {modello === 'CAF' ? (
              <View>
                <Text style={{ fontSize: 7.5, textAlign: 'justify', marginBottom: 3 }}>
                  Per lo svolgimento delle prestazioni oggetto del presente incarico, le parti concordano che al Professionista spetteranno i seguenti compensi (da compilare all&apos;atto del conferimento):
                </Text>
                <Text style={{ fontSize: 7.6, marginBottom: 2 }}>
                  • <Text style={styles.bold}>Elaborazione Modello 730 / Modello Redditi PF:</Text> € ____________________ cad.
                </Text>
                <Text style={{ fontSize: 7.6, marginBottom: 2 }}>
                  • <Text style={styles.bold}>Calcolo IMU e predisposizione modelli F24:</Text> € ____________________ annui
                </Text>
                <Text style={{ fontSize: 7.6, marginBottom: 3 }}>
                  • <Text style={styles.bold}>Pratiche tributarie, CU, ISEE e istanze di sgravio:</Text> € ____________________ a pratica
                </Text>
              </View>
            ) : modello === 'OCCASIONALI' ? (
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

        <CorporateFooter studio={studio} />
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
        modello={modello}
      />
    </Document>
  )

  return await renderToBuffer(doc)
}
