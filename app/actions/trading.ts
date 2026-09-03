'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trades, tradingSettings, tradingPairs, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

export async function getTradingData() {
  const id = await getUserId()
  const [rows, settings, pairs, profile] = await Promise.all([
    db.select().from(trades).where(eq(trades.userId, id)).orderBy(desc(trades.tradedAt)),
    db.select().from(tradingSettings).where(eq(tradingSettings.userId, id)),
    db.select().from(tradingPairs).where(eq(tradingPairs.userId, id)),
    db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, id)),
  ])
  return { trades: rows.map((t) => ({ ...t, amount: Number(t.amount), payout: Number(t.payout), profit: Number(t.profit), tradedAt: t.tradedAt.toISOString() })), settings: settings[0] ? { ...settings[0], initialBalance: Number(settings[0].initialBalance), taxRate: Number(settings[0].taxRate), dailyGoal: Number(settings[0].dailyGoal) } : null, pairs: pairs.map((p) => p.symbol), user: profile[0] }
}

export async function createTrade(input: { pair: string; direction: string; amount: number; payout: number; result: string; mood: string; followedPlan: boolean; strategy?: string; notes?: string; screenshotPath?: string; tradedAt?: string }) {
  const id = await getUserId()
  if (!input.pair || !['CALL', 'PUT'].includes(input.direction) || !['win', 'loss', 'break_even'].includes(input.result) || input.amount <= 0 || input.payout < 0 || input.payout > 100) throw new Error('Dados da operação inválidos')
  const profit = input.result === 'win' ? input.amount * input.payout / 100 : input.result === 'loss' ? -input.amount : 0
  await db.insert(trades).values({ userId: id, pair: input.pair, direction: input.direction, amount: input.amount.toFixed(2), payout: input.payout.toFixed(2), result: input.result, profit: profit.toFixed(2), mood: input.mood, followedPlan: input.followedPlan, strategy: input.strategy || null, notes: input.notes || null, screenshotPath: input.screenshotPath || null, tradedAt: input.tradedAt ? new Date(input.tradedAt) : new Date() })
  revalidatePath('/')
}

export async function updateTrade(input: { id: number; pair: string; direction: string; amount: number; payout: number; result: string; mood: string; followedPlan: boolean; strategy?: string; notes?: string; screenshotPath?: string | null; tradedAt?: string }) {
  const userId = await getUserId()
  if (!input.id || !input.pair || !['CALL', 'PUT'].includes(input.direction) || !['win', 'loss', 'break_even'].includes(input.result) || !Number.isFinite(input.amount) || input.amount <= 0 || !Number.isFinite(input.payout) || input.payout < 0 || input.payout > 100) throw new Error('Dados da operação inválidos')
  const profit = input.result === 'win' ? input.amount * input.payout / 100 : input.result === 'loss' ? -input.amount : 0
  await db.update(trades).set({ pair: input.pair, direction: input.direction, amount: input.amount.toFixed(2), payout: input.payout.toFixed(2), result: input.result, profit: profit.toFixed(2), mood: input.mood, followedPlan: input.followedPlan, strategy: input.strategy || null, notes: input.notes || null, screenshotPath: input.screenshotPath || null, tradedAt: input.tradedAt ? new Date(input.tradedAt) : undefined }).where(eq(trades.id, input.id)).where(eq(trades.userId, userId))
  revalidatePath('/')
}

export async function deleteTrade(id: number) {
  const userId = await getUserId()
  if (!id) throw new Error('Operação inválida')
  await db.delete(trades).where(eq(trades.id, id)).where(eq(trades.userId, userId))
  revalidatePath('/')
}

export async function saveSettings(input: { initialBalance: number; taxRate: number; dailyGoal: number }) {
  const id = await getUserId()
  if (input.initialBalance < 0 || input.taxRate < 0 || input.dailyGoal < 0) throw new Error('Valores inválidos')
  await db.insert(tradingSettings).values({ userId: id, initialBalance: input.initialBalance.toFixed(2), taxRate: input.taxRate.toFixed(2), dailyGoal: input.dailyGoal.toFixed(2) }).onConflictDoUpdate({ target: tradingSettings.userId, set: { initialBalance: input.initialBalance.toFixed(2), taxRate: input.taxRate.toFixed(2), dailyGoal: input.dailyGoal.toFixed(2), updatedAt: new Date() } })
  revalidatePath('/')
}

export async function addTradingPair(symbol: string) {
  const id = await getUserId(); const value = symbol.trim().toUpperCase()
  if (!/^[A-Z0-9]{2,12}\/[A-Z0-9]{2,12}$/.test(value)) throw new Error('Use o formato EUR/USD')
  await db.insert(tradingPairs).values({ userId: id, symbol: value }).onConflictDoNothing(); revalidatePath('/')
}

export async function updateProfile(name: string) {
  const id = await getUserId(); const value = name.trim()
  if (value.length < 2 || value.length > 80) throw new Error('Nome inválido')
  await db.update(user).set({ name: value, updatedAt: new Date() }).where(eq(user.id, id)); revalidatePath('/')
}
