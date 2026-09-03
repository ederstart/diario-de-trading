'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial: Theme = stored ?? (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  }

  if (!mounted) {
    return <div className="size-[18px]" aria-hidden="true" />
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      aria-label="Alternar tema"
      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition"
    >
      {theme === 'light' ? (
        <Moon className="size-[18px] shrink-0" />
      ) : (
        <Sun className="size-[18px] shrink-0" />
      )}
      {showLabel && (
        <span className="text-xs">
          {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        </span>
      )}
    </button>
  )
}
