import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import Decimal from 'decimal.js';

/**
 * Combina classi CSS con clsx e tailwind-merge
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatta un importo in euro nel formato italiano
 * Esempio: 184.08 -> '184,08 €'
 */
export function formatEuro(amount: Decimal | number | string): string {
  let num: number;

  if (amount instanceof Decimal) {
    num = amount.toNumber();
  } else if (typeof amount === 'string') {
    num = parseFloat(amount);
  } else {
    num = amount;
  }

  if (isNaN(num)) return '0,00 €';

  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + ' €';
}

/**
 * Formatta una data nel formato breve italiano
 * Esempio: '26/09/2026'
 */
export function formatData(
  date: Date | string | null,
  formato: string = 'dd/MM/yyyy'
): string {
  if (!date) return '-';

  let d: Date;

  if (typeof date === 'string') {
    d = parseISO(date);
  } else {
    d = date;
  }

  if (!isValid(d)) return '-';

  return format(d, formato, { locale: it });
}

/**
 * Formatta una data nel formato lungo italiano
 * Esempio: '26 settembre 2026'
 */
export function formatDataLunga(date: Date | string | null): string {
  return formatData(date, 'd MMMM yyyy');
}

/**
 * Calcola l'importo di una riga (quantità × prezzo unitario)
 */
export function calcolaImportoRiga(
  quantita: number,
  prezzoUnitario: number
): number {
  return new Decimal(quantita).mul(new Decimal(prezzoUnitario)).toNumber();
}

/**
 * Calcola l'arrotondamento ore a partire dai minuti
 * - COMMERCIALE: arrotonda a mezz'ora commerciale (>= 15 min -> 0.5, >= 45 -> 1.0)
 * - SEMPRE_SU: arrotonda sempre all'ora intera superiore
 * - SEMPRE_GIU: arrotonda sempre all'ora intera inferiore (floor)
 * - QUARTO_ORA: arrotonda al quarto d'ora più vicino
 */
export function calcolaArrotondamentoOre(
  minuti: number,
  tipo: 'COMMERCIALE' | 'SEMPRE_SU' | 'SEMPRE_GIU' | 'QUARTO_ORA'
): number {
  const oreDecimali = minuti / 60;

  switch (tipo) {
    case 'COMMERCIALE': {
      const ore = Math.floor(oreDecimali);
      const minutiResto = minuti % 60;
      if (minutiResto < 15) return ore;
      if (minutiResto < 45) return ore + 0.5;
      return ore + 1;
    }
    case 'SEMPRE_SU': {
      return Math.ceil(oreDecimali);
    }
    case 'SEMPRE_GIU': {
      return Math.floor(oreDecimali);
    }
    case 'QUARTO_ORA': {
      return Math.round(oreDecimali * 4) / 4;
    }
    default:
      return oreDecimali;
  }
}

/**
 * Mappa lo stato di una fattura in etichetta leggibile
 */
export function statoInvoiceLabel(stato: string): string {
  const mappa: Record<string, string> = {
    BOZZA: 'Bozza',
    APPROVATA: 'Approvata',
    EMESSA: 'Emessa',
    PARZIALMENTE_PAGATA: 'Parz. pagata',
    PAGATA: 'Pagata',
    ANNULLATA: 'Annullata',
    STORNATA: 'Stornata',
  };
  return mappa[stato] ?? stato;
}

/**
 * Mappa lo stato di una work entry in etichetta leggibile
 */
export function statoWorkEntryLabel(stato: string): string {
  const mappa: Record<string, string> = {
    DA_CLASSIFICARE: 'Da classificare',
    DA_VERIFICARE: 'Da verificare',
    APPROVATA: 'Approvata',
    IN_BOZZA: 'In bozza',
    FATTURATA: 'Fatturata',
    NON_FATTURABILE: 'Non fatturabile',
    ANNULLATA: 'Annullata',
  };
  return mappa[stato] ?? stato;
}

/**
 * Restituisce le classi Tailwind per il badge colore in base allo stato fattura
 */
export function statoInvoiceBadgeColor(stato: string): string {
  const mappa: Record<string, string> = {
    BOZZA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVATA: 'bg-blue-100 text-blue-800 border-blue-200',
    EMESSA: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    PARZIALMENTE_PAGATA: 'bg-orange-100 text-orange-800 border-orange-200',
    PAGATA: 'bg-green-100 text-green-800 border-green-200',
    ANNULLATA: 'bg-gray-100 text-gray-600 border-gray-200',
    STORNATA: 'bg-red-100 text-red-800 border-red-200',
  };
  return mappa[stato] ?? 'bg-gray-100 text-gray-600 border-gray-200';
}
