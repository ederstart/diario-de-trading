import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tradingPairs, user } from '@/lib/db/schema'
import { headers } from 'next/headers'

const PAIRS = [
  'EUR/USD OTC',
  'AUD/CAD OTC',
  'AUD/CHF OTC',
  'AUD/JPY OTC',
  'AUD/NZD OTC',
  'AUD/USD OTC',
  'CAD/CHF OTC',
  'CAD/JPY OTC',
  'CHF/JPY OTC',
  'EUR/CHF OTC',
  'EUR/GBP OTC',
  'EUR/JPY OTC',
  'EUR/NZD OTC',
  'GBP/AUD OTC',
  'GBP/JPY OTC',
  'GBP/USD OTC',
  'NZD/JPY OTC',
  'NZD/USD OTC',
  'USD/CAD OTC',
  'USD/CHF OTC',
  'USD/JPY OTC',
  'USD/RUB OTC',
  'EUR/RUB OTC',
  'CHF/NOK OTC',
  'EUR/HUF OTC',
  'USD/CNH OTC',
  'EUR/TRY OTC',
  'USD/INR OTC',
  'USD/SGD OTC',
  'USD/CLP OTC',
  'USD/MYR OTC',
  'USD/THB OTC',
  'USD/VND OTC',
  'USD/PKR OTC',
  'USD/COP OTC',
  'USD/EGP OTC',
  'USD/PHP OTC',
  'USD/MXN OTC',
  'USD/DZD OTC',
  'USD/ARS OTC',
  'USD/IDR OTC',
  'USD/BRL OTC',
  'USD/BDT OTC',
  'YER/USD OTC',
  'LBP/USD OTC',
  'TND/USD OTC',
  'MAD/USD OTC',
  'BHD/CNY OTC',
  'AED/CNY OTC',
  'SAR/CNY OTC',
  'QAR/CNY OTC',
  'OMR/CNY OTC',
  'JOD/CNY OTC',
  'NGN/USD OTC',
  'KES/USD OTC',
  'ZAR/USD OTC',
  'UAH/USD OTC',
]

export async function GET(request: NextRequest) {
  // Proteção: exige login + token de seed (defina SEED_TOKEN no Vercel)
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const token = request.nextUrl.searchParams.get('token')
  const expected = process.env.SEED_TOKEN ?? 'seed-otc-2026'
  if (token !== expected) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  try {
    // Insere todos os pares para o usuário logado (idempotente)
    const values = PAIRS.map((symbol) => ({
      userId: session.user.id,
      symbol,
    }))
    const inserted = await db
      .insert(tradingPairs)
      .values(values)
      .onConflictDoNothing()
      .returning({ symbol: tradingPairs.symbol })

    return NextResponse.json({
      ok: true,
      requested: PAIRS.length,
      inserted: inserted.length,
      pairs: inserted.map((r) => r.symbol),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao inserir' },
      { status: 500 }
    )
  }
}
