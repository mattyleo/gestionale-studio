// src/lib/pdf/antiriciclaggio-mandato-pdf.tsx
// LETTERA D'INCARICO PROFESSIONALE AUTOCOMPILATA DAL BOT (Amministrazione Personale/Paghe, Contabilità/Bilanci, Consulenza)
// Conforme al modello ufficiale dello Studio Dott. Antonio Tuzio (Via Umberto Poli 9/B - 42123 Reggio Emilia)
// Include:
// 1. Conferimento Mandato + IBAN Studio + Oggetto dell'Incarico + Compenso RF19 + Durata + Obblighi + Clausola Antiriciclaggio D.Lgs. 231/2007 + Foro CCIAA RE + Delega Cassetto Fiscale/LUL
// 2. Policy Privacy GDPR (Art. 13-21 Reg. UE 679/2016) con espressione di consenso e firme
// 3. Autorizzazione alla Trasmissione Telematica dei Modelli di Versamento F24 + Allegato Tariffario di Studio & Inquadramento AML

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import { calcolaZonaERischioBot } from '@/lib/antiriciclaggio-engine'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 9.5,
    color: '#111827',
    paddingTop: 32,
    paddingBottom: 68,
    paddingHorizontal: 42,
    lineHeight: 1.38,
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  italic: {
    fontFamily: 'Times-Italic',
  },
  docTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11.5,
    textAlign: 'left',
    textTransform: 'uppercase',
    marginBottom: 10,
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 4,
  },
  sectionHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  paragraph: {
    fontSize: 9.5,
    textAlign: 'justify',
    marginBottom: 5,
  },
  smallParagraph: {
    fontSize: 8.3,
    textAlign: 'justify',
    marginBottom: 4,
    lineHeight: 1.3,
  },
  fieldBlock: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 0.7,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  fieldLabel: {
    width: '32%',
    fontSize: 9,
    color: '#334155',
  },
  fieldValue: {
    width: '68%',
    fontSize: 9.5,
    fontFamily: 'Times-Bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#94a3b8',
    paddingBottom: 1,
  },
  conferisceTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 6,
    letterSpacing: 1,
  },
  listItem: {
    fontSize: 9.3,
    marginLeft: 10,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
    marginVertical: 6,
  },
  signatureBlock: {
    marginTop: 10,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureCol: {
    width: '46%',
  },
  signatureLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#111827',
    marginTop: 22,
    marginBottom: 3,
  },
  tariffBox: {
    marginTop: 6,
    padding: 8,
    borderWidth: 0.8,
    borderColor: '#94a3b8',
    backgroundColor: '#fafafa',
    borderRadius: 3,
  },
  amlBox: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
    borderRadius: 3,
  },
  studioFooter: {
    position: 'absolute',
    bottom: 16,
    left: 42,
    right: 42,
    textAlign: 'center',
    fontSize: 7.8,
    color: '#334155',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
    lineHeight: 1.25,
  },
  studioFooterLink: {
    color: '#1d4ed8',
  },
})

function StudioFooter() {
  return (
    <View style={styles.studioFooter} fixed>
      <Text style={styles.bold}>Tuzio Antonio — Dottore Commercialista</Text>
      <Text>Via Umberto Poli 9/B — 42123 Reggio Emilia (RE)</Text>
      <Text style={styles.studioFooterLink}>info@studiotuzio.it · studiotuzio@legalmail.it</Text>
      <Text>telefono 0522331628 · cell studio 3286781837</Text>
    </View>
  )
}

export async function generaLetteraIncaricoMandatoPDF(
  azienda: any,
  emittente: any,
  varianteRichiesta?: string
): Promise<Buffer> {
  const bot = calcolaZonaERischioBot(azienda)
  const oggi = new Date().toLocaleDateString('it-IT')

  const ragSoc = azienda.ragioneSociale || '____________________________________'
  const ragSocUp = ragSoc.toUpperCase()
  const isSocieta =
    azienda.tipoSoggetto === 'PERSONA_GIURIDICA' ||
    /\b(SRL|S\.R\.L|SPA|S\.P\.A|SNC|S\.N\.C|SAS|S\.A\.S|COOP|CONSORZIO|SOCIETA)\b/.test(ragSocUp)

  // Sottoscrittore (Amministratore / Titolare)
  const rapprCompleto =
    azienda.legaleRappresentante ||
    azienda.referente ||
    (!isSocieta ? azienda.ragioneSociale : '____________________________________')

  const cfRappr =
    azienda.cfRappresentante ||
    (!isSocieta ? azienda.codiceFiscale || '________________________' : '________________________')

  const comuneSede = azienda.comune || 'Reggio Emilia'
  const provSede = azienda.provincia || 'RE'
  const capSede = azienda.cap || '42121'
  const viaSede = azienda.indirizzo || '____________________________________'
  const cfAzienda = azienda.codiceFiscale || azienda.partitaIva || '________________________'
  const pivaAzienda = azienda.partitaIva || '________________________'
  const pecAzienda = azienda.pec || azienda.emailAmministrativa || '____________________________________'
  const ibanCliente = azienda.iban || '______________________________________________________'

  // Determina la variante del mandato (PAGHE, CONTABILITA, CONSULENZA/FORFETTARI)
  const settore = (varianteRichiesta || azienda.settoreAttivita || 'PAGHE').toUpperCase()
  const isContabilita =
    settore === 'CONTABILITA' ||
    (bot.zona === 'ZONA_3' && !azienda.antiriciclaggioPrestazione?.toLowerCase().includes('verbale ispettivo'))
  const isForfettario = settore === 'FORFETTARI' || settore === 'CONSULENZA'

  const titoloLettera = isContabilita
    ? "LETTERA D'INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ, BILANCI E CONSULENZA FISCALE"
    : isForfettario
    ? "LETTERA D'INCARICO PROFESSIONALE PER CONSULENZA FISCALE E DICHIARAZIONE DEI REDDITI"
    : "LETTERA D'INCARICO AMMINISTRAZIONE DEL PERSONALE DIPENDENTE E CONSULENZA DEL LAVORO"

  const attivitaEsercitata = isContabilita
    ? 'Attività commerciale / societaria (Contabilità e Bilanci)'
    : isForfettario
    ? 'Impresa individuale / Attività professionale (Regime Forfettario / Redditi)'
    : 'Impresa con personale dipendente (Amministrazione del Personale / LUL)'

  // Dati Studio (con fallback esatti della Lettera d'Incarico del Dott. Tuzio Antonio)
  const ibanStudio = emittente?.iban || 'IT 89E 03032 12804 0100 00063104'

  const doc = (
    <Document title={`Lettera_Incarico_Mandato_${azienda.ragioneSociale}`}>
      {/* ==================== PAGINA 1: CONFERIMENTO INCARICO, OGGETTO, COMPENSO, DURATA, OBBLIGHI ==================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.docTitle}>{titoloLettera}</Text>

        {/* Blocco Sottoscrittore e Azienda */}
        <View style={styles.fieldBlock}>
          <Text style={[styles.bold, { fontSize: 9.5, marginBottom: 4 }]}>IL SOTTOSCRITTO:</Text>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Cognome e Nome:</Text>
            <Text style={styles.fieldValue}>{rapprCompleto}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Codice Fiscale:</Text>
            <Text style={styles.fieldValue}>{cfRappr}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Residente / Domiciliato in:</Text>
            <Text style={styles.fieldValue}>
              {viaSede} — {capSede} {comuneSede} ({provSede})
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Documento d&apos;Identità:</Text>
            <Text style={styles.fieldValue}>
              {azienda.documentoNumero
                ? `${azienda.documentoTipo || 'C.I.'} n. ${azienda.documentoNumero} (Scad. ${
                    azienda.documentoScadenza ? new Date(azienda.documentoScadenza).toLocaleDateString('it-IT') : '____/____/____'
                  })`
                : '____________________________________________________'}
            </Text>
          </View>

          <Text style={[styles.italic, { fontSize: 8.8, marginVertical: 4 }]}>
            {isSocieta
              ? '[X] In qualità di Amministratore / Legale Rappresentante della Società   [ ] Oppure Titolare della impresa individuale'
              : '[ ] In qualità di Amministratore / Legale Rappresentante della Società   [X] Oppure Titolare della impresa individuale'}
          </Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Denominata (Ragione Sociale):</Text>
            <Text style={styles.fieldValue}>{ragSoc}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Con sede legale in (Via e Città):</Text>
            <Text style={styles.fieldValue}>
              {viaSede} — {capSede} {comuneSede} ({provSede})
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Codice Fiscale / Partita IVA:</Text>
            <Text style={styles.fieldValue}>
              C.F. {cfAzienda} — P.IVA {pivaAzienda}
            </Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>PEC / Email:</Text>
            <Text style={styles.fieldValue}>{pecAzienda}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Esercente attività:</Text>
            <Text style={styles.fieldValue}>{attivitaEsercitata}</Text>
          </View>
          <Text style={{ fontSize: 8.5, marginTop: 2 }}>Denominato in seguito come &quot;Cliente&quot;</Text>
        </View>

        <Text style={styles.conferisceTitle}>CONFERISCE</Text>

        <Text style={styles.paragraph}>
          al <Text style={styles.bold}>Dott. TUZIO ANTONIO</Text>, codice fiscale{' '}
          <Text style={styles.bold}>TZUNTN69A16D612E</Text>, iscritto all&apos;Ordine dei Dottori Commercialisti della
          provincia di REGGIO NELL&apos;EMILIA, con numero di iscrizione <Text style={styles.bold}>742/A</Text>,
          residente in Viale Risorgimento 70 - 42123 Reggio Emilia (RE), con studio in{' '}
          <Text style={styles.bold}>Via Umberto Poli 9/B - 42123 Reggio Emilia (RE)</Text>, il seguente incarico
          professionale, disciplinato dai seguenti articoli ed accettato dal Professionista mediante sottoscrizione
          della presente lettera di incarico. Denominato in seguito come &quot;Professionista&quot;.
        </Text>
        <Text style={styles.paragraph}>
          Il pagamento delle prestazioni indicate al presente documento dovrà essere eseguito con modalità tracciabile
          (ai sensi della normativa Antiriciclaggio D.Lgs. 231/2007). Si indica l&apos;IBAN di studio:{' '}
          <Text style={styles.bold}>{ibanStudio}</Text>
        </Text>

        <View style={styles.divider} />

        {/* ART. 1 — OGGETTO DEL MANDATO */}
        <Text style={styles.sectionHeading}>1. OGGETTO DEL MANDATO</Text>
        {isContabilita ? (
          <View>
            <Text style={styles.paragraph}>
              L&apos;incarico ha come oggetto le prestazioni di tenuta della contabilità, redazione dei bilanci,
              consulenza continuativa in materia fiscale, tributaria e societaria, nonché l&apos;invio telematico delle
              dichiarazioni fiscali. In particolare, l&apos;incarico include:
            </Text>
            <Text style={styles.listItem}>1. Tenuta delle scritture contabili obbligatorie, registri IVA e libro giornale/inventari.</Text>
            <Text style={styles.listItem}>2. Elaborazione e invio telematico delle Liquidazioni Periodiche IVA (LIPE) e Dichiarazione IVA annuale.</Text>
            <Text style={styles.listItem}>3. Predisposizione del Bilancio d&apos;esercizio e relativo deposito presso il Registro delle Imprese (per SRL/Società di capitali).</Text>
            <Text style={styles.listItem}>4. Redazione e trasmissione telematica delle dichiarazioni dei redditi (Mod. Redditi, IRAP, ISA) e Modello 770.</Text>
            <Text style={styles.listItem}>5. Gestione delle pratiche telematiche presso Agenzia delle Entrate, CCIAA, INPS e INAIL.</Text>
          </View>
        ) : isForfettario ? (
          <View>
            <Text style={styles.paragraph}>
              L&apos;incarico ha come oggetto le prestazioni di assistenza fiscale, consulenza tributaria e redazione
              della dichiarazione annuale dei redditi per contribuenti in Regime Forfettario (L. 190/2014) o regime
              semplificato. In particolare, l&apos;incarico include:
            </Text>
            <Text style={styles.listItem}>1. Elaborazione e trasmissione telematica del Modello Redditi Persone Fisiche (Quadro LM / altri quadri).</Text>
            <Text style={styles.listItem}>2. Calcolo dell&apos;imposta sostitutiva e dei contributi previdenziali INPS (Gestione Artigiani/Commercianti o Gestione Separata).</Text>
            <Text style={styles.listItem}>3. Predisposizione e invio telematico delle deleghe di versamento F24 alle scadenze fiscali.</Text>
            <Text style={styles.listItem}>4. Verifica dei requisiti di permanenza nel regime agevolato e pratiche telematiche Agenzia delle Entrate / CCIAA.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.paragraph}>
              L&apos;incarico ha come oggetto le prestazioni di gestione delle paghe, elaborazione dei prospetti paga,
              invio telematico dei flussi retributivi, denunce assicurative e previdenziali, e consulenza in materia di
              diritto del lavoro. In particolare, l&apos;incarico include:
            </Text>
            <Text style={styles.listItem}>1. Elaborazione delle buste paga per i dipendenti e tenuta del Libro Unico del Lavoro (LUL).</Text>
            <Text style={styles.listItem}>2. Gestione delle pratiche di assunzione, variazione e cessazione del rapporto di lavoro.</Text>
            <Text style={styles.listItem}>3. Autoliquidazione annuale INAIL e denunce retributive.</Text>
            <Text style={styles.listItem}>4. Comunicazioni obbligatorie telematiche (Unilav, UniEmens INPS, INAIL, Cassa Edile ove prevista).</Text>
            <Text style={styles.listItem}>5. Elaborazione delle Certificazioni Uniche (CU) e del Modello 770.</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ART. 2 — COMPENSO */}
        <Text style={styles.sectionHeading}>2. COMPENSO</Text>
        <Text style={styles.paragraph}>
          Per lo svolgimento delle prestazioni oggetto del suddetto incarico, le parti concordano che al Professionista
          spetteranno i compensi previsti nel tariffario allegato alla presente lettera di incarico.
        </Text>
        <Text style={styles.paragraph}>
          Il Professionista emetterà parcella con cadenza trimestrale in regime Forfetario RF19 (senza applicazione
          dell&apos;IVA ai sensi dell&apos;art. 1 co. 54-89, della legge n. 190/2014). I compensi pattuiti si intendono
          comprensivi del contributo integrativo previdenziale (attualmente nella misura del 4%). Il pagamento dovrà
          essere effettuato entro il 10° giorno successivo al ricevimento della fattura o preavviso di parcella.
        </Text>

        <StudioFooter />
      </Page>

      {/* ==================== PAGINA 2: DURATA, OBBLIGHI, ANTIRICICLAGGIO, FORO, DELEGA LUL, PRIVACY ==================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>3. DURATA DELL&apos;INCARICO</Text>
        <Text style={styles.paragraph}>
          L&apos;incarico decorre dalla data di sottoscrizione e si intende valido in forma continuativa, con rinnovo
          tacito annuale automatico, salvo comunicazione di recesso da una delle parti. Recesso: ciascuna parte può
          recedere con preavviso di 90 giorni, da comunicare tramite PEC o lettera raccomandata AR.
        </Text>

        <Text style={styles.sectionHeading}>4. OBBLIGHI DEL PROFESSIONISTA</Text>
        <Text style={styles.paragraph}>
          Il Professionista si impegna a prestare il proprio servizio utilizzando la diligenza richiesta dalla natura
          dell&apos;attività esercitata, dalla legge e dalle norme deontologiche professionali, rispettando il segreto
          professionale.
        </Text>

        <Text style={styles.sectionHeading}>
          5. OBBLIGHI DEL CLIENTE E ADEMPIMENTI ANTIRICICLAGGIO (D.LGS. 231/2007)
        </Text>
        <Text style={styles.paragraph}>
          Il Cliente si impegna a fornire tempestivamente la documentazione necessaria per l&apos;espletamento
          dell&apos;incarico, garantendone la completezza, l&apos;esattezza e l&apos;autenticità. Si obbliga a
          collaborare fattivamente per il buon esito delle attività previste dall&apos;incarico e a comunicare
          tempestivamente eventuali variazioni rilevanti per l&apos;incarico.
        </Text>
        <Text style={styles.paragraph}>
          Ai sensi del <Text style={styles.bold}>D.Lgs. 231/2007</Text> e delle Regole Tecniche CNDCEC, il Cliente
          prende atto che il Professionista è tenuto agli obblighi antiriciclaggio (adeguata verifica della clientela ove
          prevista dall&apos;art. 17, identificazione del Titolare Effettivo ex art. 20, conservazione decennale del
          fascicolo ex art. 31, obbligo di astensione ex art. 42 e Segnalazione di Operazioni Sospette alla UIF ex art.
          35) e dichiara sotto la propria responsabilità (art. 22 e art. 55 co. 3 D.Lgs. 231/2007) che il Titolare
          Effettivo è{' '}
          <Text style={styles.bold}>
            {azienda.antiriciclaggioTitolareEffettivo || rapprCompleto}
          </Text>{' '}
          e di {azienda.antiriciclaggioPep ? 'rivestire' : 'NON rivestire'} la qualifica di Persona Politicamente
          Esposta (PPE).
        </Text>

        <Text style={styles.sectionHeading}>6. FORO COMPETENTE E RINVIO</Text>
        <Text style={styles.paragraph}>
          Qualsiasi controversia dovesse insorgere in relazione al presente contratto, sarà sottoposta a Procedura di
          Mediazione da parte dell&apos;Organismo di Mediazione della C.C.I.A.A. di Reggio Emilia — Servizio di
          Conciliazione della CCIAA di Reggio Emilia – Giustizia.alternativa@re.camcom.it – cciaa@re.legalmail.it
          Piazza della Vittoria 3 Reggio Emilia.
        </Text>

        <Text style={styles.sectionHeading}>
          7. DELEGA AL CASSETTO FISCALE, PREVIDENZIALE, INAIL E TENUTA DEL LIBRO UNICO DEL LAVORO
        </Text>
        <Text style={styles.paragraph}>
          Il Cliente, con la sottoscrizione del presente incarico, autorizza il Professionista ad accedere ai sistemi
          informatici dell&apos;Agenzia delle Entrate, INPS e INAIL per la gestione delle pratiche fiscali,
          previdenziali e assicurative. Il Professionista è altresì autorizzato alla tenuta del Libro Unico del Lavoro
          (LUL), delle scritture contabili e alla conservazione della documentazione relativa.
        </Text>

        <View style={styles.divider} />

        {/* POLICY PRIVACY GDPR */}
        <Text style={[styles.sectionHeading, { textAlign: 'center', fontSize: 10.5 }]}>
          INFORMAZIONI DI CARATTERE GENERALE: POLICY PRIVACY (REG. UE 679/2016 - GDPR)
        </Text>
        <Text style={styles.smallParagraph}>
          Si informano gli interessati dei seguenti profili generali, validi per tutti gli ambiti del trattamento: tutti
          i dati sono trattati in modo lecito, corretto e trasparente nei confronti dell&apos;interessato, nel rispetto
          dei principi generali previsti dall&apos;Art. 5 del GDPR; specifiche misure di sicurezza sono osservate per
          prevenire la perdita dei dati, usi illeciti, o non corretti ed accessi non autorizzati.
        </Text>
        <Text style={styles.smallParagraph}>
          <Text style={styles.bold}>Riferimenti e diritti degli interessati (Artt. 15-21 GDPR): </Text>
          Il Titolare del Trattamento è lo scrivente studio, in persona del legale rappresentante pro-tempore, al quale
          è possibile rivolgersi per esercitare tutti i diritti previsti dagli artt. 15-21 del GDPR (accesso, rettifica,
          cancellazione, limitazione, portabilità, opposizione), nonché revocare un consenso precedentemente accordato
          o proporre reclamo al Garante per la protezione dei dati personali (Art. 13, co. 2, lett. d).{' '}
          <Text style={styles.bold}>
            Dati di contatto del Titolare: Tuzio Antonio – Via Umberto Poli 9/b – 42123 Reggio Emilia – Tel: 0522 331628
            – Email: studiotuzio@gmail.com – Pec: studiotuzio@legalmail.it
          </Text>
        </Text>
        <Text style={styles.smallParagraph}>
          <Text style={styles.bold}>Oggetto, Finalità e Base Giuridica (Art. 6, co. 1, lett. b, c, f GDPR): </Text>
          Lo studio tratta dati personali identificativi, anagrafici, fiscali, contabili, retributivi e bancari di
          clienti, dipendenti e referenti operativi per: concludere ed eseguire rapporti contrattuali/professionali;
          adempiere agli obblighi precontrattuali, contrattuali, fiscali, previdenziali e antiriciclaggio (D.Lgs.
          231/2007) derivanti dai rapporti in essere; esercitare un legittimo interesse del Titolare. Il trattamento è
          realizzato con modalità manuali, informatiche e telematiche per il tempo necessario ad adempiere alle finalità
          contrattuali e agli obblighi di legge (10 anni ex art. 2220 c.c. e art. 31 D.Lgs. 231/2007).
        </Text>
        <Text style={styles.smallParagraph}>
          <Text style={styles.bold}>Espressione di consenso (Art. 7 Regolamento UE n. 679/2016): </Text>
          Preso atto di quanto indicato nella presente informativa, e dichiarando di averne ricevuto copia:{'\n'}
          [X] <Text style={styles.bold}>Autorizzo</Text>   [ ] Non autorizzo in modo esplicito il trattamento dei miei dati personali, inclusi quelli particolari, per l&apos;esecuzione dell&apos;incarico e dei processi di valutazione.{'\n'}
          [X] <Text style={styles.bold}>Autorizzo</Text>   [ ] Non autorizzo la comunicazione dei miei dati limitatamente agli ambiti ed organi specificati nell&apos;informativa.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Letto, approvato e sottoscritto (Mandato e Privacy)</Text>
            <Text style={[styles.bold, { fontSize: 9, marginTop: 4 }]}>
              REGGIO NELL&apos;EMILIA, lì {oggi}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma del Professionista (TUZIO ANTONIO)</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Per accettazione Mandato, Delega LUL e Consenso Privacy:</Text>
            <Text style={[styles.bold, { fontSize: 9, marginTop: 4 }]}>Il Cliente: {ragSoc.slice(0, 34)}</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>
              Firma dell&apos;Interessato / Cliente ({rapprCompleto})
            </Text>
          </View>
        </View>

        <StudioFooter />
      </Page>

      {/* ==================== PAGINA 3: DELEGA TELEMATICA F24 + ALLEGATO TARIFFARIO + INQUADRAMENTO AML ==================== */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeading}>
          AUTORIZZAZIONE ALLA TRASMISSIONE TELEMATICA DEI MODELLI DI VERSAMENTO F24
        </Text>
        <Text style={styles.paragraph}>
          Il Cliente (<Text style={styles.bold}>{ragSoc}</Text>, C.F./P.IVA <Text style={styles.bold}>{pivaAzienda}</Text>)
          autorizza il Professionista <Text style={styles.bold}>Dott. TUZIO ANTONIO</Text>, in qualità di professionista
          abilitato intermediario Entratel, a trasmettere telematicamente i modelli di versamento F24 relativi alle
          imposte, contributi e tasse, utilizzando il conto corrente bancario o postale indicato dal Cliente:
        </Text>
        <View style={[styles.fieldBlock, { marginVertical: 4 }]}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>IBAN del Cliente per addebito F24:</Text>
            <Text style={styles.fieldValue}>{ibanCliente}</Text>
          </View>
        </View>
        <Text style={styles.paragraph}>
          Il professionista si impegna a presentare al cliente le singole elaborazioni periodiche mettendolo al corrente
          automaticamente degli obblighi di pagamento e delle scadenze relative. Nell&apos;eventualità in cui il cliente
          richieda anche verbalmente al professionista di sospendere il pagamento telematico di una delega o più
          deleghe, il professionista si limiterà ad astenersi dall&apos;invio e sarà esonerato da qualsiasi
          responsabilità per omesso o ritardato versamento. Nel caso di richiesta successiva da parte del cliente di
          pagamento con ravvedimento operoso di importi in precedenza sospesi, sarà cura del cliente provvedere ad
          avvertire per iscritto con qualsiasi mezzo il professionista sulle modalità di invio degli importi omessi,
          quando possibile il ravvedimento.
        </Text>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Letto, approvato e sottoscritto — REGGIO NELL&apos;EMILIA, lì {oggi}</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma TUZIO ANTONIO</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Autorizzazione addebito F24:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma Cliente ({rapprCompleto})</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ALLEGATO: TARIFFARIO DI STUDIO */}
        <View style={styles.tariffBox}>
          <Text style={[styles.bold, { fontSize: 10, marginBottom: 4, color: '#0f172a' }]}>
            ALLEGATO 1: TARIFFARIO DI STUDIO PER LA GESTIONE DELLE PAGHE E ADEMPIMENTI
          </Text>

          <Text style={[styles.bold, { fontSize: 9, marginTop: 2 }]}>1. Parte Calcolata ad Ogni Singola Busta Paga</Text>
          <Text style={styles.listItem}>• Buste paga edilizia (1 busta a dipendente – costo mensile): € 35,00</Text>
          <Text style={styles.listItem}>• Buste paga ditte (1-20 dipendenti, 1 busta a dipendente costo mensile): € 25,00</Text>
          <Text style={styles.listItem}>• Buste paga ditte (21-30 dipendenti, 1 busta a dipendente costo mensile): € 20,00</Text>

          <Text style={[styles.bold, { fontSize: 9, marginTop: 4 }]}>2. Parte Calcolata a Pratica</Text>
          <Text style={styles.listItem}>• Pratiche di assunzione: € 60,00</Text>
          <Text style={styles.listItem}>• Pratica cessazione ditta edile: € 60,00  |  Pratica cessazione ditta ordinaria: € 35,00</Text>
          <Text style={styles.listItem}>• Autoliquidazione INAIL: € 50,00  |  Pratiche variazioni INAIL/Unilav/INPS: € 25,00</Text>
          <Text style={styles.listItem}>• Pratica Modello 770 (ditte non forfettarie): € 60,00  |  Budget costo del personale: € 60,00</Text>

          <Text style={[styles.bold, { fontSize: 9, marginTop: 4 }]}>
            3. Parte Calcolata a Domanda (su richiesta specifica di singoli dipendenti dell&apos;azienda cliente)
          </Text>
          <Text style={styles.listItem}>• Congedi parentali: € 60,00  |  Domanda di maternità: € 60,00  |  Naspi (domanda): € 60,00</Text>

          {(isContabilita || isForfettario) && (
            <View style={{ marginTop: 4, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: '#cbd5e1' }}>
              <Text style={[styles.bold, { fontSize: 9 }]}>
                4. Prestazioni Contabili, Fiscali e Societarie (come da accordo specifico con il Cliente)
              </Text>
              <Text style={styles.listItem}>
                • {azienda.antiriciclaggioPrestazione || bot.zonaLabel}: compenso annuo/trimestrale concordato secondo complessità e volume d&apos;affari.
              </Text>
            </View>
          )}
        </View>

        {/* ALLEGATO 2: ATTESTAZIONE DI INQUADRAMENTO ANTIRICICLAGGIO DEL MANDATO (D.LGS. 231/2007) */}
        <View style={styles.amlBox}>
          <Text style={[styles.bold, { fontSize: 9.5, color: '#1e3a8a', marginBottom: 2 }]}>
            ALLEGATO 2: INQUADRAMENTO ANTIRICICLAGGIO DEL PRESENTE MANDATO (D.LGS. 231/2007 — CNDCEC/CNOCDL)
          </Text>
          <Text style={{ fontSize: 8.5, color: '#1e293b' }}>
            • <Text style={styles.bold}>N° Fascicolo Studio:</Text> {azienda.antiriciclaggioFascicolo || 'ARC-2026'}   |   <Text style={styles.bold}>Qualificazione AML:</Text> {bot.zonaLabel}{'\n'}
            • <Text style={styles.bold}>Regime Applicato:</Text> {bot.motivoBot}
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Per approvazione Tariffario e Inquadramento:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma TUZIO ANTONIO</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Per accettazione espressa anche ex artt. 1341-1342 c.c.:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma Cliente ({rapprCompleto})</Text>
          </View>
        </View>

        <StudioFooter />
      </Page>
    </Document>
  )

  return await renderToBuffer(doc)
}
