// src/lib/pdf/antiriciclaggio-mandato-pdf.tsx
// I 3 MODELLI UFFICIALI DI LETTERA D'INCARICO DELLO STUDIO DOTT. ANTONIO TUZIO AUTOCOMPILATI DAL BOT:
// 1. Modello PAGHE: "LETTERA D'INCARICO AMMINISTRAZIONE DEL PERSONALE DIPENDENTE" (con Tariffario Paghe, Delega LUL, Privacy GDPR, Delega F24 e Clausola Antiriciclaggio)
// 2. Modello CONTABILITA: "LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA" (con Punti 1.1 Scritture, 1.2 Bilancio artt. 2423-2428 c.c., 1.3 Dichiarazioni, Clausola non domiciliazione, Compensi € 873,60 x 3 = € 2.620,80, Polizza LLOYD'S Insurance Company, Delega Uni-riscossioni/LUL, Privacy, Delega F24 e Clausola Antiriciclaggio)
// 3. Modello FORFETTARI: "LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO" (con Compensi € 90 apertura P.IVA, € 420 annuale, € 90 INAIL, recesso entro 31 ottobre, Polizza LLOYD'S Insurance Company, Privacy GDPR, Delega F24 Unificato + Informativa F24 Telematico Entratel e Clausola Antiriciclaggio)

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
    fontSize: 9.3,
    color: '#111827',
    paddingTop: 30,
    paddingBottom: 64,
    paddingHorizontal: 40,
    lineHeight: 1.36,
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  italic: {
    fontFamily: 'Times-Italic',
  },
  docTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a8a',
    paddingBottom: 4,
  },
  docSubtitle: {
    fontFamily: 'Times-Bold',
    fontSize: 9.8,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 8,
    color: '#1e3a8a',
  },
  sectionHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 9.8,
    marginTop: 7,
    marginBottom: 3.5,
    color: '#0f172a',
  },
  subHeading: {
    fontFamily: 'Times-Bold',
    fontSize: 9.3,
    marginTop: 4,
    marginBottom: 2,
    color: '#1e293b',
  },
  paragraph: {
    fontSize: 9.2,
    textAlign: 'justify',
    marginBottom: 4.5,
  },
  smallParagraph: {
    fontSize: 8.2,
    textAlign: 'justify',
    marginBottom: 3.5,
    lineHeight: 1.28,
  },
  fieldBlock: {
    marginBottom: 7,
    padding: 7,
    backgroundColor: '#f8fafc',
    borderWidth: 0.7,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  fieldLabel: {
    width: '33%',
    fontSize: 8.8,
    color: '#334155',
  },
  fieldValue: {
    width: '67%',
    fontSize: 9.2,
    fontFamily: 'Times-Bold',
    borderBottomWidth: 0.5,
    borderBottomColor: '#94a3b8',
    paddingBottom: 1,
  },
  conferisceTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    textAlign: 'center',
    marginVertical: 5,
    letterSpacing: 0.8,
  },
  listItem: {
    fontSize: 9,
    marginLeft: 10,
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
    marginVertical: 5,
  },
  signatureBlock: {
    marginTop: 8,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureCol: {
    width: '46%',
  },
  signatureLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#111827',
    marginTop: 20,
    marginBottom: 2.5,
  },
  tariffBox: {
    marginTop: 5,
    padding: 7,
    borderWidth: 0.8,
    borderColor: '#94a3b8',
    backgroundColor: '#fafafa',
    borderRadius: 3,
  },
  amlBox: {
    marginTop: 6,
    padding: 7,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
    borderRadius: 3,
  },
  studioFooter: {
    position: 'absolute',
    bottom: 14,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7.5,
    color: '#334155',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 3.5,
    lineHeight: 1.22,
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
      <Text style={styles.studioFooterLink}>
        info@studiotuzio.it · postmaster@studiotuzio.it · studiotuzio@legalmail.it
      </Text>
      <Text>telefono 0522331628 · cell studio 3286781837</Text>
    </View>
  )
}

function PrivacyF24Pages({
  ragSoc,
  rapprCompleto,
  cfRappr,
  luogoNascita,
  dataNascita,
  viaSede,
  capSede,
  comuneSede,
  provSede,
  pivaAzienda,
  ibanCliente,
  isSocieta,
  oggi,
  includiInformativaEntratel,
}: {
  ragSoc: string
  rapprCompleto: string
  cfRappr: string
  luogoNascita: string
  dataNascita: string
  viaSede: string
  capSede: string
  comuneSede: string
  provSede: string
  pivaAzienda: string
  ibanCliente: string
  isSocieta: boolean
  oggi: string
  includiInformativaEntratel?: boolean
}) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={[styles.sectionHeading, { textAlign: 'center', fontSize: 10.2 }]}>
        INFORMAZIONI DI CARATTERE GENERALE: POLICY PRIVACY (AI SENSI DEL REG. UE 2016/679 - GDPR)
      </Text>
      <Text style={styles.smallParagraph}>
        Si informano gli interessati dei seguenti profili generali, validi per tutti gli ambiti del trattamento: tutti
        i dati sono trattati in modo lecito, corretto e trasparente nei confronti dell&apos;interessato, nel rispetto
        dei principi generali previsti dall&apos;Art. 5 del GDPR; specifiche misure di sicurezza sono osservate per
        prevenire la perdita dei dati, usi illeciti, o non corretti ed accessi non autorizzati.
      </Text>
      <Text style={styles.smallParagraph}>
        <Text style={styles.bold}>Riferimenti e diritti degli interessati: </Text>
        Il Titolare del Trattamento è lo scrivente studio, in persona del legale rappresentante pro-tempore, al quale è
        possibile rivolgersi per esercitare tutti i diritti previsti dagli artt. 15-21 del GDPR (diritto di accesso, di
        rettifica, di cancellazione, di limitazione, di portabilità, di opposizione), nonché revocare un consenso
        precedentemente accordato; in caso di mancato riscontro alle loro richieste gli interessati possono proporre un
        reclamo all&apos;Autorità di controllo per la protezione dei dati personali (GDPR - Art. 13, comma 2, lettera
        d).{' '}
        <Text style={styles.bold}>
          Dati di contatto del titolare del trattamento: Titolare: Tuzio Antonio – Via Umberto Poli 9/b – 42123 Reggio
          Emilia – Tel: 0522 331628 – Email: studiotuzio@gmail.com / postmaster@studiotuzio.it – Pec:
          studiotuzio@legalmail.it
        </Text>
      </Text>
      <Text style={styles.smallParagraph}>
        <Text style={styles.bold}>Oggetto, Finalità e base giuridica del trattamento: </Text>
        Lo studio tratta dati personali identificativi di clienti/fornitori (nome, cognome, ragione sociale, dati
        anagrafici/fiscali, indirizzo, telefono, e-mail, riferimenti bancari e di pagamento) e di suoi referenti
        operativi acquisiti ed utilizzati nell&apos;ambito dell&apos;erogazione dei servizi forniti per: concludere
        rapporti contrattuali/professionali; adempiere agli obblighi precontrattuali, contrattuali, fiscali e
        antiriciclaggio (D.Lgs. 231/2007) derivanti dai rapporti in essere; adempiere agli obblighi previsti dalla
        legge, da un regolamento, dalla normativa comunitaria o da un ordine dell&apos;Autorità; esercitare un
        legittimo interesse nonché un diritto del Titolare (Art. 6, commi b, c, f GDPR). Il trattamento è realizzato
        per mezzo di operazioni manuali/informatiche (sia cartaceo che elettronico) per il tempo necessario ad
        adempiere alle finalità e relativi obblighi di legge. I dati sono trattati da soggetti interni regolarmente
        autorizzati ed istruiti ai sensi dell&apos;Art. 29 del GDPR.
      </Text>
      <Text style={styles.smallParagraph}>
        <Text style={styles.bold}>Espressione di consenso art. 23 D.Lgs. 196/2003 e art. 7 Regolamento UE n. 679/2016: </Text>
        Preso atto di quanto indicato nella precedente informativa, e dichiarando di aver letto attentamente il
        contenuto dell&apos;informativa da Voi fornita, avendone ricevuto copia:{'\n'}
        [X] <Text style={styles.bold}>autorizzo</Text>   [ ] non autorizzo in modo esplicito il trattamento dei miei dati personali, in particolare quelli di tipo particolare, per l&apos;elaborazione di rapporti (&ldquo;reports&rdquo;) ai fini della formazione dei processi di valutazione.{'\n'}
        [X] <Text style={styles.bold}>Autorizzo</Text>   [ ] Non autorizzo la comunicazione dei miei dati limitatamente agli ambiti ed organi specificati nell&apos;informativa.{'\n'}
        <Text style={styles.italic}>
          NB: Il predetto consenso può essere revocato in qualsiasi momento, senza pregiudicare la liceità del
          trattamento effettuato prima della revoca stessa.
        </Text>
      </Text>

      <View style={styles.signatureBlock}>
        <View style={styles.signatureCol}>
          <Text style={{ fontSize: 8.8 }}>Reggio nell&apos;Emilia, lì {oggi}</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 8.2, textAlign: 'center' }}>
            Il Cliente / Firma dell&apos;Interessato ({rapprCompleto})
          </Text>
        </View>
        <View style={styles.signatureCol}>
          <Text style={{ fontSize: 8.8 }}>Per presa visione e accettazione:</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Il Professionista (Dott. TUZIO ANTONIO)</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* AUTORIZZAZIONE ALLA TRASMISSIONE TELEMATICA DEI MODELLI DI VERSAMENTO UNIFICATO F24 */}
      <Text style={styles.sectionHeading}>
        AUTORIZZAZIONE ALLA TRASMISSIONE TELEMATICA DEI MODELLI DI VERSAMENTO UNIFICATO F24
      </Text>
      <Text style={styles.smallParagraph}>
        Il sottoscritto <Text style={styles.bold}>{rapprCompleto}</Text>, nato a{' '}
        <Text style={styles.bold}>{luogoNascita}</Text> il <Text style={styles.bold}>{dataNascita}</Text>, C.F.{' '}
        <Text style={styles.bold}>{cfRappr}</Text> e residente/domiciliato in{' '}
        <Text style={styles.bold}>
          {comuneSede} ({provSede}) — {viaSede}
        </Text>
        , in qualità di {isSocieta ? `Rappresentante Legale di ${ragSoc}` : `Titolare di ${ragSoc}`} (P.IVA/C.F.{' '}
        {pivaAzienda}), <Text style={styles.bold}>AUTORIZZA</Text> il{' '}
        <Text style={styles.bold}>Dott. Tuzio Antonio</Text>, CF TZUNTN69A16D612E, Dottore Commercialista in Reggio
        Emilia, iscritto al n. 742/A, intermediario abilitato al servizio Entratel, a disporre gli ordini di pagamento
        delle imposte, contributi, tasse e versamenti vari effettuabili tramite modello F24, a valere sul conto
        corrente bancario o postale intestato allo stesso soggetto che effettua la trasmissione telematica:
      </Text>
      <View style={[styles.fieldBlock, { marginVertical: 3, padding: 5 }]}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>IBAN del Cliente per addebito F24:</Text>
          <Text style={styles.fieldValue}>{ibanCliente}</Text>
        </View>
      </View>
      <Text style={styles.smallParagraph}>
        Il professionista si impegna a presentare al cliente le singole elaborazioni periodiche mettendolo al corrente
        degli obblighi di pagamento e delle date di scadenza delle stesse. Nell&apos;eventualità in cui il cliente
        richieda anche verbalmente al professionista di sospendere il pagamento telematico di una delega o più deleghe,
        il professionista si limiterà ad astenersi dall&apos;invio e sarà esonerato da qualsiasi responsabilità per
        omesso o ritardato versamento. Nel caso di richiesta successiva da parte del cliente di pagamento con
        ravvedimento operoso di importi in precedenza sospesi, sarà cura del cliente provvedere ad avvertire per
        iscritto con qualsiasi mezzo il professionista sulle modalità di invio degli importi omessi, quando possibile
        ravveduti, all&apos;indirizzo mail: <Text style={styles.bold}>postmaster@studiotuzio.it</Text>.
      </Text>

      {includiInformativaEntratel && (
        <Text style={[styles.smallParagraph, { fontSize: 7.7, color: '#334155' }]}>
          <Text style={styles.bold}>Informativa servizio &ldquo;F24 Telematico Entratel&rdquo; (ex art. 13 D.Lgs. 196/2003 e GDPR): </Text>
          I dati conferiti tramite questo modello sono raccolti esclusivamente per l&apos;espletamento del servizio
          &ldquo;F24 Telematico Entratel&rdquo; e vengono trasmessi per via telematica con sistemi di cifratura
          all&apos;Agenzia delle Entrate, la quale li invierà alla banca o a Poste Italiane, depositarie del conto
          corrente indicato, per richiedere l&apos;addebito delle somme dovute relative ai modelli F24 inviati.
        </Text>
      )}

      <View style={styles.signatureBlock}>
        <View style={styles.signatureCol}>
          <Text style={{ fontSize: 8.8 }}>Letto, approvato e sottoscritto — Reggio Emilia, lì {oggi}</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Professionista (Dott. Antonio Tuzio)</Text>
        </View>
        <View style={styles.signatureCol}>
          <Text style={{ fontSize: 8.8 }}>Autorizzazione addebito F24:</Text>
          <View style={styles.signatureLine} />
          <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Cliente ({rapprCompleto})</Text>
        </View>
      </View>

      <StudioFooter />
    </Page>
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

  const rapprCompleto =
    azienda.legaleRappresentante ||
    azienda.referente ||
    (!isSocieta ? azienda.ragioneSociale : '____________________________________')

  const cfRappr =
    azienda.cfRappresentante ||
    (!isSocieta ? azienda.codiceFiscale || '________________________' : '________________________')

  const luogoNascita = azienda.luogoNascitaRappr || azienda.comune || '________________'
  const dataNascita = azienda.dataNascitaRappr
    ? new Date(azienda.dataNascitaRappr).toLocaleDateString('it-IT')
    : '____/____/________'

  const comuneSede = azienda.comune || 'Reggio Emilia'
  const provSede = azienda.provincia || 'RE'
  const capSede = azienda.cap || '42121'
  const viaSede = azienda.indirizzo || '____________________________________'
  const cfAzienda = azienda.codiceFiscale || azienda.partitaIva || '________________________'
  const pivaAzienda = azienda.partitaIva || cfAzienda
  const emailAzienda = azienda.emailAmministrativa || '____________________________________'
  const pecAzienda = azienda.pec || azienda.emailAmministrativa || '____________________________________'
  const ibanCliente = azienda.iban || '______________________________________________________'
  const ibanStudio = emittente?.iban || 'IT 89E 03032 12804 0100 00063104'

  // Determina quale dei 3 Modelli Ufficiali generare:
  // 1) 'CONTABILITA' -> Lettera di Incarico Professionale per Tenuta Contabilità Ordinaria
  // 2) 'FORFETTARI'  -> Lettera di Incarico Professionale per Dichiarazioni e Consulenza in Regime Forfetario
  // 3) 'PAGHE'       -> Lettera d'Incarico Amministrazione del Personale Dipendente
  const vReq = (varianteRichiesta || '').toUpperCase()
  let modello: 'PAGHE' | 'CONTABILITA' | 'FORFETTARI' = 'PAGHE'

  if (vReq === 'CONTABILITA') {
    modello = 'CONTABILITA'
  } else if (vReq === 'FORFETTARI' || vReq === 'FORFETTARIO' || vReq === 'CONSULENZA') {
    modello = 'FORFETTARI'
  } else if (vReq === 'PAGHE') {
    modello = 'PAGHE'
  } else {
    // Auto-selezione intelligente dal Bot
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

  // ========================================================================================================
  // MODELLO 2: LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA (E BILANCIO)
  // ========================================================================================================
  if (modello === 'CONTABILITA') {
    const docContabilita = (
      <Document title={`Lettera_Incarico_Contabilita_Ordinaria_${ragSoc}`}>
        {/* PAGINA 1: INTESTAZIONE, OGGETTO 1.1, 1.2, 1.3, NON DOMICILIAZIONE */}
        <Page size="A4" style={styles.page}>
          <Text style={styles.docTitle}>
            LETTERA DI INCARICO PROFESSIONALE PER TENUTA CONTABILITÀ ORDINARIA
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.bold, { fontSize: 9.3, marginBottom: 3 }]}>Il Cliente:</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Denominazione / Ragione Sociale:</Text>
              <Text style={styles.fieldValue}>{ragSoc}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Sede Legale:</Text>
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
              <Text style={styles.fieldLabel}>Rappresentato da (Legale Rappr.):</Text>
              <Text style={styles.fieldValue}>
                {rapprCompleto} — C.F. {cfRappr}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Residenza e Doc. Identità:</Text>
              <Text style={styles.fieldValue}>
                {comuneSede} ({provSede}){' '}
                {azienda.documentoNumero ? `— Doc. ${azienda.documentoNumero}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.conferisceTitle}>CONFERISCE AL PROFESSIONISTA</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Nome e Cognome:</Text> Dott. Antonio Tuzio - C.F. TZUNTN69A16D612E{'\n'}
            <Text style={styles.bold}>Studio:</Text> Via Umberto Poli 9/B, 42123 Reggio Emilia (RE) —{' '}
            <Text style={styles.bold}>Telefono:</Text> 0522 331628{'\n'}
            <Text style={styles.bold}>Email:</Text> postmaster@studiotuzio.it —{' '}
            <Text style={styles.bold}>PEC:</Text> studiotuzio@legalmail.it{'\n'}
            <Text style={styles.bold}>Iscrizione Albo:</Text> Dottori Commercialisti di Reggio Emilia, n. 742/A{'\n'}
            Il pagamento delle prestazioni indicate al presente documento dovrà essere eseguito con modalità
            tracciabile. Si indica l&apos;IBAN di studio: <Text style={styles.bold}>{ibanStudio}</Text>
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>1. Oggetto e complessità dell&apos;incarico</Text>
          <Text style={styles.paragraph}>
            Il Professionista si impegna a svolgere le seguenti attività per conto del Cliente:
          </Text>

          <Text style={styles.subHeading}>1.1 Impianto delle scritture contabili</Text>
          <Text style={styles.listItem}>• Registrazione movimenti contabili rilevabili dalla prima nota fornita dal Cliente.</Text>
          <Text style={styles.listItem}>• Registrazione contabile delle fatture di acquisto, vendita e corrispettivi.</Text>
          <Text style={styles.listItem}>• Elaborazione delle liquidazioni IVA periodiche.</Text>
          <Text style={styles.listItem}>• Predisposizione, stampa e invio telematico del modello F24 per i versamenti di imposte e tributi.</Text>
          <Text style={styles.listItem}>• Predisposizione delle scritture di assestamento e chiusura ed elaborazione dei dati contabili per la formazione del Bilancio di esercizio.</Text>
          <Text style={styles.listItem}>• Stampa e consegna al cliente dei registri contabili (libro giornale, libro inventari, registro IVA acquisti, registro IVA vendite, registro IVA corrispettivi, registro beni ammortizzabili).</Text>
          <Text style={styles.listItem}>• Gestione della posizione previdenziale del titolare, collaboratori, soci e professionisti.</Text>
          <Text style={styles.listItem}>• Predisposizione della certificazione dei compensi corrisposti a terzi soggetti a ritenuta d&apos;acconto (CU) e comunicazioni fiscali previste.</Text>

          <Text style={styles.subHeading}>1.2 Consulenza e assistenza nella redazione del bilancio d&apos;esercizio</Text>
          <Text style={styles.listItem}>• Riclassificazione e redazione del bilancio secondo lo schema previsto dagli artt. 2423 e seguenti del Codice Civile.</Text>
          <Text style={styles.listItem}>• Elaborazione del Rendiconto finanziario (se dovuto) e predisposizione della Nota integrativa secondo gli schemi previsti agli artt. 2427-2427 bis c.c.</Text>
          <Text style={styles.listItem}>• Assistenza nella predisposizione della relazione sulla gestione prevista dall&apos;art. 2428 c.c. (se dovuta).</Text>
          <Text style={styles.listItem}>• Deposito telematico del bilancio presso il Registro delle Imprese.</Text>

          <Text style={styles.subHeading}>1.3 Consulenza e assistenza nella predisposizione delle dichiarazioni fiscali</Text>
          <Text style={styles.listItem}>• Predisposizione e invio telematico della dichiarazione annuale IVA, della dichiarazione dei redditi, della dichiarazione IRAP e comunicazione ISA / studi di settore.</Text>
          <Text style={styles.listItem}>• Elaborazione e liquidazione delle imposte relative, predisposizione e invio telematico dei modelli di versamento F24.</Text>

          <StudioFooter />
        </Page>

        {/* PAGINA 2: CLAUSOLA NON DOMICILIAZIONE, COMPENSI € 2.620,80, DURATA, OBBLIGHI, POLIZZA LLOYD'S, DELEGA, ANTIRICICLAGGIO */}
        <Page size="A4" style={styles.page}>
          <Text style={[styles.paragraph, styles.italic]}>
            Il professionista fa presente al cliente che nel suo studio non opera servizio di domiciliazione e neppure
            di tenuta scritture contabili, pertanto codesti adempimenti ricadranno ab origine del rapporto e in modo
            definitivo sotto la responsabilità diretta dell&apos;amministratore o del legale rappresentante firmatario
            della presente lettera di incarico, esonerando lo studio da qualsiasi responsabilità in merito alla tenuta o
            allo smarrimento di scritture contabili e documenti fiscali di proprietà del cliente stesso. Il
            professionista fornirà periodicamente e per tempo gli elaborati provenienti dal proprio studio mediante mail
            o condivisione di cartella informatica, nel rispetto della privacy, e tale documentazione sarà tenuta dal
            cliente con criterio di buona fede e osservanza dovuti dalla legge, presso la propria sede legale.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>2. Compensi, spese e contributi</Text>
          <Text style={styles.subHeading}>2.a - Compensi</Text>
          <Text style={styles.listItem}>• Attività di contabilità ordinaria (punto 1.1): € 873,60 (da definire in base alla complessità).</Text>
          <Text style={styles.listItem}>• Consulenza e assistenza bilancio (punto 1.2): € 873,60 (da definire in base alla complessità).</Text>
          <Text style={styles.listItem}>• Consulenza e assistenza dichiarazioni fiscali (punto 1.3): € 873,60 (da definire in base alla complessità).</Text>
          <Text style={[styles.paragraph, { marginTop: 3 }]}>
            <Text style={styles.bold}>Totale compensi annuali: € 2.620,80</Text>, modulabili in riferimento alla
            complessità delle attività d&apos;esercizio amministrativo. I compensi sono esclusi dall&apos;applicazione
            dell&apos;IVA e della ritenuta d&apos;acconto, in quanto il Professionista adotta il regime forfetario ai
            sensi dell&apos;art. 1, commi 54-89, della Legge n. 190/2014, come modificato dalla Legge n. 208/2015 e
            dalla Legge n. 145/2018. Ai compensi indicati sarà applicato un contributo integrativo previdenziale nella
            misura del 4%. I compensi saranno adeguati annualmente in base alla variazione dell&apos;indice ISTAT
            relativa al mese di dicembre. Per prestazioni specifiche non incluse nella presente offerta, i compensi
            saranno concordati separatamente.
          </Text>
          <Text style={styles.subHeading}>2.b - Spese e contributi</Text>
          <Text style={styles.paragraph}>
            Spese generali di studio: non previsto, ma modulabile in ragione di eventuali richieste del cliente. Spese
            di viaggio, vitto e alloggio: rimborsabili analiticamente in base alla documentazione prodotta. Indennità
            per assenza dallo studio: non prevista.
          </Text>

          <Text style={styles.sectionHeading}>3. Durata e decorrenza dell&apos;incarico</Text>
          <Text style={styles.paragraph}>
            L&apos;incarico decorre dalla data di sottoscrizione e si intende valido in forma continuativa, con rinnovo
            tacito annuale automatico, salvo comunicazione di recesso da una delle parti. Recesso: ciascuna parte può
            recedere con preavviso di 90 giorni, da comunicare tramite PEC o lettera raccomandata.
          </Text>

          <Text style={styles.sectionHeading}>4. Obblighi del Cliente e Adempimenti Antiriciclaggio (D.Lgs. 231/2007)</Text>
          <Text style={styles.paragraph}>
            Fornire tutta la documentazione necessaria entro i termini concordati; collaborare attivamente per il buon
            esito delle attività previste dall&apos;incarico; comunicare tempestivamente eventuali variazioni rilevanti
            per l&apos;incarico. Ai sensi del D.Lgs. 231/2007 (Grado 3 — Semplificazione Contabile/Societaria CNDCEC),
            il Cliente fornisce i dati identificativi propri e del Titolare Effettivo ({azienda.antiriciclaggioTitolareEffettivo || rapprCompleto}) ai sensi dell&apos;art. 22 D.Lgs. 231/2007 (Mod. AV.4).
          </Text>

          <Text style={styles.sectionHeading}>5. Obblighi del Professionista e 6. Polizza Assicurativa</Text>
          <Text style={styles.paragraph}>
            Eseguire l&apos;incarico con diligenza e professionalità, rispettare il segreto professionale e la normativa
            GDPR, garantire la massima trasparenza. Il Professionista dichiara di essere assicurato per la
            responsabilità civile contro i rischi professionali con polizza{' '}
            <Text style={styles.bold}>LLOYD&apos;S Insurance Company</Text>, in corso di validità.
          </Text>

          <Text style={styles.sectionHeading}>
            7. Delega al cassetto fiscale, previdenziale, INAIL, e delega alla Tenuta del Libro Unico del Lavoro
          </Text>
          <Text style={styles.paragraph}>
            Lo studio è abilitato ad accedere al sistema informatico dell&apos;Agenzia delle Entrate, Uni-riscossioni,
            INPS e INAIL, al fine di visualizzare le varie posizioni fiscali (presentazioni dichiarazioni, pagamenti
            fiscali, rimborsi fiscali, ecc.). Il Cliente, con la sottoscrizione del presente incarico, si obbliga a
            rilasciare in favore dello studio apposita autorizzazione all&apos;attivazione di detta procedura.
          </Text>

          <View style={styles.amlBox}>
            <Text style={[styles.bold, { fontSize: 8.8, color: '#1e3a8a' }]}>
              INQUADRAMENTO ANTIRICICLAGGIO MANDATO CONTABILE (Fascicolo {azienda.antiriciclaggioFascicolo || 'ARC-2026'}):{' '}
              {bot.zonaLabel} — Rischio Effettivo {bot.rischioEffettivo.toFixed(2)}/4,00 (Controllo Costante ogni {bot.periodicitaMesi || 36} mesi)
            </Text>
          </View>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureCol}>
              <Text style={{ fontSize: 8.8 }}>Luogo e data: Reggio Emilia, {oggi}</Text>
              <View style={styles.signatureLine} />
              <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Cliente ({rapprCompleto})</Text>
            </View>
            <View style={styles.signatureCol}>
              <Text style={{ fontSize: 8.8 }}>Per accettazione incarico:</Text>
              <View style={styles.signatureLine} />
              <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Professionista (Dott. Antonio Tuzio)</Text>
            </View>
          </View>

          <StudioFooter />
        </Page>

        {/* PAGINA 3: POLICY PRIVACY GDPR + DELEGA F24 ENTRATEL */}
        <PrivacyF24Pages
          ragSoc={ragSoc}
          rapprCompleto={rapprCompleto}
          cfRappr={cfRappr}
          luogoNascita={luogoNascita}
          dataNascita={dataNascita}
          viaSede={viaSede}
          capSede={capSede}
          comuneSede={comuneSede}
          provSede={provSede}
          pivaAzienda={pivaAzienda}
          ibanCliente={ibanCliente}
          isSocieta={isSocieta}
          oggi={oggi}
          includiInformativaEntratel={true}
        />
      </Document>
    )
    return await renderToBuffer(docContabilita)
  }

  // ========================================================================================================
  // MODELLO 3: LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO
  // ========================================================================================================
  if (modello === 'FORFETTARI') {
    const docForfettari = (
      <Document title={`Lettera_Incarico_Regime_Forfetario_${ragSoc}`}>
        {/* PAGINA 1: INCARICO REGIME FORFETARIO (ART. 1 - 6 + FIRME) */}
        <Page size="A4" style={styles.page}>
          <Text style={styles.docSubtitle}>INCARICO PROFESSIONALE</Text>
          <Text style={styles.docTitle}>
            LETTERA DI INCARICO PROFESSIONALE PER DICHIARAZIONI E CONSULENZA IN REGIME FORFETARIO
          </Text>

          <View style={styles.fieldBlock}>
            <Text style={[styles.bold, { fontSize: 9.3, marginBottom: 3 }]}>Il Cliente:</Text>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nome e Cognome / Ditta:</Text>
              <Text style={styles.fieldValue}>{ragSoc}</Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Luogo e Data di Nascita:</Text>
              <Text style={styles.fieldValue}>
                {luogoNascita}, il {dataNascita}
              </Text>
            </View>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Residenza / Sede:</Text>
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
              <Text style={styles.fieldLabel}>Email / P.E.C.:</Text>
              <Text style={styles.fieldValue}>
                {emailAzienda} — PEC: {pecAzienda}
              </Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Il Professionista:</Text> Nome e Cognome: <Text style={styles.bold}>Antonio Tuzio</Text> — Studio sito in: <Text style={styles.bold}>Via Umberto Poli 9/B, 42123 Reggio Emilia (RE)</Text> — Email: <Text style={styles.bold}>postmaster@studiotuzio.it</Text> — P.E.C.: <Text style={styles.bold}>studiotuzio@legalmail.it</Text> — Iscritto all&apos;Albo dei Dottori Commercialisti e degli Esperti Contabili di Reggio Emilia, n. <Text style={styles.bold}>742A</Text>.
          </Text>
          <Text style={styles.paragraph}>
            Con la presente, il Cliente conferisce al Professionista l&apos;incarico per l&apos;assistenza e la
            consulenza fiscale in regime forfetario, secondo i termini e le condizioni indicate di seguito:
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeading}>1. Oggetto dell&apos;incarico</Text>
          <Text style={styles.paragraph}>Il Professionista si impegna a svolgere le seguenti attività:</Text>
          <Text style={styles.listItem}>
            • Consulenza fiscale soggetti regime forfetario RF19 - Operazione senza applicazione dell&apos;IVA ai sensi
            dell&apos;art. 1 co. 54-89, della legge n. 190/2014 così come modificato dalla legge n. 208/2015 e dalla
            legge n. 145/2018;
          </Text>
          <Text style={styles.listItem}>
            • Predisposizione e invio telematico della dichiarazione di apertura della Partita IVA e iscrizione al
            Registro delle Imprese;
          </Text>
          <Text style={styles.listItem}>• Predisposizione e invio telematico della dichiarazione dei redditi;</Text>
          <Text style={styles.listItem}>• Gestione del cassetto fiscale e previdenziale del Cliente;</Text>
          <Text style={styles.listItem}>
            • Elaborazione e liquidazione delle imposte, predisposizione dei modelli di versamento e invio telematico
            dei modelli F24.
          </Text>

          <Text style={styles.sectionHeading}>2. Compensi</Text>
          <Text style={styles.listItem}>• Una tantum per apertura Partita IVA e iscrizione Registro Imprese: € 90,00;</Text>
          <Text style={styles.listItem}>• Compenso annuale per attività ordinaria: € 420,00;</Text>
          <Text style={styles.listItem}>• Eventuale pratica iscrizione INAIL e autoliquidazione: € 90,00;</Text>
          <Text style={styles.listItem}>
            • Eventuali compensi per attività straordinarie saranno definiti separatamente previa approvazione scritta
            del Cliente.
          </Text>
          <Text style={styles.paragraph}>
            I compensi sono considerati esclusi da IVA adottando lo scrivente il regime forfetario, e pertanto è
            esonerato dall&apos;applicazione della ritenuta d&apos;acconto sulle parcelle emesse. I compensi saranno
            soggetti al contributo integrativo previdenziale pari alla misura del 4% addebitato al cliente. Il pagamento
            delle prestazioni dovrà avvenire all&apos;atto della presentazione dell&apos;avviso di parcella mediante
            Bonifico Bancario al seguente IBAN: <Text style={styles.bold}>{ibanStudio}</Text>
          </Text>

          <Text style={styles.sectionHeading}>3. Durata e decorrenza dell&apos;incarico</Text>
          <Text style={styles.paragraph}>
            L&apos;incarico decorre dalla sottoscrizione e si intende valido fino al 31 dicembre dell&apos;anno
            corrente, con rinnovo tacito annuale salvo comunicazione di recesso da una delle parti. L&apos;eventuale
            recesso del rapporto da parte del cliente si intende da comunicarsi con preavviso entro e non oltre il{' '}
            <Text style={styles.bold}>31 ottobre</Text> di ogni anno solare, mediante mail o pec al seguente indirizzo:{' '}
            <Text style={styles.bold}>studiotuzio@legalmail.it</Text>
          </Text>

          <Text style={styles.sectionHeading}>4. Obblighi del Cliente e 5. Diritti e obblighi del Professionista</Text>
          <Text style={styles.paragraph}>
            Il Cliente si impegna a fornire tutta la documentazione necessaria entro i termini concordati, collaborare
            attivamente e informare tempestivamente il professionista su qualsivoglia variazione mediante mail o pec. Il
            Professionista si impegna ad eseguire l&apos;incarico con diligenza, professionalità, trasparenza e rispetto
            del segreto professionale e del GDPR.
          </Text>

          <Text style={styles.sectionHeading}>6. Clausole aggiuntive e Inquadramento Antiriciclaggio (D.Lgs. 231/2007)</Text>
          <Text style={styles.paragraph}>
            • <Text style={styles.bold}>Esclusione di responsabilità:</Text> Il Professionista declina ogni
            responsabilità per ritardi o inadempimenti dovuti a incuria o mancanza di collaborazione da parte del
            Cliente.{'\n'}
            • <Text style={styles.bold}>Polizza assicurativa:</Text> Il professionista dichiara sotto la sua
            responsabilità di essere assicurato per responsabilità civile contro i rischi professionali con polizza{' '}
            <Text style={styles.bold}>LLOYD&apos;S Insurance Company</Text> in corso di validità.{'\n'}
            • <Text style={styles.bold}>Antiriciclaggio (Art. 17 co. 7 D.Lgs. 231/2007):</Text> Fascicolo{' '}
            {azienda.antiriciclaggioFascicolo || 'ARC-2026'} — {bot.zonaLabel} (Esente da scheda AVC per mera
            dichiarazione redditi, fermo restando l&apos;obbligo generale di SOS).
          </Text>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureCol}>
              <Text style={{ fontSize: 8.8 }}>Luogo e Data: Reggio Emilia, {oggi}</Text>
              <View style={styles.signatureLine} />
              <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Cliente ({rapprCompleto})</Text>
            </View>
            <View style={styles.signatureCol}>
              <Text style={{ fontSize: 8.8 }}>Per accettazione:</Text>
              <View style={styles.signatureLine} />
              <Text style={{ fontSize: 8.2, textAlign: 'center' }}>Firma del Professionista (Dott. Antonio Tuzio)</Text>
            </View>
          </View>

          <StudioFooter />
        </Page>

        {/* PAGINA 2: POLICY PRIVACY GDPR + DELEGA F24 UNIFICATO + INFORMATIVA F24 TELEMATICO ENTRATEL */}
        <PrivacyF24Pages
          ragSoc={ragSoc}
          rapprCompleto={rapprCompleto}
          cfRappr={cfRappr}
          luogoNascita={luogoNascita}
          dataNascita={dataNascita}
          viaSede={viaSede}
          capSede={capSede}
          comuneSede={comuneSede}
          provSede={provSede}
          pivaAzienda={pivaAzienda}
          ibanCliente={ibanCliente}
          isSocieta={isSocieta}
          oggi={oggi}
          includiInformativaEntratel={true}
        />
      </Document>
    )
    return await renderToBuffer(docForfettari)
  }

  // ========================================================================================================
  // MODELLO 1 (DEFAULT): LETTERA D'INCARICO AMMINISTRAZIONE DEL PERSONALE DIPENDENTE (PAGHE)
  // ========================================================================================================
  const docPaghe = (
    <Document title={`Lettera_Incarico_Amministrazione_Personale_${ragSoc}`}>
      {/* PAGINA 1: CONFERIMENTO INCARICO PAGHE, ART. 1 - 7 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.docTitle}>
          LETTERA D&apos;INCARICO AMMINISTRAZIONE DEL PERSONALE DIPENDENTE
        </Text>

        <View style={styles.fieldBlock}>
          <Text style={[styles.bold, { fontSize: 9.3, marginBottom: 3 }]}>IL SOTTOSCRITTO:</Text>
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

          <Text style={[styles.italic, { fontSize: 8.6, marginVertical: 3 }]}>
            {isSocieta
              ? '[X] In qualità di Amministratore legale rappresentante della Società   [ ] Oppure Titolare della impresa individuale'
              : '[ ] In qualità di Amministratore legale rappresentante della Società   [X] Oppure Titolare della impresa individuale'}
          </Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Denominata:</Text>
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
            <Text style={styles.fieldLabel}>PEC:</Text>
            <Text style={styles.fieldValue}>{pecAzienda}</Text>
          </View>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Esercente attività:</Text>
            <Text style={styles.fieldValue}>Impresa con personale dipendente</Text>
          </View>
          <Text style={{ fontSize: 8.3, marginTop: 2 }}>Denominato in seguito come &quot;Cliente&quot;</Text>
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
          Il pagamento delle prestazioni indicate al presente documento dovrà essere eseguito con modalità tracciabile.
          Si indica l&apos;IBAN di studio: <Text style={styles.bold}>{ibanStudio}</Text>
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>1. OGGETTO DEL MANDATO</Text>
        <Text style={styles.paragraph}>
          L&apos;incarico ha come oggetto le prestazioni di gestione delle paghe, elaborazione dei prospetti paga, invio
          telematico dei flussi retributivi, denunce assicurative e previdenziali, e consulenza in materia di diritto
          del lavoro. In particolare, l&apos;incarico include:
        </Text>
        <Text style={styles.listItem}>1. Elaborazione delle buste paga per i dipendenti.</Text>
        <Text style={styles.listItem}>2. Gestione delle pratiche di assunzione, variazione e cessazione.</Text>
        <Text style={styles.listItem}>3. Autoliquidazione INAIL.</Text>
        <Text style={styles.listItem}>4. Comunicazioni obbligatorie (Unilav, INPS, INAIL).</Text>
        <Text style={styles.listItem}>5. Elaborazione Certificazioni Uniche (CU) e Modello 770.</Text>

        <Text style={styles.sectionHeading}>2. COMPENSO</Text>
        <Text style={styles.paragraph}>
          Per lo svolgimento delle prestazioni oggetto del suddetto incarico, le parti concordano che al Professionista
          spetteranno i compensi previsti nel tariffario allegato alla presente lettera di incarico. Il Professionista
          emetterà parcella con cadenza trimestrale in regime Forfetario RF19 (senza applicazione dell&apos;IVA ai sensi
          dell&apos;art. 1 co. 54-89, della legge n. 190/2014). I compensi pattuiti si intendono comprensivi del
          contributo integrativo previdenziale (attualmente nella misura del 4%). Il pagamento dovrà essere effettuato
          entro il 10° giorno successivo al ricevimento della fattura o preavviso di parcella.
        </Text>

        <Text style={styles.sectionHeading}>3. DURATA DELL&apos;INCARICO</Text>
        <Text style={styles.paragraph}>
          L&apos;incarico decorre dalla data di sottoscrizione e si intende valido in forma continuativa, con rinnovo
          tacito annuale automatico, salvo comunicazione di recesso da una delle parti con preavviso di 90 giorni, da
          comunicare tramite PEC o lettera raccomandata AR.
        </Text>

        <Text style={styles.sectionHeading}>4. OBBLIGHI DEL PROFESSIONISTA &amp; 5. OBBLIGHI DEL CLIENTE</Text>
        <Text style={styles.paragraph}>
          Il Professionista si impegna a prestare il proprio servizio utilizzando la diligenza richiesta dalla natura
          dell&apos;attività esercitata, dalla legge e dalle norme deontologiche professionali, rispettando il segreto
          professionale (Polizza RC professionale <Text style={styles.bold}>LLOYD&apos;S Insurance Company</Text>). Il
          Cliente si impegna a fornire tempestivamente la documentazione necessaria garantendone completezza, esattezza
          e autenticità e a comunicare eventuali variazioni rilevanti anche ai sensi del D.Lgs. 231/2007.
        </Text>

        <Text style={styles.sectionHeading}>6. FORO COMPETENTE &amp; 7. DELEGA CASSETTO FISCALE, INPS, INAIL E LUL</Text>
        <Text style={styles.paragraph}>
          Qualsiasi controversia sarà sottoposta a Procedura di Mediazione della C.C.I.A.A. di Reggio Emilia (Piazza
          della Vittoria 3 – Giustizia.alternativa@re.camcom.it – cciaa@re.legalmail.it). Il Cliente autorizza il
          Professionista ad accedere ai sistemi informatici di Agenzia delle Entrate, INPS e INAIL e alla tenuta e
          conservazione del Libro Unico del Lavoro (LUL).
        </Text>

        <StudioFooter />
      </Page>

      {/* PAGINA 2: POLICY PRIVACY GDPR + DELEGA F24 */}
      <PrivacyF24Pages
        ragSoc={ragSoc}
        rapprCompleto={rapprCompleto}
        cfRappr={cfRappr}
        luogoNascita={luogoNascita}
        dataNascita={dataNascita}
        viaSede={viaSede}
        capSede={capSede}
        comuneSede={comuneSede}
        provSede={provSede}
        pivaAzienda={pivaAzienda}
        ibanCliente={ibanCliente}
        isSocieta={isSocieta}
        oggi={oggi}
        includiInformativaEntratel={false}
      />

      {/* PAGINA 3: ALLEGATO TARIFFARIO PER LA GESTIONE DELLE PAGHE + INQUADRAMENTO ANTIRICICLAGGIO */}
      <Page size="A4" style={styles.page}>
        <View style={styles.tariffBox}>
          <Text style={[styles.bold, { fontSize: 10.5, marginBottom: 6, color: '#0f172a' }]}>
            ALLEGATO: TARIFFARIO PER LA GESTIONE DELLE PAGHE
          </Text>

          <Text style={[styles.bold, { fontSize: 9.5, marginTop: 3 }]}>1. Parte Calcolata ad Ogni Singola Busta Paga</Text>
          <Text style={styles.listItem}>- Buste paga edilizia (1 busta a dipendente – costo mensile): € 35,00</Text>
          <Text style={styles.listItem}>- Buste paga ditte (1-20 dipendenti, 1 busta a dipendente costo mensile): € 25,00</Text>
          <Text style={styles.listItem}>- Buste paga ditte (21-30 dipendenti, 1 busta a dipendente costo mensile): € 20,00</Text>

          <Text style={[styles.bold, { fontSize: 9.5, marginTop: 6 }]}>2. Parte Calcolata a Pratica</Text>
          <Text style={styles.listItem}>- Pratiche di assunzione: € 60,00</Text>
          <Text style={styles.listItem}>- Pratica cessazione ditta edile: € 60,00</Text>
          <Text style={styles.listItem}>- Pratica cessazione ditta ordinaria: € 35,00</Text>
          <Text style={styles.listItem}>- Autoliquidazione INAIL: € 50,00</Text>
          <Text style={styles.listItem}>- Pratiche variazioni INAIL/Unilav/INPS: € 25,00</Text>
          <Text style={styles.listItem}>- Pratica 770 (ditte non forfettarie): € 60,00</Text>
          <Text style={styles.listItem}>- Budget costo del personale: € 60,00</Text>

          <Text style={[styles.bold, { fontSize: 9.5, marginTop: 6 }]}>3. Parte Calcolata a Domanda</Text>
          <Text style={styles.listItem}>- Congedi parentali: € 60,00</Text>
          <Text style={styles.listItem}>- Domanda di maternità: € 60,00</Text>
          <Text style={styles.listItem}>- Naspi (domanda): € 60,00</Text>
          <Text style={[styles.italic, { fontSize: 8.8, marginLeft: 10, marginTop: 2 }]}>
            Su richiesta specifica di singoli dipendenti dell&apos;azienda cliente.
          </Text>
        </View>

        <View style={styles.amlBox}>
          <Text style={[styles.bold, { fontSize: 9.3, color: '#1e3a8a', marginBottom: 2 }]}>
            INQUADRAMENTO ANTIRICICLAGGIO DEL MANDATO (D.LGS. 231/2007 — ART. 17 CO. 7)
          </Text>
          <Text style={{ fontSize: 8.5, color: '#1e293b' }}>
            • <Text style={styles.bold}>N° Fascicolo Studio:</Text> {azienda.antiriciclaggioFascicolo || 'ARC-2026'}   |   <Text style={styles.bold}>Qualificazione AML:</Text> {bot.zonaLabel}{'\n'}
            • <Text style={styles.bold}>Nota Operativa:</Text> {bot.motivoBot}
          </Text>
        </View>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Letto, approvato e sottoscritto — Reggio Emilia, lì {oggi}</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma TUZIO ANTONIO</Text>
          </View>
          <View style={styles.signatureCol}>
            <Text style={{ fontSize: 9 }}>Per accettazione Mandato e Tariffario:</Text>
            <View style={styles.signatureLine} />
            <Text style={{ fontSize: 8.5, textAlign: 'center' }}>Firma Cliente ({rapprCompleto})</Text>
          </View>
        </View>

        <StudioFooter />
      </Page>
    </Document>
  )

  return await renderToBuffer(docPaghe)
}
