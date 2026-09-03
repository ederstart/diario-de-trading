'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export type ThemeName = 'light' | 'dark'

const LABELS: Record<ThemeName, string> = {
  light: 'Verde claro',
  dark: 'Clássico (preto)',
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement
  html.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
}

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as ThemeName | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial: ThemeName =
      stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggle() {
    const next: ThemeName = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) {
    return <div className="size-[18px]" aria-hidden="true" />
  }

  return (
    <button
      onClick={toggle}
      title={`Tema atual: ${LABELS[theme]} — clique para alternar`}
      aria-label="Alternar tema"
      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition"
    >
      {theme === 'light' ? (
        <Moon className="size-[18px] shrink-0" />
      ) : (
        <Sun className="size-[18px] shrink-0" />
      )}
      {showLabel && <span className="text-xs">{LABELS[theme]}</span>}
    </button>
  )
}
