'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Camera, Coins, Flame, Loader2, Lock, ShieldCheck, Sparkles, Star, Trophy } from 'lucide-react'
import { AvatarFrame } from '@/components/avatar-frame'
import { FRAMES, RARITY_COLOR, TITLES, xpForLevel } from '@/lib/gamification'
import { buyFrame, equipFrame, getProfile, setAvatarUrl, type ProfileData } from '@/app/actions/gamification'

export function ProfilePanel({ initialProfile }: { initialProfile?: ProfileData }) {
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile ?? null)
  const [tab, setTab] = useState<'perfil' | 'loja'>('perfil')
  const [message, setMessage] = useState<{ type: 'ok' | 'erro'; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const reload = () => getProfile().then(setProfile).catch(() => {})

  useEffect(() => {
    if (!initialProfile) reload()
  }, [initialProfile])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 4000)
    return () => clearTimeout(t)
  }, [message])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/avatar', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha no upload')
      await setAvatarUrl(data.url)
      await reload()
      setMessage({ type: 'ok', text: 'Foto de perfil atualizada!' })
    } catch (e: any) {
      setMessage({ type: 'erro', text: e.message || 'Não foi possível enviar a imagem' })
    } finally {
      setUploading(false)
    }
  }

  function run(action: () => Promise<any>) {
    startTransition(async () => {
      try {
        const r = await action()
        await reload()
        setMessage({ type: 'ok', text: r?.message || 'Feito!' })
      } catch (e: any) {
        setMessage({ type: 'erro', text: e.message || 'Ação não permitida' })
      }
    })
  }

  if (!profile) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando seu perfil...
      </div>
    )
  }

  const nextTitle = TITLES.find((t) => t.level > profile.level)

  return (
    <div className="space-y-4">
      {/* Cartão do perfil */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: RARITY_COLOR[FRAMES.find((f) => f.id === profile.equippedFrame)?.rarity ?? 'comum'] }}
        />
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            <AvatarFrame avatarUrl={profile.avatarUrl} frameId={profile.equippedFrame} name={profile.name} size={128} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow transition hover:bg-accent disabled:opacity-60"
              aria-label="Trocar foto de perfil"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleUpload(f)
                e.target.value = ''
              }}
            />
          </div>

          <div className="min-w-[240px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                <Star className="h-3 w-3" /> Nível {profile.level}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
                <Coins className="h-3 w-3" /> {profile.coins}
              </span>
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-amber-500" /> {profile.title}
            </p>
            <p className="text-xs text-muted-foreground">{profile.subtitle}</p>

            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>{profile.xpIntoLevel} XP</span>
                <span>faltam {profile.xpToNextLevel} XP para o nível {profile.level + 1}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${profile.percent}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Total acumulado: {profile.xp} XP · próximo título:{' '}
                {nextTitle ? `${nextTitle.title} (nível ${nextTitle.level})` : 'você chegou ao topo'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Flame className="h-4 w-4" />} label="Sequência" value={`${profile.stats.streak} dia(s)`} />
          <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Seguiu o plano" value={`${profile.stats.planRate}%`} />
          <Stat icon={<Sparkles className="h-4 w-4" />} label="Operações" value={String(profile.stats.totalTrades)} />
          <Stat icon={<Trophy className="h-4 w-4" />} label="Acerto" value={`${profile.stats.winRate}%`} />
        </div>

        <p className="mt-4 rounded-lg border border-border/70 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
          Aqui o XP premia o <strong className="text-foreground">processo</strong>, não o resultado: registrar a
          operação, seguir o plano e anotar o aprendizado geram progresso mesmo em dia negativo. Um loss registrado com
          honestidade também te leva ao próximo nível.
        </p>
      </section>

      {/* Abas */}
      <div className="flex gap-2">
        {(['perfil', 'loja'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'perfil' ? 'Jornada' : 'Loja de molduras'}
          </button>
        ))}
      </div>

      {message && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.type === 'ok'
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {tab === 'perfil' ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">Trilha de títulos</h3>
          <ol className="space-y-3">
            {TITLES.map((t) => {
              const unlocked = profile.level >= t.level
              return (
                <li key={t.level} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.level}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {t.title} {unlocked && <span className="text-primary">✓</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.subtitle} · {xpForLevel(t.level)} XP
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((frame) => {
            const owned = profile.ownedFrames.includes(frame.id)
            const equipped = profile.equippedFrame === frame.id
            const levelOk = profile.level >= frame.minLevel
            const canBuy = !owned && levelOk && profile.coins >= frame.price
            return (
              <article
                key={frame.id}
                className="flex flex-col items-center rounded-2xl border border-border bg-card p-4 text-center"
                style={{ boxShadow: equipped ? `0 0 0 2px ${RARITY_COLOR[frame.rarity]}` : undefined }}
              >
                <AvatarFrame avatarUrl={profile.avatarUrl} frameId={frame.id} name={profile.name} size={116} />
                <p className="mt-3 text-sm font-bold text-foreground">{frame.name}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: RARITY_COLOR[frame.rarity] }}>
                  {frame.rarity}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{frame.description}</p>

                <div className="mt-3 w-full">
                  {owned ? (
                    <button
                      disabled={equipped || pending}
                      onClick={() => run(() => equipFrame(frame.id))}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
                    >
                      {equipped ? 'Equipada' : 'Equipar'}
                    </button>
                  ) : (
                    <button
                      disabled={!canBuy || pending}
                      onClick={() => run(() => buyFrame(frame.id))}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                    >
                      {!levelOk ? (
                        <>
                          <Lock className="h-3.5 w-3.5" /> Nível {frame.minLevel}
                        </>
                      ) : (
                        <>
                          <Coins className="h-3.5 w-3.5" /> {frame.price}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  )
}
