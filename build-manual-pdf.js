// build-manual-pdf.js
// Genera la guida utente completa e professionale in HTML e PDF per il Dott. Antonio Tuzio.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const screenshotPath = path.join(__dirname, 'public', 'manuale', 'screenshot_bozza_dettaglio.png');
let screenshotBase64 = '';
if (fs.existsSync(screenshotPath)) {
  screenshotBase64 = 'data:image/png;base64,' + fs.readFileSync(screenshotPath).toString('base64');
}

const htmlContent = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Manuale d'Uso - Gestionale Studio Dott. Antonio Tuzio</title>
  <style>
    @page {
      size: A4;
      margin: 14mm 15mm 14mm 15mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.8pt;
      line-height: 1.48;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    .page {
      page-break-after: always;
      height: 268mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Copertina */
    .cover-page {
      page-break-after: always;
      height: 268mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 25px 15px 15px 15px;
    }

    .cover-header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }

    .cover-badge {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 10.5pt;
      padding: 5px 12px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 10px 0;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      margin: 0;
      font-weight: 400;
    }

    .cover-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 22px;
      margin: 25px 0;
    }

    .cover-card h3 {
      margin-top: 0;
      color: #1e293b;
      font-size: 11pt;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 8px;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      font-size: 9.5pt;
    }

    .cover-grid-item strong {
      display: block;
      color: #64748b;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5pt;
      color: #64748b;
    }

    .cover-author {
      font-weight: 600;
      color: #1e293b;
    }

    h1 {
      font-size: 16pt;
      color: #0f172a;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 4px;
      margin-top: 10px;
      margin-bottom: 12px;
      font-weight: 700;
    }

    h2 {
      font-size: 11.5pt;
      color: #1e40af;
      margin-top: 14px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    h3 {
      font-size: 10pt;
      color: #334155;
      margin-top: 10px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    p {
      margin: 0 0 8px 0;
    }

    ul, ol {
      margin: 0 0 10px 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 4px;
    }

    /* Box avvisi */
    .callout {
      border-radius: 6px;
      padding: 10px 14px;
      margin: 10px 0;
      font-size: 9pt;
      line-height: 1.45;
    }

    .callout-info {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      color: #1e3a8a;
    }

    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #d97706;
      color: #78350f;
    }

    .callout-success {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      color: #14532d;
    }

    /* Tabelle */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 8.5pt;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-weight: 600;
    }

    td {
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
    }

    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Badge */
    .badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-amber { background: #fef3c7; color: #b45309; }
    .badge-red { background: #fee2e2; color: #b91c1c; }

    /* Rappresentazione Menu Sidebar */
    .sidebar-mockup {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 8.8pt;
      margin-bottom: 3px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    .sidebar-item.active {
      background: #2563eb;
      color: #ffffff;
      font-weight: 600;
      border-color: #2563eb;
    }

    .sidebar-item .icon {
      margin-right: 8px;
      font-size: 10pt;
      width: 18px;
      text-align: center;
    }

    .sidebar-subitem {
      margin-left: 24px;
      padding: 3px 8px;
      font-size: 8pt;
      color: #64748b;
      border-left: 2px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    /* Screenshot */
    .screenshot-container {
      margin: 10px 0;
      text-align: center;
    }

    .screenshot-img {
      max-width: 95%;
      max-height: 105mm;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07);
    }

    .screenshot-caption {
      font-size: 8pt;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
    }

    /* Flusso di processo */
    .flow-steps {
      display: flex;
      gap: 8px;
      margin: 10px 0;
    }

    .flow-step {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-top: 3px solid #2563eb;
      border-radius: 6px;
      padding: 8px;
      font-size: 8pt;
    }

    .flow-step-num {
      font-weight: 700;
      color: #2563eb;
      font-size: 8.5pt;
      margin-bottom: 2px;
    }

    .flow-step-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 2px;
    }

    code {
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 8.5pt;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- PAGINA 1: COPERTINA -->
  <div class="cover-page">
    <div class="cover-header">
      <div class="cover-badge">Studio Dott. Antonio Tuzio — Manuale Ufficiale</div>
      <h1 class="cover-title">GESTIONALE ATTIVITÀ &<br>FATTURAZIONE PROFESSIONALE</h1>
      <p class="cover-subtitle">Guida Operativa, Gestione Prestazioni e Fatturazione Elettronica SdI</p>
    </div>

    <div class="cover-card">
      <h3>DATI DI CONFIGURAZIONE & ACCESSO DELLO STUDIO</h3>
      <div class="cover-grid">
        <div class="cover-grid-item">
          <strong>Titolare Emittente</strong>
          Dott. Antonio Tuzio
        </div>
        <div class="cover-grid-item">
          <strong>Codice Fiscale / P.IVA</strong>
          TZUNTN69A16D612E · 05389400481
        </div>
        <div class="cover-grid-item">
          <strong>Regime & Cassa</strong>
          Forfetario RF19 (N2.2) · CNPADC TC02 (4%)
        </div>
        <div class="cover-grid-item">
          <strong>IBAN Accreditamento</strong>
          IT89E0303212804010000063104 (Credem)
        </div>
        <div class="cover-grid-item">
          <strong>Indirizzo Locale Gestionale</strong>
          <code>http://localhost:3000</code>
        </div>
        <div class="cover-grid-item">
          <strong>Credenziali Predefinite</strong>
          <code>infooizut@gmail.com</code> / <code>Admin1234!</code>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <span>Progettato e sviluppato da:</span><br>
        <span class="cover-author">Leoni Mattia</span>
      </div>
      <div>
        <span>Edizione per Ubuntu Linux & Windows 11</span><br>
        <span>Ottobre 2026 — Versione 1.0 (Produzione)</span>
      </div>
    </div>
  </div>

  <!-- PAGINA 2: ARCHITETTURA E MENU SIDEBAR -->
  <div class="page">
    <h1>1. Architettura e Primo Accesso</h1>
    <p>
      Il gestionale è un'applicazione web sviluppata su misura per lo studio professionale del Dott. Antonio Tuzio. 
      Funziona su server locale con database sicuro <strong>PostgreSQL</strong>; tutti i dati dei clienti e della contabilità risiedono esclusivamente all'interno dello studio.
    </p>

    <h2>Accesso Multi-Postazione (Ubuntu e Windows)</h2>
    <ul>
      <li><strong>Postazione Principale (PC Ubuntu del Dottore):</strong> Il programma è raggiungibile digitando <code>http://localhost:3000</code> o con doppio clic sull'icona creata sulla Scrivania.</li>
      <li><strong>Postazioni Secondarie (PC Windows 11 dello studio):</strong> Basta aprire Google Chrome o Microsoft Edge e digitare l'indirizzo IP del PC Ubuntu, ad esempio: <code>http://192.168.1.50:3000</code>. Non serve alcuna installazione sui client!</li>
    </ul>

    <div class="callout callout-info">
      <strong>💡 Avvio rapido:</strong> Quando lanci il programma con lo script <code>./avvia-ubuntu.sh</code>, il terminale indica automaticamente l'indirizzo IP locale esatto da inserire negli altri computer dello studio.
    </div>

    <h1>2. La Barra di Navigazione (Menu Laterale)</h1>
    <p>
      Il menu laterale è sempre accessibile a sinistra e organizza in modo ordinato tutte le funzioni:
    </p>

    <div class="sidebar-mockup">
      <div class="sidebar-item active"><span class="icon">📊</span> <strong>Dashboard</strong> — Cruscotto con KPI: incassi, valore non fatturato, bozze e trend mensile</div>
      <div class="sidebar-item"><span class="icon">🏢</span> <strong>Aziende</strong> — Anagrafica completa clienti (imprese con P.IVA e privati con Codice Fiscale)</div>
      <div class="sidebar-item"><span class="icon">📋</span> <strong>Attività</strong> — Registrazione delle prestazioni giornaliere (a tempo, forfait o cedolini)</div>
      <div class="sidebar-item"><span class="icon">📅</span> <strong>Calendar</strong> — Importazione e sincronizzazione eventi da Google Calendar dello studio</div>
      <div class="sidebar-item"><span class="icon">🧾</span> <strong>Tariffario</strong> — Gestione prestazioni, tariffe orarie e fasce dipendenti buste paga</div>
      <div class="sidebar-item"><span class="icon">📑</span> <strong>Fatture</strong> — Gestione integrata del ciclo di fatturazione</div>
      <div class="sidebar-subitem"><span>↳ Bozze</span> <span class="badge badge-amber">Avvisi di parcella provvisori</span></div>
      <div class="sidebar-subitem"><span>↳ Da incassare</span> <span class="badge badge-red">Fatture emesse con residuo aperto</span></div>
      <div class="sidebar-subitem"><span>↳ Incassate</span> <span class="badge badge-green">Fatture saldate al 100%</span></div>
      <div class="sidebar-item"><span class="icon">💳</span> <strong>Pagamenti</strong> — Tracciamento incassi, acconti, bonifici e metodi di saldo</div>
      <div class="sidebar-item"><span class="icon">📈</span> <strong>Report</strong> — Statistiche annuali, fatturato emesso, incassato e riepilogo per azienda</div>
      <div class="sidebar-item"><span class="icon">⚙️</span> <strong>Impostazioni</strong> — Dati fiscali studio, sezionali numerazione e integrazione Aruba SdI</div>
    </div>
  </div>

  <!-- PAGINA 3: ANAGRAFICA E TARIFFARIO -->
  <div class="page">
    <h1>3. Gestione Anagrafica Clienti (Aziende e Privati)</h1>
    <p>
      Nella sezione <strong>Aziende</strong> è possibile inserire sia soggetti aziendali con Partita IVA, sia liberi professionisti, sia clienti privati privi di Partita IVA.
    </p>

    <h2>Distinzione tra Soggetto Impresa e Privato Cittadino</h2>
    <table>
      <thead>
        <tr>
          <th>Tipo Soggetto</th>
          <th>Dati Obbligatori</th>
          <th>Codice SDI / Canale</th>
          <th>Regola XML FatturaPA</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Società o Impresa</strong></td>
          <td>Ragione Sociale, P.IVA, Codice Fiscale, Indirizzo</td>
          <td>Codice Destinatario (7 caratteri) o PEC</td>
          <td>Genera blocchi <code>&lt;Denominazione&gt;</code> e <code>&lt;IdFiscaleIVA&gt;</code></td>
        </tr>
        <tr>
          <td><strong>Persona Fisica (Privato)</strong></td>
          <td>Nome e Cognome, Codice Fiscale, Indirizzo</td>
          <td>Codice convenzionale <code>0000000</code></td>
          <td>Genera <code>&lt;Nome&gt;</code> e <code>&lt;Cognome&gt;</code> separati, senza P.IVA</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warning">
      <strong>⚠️ Archiviazione protetta:</strong> Per preservare la contabilità e lo storico dei documenti emessi, i clienti con attività o fatture collegate <strong>non vengono eliminati fisicamente</strong>, ma archiviati in sola lettura.
    </div>

    <h1>4. Il Tariffario dello Studio</h1>
    <p>
      Il gestionale include una gestione intelligente dei prezzi configurabile in <strong>Tariffario</strong>:
    </p>
    <ul>
      <li><strong>Prestazioni a Ore (es. Consulenza fiscale):</strong> Il software calcola il compenso moltiplicando le ore per la tariffa oraria. L'arrotondamento commerciale è impostato ai quarti d'ora (es. 90 minuti = 1,5 ore &times; 80 €/h = 120,00 €).</li>
      <li><strong>Prestazioni a Forfait o Pratica (es. Bilancio, Dichiarazione dei redditi):</strong> Importo fisso concordato.</li>
      <li><strong>Fasce Buste Paga:</strong> Permette di differenziare il compenso a cedolino in base al numero di dipendenti dell'azienda (es. 35,00 €/cedolino fino a 5 dipendenti, 30,00 € oltre).</li>
      <li><strong>Tariffe Personalizzate per Cliente:</strong> Se un cliente gode di condizioni particolari, è possibile inserire una tariffa specifica nella sua anagrafica: il programma le darà sempre priorità sul tariffario generale.</li>
    </ul>

    <div class="callout callout-info">
      <strong>🔒 Prezzi congelati nel tempo:</strong> Quando un'attività viene inclusa in una fattura, il prezzo viene scritto direttamente sulla riga del documento. Modificare il tariffario in futuro non altererà mai le fatture del passato.
    </div>
  </div>

  <!-- PAGINA 4: CICLO FATTURAZIONE E SCREENSHOT -->
  <div class="page">
    <h1>5. Il Ciclo di Fatturazione Completo</h1>
    <p>
      Il flusso operativo garantisce la massima trasparenza contabile attraverso 4 fasi sequenziali:
    </p>

    <div class="flow-steps">
      <div class="flow-step">
        <div class="flow-step-num">Fase 1</div>
        <div class="flow-step-title">Attività Approvata</div>
        L'operatore registra le ore o i cedolini. Convalidata la prestazione, diventa "APPROVATA".
      </div>
      <div class="flow-step">
        <div class="flow-step-num">Fase 2</div>
        <div class="flow-step-title">Bozza di Fattura</div>
        A fine mese si genera la bozza per cliente. Le prestazioni vengono raggruppate. Nessun valore fiscale.
      </div>
      <div class="flow-step">
        <div class="flow-step-num">Fase 3</div>
        <div class="flow-step-title">Avviso di Parcella</div>
        Si stampa il PDF con filigrana "BOZZA" e si inoltra al cliente per richiedere il bonifico.
      </div>
      <div class="flow-step">
        <div class="flow-step-num">Fase 4</div>
        <div class="flow-step-title">Emissione Fiscale</div>
        Ricevuto il bonifico, si emette con numero definitivo (es. FT 1/2026) e si scaricano PDF e XML.
      </div>
    </div>

    <h2>Schermata Reale di Dettaglio Bozza nel Gestionale</h2>
    <div class="screenshot-container">
      ${screenshotBase64 ? `<img src="${screenshotBase64}" class="screenshot-img" alt="Schermata Bozza">` : ''}
      <div class="screenshot-caption">Figura 1 — Vista reale della bozza: pulsanti "Stampa Avviso di Parcella", "Emetti fattura fiscale" e riepilogo fiscale.</div>
    </div>

    <h2>Differenza: Avviso di Parcella vs Fattura Fiscale</h2>
    <ul>
      <li><strong>Avviso di Parcella ("Stampa Avviso di Parcella"):</strong> Genera un documento PDF recante la filigrana <em>«BOZZA — NON EMESSA»</em>. Permette al cliente di effettuare il pagamento senza che lo studio debba anticipare adempimenti fiscali prima dell'incasso reale.</li>
      <li><strong>Fattura Fiscale Ufficiale ("Emetti fattura fiscale"):</strong> Assegna il numero progressivo (es. <code>FT 1/2026</code>), congela l'anagrafica e genera il PDF di cortesia e il file XML per lo SdI.</li>
    </ul>

    <div class="callout callout-success">
      <strong>✨ Saldo Contestuale all'Emissione:</strong> Se il cliente ha già bonificato l'importo dell'avviso di parcella, all'atto dell'emissione basta spuntare <em>«Registra contestualmente come già incassata»</em>: la fattura viene emessa e saldata all'istante!
    </div>
  </div>

  <!-- PAGINA 5: FATTURAZIONE ELETTRONICA SDI, ARUBA E PAGAMENTI -->
  <div class="page">
    <h1>6. Fattura Elettronica SdI & Portale Aruba</h1>
    <p>
      Il gestionale crea il file <strong>XML FatturaPA v1.2</strong> conforme a tutte le normative vigenti dell'Agenzia delle Entrate per il regime forfettario dei Dottori Commercialisti.
    </p>

    <h2>Parametri Fiscali del Dott. Tuzio Applicati in Automatico</h2>
    <table>
      <thead>
        <tr>
          <th>Parametro Fiscale</th>
          <th>Codice SdI</th>
          <th>Regola di Calcolo Applicata dal Software</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Regime Fiscale</strong></td>
          <td><code>RF19</code></td>
          <td>Regime Forfettario Legge 190/2014 art. 1 c. 58</td>
        </tr>
        <tr>
          <td><strong>Cassa Dottori Commercialisti</strong></td>
          <td><code>TC02</code> (CNPADC)</td>
          <td>Aliquota <strong>4,00%</strong> calcolata sull'imponibile prestazioni</td>
        </tr>
        <tr>
          <td><strong>Trattamento IVA</strong></td>
          <td><code>0.00%</code> · Natura <code>N2.2</code></td>
          <td>Operazione non soggetta ad IVA ai sensi di legge</td>
        </tr>
        <tr>
          <td><strong>Bollo Virtuale</strong></td>
          <td><code>SI</code> · 2,00 €</td>
          <td>Applicato automaticamente se (Imponibile + Cassa) &gt; <strong>77,47 €</strong></td>
        </tr>
        <tr>
          <td><strong>Formato Trasm. Privati/Aziende</strong></td>
          <td><code>FPR12</code></td>
          <td>Codice destinatario a 7 cifre (o <code>0000000</code> per privati)</td>
        </tr>
        <tr>
          <td><strong>Formato Trasm. Pubblica Amm.</strong></td>
          <td><code>FPA12</code></td>
          <td>Codice Univoco Ufficio a 6 caratteri (per enti pubblici)</td>
        </tr>
      </tbody>
    </table>

    <h2>Come Trasmettere l'XML allo SdI tramite Aruba</h2>
    <ol>
      <li>Nella fattura emessa, clicca su <strong>"XML FatturaPA"</strong>: il file ufficiale verrà scaricato (es. <code>IT05389400481_FT00001.xml</code>).</li>
      <li>Apri il consueto portale web di <strong>Aruba Fatturazione Elettronica</strong> (o portale AdE <em>Fatture e Corrispettivi</em>).</li>
      <li>Clicca su <strong>"Importa Fattura XML"</strong> (o "Carica XML") e carica il file.</li>
      <li>Aruba effettuerà la verifica istantanea attestando la conformità del file e della quadratura IVA/Cassa.</li>
      <li>Clicca <strong>"Invia allo SdI"</strong>: la fattura è ufficialmente inviata all'Agenzia delle Entrate.</li>
    </ol>

    <h1>7. Gestione Pagamenti, Insoluti e Rettifica Numero</h1>
    <ul>
      <li><strong>Fatture Da Incassare:</strong> Elenca le fatture con residuo aperto, indicando data di scadenza e giorni di ritardo.</li>
      <li><strong>Acconti e Saldi:</strong> Il pulsante <em>"Registra Pagamento"</em> consente pagamenti parziali calcolando il residuo esatto. Quando il residuo arriva a 0,00 €, la fattura si sposta automaticamente in <strong>"Incassate"</strong>.</li>
      <li><strong>Rettifica Numero:</strong> Nel caso sia necessario correggere la numerazione progressiva, è disponibile il pulsante <strong>«Modifica numero»</strong> nella pagina della fattura emessa.</li>
    </ul>
  </div>

  <!-- PAGINA 6: BACKUP, FAQ E CREDITI -->
  <div class="page">
    <h1>8. Operazioni Quotidiane & Backup con 1 Clic</h1>
    <p>
      Tutti i comandi per l'utilizzo quotidiano sono pronti nella cartella principale del programma:
    </p>

    <table>
      <thead>
        <tr>
          <th>Operazione</th>
          <th>File su Ubuntu Linux</th>
          <th>File su Windows 11</th>
          <th>Funzione Eseguita</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Avvio Gestionale</strong></td>
          <td><code>./avvia-ubuntu.sh</code></td>
          <td><code>avvia-windows.bat</code></td>
          <td>Avvia il database, lancia il server e apre il browser su <code>http://localhost:3000</code>.</td>
        </tr>
        <tr>
          <td><strong>Arresto Ordinato</strong></td>
          <td><code>./ferma-ubuntu.sh</code></td>
          <td><code>ferma-windows.bat</code></td>
          <td>Arresta i container e il server in sicurezza senza perdita di dati.</td>
        </tr>
        <tr>
          <td><strong>Backup Database</strong></td>
          <td><code>./backup-database-ubuntu.sh</code></td>
          <td><code>backup-database-windows.bat</code></td>
          <td>Salva con 1 clic una copia completa del database nella cartella <code>backups/</code>.</td>
        </tr>
      </tbody>
    </table>

    <div class="callout callout-warning">
      <strong>💾 Regola di salvataggio consigliata:</strong> Esegui lo script di backup a fine settimana o a fine mese e copia periodicamente la cartella <code>backups/</code> su una chiavetta USB esterna o unità di rete protetta dello studio.
    </div>

    <h1>9. Domande Frequenti (FAQ)</h1>

    <h3>D: Posso modificare una bozza prima di emetterla?</h3>
    <p>
      <strong>R:</strong> Sì. Nella bozza puoi aggiungere righe di prestazione, modificare descrizioni o importi, oppure annullarla (le attività collegate torneranno disponibili per un'altra fatturazione).
    </p>

    <h3>D: L'Avviso di Parcella genera imposte o IVA?</h3>
    <p>
      <strong>R:</strong> No. È un promemoria provvisorio con filigrana "BOZZA — NON EMESSA" ed è escluso dal fatturato contabile. La fattura fiscale nasce solo al momento dell'emissione ufficiale.
    </p>

    <h3>D: Posso registrare un acconto e il saldo in due momenti diversi?</h3>
    <p>
      <strong>R:</strong> Sì. Registrando il primo acconto la fattura rimane in "Da incassare" mostrando il saldo residuo. Quando registri il saldo finale, la fattura passa automaticamente tra le "Incassate".
    </p>

    <div style="margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 8.5pt; color: #64748b;">
      <p style="margin: 0 0 3px 0;"><strong>Gestionale Attività e Fatturazione Studio Professionale</strong></p>
      <p style="margin: 0 0 3px 0;">Sviluppato per lo studio del <strong>Dott. Antonio Tuzio</strong> — Dottore Commercialista</p>
      <p style="margin: 0;">Progetto software e documentazione tecnica realizzati da <strong>Leoni Mattia</strong></p>
    </div>
  </div>

</body>
</html>
`;

async function main() {
  const htmlPath = path.join(__dirname, 'GUIDA_GESTIONALE_DOTT_TUZIO.html');
  const pdfPath = path.join(__dirname, 'GUIDA_GESTIONALE_DOTT_TUZIO.pdf');

  console.log('Scrittura file HTML della guida...');
  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log('File HTML creato:', htmlPath);

  console.log('Avvio rendering PDF con Microsoft Edge headless...');
  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  let executablePath = '';
  for (const p of edgePaths) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  if (!executablePath) {
    console.error('Nessun eseguibile Edge trovato!');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Generazione del file PDF in formato A4...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm',
    },
  });

  await browser.close();
  console.log('======================================================================');
  console.log('✅ GUIDA GENERATA CON SUCCESSO!');
  console.log('PDF:', pdfPath);
  console.log('Dimensioni PDF:', Math.round(fs.statSync(pdfPath).size / 1024), 'KB');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('Errore generazione PDF:', err);
  process.exit(1);
});
