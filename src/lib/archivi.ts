// src/lib/archivi.ts
// Utility per la gestione dell'Archivio Documentale Clienti dello Studio

import path from 'path'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import crypto from 'crypto'

export const ARCHIVI_BASE_DIR = path.join(process.cwd(), 'storage', 'archivi')

// Categorie e relative sottocartelle
export const CATEGORIE_ARCHIVIO = [
  { id: 'documenti_identita', label: 'Documenti di Riconoscimento', dir: '01_Documenti_Identita', icon: 'UserCheck' },
  { id: 'visure_catasto', label: 'Visure & Catasto', dir: '02_Visure_e_Catasto', icon: 'FileSearch' },
  { id: 'terreni_fabbricati', label: 'Terreni & Fabbricati', dir: '03_Terreni_e_Fabbricati', icon: 'Landmark' },
  { id: 'dichiarazioni_fiscali', label: 'Dichiarazioni Fiscali & Redditi', dir: '04_Dichiarazioni_Fiscali', icon: 'FileText' },
  { id: 'f24_pagamenti', label: 'Modelli F24 & Pagamenti', dir: '05_F24_e_Pagamenti', icon: 'CreditCard' },
  { id: 'lipe_iva', label: 'LIPE & Comunicazioni IVA', dir: '06_LIPE_e_IVA', icon: 'Receipt' },
  { id: 'contratti_incarichi', label: 'Contratti & Lettere Incarico', dir: '07_Contratti_e_Incarichi', icon: 'FileCheck' },
  { id: 'contabilita_bilanci', label: 'Contabilità & Bilanci', dir: '08_Contabilita_e_Bilanci', icon: 'Calculator' },
  { id: 'altro', label: 'Altri Documenti Studio', dir: '09_Altro', icon: 'Folder' },
] as const

export type CategoriaArchivioId = typeof CATEGORIE_ARCHIVIO[number]['id']

/**
 * Pulisce una stringa per renderla sicura come nome di cartella su file system
 */
export function sanificaNomeCartella(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 50)
}

/**
 * Ricava il nome della cartella del cliente (es: "ROSSI_MARIO_RSSMRA80A01H501Z")
 */
export function getCartellaCliente(ragioneSociale: string, codiceFiscale?: string | null, partitaIva?: string | null): string {
  const base = sanificaNomeCartella(ragioneSociale)
  const idFisc = sanificaNomeCartella(partitaIva || codiceFiscale || 'CLI')
  return `${base}_${idFisc}`
}

/**
 * Genera un codice alfanumerico univoco per il documento:
 * Es: DOC-BORG-20261107-8K3F
 */
export function generaCodiceUnivocoDoc(ragioneSociale: string): string {
  const sigla = sanificaNomeCartella(ragioneSociale).substring(0, 4).toUpperCase().padEnd(4, 'X')
  const dataStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `DOC-${sigla}-${dataStr}-${randomHex}`
}

/**
 * Assicura l'esistenza della cartella fisica su disco per il cliente e la categoria
 */
export async function assicuraCartellaArchivio(
  cartellaCliente: string,
  categoriaId: string
): Promise<string> {
  const cat = CATEGORIE_ARCHIVIO.find(c => c.id === categoriaId) || CATEGORIE_ARCHIVIO[CATEGORIE_ARCHIVIO.length - 1]
  const targetDir = path.join(ARCHIVI_BASE_DIR, cartellaCliente, cat.dir)
  
  if (!fs.existsSync(targetDir)) {
    await fsPromises.mkdir(targetDir, { recursive: true })
  }
  
  return targetDir
}
