'use client'

import Link from 'next/link'

const cosmetics: Record<string, { border: string; glow: string }> = {
  padrão: { border: 'border-border', glow: 'shadow-black/10' },
  'azul sereno': { border: 'border-sky-400', glow: 'shadow-sky-400/20' },
  'âmbar paciente': { border: 'border-amber-400', glow: 'shadow-amber-400/20' },
  'esmeralda focada': { border: 'border-emerald-400', glow: 'shadow-emerald-400/20' },
}

export function ProfileHomeCard({ user, progress, level, xpPercent, levelXp }: { user: { name: string }; progress: { xp: number; coins: number; selectedTitle: string; selectedCosmetic: string; avatarPath?: string | null }; level: number; xpPercent: number; levelXp: number }) {
  const cosmetic = cosmetics[progress.selectedCosmetic] ?? cosmetics.padrão
  return <section className={`relative overflow-hidden rounded-2xl border bg-card p-4 shadow-lg ${cosmetic.glow}`}><div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-primary/5" /><div className="relative flex items-center gap-4"><div className={`relative grid size-16 shrink-0 place-items-center rounded-full border-4 bg-muted text-xl font-semibold shadow-inner ${cosmetic.border}`}><div className={`absolute -inset-1 rounded-full border border-dashed opacity-70 ${cosmetic.border}`} />{progress.avatarPath ? <img src={`/api/file?pathname=${encodeURIComponent(progress.avatarPath)}`} alt={`Foto de ${user.name}`} className="size-full rounded-full object-cover" /> : user.name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><div><p className="text-xs uppercase tracking-wider text-primary">Nível {level}</p><h2 className="truncate text-lg font-semibold">{user.name}</h2></div><span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">{progress.coins} moedas</span></div><p className="truncate text-sm text-muted-foreground">{progress.selectedTitle}</p><div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${xpPercent}%` }} /></div><span className="text-[11px] text-muted-foreground">{xpPercent}%</span></div><p className="mt-1 text-[11px] text-muted-foreground">{levelXp}/500 XP para o próximo nível</p></div></div><div className="relative mt-4 flex items-center justify-between border-t border-border pt-3"><p className="text-xs text-muted-foreground">Cada trade é uma experiência. Nenhum define quem você é.</p><Link href="/perfil" className="min-h-11 shrink-0 rounded-lg px-3 py-3 text-xs font-medium text-primary hover:bg-primary/10">Ver perfil</Link></div></section>
}
