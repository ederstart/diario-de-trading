'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trades, tradingSettings } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function userId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

export async function getTradingData() {
  const id = await userId()
  const [rows, settings] = await Promise.all([
    db.select().from(trades).where(eq(trades.userId, id)).orderBy(desc(trades.tradedAt)),
    db.select().from(tradingSettings).where(eq(tradingSettings.userId, id)),
  ])
  return { trades: rows.map((t) => ({ ...t, amount: Number(t.amount), payout: Number(t.payout), profit: Number(t.profit), tradedAt: t.tradedAt.toISOString() })), settings: settings[0] ? { ...settings[0], initialBalance: Number(settings[0].initialBalance), taxRate: Number(settings[0].taxRate), dailyGoal: Number(settings[0].dailyGoal) } : null }
}

export async function createTrade(input: { pair: string; direction: string; amount: number; payout: number; result: string; mood: string; followedPlan: boolean; strategy?: string; notes?: string }) {
  const id = await userId()
  if (!input.pair || !['CALL', 'PUT'].includes(input.direction) || !['win', 'loss', 'break_even'].includes(input.result) || input.amount <= 0 || input.payout < 0 || input.payout > 100) throw new Error('Dados da operação inválidos')
  const profit = input.result === 'win' ? input.amount * input.payout / 100 : input.result === 'loss' ? -input.amount : 0
  await db.insert(trades).values({ userId: id, pair: input.pair, direction: input.direction, amount: input.amount.toFixed(2), payout: input.payout.toFixed(2), result: input.result, profit: profit.toFixed(2), mood: input.mood, followedPlan: input.followedPlan, strategy: input.strategy || null, notes: input.notes || null })
  revalidatePath('/')
}

export async function saveSettings(input: { initialBalance: number; taxRate: number; dailyGoal: number }) {
  const id = await userId()
  await db.insert(tradingSettings).values({ userId: id, initialBalance: input.initialBalance.toFixed(2), taxRate: input.taxRate.toFixed(2), dailyGoal: input.dailyGoal.toFixed(2) }).onConflictDoUpdate({ target: tradingSettings.userId, set: { initialBalance: input.initialBalance.toFixed(2), taxRate: input.taxRate.toFixed(2), dailyGoal: input.dailyGoal.toFixed(2), updatedAt: new Date() } })
  revalidatePath('/')
}
