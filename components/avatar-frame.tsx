'use client'

import { FRAME_BY_ID, DEFAULT_FRAME } from '@/lib/gamification'

type Props = {
  avatarUrl?: string | null
  frameId?: string
  name?: string
  size?: number
  className?: string
}

/**
 * Avatar com moldura estilo MOBA: a foto fica em um círculo interno e a moldura PNG
 * (fundo transparente) é sobreposta por cima, escalada um pouco maior que a foto.
 */
export function AvatarFrame({ avatarUrl, frameId = DEFAULT_FRAME, name = '', size = 112, className = '' }: Props) {
  const frame = FRAME_BY_ID[frameId] ?? FRAME_BY_ID[DEFAULT_FRAME]
  const inner = Math.round(size * 0.66)
  const initials = name.trim().slice(0, 2).toUpperCase() || 'TR'

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      title={frame.name}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-muted"
        style={{ width: inner, height: inner }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || 'Avatar'} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
            {initials}
          </div>
        )}
      </div>
      <img
        src={frame.image}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-contain drop-shadow-md"
        loading="lazy"
      />
    </div>
  )
}
