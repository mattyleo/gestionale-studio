// pulisci-db.ts
// Ripulisce completamente il database da tutte le aziende demo, fatture, attività e pagamenti,
// lasciando intatti:
// - L'utente amministratore (Dott. Antonio Tuzio - infooizut@gmail.com)
// - Il profilo dello studio emittente
// - Il tariffario dei servizi dello studio

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=======================================================================')
  console.log('           PULIZIA DATABASE — GESTIONALE STUDIO PROFESSIONALE          ')
  console.log('=======================================================================')
  console.log('Eliminazione dati transazionali e anagrafiche per nuova importazione...')

  // 1. Pagamenti
  const deletedPayments = await prisma.payment.deleteMany({})
  console.log(`✅ Pagamenti eliminati: ${deletedPayments.count}`)

  // 2. Trasmissioni SdI
  const deletedTransmissions = await prisma.invoiceTransmission.deleteMany({})
  console.log(`✅ Trasmissioni SdI eliminate: ${deletedTransmissions.count}`)

  // 3. Righe fattura
  const deletedLines = await prisma.invoiceLine.deleteMany({})
  console.log(`✅ Righe fattura eliminate: ${deletedLines.count}`)

  // 4. Fatture
  const deletedInvoices = await prisma.invoice.deleteMany({})
  console.log(`✅ Fatture eliminate: ${deletedInvoices.count}`)

  // 5. Attività di lavoro (Work Entries)
  const deletedWork = await prisma.workEntry.deleteMany({})
  console.log(`✅ Attività eliminate: ${deletedWork.count}`)

  // 6. Eventi Calendario
  const deletedEvents = await prisma.calendarEvent.deleteMany({})
  console.log(`✅ Eventi calendario eliminati: ${deletedEvents.count}`)

  // 7. Documenti allegati aziende
  const deletedDocs = await prisma.companyDocument.deleteMany({})
  console.log(`✅ Documenti allegati eliminati: ${deletedDocs.count}`)

  // 8. Contatti aziende
  const deletedContacts = await prisma.companyContact.deleteMany({})
  console.log(`✅ Contatti aziende eliminati: ${deletedContacts.count}`)

  // 9. Storico modifiche anagrafiche
  const deletedHistory = await prisma.companyHistorySnapshot.deleteMany({})
  console.log(`✅ Storico anagrafiche eliminato: ${deletedHistory.count}`)

  // 10. Tariffe concordate specifiche per aziende (manteniamo quelle generali del tariffario)
  const deletedCompanyRules = await prisma.priceRule.deleteMany({
    where: { companyId: { not: null } },
  })
  console.log(`✅ Tariffe personalizzate clienti eliminate: ${deletedCompanyRules.count}`)

  // 11. Aziende clienti
  const deletedCompanies = await prisma.company.deleteMany({})
  console.log(`✅ Aziende clienti eliminate: ${deletedCompanies.count}`)

  // 12. Reset contatori numerazione fatture
  const deletedSequences = await prisma.documentSequence.deleteMany({})
  console.log(`✅ Numeratori sequenze azzerati: ${deletedSequences.count}`)

  // 13. Audit events
  const deletedAudit = await prisma.auditEvent.deleteMany({})
  console.log(`✅ Registro audit eliminato: ${deletedAudit.count}`)

  console.log('')
  console.log('-----------------------------------------------------------------------')
  console.log('Verifica integrità dati di base:')

  const usersCount = await prisma.user.count()
  const issuerCount = await prisma.issuerProfile.count()
  const servicesCount = await prisma.service.count()

  console.log(`- Utenti registrati: ${usersCount} (preservati)`)
  console.log(`- Dati Studio Emittente: ${issuerCount} (preservati)`)
  console.log(`- Voci Tariffario: ${servicesCount} (preservate)`)

  console.log('=======================================================================')
  console.log('  DATABASE COMPLETAMENTE PULITO E PRONTO PER L\'IMPORTAZIONE REALE!')
  console.log('=======================================================================')
}

main()
  .catch((e) => {
    console.error('Errore durante la pulizia:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
