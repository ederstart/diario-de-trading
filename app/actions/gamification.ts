'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trades, user } from '@/lib/db/schema'
import { ownedFrames, traderProfile } from '@/lib/db/gamification-schema'
import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  computeProgress,
  computeStreak,
  DEFAULT_FRAME,
  FRAME_BY_ID,
  levelFromXp,
  progressForXp,
} from '@/lib/gamification'

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Não autorizado')
  return session.user.id
}

async function ensureProfile(userId: string) {
  const rows = await db.select().from(traderProfile).where(eq(traderProfile.userId, userId))
  if (rows[0]) return rows[0]
  await db.insert(traderProfile).values({ userId }).onConflictDoNothing()
  await db.insert(ownedFrames).values({ userId, frameId: DEFAULT_FRAME }).onConflictDoNothing()
  const created = await db.select().from(traderProfile).where(eq(traderProfile.userId, userId))
  return created[0]
}

export type ProfileData = Awaited<ReturnType<typeof getProfile>>

export async function getProfile() {
  const userId = await getUserId()
  const [profile, tradeRows, account] = await Promise.all([
    ensureProfile(userId),
    db
      .select({
        result: trades.result,
        followedPlan: trades.followedPlan,
        notes: trades.notes,
        strategy: trades.strategy,
        tradedAt: trades.tradedAt,
      })
      .from(trades)
      .where(eq(trades.userId, userId)),
    db.select({ name: user.name, email: user.email, createdAt: user.createdAt }).from(user).where(eq(user.id, userId)),
  ])

  const owned = await db.select({ frameId: ownedFrames.frameId }).from(ownedFrames).where(eq(ownedFrames.userId, userId))

  const list = tradeRows.map((t) => ({ ...t, tradedAt: t.tradedAt.toISOString() }))
  const { xp, coinsEarned, activeDays, totalTrades } = computeProgress(list)
  const wins = list.filter((t) => t.result === 'win').length
  const planFollowed = list.filter((t) => t.followedPlan).length
  const userCreatedAt = account[0]?.createdAt ? account[0].createdAt.toISOString() : null

  return {
    name: account[0]?.name ?? 'Trader',
    email: account[0]?.email ?? '',
    avatarUrl: profile.avatarUrl,
    equippedFrame: FRAME_BY_ID[profile.equippedFrame] ? profile.equippedFrame : DEFAULT_FRAME,
    ownedFrames: [...new Set([DEFAULT_FRAME, ...owned.map((o) => o.frameId)])],
    coins: Math.max(coinsEarned - profile.coinsSpent, 0),
    stats: {
      totalTrades,
      activeDays,
      wins,
      winRate: totalTrades ? Math.round((wins / totalTrades) * 100) : 0,
      planRate: totalTrades ? Math.round((planFollowed / totalTrades) * 100) : 0,
      streak: computeStreak(list, userCreatedAt),
    },
    ...progressForXp(xp),
  }
}

export async function setAvatarUrl(url: string) {
  const userId = await getUserId()
  if (!/^https?:\/\/.+/.test(url) && !url.startsWith('avatars/')) throw new Error('Imagem inválida')
  await ensureProfile(userId)
  await db.update(traderProfile).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(traderProfile.userId, userId))
  revalidatePath('/')
}

export async function buyFrame(frameId: string) {
  const userId = await getUserId()
  const frame = FRAME_BY_ID[frameId]
  if (!frame) throw new Error('Moldura inexistente')

  const profile = await ensureProfile(userId)
  const already = await db
    .select({ id: ownedFrames.id })
    .from(ownedFrames)
    .where(and(eq(ownedFrames.userId, userId), eq(ownedFrames.frameId, frameId)))
  if (already[0]) return { ok: true, message: 'Você já possui esta moldura' }

  const tradeRows = await db
    .select({
      result: trades.result,
      followedPlan: trades.followedPlan,
      notes: trades.notes,
      strategy: trades.strategy,
      tradedAt: trades.tradedAt,
    })
    .from(trades)
    .where(eq(trades.userId, userId))
  const list = tradeRows.map((t) => ({ ...t, tradedAt: t.tradedAt.toISOString() }))
  const { xp, coinsEarned } = computeProgress(list)
  const coins = Math.max(coinsEarned - profile.coinsSpent, 0)

  if (levelFromXp(xp) < frame.minLevel) throw new Error(`Disponível a partir do nível ${frame.minLevel}`)
  if (coins < frame.price) throw new Error('Moedas insuficientes')

  await db.insert(ownedFrames).values({ userId, frameId }).onConflictDoNothing()
  await db
    .update(traderProfile)
    .set({ coinsSpent: profile.coinsSpent + frame.price, equippedFrame: frameId, updatedAt: new Date() })
    .where(eq(traderProfile.userId, userId))
  revalidatePath('/')
  return { ok: true, message: `${frame.name} desbloqueada!` }
}

export async function equipFrame(frameId: string) {
  const userId = await getUserId()
  if (!FRAME_BY_ID[frameId]) throw new Error('Moldura inexistente')
  await ensureProfile(userId)
  if (frameId !== DEFAULT_FRAME) {
    const owned = await db
      .select({ id: ownedFrames.id })
      .from(ownedFrames)
      .where(and(eq(ownedFrames.userId, userId), eq(ownedFrames.frameId, frameId)))
    if (!owned[0]) throw new Error('Você ainda não possui esta moldura')
  }
  await db
    .update(traderProfile)
    .set({ equippedFrame: frameId, updatedAt: new Date() })
    .where(eq(traderProfile.userId, userId))
  revalidatePath('/')
}
