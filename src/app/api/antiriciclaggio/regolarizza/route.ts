// src/app/api/antiriciclaggio/regolarizza/route.ts
// Motore di Regolarizzazione Massiva Antiriciclaggio (Regole Tecniche CNDCEC 2025, Regole CdL e Verifiche GdF)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { eseguiRegolarizzazioneCNDCEC } from '@/lib/antiriciclaggio-engine'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  try {
    const res = await eseguiRegolarizzazioneCNDCEC()
    return NextResponse.json({
      ok: true,
      ...res,
      messaggio: `Regolarizzazione completata secondo le Regole Tecniche CNDCEC 2025: ${res.aggiornateObbligate} fascicoli aziendali/P.IVA numerati e valutati con Matrice CNDCEC, e ${res.esonerateCaf} pratiche private (730/CAF/IMU/INPS) classificate come esonerate ex Regola Tecnica n. 2.`,
    })
  } catch (err: any) {
    console.error('Errore POST /api/antiriciclaggio/regolarizza:', err)
    return NextResponse.json({ error: err.message || 'Errore durante la regolarizzazione' }, { status: 500 })
  }
}
