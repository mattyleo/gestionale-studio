// src/lib/programmi-default.ts
// Programmi predefiniti dello studio professionale per adempimenti fiscali, previdenziali e catastali

export interface StudioProgramDef {
  nome: string
  descrizione: string
  categoria: string
  icona: string
  comandoLinux: string | null
  comandoWindows: string | null
  webUrl: string | null
  ordinamento: number
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
    descrizione: 'Pacchetto ministeriale per la compilazione e il calcolo delle dichiarazioni dei redditi annuali',
    categoria: 'Fiscale',
    icona: 'FileSpreadsheet',
    comandoLinux: 'redditionline',
    comandoWindows: 'C:\\RedditiOnline\\redditi.exe',
    webUrl: 'https://www.agenziaentrate.gov.it/portale/dichiarazioni-e-comunicazioni',
    ordinamento: 3,
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
