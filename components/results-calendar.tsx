'use client'

import { useEffect, useState } from 'react'

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(v)

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Cell = { key: string; day: number; month: number; weekday: number; isToday: boolean }

/**
 * Calendário de resultados.
 * - Colunas alinhadas com os dias da semana (Dom → Sáb).
 * - Sábado e domingo aparecem marcados como "Descanso".
 */
export function Calendar({ byDay, compact }: { byDay: Record<string, number>; compact?: boolean }) {
  const [days, setDays] = useState<Cell[]>([])

  useEffect(() => {
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayKey = key(today)

    // Termina no sábado da semana atual para as colunas baterem com os dias da semana.
    const end = new Date(today)
    end.setDate(end.getDate() + (6 - end.getDay()))

    const arr: Cell[] = Array.from({ length: 35 }, (_, i) => {
      const d = new Date(end)
      d.setDate(end.getDate() - 34 + i)
      return {
        key: key(d),
        day: d.getDate(),
        month: d.getMonth() + 1,
        weekday: d.getDay(),
        isToday: key(d) === todayKey,
      }
    })
    setDays(arr)
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-medium">Calendário de resultados</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Sábado e domingo são dias de descanso — não quebram a sua sequência.
      </p>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1.5' : 'gap-2'} mb-1`}>
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-[10px] font-medium uppercase tracking-wide ${
              i === 0 || i === 6 ? 'text-amber-400/80' : 'text-muted-foreground'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {days.map((d) => {
          const v = byDay[d.key] || 0
          const weekend = d.weekday === 0 || d.weekday === 6
          const tone =
            v > 0
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : v < 0
                ? 'border-red-500/30 bg-red-500/10 text-red-400'
                : weekend
                  ? 'border-amber-500/20 bg-amber-500/[0.06] text-amber-400/70'
                  : 'border-border text-muted-foreground'

          return (
            <div
              key={d.key}
              title={weekend ? 'Fim de semana — dia de descanso' : undefined}
              className={`${compact ? 'min-h-12' : 'min-h-14'} rounded-lg border p-2 text-[10px] ${tone} ${
                d.isToday ? 'ring-1 ring-primary/60' : ''
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span>
                  {d.day}/{d.month}
                </span>
                {weekend && <span aria-hidden>😴</span>}
              </span>

              {v !== 0 ? (
                <strong className="block mt-1">
                  {v > 0 ? '+' : ''}
                  {money(v)}
                </strong>
              ) : weekend ? (
                <span className="block mt-1 leading-tight">Descanso</span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
