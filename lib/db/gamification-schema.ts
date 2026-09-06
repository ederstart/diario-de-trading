import { integer, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

/**
 * Tabelas NOVAS. Nenhuma tabela existente é alterada.
 * Rode o SQL em sql/gamification.sql no mesmo banco (DATABASE_URL).
 */

export const traderProfile = pgTable('trader_profile', {
  userId: text('user_id').primaryKey(),
  avatarUrl: text('avatar_url'),
  equippedFrame: text('equipped_frame').notNull().default('bronze'),
  coinsSpent: integer('coins_spent').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const ownedFrames = pgTable(
  'owned_frames',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull(),
    frameId: text('frame_id').notNull(),
    acquiredAt: timestamp('acquired_at').notNull().defaultNow(),
  },
  (t) => ({
    userFrameUnique: uniqueIndex('owned_frames_user_frame_unique').on(t.userId, t.frameId),
  })
)
