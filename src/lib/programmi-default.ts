// src/lib/programmi-default.ts
// Programmi predefiniti dello studio professionale per adempimenti fiscali, previdenziali e catastali

export interface ProgrammaVersioneDef {
  anno: string
  etichetta: string
  comandoWindows?: string | null
  comandoLinux?: string | null
  webUrl?: string | null
}

export interface StudioProgramDef {
  nome: string
  descrizione: string
  categoria: string
  icona: string
  comandoLinux: string | null
  comandoWindows: string | null
  webUrl: string | null
  ordinamento: number
  versioni?: ProgrammaVersioneDef[]
}

export const DEFAULT_PROGRAMMI: StudioProgramDef[] = [
  {
    nome: 'Desktop Telematico (Entratel / FileInternet)',
    descrizione: 'Software ufficiale Agenzia delle Entrate per invio telematico dichiarazioni fiscali, F24 e atti',
    categoria: 'Fiscale',
    icona: 'Monitor',
    comandoLinux: '~/Scaricati/DesktopTelematico-linux64_140/DesktopTelematico',
    comandoWindows: 'C:\\DesktopTelematico\\DesktopTelematico.exe',
    webUrl: 'https://telematici.agenziaentrate.gov.it/',
    ordinamento: 1,
  },
  {
    nome: 'INPS Controlli UniEMens',
    descrizione: 'Software INPS di controllo, validazione formale e squadratura dei flussi mensili UniEMens',
    categoria: 'Previdenziale',
    icona: 'Users',
    comandoLinux: '/opt/INPS - Controlli Uniemens/inps-controlli-uniemens',
    comandoWindows: 'C:\\INPS\\UniEMens\\uniemens.bat',
    webUrl: 'https://www.inps.it/it/it/servizi-e-ricerca/servizi-per/aziende-e-consulenti.html',
    ordinamento: 2,
  },
  {
    nome: 'Dichiarazioni dei Redditi (Redditi PF / SP / SC / 730)',
    descrizione: 'Pacchetto per la compilazione e il calcolo delle dichiarazioni dei redditi annuali e modelli 730',
    categoria: 'Fiscale',
    icona: 'FileSpreadsheet',
    comandoLinux: 'redditionline',
    comandoWindows: 'C:\\RedditiOnline\\redditi.exe',
    webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazioni-e-comunicazioni',
    ordinamento: 3,
    versioni: [
      {
        anno: '2025',
        etichetta: 'Redditi / 730 2025 (Periodo 2024)',
        comandoWindows: 'C:\\RedditiOnline2025\\redditi.exe',
        comandoLinux: 'redditi2025',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazione-redditi-persone-fisiche-2025',
      },
      {
        anno: '2024',
        etichetta: 'Redditi / 730 2024 (Periodo 2023)',
        comandoWindows: 'C:\\RedditiOnline2024\\redditi.exe',
        comandoLinux: 'redditi2024',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazione-redditi-persone-fisiche-2024',
      },
      {
        anno: '2023',
        etichetta: 'Redditi / 730 2023 (Periodo 2022)',
        comandoWindows: 'C:\\RedditiOnline2023\\redditi.exe',
        comandoLinux: 'redditi2023',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazione-redditi-persone-fisiche-2023',
      },
      {
        anno: '2022',
        etichetta: 'Redditi / 730 2022 (Periodo 2021)',
        comandoWindows: 'C:\\RedditiOnline2022\\redditi.exe',
        comandoLinux: 'redditi2022',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazione-redditi-persone-fisiche-2022',
      },
    ],
  },
  {
    nome: 'Comunicazioni LIPE (Liquidazioni IVA)',
    descrizione: 'Modulo per la preparazione e il controllo delle comunicazioni liquidazioni periodiche IVA trimestrali',
    categoria: 'Fiscale',
    icona: 'Receipt',
    comandoLinux: 'lipe',
    comandoWindows: 'C:\\LIPE\\lipe.exe',
    webUrl: 'https://ivaservizi.agenziaentrate.gov.it/portale/',
    ordinamento: 4,
    versioni: [
      {
        anno: '2025',
        etichetta: 'LIPE Trimestri 2025',
        comandoWindows: 'C:\\LIPE2025\\lipe.exe',
        comandoLinux: 'lipe2025',
        webUrl: 'https://ivaservizi.agenziaentrate.gov.it/portale/',
      },
      {
        anno: '2024',
        etichetta: 'LIPE Trimestri 2024',
        comandoWindows: 'C:\\LIPE2024\\lipe.exe',
        comandoLinux: 'lipe2024',
        webUrl: 'https://ivaservizi.agenziaentrate.gov.it/portale/',
      },
      {
        anno: '2023',
        etichetta: 'LIPE Trimestri 2023',
        comandoWindows: 'C:\\LIPE2023\\lipe.exe',
        comandoLinux: 'lipe2023',
        webUrl: 'https://ivaservizi.agenziaentrate.gov.it/portale/',
      },
    ],
  },
  {
    nome: 'Certificazione Unica (CU)',
    descrizione: 'Software di compilazione e predisposizione delle Certificazioni Uniche per lavoratori e autonomi',
    categoria: 'Fiscale',
    icona: 'FileText',
    comandoLinux: 'cu',
    comandoWindows: 'C:\\CU\\cu.exe',
    webUrl: 'https://www.agenziaentrate.gov.it/portale/certificazione-unica',
    ordinamento: 5,
    versioni: [
      {
        anno: '2025',
        etichetta: 'Certificazione Unica 2025 (Redditi 2024)',
        comandoWindows: 'C:\\CU2025\\cu.exe',
        comandoLinux: 'cu2025',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/certificazione-unica-2025',
      },
      {
        anno: '2024',
        etichetta: 'Certificazione Unica 2024 (Redditi 2023)',
        comandoWindows: 'C:\\CU2024\\cu.exe',
        comandoLinux: 'cu2024',
        webUrl: 'https://www.agenziaentrate.gov.it/portale/certificazione-unica-2024',
      },
    ],
  },
  {
    nome: 'F24 Online (Compilazione & Invio)',
    descrizione: 'Applicativo AdE per la compilazione, verifica e generazione telematica dei modelli di versamento F24',
    categoria: 'Fiscale',
    icona: 'CreditCard',
    comandoLinux: 'f24online',
    comandoWindows: 'C:\\F24Online\\f24.exe',
    webUrl: 'https://telematici.agenziaentrate.gov.it/',
    ordinamento: 6,
  },
  {
    nome: 'Sister — Visure Catastali e Ipotecarie',
    descrizione: 'Piattaforma telematica dell\'Agenzia delle Entrate per visure, planimetrie e volture catastali',
    categoria: 'Catasto & Immobili',
    icona: 'Building2',
    comandoLinux: null,
    comandoWindows: null,
    webUrl: 'https://sister.agenziaentrate.gov.it/Main/index.jsp',
    ordinamento: 7,
  },
]
