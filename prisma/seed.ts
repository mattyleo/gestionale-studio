// prisma/seed.ts — Dati demo per il gestionale fatturazione
// Contiene: utente admin, profilo emittente (Dott. Tuzio), tariffario completo, aziende demo

import { PrismaClient, UserRole, TipoSoggetto, UnitaServizio, ArrotondamentoOre, FatturazFrequenza, WorkEntryStato, WorkEntryOrigine, InvoiceStato } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Decimal } from 'decimal.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Avvio seed database...')

  // ─────────────────────────────────────────────
  // UTENTE ADMIN
  // ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin1234!', 12)

  const adminUser = await prisma.user.upsert({
    where: { email: 'infooizut@gmail.com' },
    update: {},
    create: {
      name: 'Dott. Antonio Tuzio',
      email: 'infooizut@gmail.com',
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  })
  console.log('✅ Utente admin creato:', adminUser.email)

  // ─────────────────────────────────────────────
  // PROFILO EMITTENTE
  // ─────────────────────────────────────────────
  const issuer = await prisma.issuerProfile.upsert({
    where: { id: 'issuer-tuzio' },
    update: {},
    create: {
      id: 'issuer-tuzio',
      denominazione: 'Dott. Antonio Tuzio',
      codiceFiscale: 'TZUNTN69A16D612E',
      partitaIva: '05389400481',
      indirizzo: 'Via Umberto Poli 9/A',
      cap: '42123',
      comune: 'Reggio nell\'Emilia',
      provincia: 'RE',
      paese: 'IT',
      telefono: '0522331628',
      email: 'infooizut@gmail.com',
      iban: 'IT89E0303212804010000063104', // CREDEM dall'esempio
      regimeFiscale: 'RF19',              // Forfetario L. 190/2014
      cassaPrevidenziale: 'TC02',         // CNPADC - Dottori Commercialisti
      aliquotaCassa: new Decimal(4),       // 4% su 100% imponibile
      rivalsa: true,
      bolloVirtuale: true,
      importoBollo: new Decimal(2.00),
      sogliaBollo: new Decimal(77.47),
      aliquotaIva: '0',
      naturaIva: 'N2.2',
      templatePdf: 'default',
      noteDefaultFattura: 'Imposta di bollo assolta in modo virtuale ai sensi dell\'art. 15 del D.P.R. 642/1972 e del DM 17/06/2014 e ss.mm.',
    },
  })
  console.log('✅ Profilo emittente creato:', issuer.denominazione)

  // ─────────────────────────────────────────────
  // SEQUENZA NUMERAZIONE FATTURE
  // ─────────────────────────────────────────────
  await prisma.documentSequence.upsert({
    where: { issuerId_sezionale_anno: { issuerId: issuer.id, sezionale: 'FT', anno: 2026 } },
    update: {},
    create: {
      issuerId: issuer.id,
      sezionale: 'FT',
      anno: 2026,
      ultimoNumero: 0,
    },
  })
  console.log('✅ Sequenza numerazione creata: FT/2026')

  // ─────────────────────────────────────────────
  // SERVIZI / TARIFFARIO
  // ─────────────────────────────────────────────
  const servizi = [
    // DICHIARAZIONI E MODELLI
    {
      codice: 'MOD730S',
      descrizione: 'Modello 730 singolo',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(40),
    },
    {
      codice: 'MOD730C',
      descrizione: 'Modello 730 congiunto',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(65),
    },
    {
      codice: 'ASS_UNICO',
      descrizione: 'Domanda Assegno Unico',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(35),
    },
    {
      codice: 'DIMISSIONI',
      descrizione: 'Dimissioni on Line',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'IMU',
      descrizione: 'IMU calcolo annuale',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(30),
    },
    {
      codice: 'NASPI',
      descrizione: 'Domanda NASPI',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'VERIF_BP',
      descrizione: 'Verifica busta paga e TFR',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(40),
    },
    {
      codice: 'ISEE',
      descrizione: 'ISEE',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(35),
      note: 'Il secondo ISEE dello stesso anno è gratuito',
    },
    {
      codice: 'MOD_REDDITI',
      descrizione: 'Modello Redditi persone fisiche',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    // PRATICHE FISCALI
    {
      codice: 'PIVA_FORF',
      descrizione: 'Attivazione Partita IVA (Contribuenti Forfetari)',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'INAIL_ATT',
      descrizione: 'Pratiche attivazione posizione INAIL',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(40),
    },
    {
      codice: 'REG_IMP',
      descrizione: 'Pratica iscrizione Registro Imprese + attribuzione Partita IVA',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(120),
    },
    {
      codice: 'VAR_DATI',
      descrizione: 'Pratica variazione dati INAIL/INPS/Registro Imprese',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(80),
    },
    // GESTIONE FISCALE FORFETARIA
    {
      codice: 'GEST_FISC_FORF',
      descrizione: 'Gestione fiscale annuale forfetario',
      unita: UnitaServizio.MESE,
      prezzoBase: new Decimal(35),
      note: 'Importo mensile — canone annuale',
    },
    // GESTIONE PAGHE - PER PRATICA
    {
      codice: 'TIRO_ATT',
      descrizione: 'Attivazione tirocinio',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(120),
    },
    {
      codice: 'OCC_ATT',
      descrizione: 'Attivazione rapporti occasionali (Presto / Libretto Famiglia)',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(80),
    },
    {
      codice: 'OCC_GEST',
      descrizione: 'Gestione mensile rapporti occasionali (Presto / Libretto Famiglia)',
      unita: UnitaServizio.MESE,
      prezzoBase: new Decimal(30),
    },
    {
      codice: 'PREST_OCC',
      descrizione: 'Prestazione Occasionale autonoma',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'INQ_DITTA',
      descrizione: 'Pratiche inquadramento ditta paghe',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(120),
    },
    {
      codice: 'ASSUNZIONE',
      descrizione: 'Pratica assunzione dipendente',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'VAR_DIP',
      descrizione: 'Pratica variazione dipendente',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(25),
    },
    {
      codice: 'CESS_DITTA',
      descrizione: 'Pratica cessazione ditta con dipendenti',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'CESS_DITTA_EDILE',
      descrizione: 'Pratica cessazione ditta edile',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'CESS_DITTA_ORD',
      descrizione: 'Pratica cessazione ditta ordinaria',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(35),
    },
    {
      codice: 'INAIL_AUTO',
      descrizione: 'Autoliquidazione annuale INAIL',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(50),
    },
    {
      codice: 'MOD770',
      descrizione: 'Modello 770 dipendenti',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(80),
    },
    {
      codice: 'MOD770_PAGHE',
      descrizione: 'Pratica 770 (solo ditte paghe)',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'VAR_INAIL',
      descrizione: 'Pratiche variazioni INAIL/Unilav/INPS',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(25),
    },
    {
      codice: 'BUDGET_PERS',
      descrizione: 'Budget costo del personale',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
      note: 'Una tantum anche in caso di sola mancata assunzione',
    },
    // DOMANDE PREVIDENZIALI
    {
      codice: 'CONGEDO',
      descrizione: 'Congedi parentali (domanda)',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    {
      codice: 'MATERNITA',
      descrizione: 'Domanda di maternità',
      unita: UnitaServizio.PRATICA,
      prezzoBase: new Decimal(60),
    },
    // BUSTE PAGA — con fasce per numero dipendenti
    // Prezzi base per ditte standard 1-20 dip. (la fascia viene gestita via PriceRule)
    {
      codice: 'BUSTA_PAGA',
      descrizione: 'Elaborazione cedolino paga',
      unita: UnitaServizio.BUSTA_PAGA_FASCIA,
      prezzoBase: new Decimal(25), // Default base (1-20 dip. ordinaria)
      note: 'Il prezzo dipende dal tipo di ditta e dal numero di dipendenti — vedi tariffario fasce',
    },
    // SPESE VIVE (ART. 15 DPR 633)
    {
      codice: 'SPESE_VIVE',
      descrizione: 'Spese vive (art. 15 DPR 633/72)',
      unita: UnitaServizio.QUANTITA,
      prezzoBase: null,
      note: 'Importo da impostare manualmente al momento dell\'inserimento',
    },
    // CONSULENZA ORARIA
    {
      codice: 'CONSULENZA',
      descrizione: 'Consulenza professionale (ora)',
      unita: UnitaServizio.ORA,
      tariffaOraria: new Decimal(80),
      arrotondamento: ArrotondamentoOre.COMMERCIALE,
    },
    // RICOSTRUZIONE CARRIERA
    {
      codice: 'RIC_CARRIERA',
      descrizione: 'Conteggi ricostruzione carriera lavorativa',
      unita: UnitaServizio.PRATICA,
      prezzoBase: null,
      note: 'Importo da definire in base al numero di anni verificati',
    },
  ]

  for (const servizio of servizi) {
    await prisma.service.upsert({
      where: { codice: servizio.codice },
      update: {},
      create: {
        codice: servizio.codice,
        descrizione: servizio.descrizione,
        unita: servizio.unita,
        prezzoBase: servizio.prezzoBase ?? null,
        tariffaOraria: (servizio as any).tariffaOraria ?? null,
        aliquotaIva: '0',
        naturaIva: 'N2.2',
        arrotondamento: (servizio as any).arrotondamento ?? ArrotondamentoOre.COMMERCIALE,
        attivo: true,
        note: servizio.note ?? null,
        validoDal: new Date('2025-01-01'),
      },
    })
  }
  console.log(`✅ ${servizi.length} servizi del tariffario creati`)

  // ─────────────────────────────────────────────
  // TARIFFE A FASCE — BUSTE PAGA
  // ─────────────────────────────────────────────
  const bustaPagaService = await prisma.service.findUnique({ where: { codice: 'BUSTA_PAGA' } })
  if (bustaPagaService) {
    const fasceGenerali = [
      // Ditte edilizia 1-20 dipendenti
      { tipoDitta: 'edilizia', dipendentiMin: 1, dipendentiMax: 20, prezzoUnitario: new Decimal(35) },
      // Ditte ordinarie 1-20 dipendenti
      { tipoDitta: 'ordinaria', dipendentiMin: 1, dipendentiMax: 20, prezzoUnitario: new Decimal(25) },
      // Ditte ordinarie 21-30 dipendenti
      { tipoDitta: 'ordinaria', dipendentiMin: 21, dipendentiMax: 30, prezzoUnitario: new Decimal(20) },
    ]

    for (const fascia of fasceGenerali) {
      // Controlla se esiste già
      const existing = await prisma.priceRule.findFirst({
        where: {
          serviceId: bustaPagaService.id,
          companyId: null,
          tipoDitta: fascia.tipoDitta,
          dipendentiMin: fascia.dipendentiMin,
          dipendentiMax: fascia.dipendentiMax,
        },
      })
      if (!existing) {
        await prisma.priceRule.create({
          data: {
            serviceId: bustaPagaService.id,
            companyId: null,
            tipoDitta: fascia.tipoDitta,
            dipendentiMin: fascia.dipendentiMin,
            dipendentiMax: fascia.dipendentiMax,
            prezzoUnitario: fascia.prezzoUnitario,
            validaDal: new Date('2025-01-01'),
            attiva: true,
            note: `Tariffa generale: ${fascia.tipoDitta}, ${fascia.dipendentiMin}-${fascia.dipendentiMax ?? '∞'} dipendenti`,
          },
        })
      }
    }
    console.log('✅ Fasce tariffarie buste paga create')
  }

  // ─────────────────────────────────────────────
  // AZIENDE DEMO
  // ─────────────────────────────────────────────
  const consorziRc = await prisma.company.upsert({
    where: { id: 'company-consorzio-rc' },
    update: {},
    create: {
      id: 'company-consorzio-rc',
      ragioneSociale: 'CONSORZIO RC',
      tipoSoggetto: TipoSoggetto.PERSONA_GIURIDICA,
      codiceFiscale: '03095370353',
      partitaIva: '03095370353',
      indirizzo: 'Via Gattalupa 23/4',
      cap: '42122',
      comune: 'Reggio nell\'Emilia',
      provincia: 'RE',
      paese: 'IT',
      modalitaPagamento: 'MP05',
      terminiPagamento: 30,
      frequenzaFatturazione: FatturazFrequenza.MENSILE,
      attivo: true,
    },
  })

  // Aggiungi altre aziende demo per testare tutte le funzionalità
  const alfaEdilSrl = await prisma.company.upsert({
    where: { id: 'company-alfa-edil' },
    update: {},
    create: {
      id: 'company-alfa-edil',
      ragioneSociale: 'ALFA EDIL SRL',
      tipoSoggetto: TipoSoggetto.PERSONA_GIURIDICA,
      codiceFiscale: '02500000356',
      partitaIva: '02500000356',
      indirizzo: 'Via Roma 15',
      cap: '42100',
      comune: 'Reggio nell\'Emilia',
      provincia: 'RE',
      paese: 'IT',
      modalitaPagamento: 'MP05',
      terminiPagamento: 30,
      frequenzaFatturazione: FatturazFrequenza.MENSILE,
      note: 'Ditta edilizia — usare tariffa buste paga edilizia',
      attivo: true,
    },
  })

  const rossiBiancaPrivato = await prisma.company.upsert({
    where: { id: 'company-rossi-bianca' },
    update: {},
    create: {
      id: 'company-rossi-bianca',
      ragioneSociale: 'Rossi Bianca',
      tipoSoggetto: TipoSoggetto.PERSONA_FISICA,
      codiceFiscale: 'RSSBCN85M41H501Z',
      partitaIva: null,
      indirizzo: 'Via Verdi 5',
      cap: '42121',
      comune: 'Reggio nell\'Emilia',
      provincia: 'RE',
      paese: 'IT',
      modalitaPagamento: 'MP05',
      terminiPagamento: 30,
      frequenzaFatturazione: FatturazFrequenza.ANNUALE,
      attivo: true,
    },
  })

  console.log('✅ Aziende demo create: CONSORZIO RC, ALFA EDIL SRL, Rossi Bianca')

  // ─────────────────────────────────────────────
  // ATTIVITÀ DEMO
  // ─────────────────────────────────────────────
  const bustaPagaServ = await prisma.service.findUnique({ where: { codice: 'BUSTA_PAGA' } })
  const assunzioneServ = await prisma.service.findUnique({ where: { codice: 'ASSUNZIONE' } })
  const mod730Serv = await prisma.service.findUnique({ where: { codice: 'MOD730S' } })
  const inailServ = await prisma.service.findUnique({ where: { codice: 'INAIL_AUTO' } })

  if (bustaPagaServ && assunzioneServ && mod730Serv) {
    // Attività approvate per CONSORZIO RC (aprile-agosto 2026 come nell'esempio)
    const mesi = [
      new Date('2026-04-30'),
      new Date('2026-05-31'),
      new Date('2026-06-30'),
      new Date('2026-07-31'),
      new Date('2026-08-31'),
    ]

    for (const data of mesi) {
      const label = data.toISOString().substring(0, 7)
      const existing = await prisma.workEntry.findFirst({
        where: { companyId: consorziRc.id, data, serviceId: bustaPagaServ.id },
      })
      if (!existing) {
        await prisma.workEntry.create({
          data: {
            companyId: consorziRc.id,
            serviceId: bustaPagaServ.id,
            operatoreId: adminUser.id,
            data,
            descrizione: `Elaborazione cedolini paga ${label}`,
            quantita: new Decimal(5), // 5 cedolini come nell'esempio
            prezzoUnitario: new Decimal(35),
            importo: new Decimal(175),
            numeroDipendenti: 5,
            tipoDitta: 'ordinaria',
            stato: WorkEntryStato.APPROVATA,
            origine: WorkEntryOrigine.MANUALE,
          },
        })
      }
    }
    console.log('✅ 5 attività di elaborazione cedolini create per CONSORZIO RC')

    // Attività per ALFA EDIL — buste paga edilizia
    const mesoCorrente = new Date('2026-09-30')
    const existingEdil = await prisma.workEntry.findFirst({
      where: { companyId: alfaEdilSrl.id, data: mesoCorrente },
    })
    if (!existingEdil) {
      await prisma.workEntry.create({
        data: {
          companyId: alfaEdilSrl.id,
          serviceId: bustaPagaServ.id,
          operatoreId: adminUser.id,
          data: mesoCorrente,
          descrizione: 'Elaborazione cedolini paga settembre 2026',
          quantita: new Decimal(8),
          prezzoUnitario: new Decimal(35),
          importo: new Decimal(280),
          numeroDipendenti: 8,
          tipoDitta: 'edilizia',
          stato: WorkEntryStato.DA_VERIFICARE,
          origine: WorkEntryOrigine.MANUALE,
        },
      })
    }

    // Attività per Rossi Bianca — 730
    const existing730 = await prisma.workEntry.findFirst({
      where: { companyId: rossiBiancaPrivato.id, serviceId: mod730Serv.id },
    })
    if (!existing730) {
      await prisma.workEntry.create({
        data: {
          companyId: rossiBiancaPrivato.id,
          serviceId: mod730Serv.id,
          operatoreId: adminUser.id,
          data: new Date('2026-06-15'),
          descrizione: 'Modello 730 singolo 2026 (redditi 2025)',
          quantita: new Decimal(1),
          prezzoUnitario: new Decimal(40),
          importo: new Decimal(40),
          stato: WorkEntryStato.APPROVATA,
          origine: WorkEntryOrigine.MANUALE,
        },
      })
    }
    console.log('✅ Attività demo aggiuntive create')
  }

  // ─────────────────────────────────────────────
  // FATTURA DEMO — equivalente dell'esempio ricevuto
  // ─────────────────────────────────────────────
  const seq = await prisma.documentSequence.findFirst({
    where: { issuerId: issuer.id, sezionale: 'FT', anno: 2026 },
  })

  if (seq) {
    const existingInvoice = await prisma.invoice.findUnique({
      where: { numeroCompleto: 'FT 1/2026' },
    })

    if (!existingInvoice) {
      // Crea la fattura demo emessa (equivalente del PRO 48/2026 dell'esempio)
      const invoice = await prisma.invoice.create({
        data: {
          sequenceId: seq.id,
          numero: 1,
          sezionale: 'FT',
          anno: 2026,
          numeroCompleto: 'FT 1/2026',
          companyId: consorziRc.id,
          dataDocumento: new Date('2026-09-26'),
          dataScadenza: new Date('2026-09-26'),
          imponibile: new Decimal(177.00),
          totaleCassa: new Decimal(7.08),
          totaleIva: new Decimal(0),
          bollo: new Decimal(2.00),
          totaleDocumento: new Decimal(184.08),
          modalitaPagamento: 'MP05',
          terminiPagamento: 0,
          ibanDestinatario: 'IT89E0303212804010000063104',
          stato: InvoiceStato.EMESSA,
          periodoDal: new Date('2026-04-01'),
          periodoAl: new Date('2026-08-31'),
          note: 'Elaborazioni buste paga aprile maggio giugno luglio agosto 2026\nImposta di bollo assolta in modo virtuale ai sensi dell\'art. 15 del D.P.R. 642/1972 e del DM 17/06/2014 e ss.mm.',
          emessaAl: new Date('2026-09-26'),
          snapshotEmittente: {
            denominazione: 'Dott. Antonio Tuzio',
            codiceFiscale: 'TZUNTN69A16D612E',
            partitaIva: '05389400481',
            indirizzo: 'Via Umberto Poli 9/A',
            cap: '42123',
            comune: 'Reggio nell\'Emilia',
            provincia: 'RE',
            paese: 'IT',
            regimeFiscale: 'RF19',
            cassaPrevidenziale: 'TC02',
            iban: 'IT89E0303212804010000063104',
          },
          snapshotCliente: {
            ragioneSociale: 'CONSORZIO RC',
            partitaIva: '03095370353',
            codiceFiscale: '03095370353',
            indirizzo: 'Via Gattalupa 23/4',
            cap: '42122',
            comune: 'Reggio nell\'Emilia',
            provincia: 'RE',
            paese: 'IT',
          },
        },
      })

      // Aggiorna il counter della sequenza
      await prisma.documentSequence.update({
        where: { id: seq.id },
        data: { ultimoNumero: 1 },
      })

      // Righe fattura
      await prisma.invoiceLine.createMany({
        data: [
          {
            invoiceId: invoice.id,
            ordinamento: 1,
            descrizione: 'Elaborazioni cedolini di periodo (apr-ago 2026)',
            quantita: new Decimal(5),
            prezzoUnitario: new Decimal(35.00),
            importo: new Decimal(175.00),
            aliquotaIva: '0',
            naturaIva: 'N2.2',
            serviceCodice: 'BUSTA_PAGA',
            serviceDescrizione: 'Elaborazione cedolino paga',
          },
          {
            invoiceId: invoice.id,
            ordinamento: 2,
            descrizione: 'Addebito bollo (imposta di bollo assolta virtualmente)',
            quantita: new Decimal(1),
            prezzoUnitario: new Decimal(2.00),
            importo: new Decimal(2.00),
            aliquotaIva: '0',
            naturaIva: 'N2.2',
          },
        ],
      })

      // Pagamento demo (fattura pagata per testare il flusso)
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          importo: new Decimal(184.08),
          dataValuta: new Date('2026-09-26'),
          dataIncasso: new Date('2026-09-26'),
          metodo: 'bonifico',
          riferimento: 'Bonifico CREDEM',
          note: 'Pagamento in unica soluzione',
          registratoDa: adminUser.id,
        },
      })

      console.log('✅ Fattura demo FT 1/2026 creata con righe e pagamento')
    }
  }

  // ─────────────────────────────────────────────
  // FATTURA IN BOZZA DEMO
  // ─────────────────────────────────────────────
  const existingBozza = await prisma.invoice.findFirst({
    where: { companyId: rossiBiancaPrivato.id, stato: InvoiceStato.BOZZA },
  })
  if (!existingBozza) {
    const bozza = await prisma.invoice.create({
      data: {
        companyId: rossiBiancaPrivato.id,
        sezionale: 'FT',
        anno: 2026,
        imponibile: new Decimal(40),
        totaleCassa: new Decimal(1.60),
        totaleIva: new Decimal(0),
        bollo: new Decimal(0), // Sotto soglia bollo
        totaleDocumento: new Decimal(41.60),
        stato: InvoiceStato.BOZZA,
        periodoDal: new Date('2026-06-01'),
        periodoAl: new Date('2026-06-30'),
        noteInterne: 'BOZZA — Attendere approvazione prima di emettere',
      },
    })

    await prisma.invoiceLine.create({
      data: {
        invoiceId: bozza.id,
        ordinamento: 1,
        descrizione: 'Modello 730 singolo 2026 (redditi 2025)',
        quantita: new Decimal(1),
        prezzoUnitario: new Decimal(40),
        importo: new Decimal(40),
        aliquotaIva: '0',
        naturaIva: 'N2.2',
        serviceCodice: 'MOD730S',
      },
    })
    console.log('✅ Fattura bozza demo creata per Rossi Bianca')
  }

  // ─────────────────────────────────────────────
  // AUDIT LOG demo
  // ─────────────────────────────────────────────
  // Audit log demo — nota: non usiamo entityType='Invoice' per evitare FK constraint nel seed
  await prisma.auditEvent.create({
    data: {
      userId: adminUser.id,
      entityType: 'System',
      entityId: 'seed',
      azione: 'SEED_COMPLETED',
      dettagli: { messaggio: 'Database inizializzato con dati demo', versione: '1.0' },
    },
  })

  console.log('')
  console.log('🎉 Seed completato con successo!')
  console.log('')
  console.log('📧 Login: infooizut@gmail.com')
  console.log('🔑 Password: Admin1234!')
  console.log('')
  console.log('⚠️  ATTENZIONE: Cambia la password al primo accesso!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Errore seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
