// src/lib/pdf/antiriciclaggio-dichiarazione-pdf.tsx
// Modello AV.4 CNDCEC (Marzo 2026) — Dichiarazione del Cliente ex art. 22, co. 1, D.Lgs. 231/2007 (Regola Tecnica n. 2)
// Conforme a CNDCEC_modulistica-AML-def.docx e Regole Tecniche 16 Gennaio 2025 — Con Allegato Note 1-4 e Doppia Firma Cliente

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
    fontSize: 8.5,
    color: '#1e293b',
    paddingTop: 26,
    paddingBottom: 34,
    paddingHorizontal: 34,
    lineHeight: 1.35,
  },
  headerBox: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 7,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  studioTitle: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  studioSub: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 1.5,
  },
  docBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  docBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  mainTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 8,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 9,
  },
  section: {
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 7,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    backgroundColor: '#f1f5f9',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3.5,
  },
  col: {
    flex: 1,
  },
  col2: {
    flex: 2,
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 1.5,
    marginRight: 6,
    minHeight: 11,
  },
  paragraph: {
    fontSize: 8,
    textAlign: 'justify',
    marginBottom: 4,
    color: '#334155',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3.5,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    marginRight: 5,
    marginTop: 1,
    textAlign: 'center',
    fontSize: 7,
    lineHeight: 1.1,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
  },
  signatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  signatureBox: {
    width: '46%',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 22,
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: '#475569',
    textAlign: 'center',
  },
  noteBox: {
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 7,
    backgroundColor: '#f8fafc',
  },
  noteHeading: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a8a',
    marginBottom: 3,
  },
  noteText: {
    fontSize: 7.5,
    color: '#334155',
    textAlign: 'justify',
    marginBottom: 3,
    lineHeight: 1.32,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 34,
    right: 34,
    fontSize: 6.8,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 3,
  },
})

function formatDate(d?: Date | string | null): string {
  if (!d) return '____/____/________'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '____/____/________'
  return dt.toLocaleDateString('it-IT')
}

function getTipoDocLabel(t?: string | null): string {
  if (t === 'carta_identita') return 'Carta d\'Identità'
  if (t === 'passaporto') return 'Passaporto'
  if (t === 'patente') return 'Patente di Guida'
  return t || 'Carta d\'Identità'
}

export async function generaAntiriciclaggioDichiarazionePDF(
  azienda: any,
  emittente: any
): Promise<Buffer> {
  const rawDenom = (emittente?.denominazione || 'Dott. Antonio Tuzio')
    .replace(/^STUDIO\s+COMMERCIALE\s+/i, '')
    .trim()
  const studioDenominazione = rawDenom || 'Dott. Antonio Tuzio'
  const studioIndirizzo = emittente?.indirizzo
    ? `${emittente.indirizzo} - ${emittente.cap || '42123'} ${emittente.comune || 'Reggio Emilia'} (${emittente.provincia || 'RE'})`
    : 'Via Umberto Poli 9/B - 42123 Reggio Emilia (RE)'
  const studioPec = emittente?.pec || 'studiotuzio@legalmail.it'
  const studioEmail =
    emittente?.email && !emittente.email.includes('postmaster') && !emittente.email.includes('infooizut')
      ? emittente.email
      : 'antoniotuzio@cafcgnrostanuova.it'
  const studioPiva = `P.IVA ${emittente?.partitaIva || 'N/D'} - C.F. ${emittente?.codiceFiscale || 'N/D'} · PEC: ${studioPec} · Email: ${studioEmail}`

  const botDati = arricchisciDatiClienteBot(azienda)
  const oggi = formatDate(azienda.antiriciclaggioDataVerifica || new Date())
  const rapprNome = botDati.rapprNome || '____________________________________'
  const rapprCf = botDati.cfPersona || '________________________'
  const titolareEff = botDati.titolareEffettivo || rapprNome
  const cfTitolareEff = azienda.antiriciclaggioCfTitolareEffettivo || rapprCf
  const luogoNascita = botDati.luogoNascita || azienda.comune || '________________________'
  const dataNascita = botDati.dataNascitaIt || formatDate(azienda.dataNascitaRappr)
  const pivaNorm = botDati.pivaNorm || azienda.partitaIva
  const isSocieta = botDati.isSocieta

  const prestazioneTesto =
    azienda.antiriciclaggioPrestazione ||
    (azienda.settoreAttivita === 'PAGHE'
      ? 'Consulenza del lavoro, elaborazione buste paga/LUL e adempimenti previdenziali'
      : azienda.settoreAttivita === 'CONTABILITA'
      ? 'Tenuta della contabilità, redazione bilanci e consulenza fiscale/societaria continuativa'
      : azienda.settoreAttivita === 'FORFETTARI'
      ? 'Dichiarazione dei redditi e adempimenti fiscali annuali (Regime Forfettario)'
      : azienda.settoreAttivita === 'SUCCESSIONI'
      ? 'Assistenza e predisposizione pratica di Dichiarazione di Successione'
      : 'Consulenza fiscale e assistenza tributaria')

  const doc = (
    <Document title={`AV4_Dichiarazione_Antiriciclaggio_${azienda.ragioneSociale}`}>
      {/* PAGINA 1: MODELLO AV.4 — DICHIARAZIONE DEL CLIENTE DA FIRMARE */}
      <Page size="A4" style={styles.page}>
        {/* Header Studio */}
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.studioTitle}>{studioDenominazione}</Text>
            <Text style={styles.studioSub}>{studioIndirizzo}</Text>
            {studioPiva ? <Text style={styles.studioSub}>{studioPiva}</Text> : null}
          </View>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>
              MODELLO AV.4 CNDCEC — FASCICOLO: {azienda.antiriciclaggioFascicolo || `ARC-${new Date().getFullYear()}`}
            </Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>
          AV.4 — DICHIARAZIONE DEL CLIENTE PER ADEGUATA VERIFICA DELLA CLIENTELA
        </Text>
        <Text style={styles.subTitle}>
          (Ai sensi dell&apos;art. 22, co. 1, D.Lgs. 21 novembre 2007, n. 231 e Regola Tecnica n. 2 CNDCEC del 16/01/2025)
        </Text>

        <Text style={styles.paragraph}>
          In ottemperanza alle disposizioni dell&apos;art. 22, co. 1, del D.Lgs. 231/2007 (come modificato dal D.Lgs. 90/2017 e D.Lgs. 125/2019) e delle Regole Tecniche CNDCEC vigenti, consapevole delle responsabilità penali previste dall&apos;art. 55, co. 3, del medesimo decreto in caso di informazioni false o mendaci (v. <Text style={styles.bold}>Nota 2</Text> allegata), il/la sottoscritto/a fornisce sotto la propria responsabilità le seguenti informazioni:
        </Text>

        {/* Sezione 1: Dati del Dichiarante / Esecutore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            1. Dati Identificativi del Dichiarante (Cliente Persona Fisica / Legale Rappresentante - Esecutore)
          </Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Cognome e Nome</Text>
              <Text style={styles.value}>{rapprNome}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Codice Fiscale</Text>
              <Text style={styles.value}>{rapprCf}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Luogo di Nascita</Text>
              <Text style={styles.value}>{luogoNascita}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Data di Nascita</Text>
              <Text style={styles.value}>{dataNascita}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Domicilio / Residenza</Text>
              <Text style={styles.value}>{azienda.comune || '________________'} ({azienda.provincia || '__'})</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Documento di Identità</Text>
              <Text style={styles.value}>{getTipoDocLabel(azienda.documentoTipo)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Numero Documento</Text>
              <Text style={styles.value}>{azienda.documentoNumero || '____________________'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Autorità di Rilascio</Text>
              <Text style={styles.value}>{azienda.documentoRilasciatoDa || `Comune di ${azienda.comune || '________'}`}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Scadenza Documento</Text>
              <Text style={styles.value}>{formatDate(azienda.documentoScadenza)}</Text>
            </View>
          </View>
        </View>

        {/* Sezione 2: Dati Soggetto Rappresentato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            2. Dati Identificativi della Società / Ente / Ditta Individuale
          </Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Ragione Sociale / Denominazione</Text>
              <Text style={styles.value}>{azienda.ragioneSociale}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Partita IVA</Text>
              <Text style={styles.value}>{pivaNorm || 'Non applicabile (Privato)'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Codice Fiscale</Text>
              <Text style={styles.value}>{azienda.codiceFiscale || pivaNorm || '________________'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Sede Legale (Indirizzo, CAP, Comune, Provincia)</Text>
              <Text style={styles.value}>
                {azienda.indirizzo || '________________________'} - {azienda.cap || '_____'} {azienda.comune || '____________'} ({azienda.provincia || '__'})
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>PEC / Email</Text>
              <Text style={styles.value}>{azienda.pec || azienda.emailAmministrativa || '____________________'}</Text>
            </View>
          </View>
        </View>

        {/* Sezione 3: Scopo e Natura della Prestazione Professionale */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Natura e Scopo della Prestazione Professionale (Art. 18, co. 1, lett. c, D.Lgs. 231/2007)
          </Text>
          <View style={styles.row}>
            <View style={styles.col2}>
              <Text style={styles.label}>Oggetto della prestazione professionale richiesta allo Studio</Text>
              <Text style={styles.value}>{prestazioneTesto}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Scopo prevalente del rapporto</Text>
              <Text style={styles.value}>Adempimenti contabili, fiscali, societari o del lavoro</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Ambito territoriale operatività</Text>
              <Text style={styles.value}>Nazionale (Italia - Prov. {azienda.provincia || 'RE'})</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Mezzi pagamento e origine fondi</Text>
              <Text style={styles.value}>Mezzi tracciati / Attività propria lecita</Text>
            </View>
          </View>
        </View>

        {/* Sezione 4: Titolare Effettivo (4 opzioni ufficiali CNDCEC AV.4 — Caselle vuote da spuntare) */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            4. Dichiarazione sul Titolare Effettivo (Art. 20 e Art. 22 D.Lgs. 231/2007 — Nota 4)
          </Text>
          <View style={styles.checkboxRow}>
            <Text style={styles.checkbox}> </Text>
            <Text style={{ fontSize: 7.8, flex: 1 }}>
              <Text style={styles.bold}>Opzione A (Persona Fisica / Ditta Individuale):</Text> di agire in proprio e per conto proprio e di essere l&apos;unico Titolare Effettivo della prestazione professionale richiesta.
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <Text style={styles.checkbox}> </Text>
            <Text style={{ fontSize: 7.8, flex: 1 }}>
              <Text style={styles.bold}>Opzione B (Società / Ente):</Text> che il/i Titolare/i Effettivo/i della società/ente sopra indicato, individuato/i secondo i criteri di cui all&apos;art. 20 D.Lgs. 231/2007 (proprietà diretta/indiretta &gt; 25%, controllo o rappresentanza legale residuale), è/sono:
            </Text>
          </View>
          <View style={[styles.row, { marginTop: 2 }]}>
            <View style={styles.col2}>
              <Text style={styles.label}>Cognome e Nome Titolare Effettivo</Text>
              <Text style={styles.value}>{titolareEff}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>C.F. Titolare Effettivo</Text>
              <Text style={styles.value}>{cfTitolareEff}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Criterio Art. 20 D.Lgs. 231/07</Text>
              <Text style={styles.value}>{isSocieta ? 'Proprietà >25% / Amm.re' : 'Titolare Ditta'}</Text>
            </View>
          </View>
        </View>

        {/* Sezione 5: Status di Persona Politicamente Esposta (PPE — Caselle vuote da spuntare) */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            5. Dichiarazione su Persone Politicamente Esposte — PPE (Art. 1, co. 2, lett. dd, D.Lgs. 231/2007 — Nota 3)
          </Text>
          <View style={styles.checkboxRow}>
            <Text style={styles.checkbox}> </Text>
            <Text style={{ fontSize: 7.8, flex: 1 }}>
              Il sottoscritto (e il Titolare Effettivo indicato) dichiara di <Text style={styles.bold}>NON rivestire</Text> lo status di Persona Politicamente Esposta (PPE), né di essere familiare o soggetto con stretti legami con una PPE.
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <Text style={styles.checkbox}> </Text>
            <Text style={{ fontSize: 7.8, flex: 1 }}>
              Il sottoscritto (o il Titolare Effettivo) dichiara di <Text style={styles.bold}>RIVESTIRE</Text> la qualifica di Persona Politicamente Esposta (PPE), familiare o soggetto con stretti legami (specificare carica e origine fondi): _________________________________________________
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          Il/La sottoscritto/a si impegna a comunicare tempestivamente allo Studio ogni eventuale variazione dei dati sopra dichiarati (compresi mutamenti della compagine societaria, del Titolare Effettivo o rinnovo del documento d&apos;identità) e dichiara di aver ricevuto l&apos;informativa sul trattamento dei dati personali ai sensi del Regolamento UE 2016/679 (GDPR).
        </Text>

        {/* PRIMA FIRMA DEL CLIENTE */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Luogo e Data di Sottoscrizione</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>
              {emittente?.comune || 'Reggio Emilia'}, lì {oggi}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Firma leggibile del Cliente / Legale Rappresentante ({rapprNome})
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Modello AV.4 CNDCEC (Marzo 2026) — Dichiarazione ex art. 22 D.Lgs. 231/2007 — {studioDenominazione} — Pag. 1/2
        </Text>
      </Page>

      {/* PAGINA 2: ALLEGATO NOTE NORMATIVE UFFICIALI (NOTE 1, 2, 3, 4 CNDCEC) + SECONDA FIRMA PER PRESA VISIONE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBox}>
          <View>
            <Text style={styles.studioTitle}>{studioDenominazione}</Text>
            <Text style={styles.studioSub}>Allegato normativo obbligatorio alla Dichiarazione del Cliente (Modello AV.4 CNDCEC)</Text>
          </View>
          <View style={styles.docBadge}>
            <Text style={styles.docBadgeText}>ALLEGATO NOTE 1-4 (D.LGS. 231/2007)</Text>
          </View>
        </View>

        <Text style={styles.mainTitle}>
          ALLEGATO ALLA DICHIARAZIONE DEL CLIENTE — NOTE NORMATIVE (D.LGS. 231/2007)
        </Text>
        <Text style={styles.subTitle}>
          (Da sottoscrivere per ricevuta e presa visione unitamente al Modello AV.4)
        </Text>

        <View style={styles.noteBox}>
          <Text style={styles.noteHeading}>
            NOTA 1 — Definizione di riciclaggio e di finanziamento del terrorismo (Art. 2, D.Lgs. 231/2007)
          </Text>
          <Text style={styles.noteText}>
            Ai fini del D.Lgs. 231/2007 s&apos;intende per riciclaggio: a) la conversione o il trasferimento di beni, effettuati essendo a conoscenza che essi provengono da un&apos;attività criminosa o da una partecipazione a tale attività, allo scopo di occultare o dissimulare l&apos;origine illecita dei beni medesimi o di aiutare chiunque sia coinvolto in tale attività a sottrarsi alle conseguenze giuridiche delle proprie azioni; b) l&apos;occultamento o la dissimulazione della reale natura, provenienza, ubicazione, disposizione, movimento, proprietà dei beni o dei diritti sugli stessi, effettuati essendo a conoscenza che tali beni provengono da un&apos;attività criminosa; c) l&apos;acquisto, la detenzione o l&apos;utilizzazione di beni essendo a conoscenza, al momento della loro ricezione, che tali beni provengono da un&apos;attività criminosa; d) la partecipazione a uno degli atti di cui alle lettere precedenti. Il riciclaggio è considerato tale anche se le attività che hanno generato i beni da riciclare si sono svolte fuori dai confini nazionali. Per finanziamento del terrorismo si intende qualsiasi attività diretta, con ogni mezzo, alla fornitura, alla raccolta, alla provvista, all&apos;intermediazione, al deposito, alla custodia o all&apos;erogazione di fondi e risorse economiche, in qualunque modo realizzata, destinati ad essere, direttamente o indirettamente, in tutto o in parte, utilizzati per il compimento di una o più condotte con finalità di terrorismo.
          </Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteHeading}>
            NOTA 2 — Obblighi del cliente (Art. 22) e Sanzioni penali (Art. 55, co. 3, D.Lgs. 231/2007)
          </Text>
          <Text style={styles.noteText}>
            <Text style={styles.bold}>Art. 22, co. 1 e 2, D.Lgs. 231/2007:</Text> I clienti forniscono per iscritto, sotto la propria responsabilità, tutte le informazioni necessarie e aggiornate per consentire ai soggetti obbligati di adempiere agli obblighi di adeguata verifica. Ai fini dell&apos;identificazione del titolare effettivo, i clienti forniscono per iscritto tutte le informazioni necessarie e aggiornate delle quali siano a conoscenza.
          </Text>
          <Text style={styles.noteText}>
            <Text style={styles.bold}>Art. 55, co. 3, D.Lgs. 231/2007 (Sanzioni penali):</Text> Salvo che il fatto costituisca più grave reato, chiunque, essendo obbligato ai sensi del presente decreto a fornire i dati e le informazioni necessarie ai fini dell&apos;adeguata verifica della clientela, fornisce dati falsi o informazioni non veritiere, è punito con la <Text style={styles.bold}>reclusione da sei mesi a tre anni e con la multa da 10.000 euro a 30.000 euro</Text>.
          </Text>
          <Text style={styles.noteText}>
            <Text style={styles.bold}>Art. 42, D.Lgs. 231/2007 (Obbligo di astensione):</Text> I soggetti obbligati che si trovano nell&apos;impossibilità oggettiva di effettuare l&apos;adeguata verifica della clientela secondo le modalità stabilite dall&apos;art. 19 si astengono dall&apos;instaurare, eseguire ovvero proseguire il rapporto continuativo o la prestazione professionale e valutano se effettuare una segnalazione di operazione sospetta (SOS) alla UIF.
          </Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteHeading}>
            NOTA 3 — Persone Politicamente Esposte — PPE (Art. 1, co. 2, lett. dd, D.Lgs. 231/2007)
          </Text>
          <Text style={styles.noteText}>
            Sono Persone Politicamente Esposte (PPE) le persone fisiche che occupano o hanno cessato di occupare da meno di un anno importanti cariche pubbliche, nonché i loro familiari diretti (genitori, coniuge o parificato, figli e loro coniugi) e coloro che con i predetti soggetti intrattengono notoriamente stretti legami (titolarità effettiva congiunta di enti giuridici o qualsiasi altro stretto rapporto d&apos;affari). Rientrano tra le cariche pubbliche: Presidente della Repubblica, Presidente del Consiglio, Ministri, Vice-Ministri e Sottosegretari, Presidente e componenti della Giunta Regionale, Sindaci di capoluoghi di provincia o città metropolitane o di comuni con popolazione non inferiore a 15.000 abitanti, Parlamentari nazionali ed europei, membri degli organi direttivi di partiti politici, magistrati delle corti supreme, dirigenti di imprese partecipate dallo Stato o da enti locali.
          </Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteHeading}>
            NOTA 4 — Criteri per la determinazione della Titolarità Effettiva (Art. 20, D.Lgs. 231/2007)
          </Text>
          <Text style={styles.noteText}>
            1. Il titolare effettivo di clienti diversi dalle persone fisiche coincide con la persona fisica o le persone fisiche cui, in ultima istanza, è attribuibile la proprietà diretta o indiretta dell&apos;ente ovvero il relativo controllo.
          </Text>
          <Text style={styles.noteText}>
            2. Nel caso in cui il cliente sia una società di capitali: a) costituisce indicazione di proprietà diretta la titolarità di una partecipazione superiore al 25 per cento del capitale del cliente, detenuta da una persona fisica; b) costituisce indicazione di proprietà indiretta la titolarità di una percentuale di partecipazioni superiore al 25 per cento del capitale del cliente, posseduto per il tramite di società controllate, società fiduciarie o per interposta persona.
          </Text>
          <Text style={styles.noteText}>
            3. Nelle ipotesi in cui l&apos;esame dell&apos;assetto proprietario non consenta di individuare in maniera univoca la persona fisica o le persone fisiche cui è attribuibile la proprietà diretta o indiretta dell&apos;ente, il titolare effettivo coincide con la persona fisica o le persone fisiche cui, in ultima istanza, è attribuibile il controllo del medesimo in forza: a) del controllo della maggioranza dei voti esercitabili in assemblea ordinaria; b) del controllo di voti sufficienti per esercitare un&apos;influenza dominante in assemblea ordinaria; c) dell&apos;esistenza di particolari vincoli contrattuali.
          </Text>
          <Text style={styles.noteText}>
            5. Qualora l&apos;applicazione dei criteri di cui ai precedenti commi non consenta di individuare univocamente uno o più titolari effettivi, il titolare effettivo coincide con la persona fisica o le persone fisiche titolari, conformemente ai rispettivi assetti organizzativi o statutari, di poteri di rappresentanza legale, amministrazione o direzione della società o del cliente comunque diverso dalla persona fisica.
          </Text>
        </View>

        <Text style={[styles.paragraph, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>
          Il/La sottoscritto/a {rapprNome}, nella qualità sopra indicata per {azienda.ragioneSociale}, dichiara di aver ricevuto copia e di aver preso integrale visione delle Note 1, 2, 3 e 4 sopra riportate.
        </Text>

        {/* SECONDA FIRMA DEL CLIENTE PER RICEVUTA E PRESA VISIONE DELLE NOTE */}
        <View style={styles.signatureGrid}>
          <View style={styles.signatureBox}>
            <Text style={styles.label}>Luogo e Data</Text>
            <Text style={[styles.value, { marginTop: 4 }]}>
              {emittente?.comune || 'Reggio Emilia'}, lì {oggi}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              Firma del Cliente per ricevuta e presa visione delle Note 1-4
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Modello AV.4 CNDCEC (Marzo 2026) — Allegato Note Normative 1, 2, 3 e 4 — {studioDenominazione} — Pag. 2/2
        </Text>
      </Page>
    </Document>
  )

  return await renderToBuffer(doc)
}
