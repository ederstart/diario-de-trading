'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trades, tradingSettings, tradingPairs, user, profileProgress } from '@/lib/db/schema'
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm'
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
  const xp = rows.length * 100
  const coins = rows.filter((trade) => trade.followedPlan).length * 10
  await db.insert(profileProgress).values({ userId: id, xp: String(xp), coins: String(coins) }).onConflictDoNothing()
  const progressRows = await db.select().from(profileProgress).where(eq(profileProgress.userId, id))
  const progress = progressRows[0] ?? { xp: String(xp), coins: String(coins), selectedTitle: 'Começando a jornada', selectedCosmetic: 'padrão', avatarPath: null }
  return { trades: rows.map((t) => ({ ...t, amount: Number(t.amount), payout: Number(t.payout), profit: Number(t.profit), tradedAt: t.tradedAt.toISOString() })), settings: settings[0] ? { ...settings[0], initialBalance: Number(settings[0].initialBalance), taxRate: Number(settings[0].taxRate), dailyGoal: Number(settings[0].dailyGoal) } : null, pairs: pairs.map((p) => p.symbol), user: profile[0], progress: { ...progress, xp: Number(progress.xp), coins: Number(progress.coins) } }
}

export async function createTrade(input: { pair: string; direction: string; amount: number; payout: number; result: string; resultAmount?: number; mood: string; followedPlan: boolean; strategy?: string; notes?: string; screenshotPath?: string; tradedAt?: string }) {
  const id = await getUserId()
  const tradedAt = input.tradedAt ? new Date(input.tradedAt) : new Date()
  if (!input.pair?.trim() || !['CALL', 'PUT'].includes(input.direction) || !['win', 'loss', 'break_even'].includes(input.result) || !Number.isFinite(input.amount) || input.amount <= 0 || !Number.isFinite(input.payout) || input.payout < 0 || input.payout > 100 || !['Confiante','Calmo','Neutro','Ansioso','Nervoso'].includes(input.mood) || Number.isNaN(tradedAt.getTime())) throw new Error('Dados da operação inválidos')
  if ([0,6].includes(tradedAt.getDay())) throw new Error('Operações não são permitidas aos finais de semana')
  const dayStart = new Date(tradedAt); dayStart.setHours(0,0,0,0); const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1)
  const sameDay = await db.select({ result: trades.result }).from(trades).where(and(eq(trades.userId,id),eq(trades.result,'loss'),gte(trades.tradedAt,dayStart),lt(trades.tradedAt,dayEnd)))
  if (sameDay.some((t)=>t.result==='loss')) throw new Error('Dia bloqueado após a primeira perda. Volte amanhã.')
  const calculated = input.result === 'win' ? input.amount * input.payout / 100 : input.result === 'loss' ? -input.amount : 0
  const profit = input.result === 'break_even' ? 0 : Number.isFinite(input.resultAmount) ? (input.result === 'loss' ? -Math.abs(input.resultAmount!) : Math.abs(input.resultAmount!)) : calculated
  await db.insert(trades).values({ userId: id, pair: input.pair.trim(), direction: input.direction, amount: input.amount.toFixed(2), payout: input.payout.toFixed(2), result: input.result, profit: profit.toFixed(2), resultAmount: Math.abs(profit).toFixed(2), mood: input.mood, followedPlan: input.followedPlan, strategy: input.strategy || null, notes: input.notes || null, screenshotPath: input.screenshotPath || null, tradedAt })
  await db.insert(profileProgress).values({ userId: id, xp: '100', coins: input.followedPlan ? '10' : '0' }).onConflictDoUpdate({ target: profileProgress.userId, set: { xp: sql`${profileProgress.xp} + 100`, coins: sql`${profileProgress.coins} + ${input.followedPlan ? 10 : 0}`, updatedAt: new Date() } })
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
  if (value.length < 2 || value.length > 40 || /[<>]/.test(value)) throw new Error('Informe um nome de par válido')
  await db.insert(tradingPairs).values({ userId: id, symbol: value }).onConflictDoNothing(); revalidatePath('/')
}

export async function renameTradingPair(previous: string, next: string) { const id=await getUserId(); const value=next.trim().toUpperCase(); if(!/^[A-Z0-9]{2,12}\/[A-Z0-9]{2,12}$/.test(value)) throw new Error('Use o formato EUR/USD'); await db.update(tradingPairs).set({symbol:value}).where(and(eq(tradingPairs.userId,id),eq(tradingPairs.symbol,previous.trim().toUpperCase()))); revalidatePath('/') }

export async function removeTradingPair(symbol: string) { const id=await getUserId(); await db.delete(tradingPairs).where(and(eq(tradingPairs.userId,id),eq(tradingPairs.symbol,symbol.trim().toUpperCase()))); revalidatePath('/') }

export async function updateProgress(input: { title?: string; cosmetic?: string; avatarPath?: string }) { const id = await getUserId(); await db.insert(profileProgress).values({ userId: id, xp: '0', coins: '0', selectedTitle: input.title || 'Começando a jornada', selectedCosmetic: input.cosmetic || 'padrão', avatarPath: input.avatarPath || null }).onConflictDoUpdate({ target: profileProgress.userId, set: { ...(input.title ? { selectedTitle: input.title } : {}), ...(input.cosmetic ? { selectedCosmetic: input.cosmetic } : {}), ...(input.avatarPath ? { avatarPath: input.avatarPath } : {}), updatedAt: new Date() } }); revalidatePath('/') }

export async function updateProfile(name: string) {
  const id = await getUserId(); const value = name.trim()
  if (value.length < 2 || value.length > 80) throw new Error('Nome inválido')
  await db.update(user).set({ name: value, updatedAt: new Date() }).where(eq(user.id, id)); revalidatePath('/')
}
