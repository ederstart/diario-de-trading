'use client'

import { useCallback, useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export type ThemeName = 'light' | 'dark'

const LABELS: Record<ThemeName, string> = {
  light: 'Verde claro',
  dark: 'Clássico (preto)',
}

function readCurrentTheme(): ThemeName {
  if (typeof document === 'undefined') return 'light'
  const html = document.documentElement
  if (html.classList.contains('dark')) return 'dark'
  if (html.classList.contains('light')) return 'light'
  return 'light'
}

function applyTheme(theme: ThemeName) {
  const html = document.documentElement
  html.classList.toggle('light', theme === 'light')
  html.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {}
}

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  // Lazy initializer: le o tema atual do DOM (definido pelo script inline
  // no <head>) para evitar dessincronizacao entre state e classe.
  const [theme, setTheme] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const current = readCurrentTheme()
    setTheme(current)
    setMounted(true)
  }, [])

  // Mantem o state em sincronia se outra aba/componente mexer no DOM.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const current = readCurrentTheme()
      setTheme((prev) => (prev === current ? prev : current))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeName = prev === 'light' ? 'dark' : 'light'
      applyTheme(next)
      return next
    })
  }, [])

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
