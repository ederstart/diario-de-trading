'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addTradingPair,
  createTrade,
  deleteTrade,
  removeTradingPair,
  saveSettings,
  updateProfile,
  updateTrade,
} from '@/app/actions/trading'
import { signOut } from '@/lib/auth-client'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  BarChart3,
  CalendarDays,
  Check,
  Edit3,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Settings,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react'

type Trade = {
  id: number
  pair: string
  direction: string
  amount: number
  payout: number
  result: string
  profit: number
  mood: string
  tradedAt: string
  followedPlan: boolean
  strategy?: string | null
  notes?: string | null
  screenshotPath?: string | null
}

type TradeForm = {
  id?: number
  pair: string
  direction: string
  amount: string
  payout: string
  result: string
  mood: string
  followedPlan: boolean
  notes: string
  screenshotPath: string | null
  tradedAt: string
}

type Props = {
  user: { name: string; email: string }
  initialData: { trades: Trade[]; settings: any; pairs?: string[] }
}

const DEFAULTS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'NZD/USD', 'BTC/USD']
const MOODS = [
  { key: 'Confiante', value: 100, color: 'emerald', label: 'Confiante' },
  { key: 'Calmo', value: 80, color: 'sky', label: 'Calmo' },
  { key: 'Neutro', value: 50, color: 'amber', label: 'Neutro' },
  { key: 'Ansioso', value: 20, color: 'red', label: 'Ansioso' },
]
const MOTIVATIONAL = [
  'Você está no controle. Respeite o seu plano.',
  'Confie no processo. Resultado vem com consistência.',
  'Não arrisque tudo. Faça uma operação por vez.',
  'Você consegue. Mantenha a disciplina.',
  'Disciplina é o caminho. Continue firme.',
  'É possível! Respeite o gerenciamento de risco.',
  'Pequenos ganhos diários viram grandes resultados.',
  'Siga o plano. A vitória é uma consequência.',
]

const money = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(v)

const toDateInput = (iso: string) => iso.slice(0, 16)

const isWeekend = (iso: string) => {
  const d = new Date(iso)
  const day = d.getDay()
  return day === 0 || day === 6
}

const sameDay = (a: string, b: string) => a.slice(0, 10) === b.slice(0, 10)

const pairLabel = (value: string) => value.replace('/', ' / ')

function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <>{fallback}</>
  return <>{children}</>
}

export default function TradingDashboard({ user, initialData }: Props) {
  const router = useRouter()
  const [view, setView] = useState('Visão geral')
  const [sidebarOpen, setSidebarOpen] = useState(true) // desktop expanded/collapsed
  const [mobileOpen, setMobileOpen] = useState(false) // mobile drawer
  const [trades, setTrades] = useState<Trade[]>(initialData.trades || [])
  const [pairs, setPairs] = useState<string[]>(() => {
    const userPairs = initialData.pairs || []
    return Array.from(new Set(userPairs))
  })
  const [modal, setModal] = useState<'trade' | 'settings' | 'pairs' | 'profile' | 'block' | 'image' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mood, setMood] = useState('Calmo')
  const [quoteIndex, setQuoteIndex] = useState(0)

  const s = initialData.settings || {}
  const [settings, setSettings] = useState({
    initialBalance: String(s.initialBalance ?? 0),
    taxRate: String(s.taxRate ?? 15),
    dailyGoal: String(s.dailyGoal ?? 0),
  })
  const [name, setName] = useState(user.name)
  const [pairInput, setPairInput] = useState('')
  const [editingPair, setEditingPair] = useState<string | null>(null)
  const [editingPairValue, setEditingPairValue] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const [form, setForm] = useState<TradeForm>({
    pair: '',
    direction: 'CALL',
    amount: '50',
    payout: '85',
    result: 'win',
    mood: 'Confiante',
    followedPlan: true,
    notes: '',
    screenshotPath: null,
    tradedAt: '',
  })
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)

  // Inicializa tradedAt apenas no cliente (evita hydration mismatch)
  useEffect(() => {
    setForm((f) => (f.tradedAt ? f : { ...f, tradedAt: new Date().toISOString().slice(0, 16) }))
  }, [])

  const [todayLabel, setTodayLabel] = useState('')
  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date())
    )
  }, [])

  // Block reasons
  const blocked = useMemo(() => {
    if (!form.tradedAt) return null
    if (isWeekend(form.tradedAt)) {
      return 'Finais de semana estão bloqueados. Foque em estudo e descanso.'
    }
    const todayKey = form.tradedAt.slice(0, 10)
    const todayTrades = trades.filter((t) => sameDay(t.tradedAt, todayKey))
    if (todayTrades.length > 0 && todayTrades[0].result === 'loss') {
      return 'Hoje sua primeira operação foi LOSS. O dia está bloqueado para preservar sua banca.'
    }
    return null
  }, [form.tradedAt, trades])

  // Stats
  const total = trades.reduce((a, t) => a + Number(t.profit), 0)
  const wins = trades.filter((t) => t.result === 'win').length
  const losses = trades.filter((t) => t.result === 'loss').length
  const rate = trades.length ? Math.round((wins / trades.length) * 100) : 0
  const adherence = trades.length
    ? Math.round((trades.filter((t) => t.followedPlan).length / trades.length) * 100)
    : 0
  const balance = Number(settings.initialBalance) + total

  const byDay = useMemo(
    () =>
      trades.reduce<Record<string, number>>(
        (acc, t) => {
          const key = t.tradedAt.slice(0, 10)
          acc[key] = (acc[key] || 0) + Number(t.profit)
          return acc
        },
        {}
      ),
    [trades]
  )

  // Performance evaluation series
  const last12 = useMemo(() => {
    const days: { key: string; label: string; profit: number; cum: number }[] = []
    let cum = 0
    const sorted = [...trades].sort((a, b) => a.tradedAt.localeCompare(b.tradedAt))
    const uniqueKeys = Array.from(new Set(sorted.map((t) => t.tradedAt.slice(0, 10))))
    const lastKeys = uniqueKeys.slice(-12)
    for (const key of lastKeys) {
      const profit = sorted
        .filter((t) => t.tradedAt.slice(0, 10) === key)
        .reduce((a, t) => a + Number(t.profit), 0)
      cum += profit
      const d = new Date(key)
      days.push({
        key,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        profit,
        cum,
      })
    }
    return days
  }, [trades])

  // Rotate motivational messages
  useEffect(() => {
    const t = setInterval(() => setQuoteIndex((i) => (i + 1) % MOTIVATIONAL.length), 8000)
    return () => clearInterval(t)
  }, [])

  // Auto-clear success message
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(t)
  }, [success])

  // Close mobile drawer when resizing up
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  async function submitTrade() {
    if (blocked) {
      setError(blocked)
      return
    }
    setBusy(true)
    setError('')
    try {
      let screenshotPath: string | null = form.screenshotPath ?? null
      const fileInput = document.querySelector('#trade-image') as HTMLInputElement | null
      const file = fileInput?.files?.[0]
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!r.ok) throw new Error('Falha no upload')
        const data = await r.json()
        screenshotPath = data.pathname
      }
      const base = {
        pair: form.pair,
        direction: form.direction,
        amount: Number(form.amount),
        payout: Number(form.payout),
        result: form.result,
        mood: form.mood,
        followedPlan: form.followedPlan,
        notes: form.notes,
        tradedAt: form.tradedAt,
      }
      const withScreenshot = screenshotPath ? { ...base, screenshotPath } : base
      if (form.id) await updateTrade({ id: form.id, ...withScreenshot })
      else await createTrade(withScreenshot)
      setModal(null)
      setEditingTrade(null)
      setSuccess('Operação salva com sucesso')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function saveAll(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      setSuccess('Salvo com sucesso')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function saveLocal(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      setSuccess('Atualizado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await signOut()
    router.replace('/sign-in')
    router.refresh()
  }

  const nav = [
    [LayoutDashboard, 'Visão geral'],
    [BarChart3, 'Análises'],
    [CalendarDays, 'Calendário'],
    [Wallet, 'Saldo'],
    [Target, 'Metas'],
    [FileText, 'Operações'],
    [Settings, 'Configurações'],
  ] as const

  return (
    <div className="min-h-screen bg-background text-foreground flex" suppressHydrationWarning>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-50 inset-y-0 left-0 ${sidebarOpen ? 'md:w-64' : 'md:w-[76px]'} ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full'} md:translate-x-0 shrink-0 border-r border-border flex flex-col py-5 gap-5 bg-sidebar transition-[transform,width] duration-200`}
      >
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 shrink-0 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <TrendingUp className="size-5" />
            </div>
            {(sidebarOpen || mobileOpen) && (
              <span className="text-sm font-semibold truncate">Diário de Trading</span>
            )}
          </div>
          <button
            onClick={() => {
              setSidebarOpen(!sidebarOpen)
              setMobileOpen(false)
            }}
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
            className="size-9 rounded-lg text-muted-foreground hover:bg-muted hidden md:grid place-items-center"
          >
            {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            title="Fechar menu"
            className="size-9 rounded-lg text-muted-foreground hover:bg-muted md:hidden grid place-items-center"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={`h-px mx-auto bg-border transition-all ${sidebarOpen || mobileOpen ? 'w-11/12' : 'w-9'}`} />
        <nav className="flex flex-col gap-3 w-full px-3">
          {nav.map(([Icon, label]) => (
            <button
              key={label}
              title={label}
              onClick={() => {
                setView(label)
                setMobileOpen(false)
              }}
              className={`${sidebarOpen || mobileOpen ? 'w-full justify-start px-3' : 'md:size-10 justify-center'} h-10 rounded-xl flex items-center gap-3 ${view === label ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            >
              <Icon className="size-[18px] shrink-0" />
              {(sidebarOpen || mobileOpen) && <span className="text-xs">{label}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-3">
          <div
            className={`${sidebarOpen || mobileOpen ? 'w-full justify-start px-3' : 'md:size-10 justify-center'} h-10 rounded-xl flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground`}
          >
            <ThemeToggle showLabel={Boolean(sidebarOpen || mobileOpen)} />
          </div>
          <button
            title="Sair"
            onClick={logout}
            className={`${sidebarOpen || mobileOpen ? 'w-full justify-start px-3' : 'md:size-10 justify-center'} h-10 rounded-xl flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-destructive`}
          >
            <LogOut className="size-[18px] shrink-0" />
            {(sidebarOpen || mobileOpen) && <span className="text-xs">Sair</span>}
          </button>
          <button
            onClick={() => setModal('profile')}
            title="Perfil"
            className={`${sidebarOpen || mobileOpen ? 'w-full justify-start px-3' : 'md:size-10 justify-center'} h-10 rounded-xl flex items-center gap-3 text-muted-foreground hover:bg-muted`}
          >
            <span className="size-8 rounded-full bg-primary/20 text-primary text-[11px] font-semibold grid place-items-center shrink-0">
              {name.slice(0, 2).toUpperCase()}
            </span>
            {(sidebarOpen || mobileOpen) && <span className="text-xs">{name}</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="min-h-[74px] border-b border-border flex items-center justify-between gap-3 px-4 sm:px-5 md:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden size-10 shrink-0 rounded-lg border border-border grid place-items-center"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate" suppressHydrationWarning>
                {todayLabel || '\u00A0'}
              </p>
              <h1 className="text-xl font-semibold truncate">
                Olá, {name}{' '}
                <span className="text-muted-foreground font-normal">
                  — vamos revisar seu dia?
                </span>
              </h1>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setModal('settings')}
              className="rounded-lg border border-border px-3 py-2 text-xs hidden sm:inline-flex"
            >
              Personalizar
            </button>
            <button
              onClick={() => {
                if (blocked) {
                  setModal('block')
                  return
                }
                if (pairs.length === 0) {
                  setModal('pairs')
                  return
                }
                setEditingTrade(null)
                setForm({
                  pair: pairs[0],
                  direction: 'CALL',
                  amount: '50',
                  payout: '85',
                  result: 'win',
                  mood: mood || 'Confiante',
                  followedPlan: true,
                  notes: '',
                  screenshotPath: null,
                  tradedAt: new Date().toISOString().slice(0, 16),
                })
                setModal('trade')
              }}
              className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold inline-flex items-center gap-1"
            >
              <Plus className="size-4" /> Nova operação
            </button>
          </div>
        </header>

        {success && (
          <div className="mx-4 sm:mx-5 md:mx-8 mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-4 py-2 text-sm">
            {success}
          </div>
        )}

        <div className="p-4 sm:p-5 md:p-8 max-w-[1500px] mx-auto">
          {/* Motivational banner */}
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3">
            <Sparkles className="size-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">{MOTIVATIONAL[quoteIndex]}</p>
          </div>

          <div className="flex justify-between mb-6 gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold truncate">{view}</h2>
              <p className="text-sm text-muted-foreground mt-1">Dados reais da sua conta.</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{trades.length} operações</span>
          </div>

          {view === 'Visão geral' && (
            <Overview
              balance={balance}
              total={total}
              rate={rate}
              adherence={adherence}
              wins={wins}
              losses={losses}
              mood={mood}
              setMood={setMood}
              trades={trades}
              byDay={byDay}
              series={last12}
              blocked={blocked}
              setView={setView}
              onEdit={(t: Trade) => {
                setEditingTrade(t)
                setForm({
                  id: t.id,
                  pair: t.pair,
                  direction: t.direction,
                  amount: String(t.amount),
                  payout: String(t.payout),
                  result: t.result,
                  mood: t.mood,
                  followedPlan: t.followedPlan,
                  notes: t.notes || '',
                  screenshotPath: t.screenshotPath || null,
                  tradedAt: toDateInput(t.tradedAt),
                })
                if (blocked) {
                  setModal('block')
                  return
                }
                setModal('trade')
              }}
              onDelete={async (t: Trade) => {
                if (!window.confirm('Excluir esta operação?')) return
                await saveAll(async () => {
                  await deleteTrade(t.id)
                })
              }}
              onPreview={(url: string) => {
                setPreviewImage(url)
                setModal('image')
              }}
            />
          )}
          {view === 'Calendário' && <Calendar byDay={byDay} />}
          {view === 'Operações' && (
            <Trades
              trades={trades}
              onEdit={(t) => {
                setEditingTrade(t)
                setForm({
                  id: t.id,
                  pair: t.pair,
                  direction: t.direction,
                  amount: String(t.amount),
                  payout: String(t.payout),
                  result: t.result,
                  mood: t.mood,
                  followedPlan: t.followedPlan,
                  notes: t.notes || '',
                  screenshotPath: t.screenshotPath || null,
                  tradedAt: toDateInput(t.tradedAt),
                })
                if (blocked) {
                  setModal('block')
                  return
                }
                setModal('trade')
              }}
              onDelete={async (t) => {
                if (!window.confirm('Excluir esta operação?')) return
                await saveAll(async () => {
                  await deleteTrade(t.id)
                })
              }}
              onPreview={(url) => {
                setPreviewImage(url)
                setModal('image')
              }}
            />
          )}
          {view === 'Análises' && <Analysis trades={trades} rate={rate} series={last12} />}
          {view === 'Saldo' && <Balance balance={balance} total={total} onClick={() => setModal('settings')} />}
          {view === 'Metas' && (
            <Balance
              balance={Number(settings.dailyGoal)}
              total={total}
              onClick={() => setModal('settings')}
            />
          )}
          {view === 'Configurações' && (
            <SettingsView
              onPairs={() => setModal('pairs')}
              onProfile={() => setModal('profile')}
              onBalance={() => setModal('settings')}
            />
          )}
        </div>
      </main>

      {modal === 'trade' && (
        <TradeModal
          form={form}
          setForm={setForm}
          pairs={pairs}
          busy={busy}
          error={error}
          blocked={blocked}
          close={() => {
            setModal(null)
            setError('')
          }}
          submit={submitTrade}
          editing={editingTrade}
        />
      )}
      {modal === 'settings' && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          busy={busy}
          error={error}
          close={() => {
            setModal(null)
            setError('')
          }}
          save={(s) =>
            saveAll(async () => {
              await saveSettings(s)
            })
          }
        />
      )}
      {modal === 'profile' && (
        <ProfileModal
          name={name}
          setName={setName}
          busy={busy}
          error={error}
          close={() => {
            setModal(null)
            setError('')
          }}
          save={() =>
            saveAll(async () => {
              await updateProfile(name)
            })
          }
        />
      )}
      {modal === 'pairs' && (
        <PairsModal
          pairs={pairs}
          setPairs={setPairs}
          pairInput={pairInput}
          setPairInput={setPairInput}
          editingPair={editingPair}
          setEditingPair={setEditingPair}
          editingPairValue={editingPairValue}
          setEditingPairValue={setEditingPairValue}
          busy={busy}
          error={error}
          close={() => {
            setModal(null)
            setError('')
            setEditingPair(null)
            setEditingPairValue('')
          }}
          add={() =>
            saveLocal(async () => {
              const v = pairInput.trim().toUpperCase()
              if (!v) throw new Error('Informe o par')
              await addTradingPair(v)
              setPairs((prev) => (prev.includes(v) ? prev : [...prev, v]))
              setPairInput('')
            })
          }
          saveEdit={(oldValue) =>
            saveLocal(async () => {
              const v = editingPairValue.trim().toUpperCase()
              if (!v) throw new Error('Informe o nome do par')
              if (oldValue !== v) {
                await addTradingPair(v)
                await removeTradingPair(oldValue)
              }
              setPairs((prev) =>
                Array.from(new Set([...prev.filter((x) => x !== oldValue), v]))
              )
              setEditingPair(null)
              setEditingPairValue('')
            })
          }
          remove={(symbol) =>
            saveLocal(async () => {
              await removeTradingPair(symbol)
              setPairs((prev) => prev.filter((x) => x !== symbol))
            })
          }
        />
      )}
      {modal === 'block' && (
        <BlockModal
          reason={blocked || 'Operação bloqueada.'}
          close={() => setModal(null)}
        />
      )}
      {modal === 'image' && previewImage && (
        <ImageModal src={previewImage} close={() => setModal(null)} />
      )}
    </div>
  )
}

function Cards({ items }: { items: [string, string, string][] }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(([a, b, c]) => (
        <div className="rounded-xl border border-border bg-card p-4" key={a}>
          <span className="text-xs text-muted-foreground">{a}</span>
          <p className="text-2xl font-semibold mt-3">{b}</p>
          <p className="text-xs text-primary mt-1">{c}</p>
        </div>
      ))}
    </section>
  )
}

function PerformanceChart({ series }: { series: { key: string; label: string; profit: number; cum: number }[] }) {
  if (!series.length) {
    return (
      <div className="h-64 grid place-items-center text-sm text-muted-foreground">
        Sem dados suficientes para gerar o gráfico.
      </div>
    )
  }
  const values = series.map((s) => s.cum)
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const range = max - min || 1
  const W = 600
  const H = 220
  const pad = 24
  const stepX = series.length > 1 ? (W - pad * 2) / (series.length - 1) : 0
  const points = series.map((s, i) => {
    const x = pad + i * stepX
    const y = H - pad - ((s.cum - min) / range) * (H - pad * 2)
    return { x, y, ...s }
  })
  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')
  const area = `${path} L ${pad + (series.length - 1) * stepX} ${H - pad} L ${pad} ${H - pad} Z`

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-56">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#g)" className="text-primary" />
        <path d={path} fill="none" strokeWidth="2" className="stroke-primary" />
        {points.map((p) => (
          <circle key={p.key} cx={p.x} cy={p.y} r="3" className="fill-primary" />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
        {series.map((s) => (
          <span key={s.key}>{s.label}</span>
        ))}
      </div>
    </div>
  )
}

function MoodRing({
  mood,
  setMood,
}: {
  mood: string
  setMood: (m: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      {MOODS.map((m) => {
        const active = mood === m.key
        const ringColor =
          m.color === 'emerald'
            ? 'stroke-emerald-500'
            : m.color === 'sky'
            ? 'stroke-sky-500'
            : m.color === 'amber'
            ? 'stroke-amber-500'
            : 'stroke-red-500'
        const textColor =
          m.color === 'emerald'
            ? 'text-emerald-400'
            : m.color === 'sky'
            ? 'text-sky-400'
            : m.color === 'amber'
            ? 'text-amber-400'
            : 'text-red-400'
        // dashed progress ring: full circle = 100%
        const radius = 28
        const circumference = 2 * Math.PI * radius
        const dashOffset = circumference * (1 - m.value / 100)
        return (
          <button
            key={m.key}
            onClick={() => setMood(m.key)}
            className={`relative rounded-xl border p-4 flex flex-col items-center gap-2 transition ${
              active ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/40'
            }`}
          >
            <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
              <circle cx="34" cy="34" r={radius} fill="none" className="stroke-muted" strokeWidth="4" strokeDasharray="4 4" />
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                className={ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${circumference * (m.value / 100)} ${circumference}`}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <span className={`text-xs font-medium ${active ? textColor : 'text-muted-foreground'}`}>
              {m.label}
            </span>
            <span className={`text-[10px] ${active ? textColor : 'text-muted-foreground/70'}`}>{m.value}%</span>
          </button>
        )
      })}
    </div>
  )
}

function MonthlyMoodRing({
  monthly,
}: {
  monthly: { key: string; label: string; color: string; value: number; count: number; pct: number }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-5">
      {monthly.map((m) => {
        const ringColor =
          m.color === 'emerald'
            ? 'stroke-emerald-500'
            : m.color === 'sky'
            ? 'stroke-sky-500'
            : m.color === 'amber'
            ? 'stroke-amber-500'
            : 'stroke-red-500'
        const textColor =
          m.color === 'emerald'
            ? 'text-emerald-400'
            : m.color === 'sky'
            ? 'text-sky-400'
            : m.color === 'amber'
            ? 'text-amber-400'
            : 'text-red-400'
        // O anel vai de 0 a 100% (sempre o tracejado completo no fundo),
        // e o preenchimento colorido avança até `pct`.
        const radius = 28
        const circumference = 2 * Math.PI * radius
        const filled = circumference * (m.pct / 100)
        const empty = circumference - filled
        return (
          <div
            key={m.key}
            className="relative rounded-xl border border-border p-4 flex flex-col items-center gap-1 hover:bg-muted/30 transition"
          >
            <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                className="stroke-muted"
                strokeWidth="4"
                strokeDasharray="4 4"
              />
              <circle
                cx="36"
                cy="36"
                r={radius}
                fill="none"
                className={ringColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${filled} ${empty}`}
              />
            </svg>
            <span className={`text-xs font-medium ${textColor}`}>{m.label}</span>
            <span className={`text-[11px] font-semibold ${textColor}`}>
              {m.pct}%
            </span>
            <span className="text-[10px] text-muted-foreground">
              {m.count} {m.count === 1 ? 'operação' : 'operações'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Overview(p: any) {
  // Distribuição de humores do mês corrente
  const monthlyMood = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const totals: Record<string, number> = {
      Confiante: 0,
      Calmo: 0,
      Neutro: 0,
      Ansioso: 0,
    }
    let total = 0
    for (const t of p.trades as Trade[]) {
      const d = new Date(t.tradedAt)
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (totals[t.mood] !== undefined) {
          totals[t.mood] += 1
          total += 1
        }
      }
    }
    return MOODS.map((m) => ({
      ...m,
      count: totals[m.key] || 0,
      pct: total ? Math.round(((totals[m.key] || 0) / total) * 100) : 0,
    }))
  }, [p.trades])

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
  }, [])

  return (
    <>
      <Cards
        items={[
          ['Saldo atual', money(p.balance), money(p.total)],
          ['Resultado líquido', money(p.total), `${p.wins} vitórias · ${p.losses} derrotas`],
          ['Taxa de acerto', `${p.rate}%`, `${p.wins}W / ${p.losses}L`],
          ['Aderência ao plano', `${p.adherence}%`, 'Baseada nos seus trades'],
        ]}
      />
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Avaliação de desempenho</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Evolução do saldo acumulado nos últimos dias
              </p>
            </div>
            <span className="text-primary text-sm font-semibold">
              {money(p.series.length ? p.series[p.series.length - 1].cum : 0)}
            </span>
          </div>
          <div className="mt-4">
            <PerformanceChart series={p.series} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Seu estado no mês</h3>
            <span className="text-xs text-muted-foreground capitalize" suppressHydrationWarning>
              {monthLabel}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Distribuição dos humores registrados nas suas operações deste mês.
            Quanto maior a porcentagem, mais predominante foi o estado.
          </p>
          <MonthlyMoodRing monthly={monthlyMood} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Calendar byDay={p.byDay} compact />
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium">Trades recentes</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Edite, exclua ou visualize os anexos diretamente
              </p>
            </div>
            <button
              onClick={() => p.setView?.('Operações')}
              className="text-xs text-primary hover:underline"
            >
              Ver todas
            </button>
          </div>
          {p.trades.length ? (
            <div className="divide-y divide-border -mx-5">
              {p.trades.slice(0, 6).map((t: Trade) => {
                const url = t.screenshotPath
                  ? `/api/trades/attachment?path=${encodeURIComponent(t.screenshotPath)}`
                  : ''
                return (
                  <div key={t.id} className="px-5 py-3 flex justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.screenshotPath ? (
                        <button
                          type="button"
                          onClick={() => p.onPreview?.(url)}
                          className="shrink-0"
                          title="Ver imagem"
                        >
                          <img
                            src={url}
                            alt={`Anexo da operação ${t.pair}`}
                            className="size-10 rounded-lg object-cover border border-border"
                          />
                        </button>
                      ) : (
                        <div className="size-10 rounded-lg border border-dashed border-border grid place-items-center text-muted-foreground shrink-0">
                          <FileText className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <b className="block truncate text-sm">{pairLabel(t.pair)}</b>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {new Date(t.tradedAt).toLocaleString('pt-BR')} · {t.mood}
                        </p>
                        {t.notes ? (
                          <p className="text-xs text-foreground/70 mt-1 line-clamp-2 max-w-[420px]">
                            {t.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <strong
                        className={
                          t.profit >= 0 ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'
                        }
                      >
                        {money(Number(t.profit))}
                      </strong>
                      <button
                        onClick={() => p.onEdit?.(t)}
                        className="text-xs text-primary"
                        title="Editar"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => p.onDelete?.(t)}
                        className="text-xs text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Nenhuma operação registrada ainda.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

function Calendar({
  byDay,
  compact,
}: {
  byDay: Record<string, number>
  compact?: boolean
}) {
  const [days, setDays] = useState<{ key: string; day: number; month: number }[]>([])
  useEffect(() => {
    const arr = Array.from({ length: 35 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 34 + i)
      return {
        key: d.toISOString().slice(0, 10),
        day: d.getDate(),
        month: d.getMonth() + 1,
      }
    })
    setDays(arr)
  }, [])
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-medium">Calendário de resultados</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-4">
        Inclui dias anteriores e fins de semana
      </p>
      <div className={`grid grid-cols-7 ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {days.map((d) => {
          const v = byDay[d.key] || 0
          return (
            <div
              key={d.key}
              className={`${
                compact ? 'min-h-12' : 'min-h-14'
              } rounded-lg border p-2 text-[10px] ${
                v > 0
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : v < 0
                  ? 'border-red-500/30 bg-red-500/10 text-red-400'
                  : 'border-border text-muted-foreground'
              }`}
            >
              <span>
                {d.day}/{d.month}
              </span>
              {v !== 0 && (
                <strong className="block mt-1">
                  {v > 0 ? '+' : ''}
                  {money(v)}
                </strong>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Trades({
  trades,
  onEdit,
  onDelete,
  onPreview,
}: {
  trades: Trade[]
  onEdit: (trade: Trade) => void
  onDelete: (trade: Trade) => Promise<void>
  onPreview: (url: string) => void
}) {
  if (!trades.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Nenhuma operação.
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border bg-card divide-y divide-border">
      {trades.map((t) => {
        const url = t.screenshotPath
          ? `/api/trades/attachment?path=${encodeURIComponent(t.screenshotPath)}`
          : ''
        return (
          <div key={t.id} className="p-4 flex justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {t.screenshotPath ? (
                <button
                  type="button"
                  onClick={() => onPreview(url)}
                  className="shrink-0"
                  title="Ver imagem"
                >
                  <img
                    src={url}
                    alt={`Anexo da operação ${t.pair}`}
                    className="size-12 rounded-lg object-cover border border-border"
                  />
                </button>
              ) : null}
              <div className="min-w-0">
                <b className="block truncate">{pairLabel(t.pair)}</b>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(t.tradedAt).toLocaleString('pt-BR')} · {t.mood}
                </p>
                {t.notes ? (
                  <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{t.notes}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <strong className={t.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {money(Number(t.profit))}
              </strong>
              <button
                onClick={() => onEdit(t)}
                className="text-xs text-primary inline-flex items-center gap-1"
              >
                <Pencil className="size-3" /> Editar
              </button>
              <button
                onClick={() => onDelete(t)}
                className="text-xs text-destructive inline-flex items-center gap-1"
              >
                <Trash2 className="size-3" /> Excluir
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Analysis({
  trades,
  rate,
  series,
}: {
  trades: Trade[]
  rate: number
  series: { key: string; label: string; profit: number; cum: number }[]
}) {
  return (
    <>
      <Cards
        items={[
          ['Trades', String(trades.length), 'Total'],
          ['Acerto', `${rate}%`, 'Performance'],
          [
            'Melhor resultado',
            money(Math.max(0, ...trades.map((t) => Number(t.profit)))),
            'Recorde',
          ],
          [
            'Pior resultado',
            money(Math.min(0, ...trades.map((t) => Number(t.profit)))),
            'Risco',
          ],
        ]}
      />
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium">Distribuição de resultados</h3>
          <div className="flex gap-2 mt-5 h-8">
            <div className="bg-emerald-500 rounded" style={{ width: `${rate}%` }} />
            <div className="bg-red-500 rounded flex-1" />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>Vitórias {rate}%</span>
            <span>Derrotas {100 - rate}%</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-medium">Avaliação de desempenho</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">Evolução do saldo</p>
          <PerformanceChart series={series} />
        </div>
      </div>
    </>
  )
}

function Balance({
  balance,
  total,
  onClick,
}: {
  balance: number
  total: number
  onClick: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 max-w-xl">
      <p className="text-sm text-muted-foreground">Saldo configurado</p>
      <p className="text-4xl font-semibold mt-2">{money(balance)}</p>
      <p className="text-sm text-primary mt-2">Resultado acumulado: {money(total)}</p>
      <button
        onClick={onClick}
        className="mt-6 rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm"
      >
        Configurar saldo e metas
      </button>
    </div>
  )
}

function SettingsView({
  onPairs,
  onProfile,
  onBalance,
}: {
  onPairs: () => void
  onProfile: () => void
  onBalance: () => void
}) {
  const items: [string, () => void][] = [
    ['Saldo e metas', onBalance],
    ['Pares de moedas', onPairs],
    ['Perfil', onProfile],
  ]
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {items.map(([label, fn]) => (
        <button
          key={label}
          onClick={fn}
          className="rounded-xl border border-border bg-card p-6 text-left hover:border-primary"
        >
          <Settings className="size-5 text-primary mb-4" />
          <b>{label}</b>
          <p className="text-xs text-muted-foreground mt-2">Gerenciar configurações</p>
        </button>
      ))}
    </div>
  )
}

/* ----------------------------- Modals ----------------------------- */

function ModalShell({
  title,
  onClose,
  error,
  children,
  footer,
}: {
  title: string
  onClose: () => void
  error?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive mt-3">{error}</p>}
        <div className="grid gap-4 mt-5">{children}</div>
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </div>
  )
}

const inputClass =
  'h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground w-full mt-2'

function TradeModal({
  form,
  setForm,
  pairs,
  busy,
  error,
  blocked,
  close,
  submit,
  editing,
}: {
  form: TradeForm
  setForm: (f: TradeForm) => void
  pairs: string[]
  busy: boolean
  error: string
  blocked: string | null
  close: () => void
  submit: () => void
  editing: Trade | null
}) {
  return (
    <ModalShell
      title={editing ? 'Editar operação' : 'Registrar operação'}
      onClose={close}
      error={error}
      footer={
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={close}
            className="h-11 rounded-lg border border-border px-4 text-sm"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            onClick={submit}
            className="h-11 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold inline-flex items-center gap-1"
          >
            <Save className="size-4" /> {busy ? 'Salvando...' : 'Salvar operação'}
          </button>
        </div>
      }
    >
      {blocked && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 px-3 py-2 text-sm">
          {blocked}
        </div>
      )}
      <label className="text-xs">
        Par
        <select
          className={inputClass}
          value={form.pair}
          onChange={(e) => setForm({ ...form, pair: e.target.value })}
        >
          {pairs.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          Direção
          <select
            className={inputClass}
            value={form.direction}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
          >
            <option>CALL</option>
            <option>PUT</option>
          </select>
        </label>
        <label className="text-xs">
          Valor da entrada
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={inputClass}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          Payout (%)
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            className={inputClass}
            value={form.payout}
            onChange={(e) => setForm({ ...form, payout: e.target.value })}
          />
        </label>
        <label className="text-xs">
          Resultado
          <select
            className={inputClass}
            value={form.result}
            onChange={(e) => setForm({ ...form, result: e.target.value })}
          >
            <option value="win">Vitória</option>
            <option value="loss">Derrota</option>
            <option value="break_even">Empate</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Resultado estimado:{' '}
        <strong
          className={form.result === 'loss' ? 'text-red-400' : 'text-emerald-400'}
        >
          {money(
            form.result === 'win'
              ? (Number(form.amount) * Number(form.payout)) / 100
              : form.result === 'loss'
              ? -Number(form.amount)
              : 0
          )}
        </strong>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          Humor
          <select
            className={inputClass}
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
          >
            {MOODS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Seguiu o plano?
          <select
            className={inputClass}
            value={form.followedPlan ? 'sim' : 'nao'}
            onChange={(e) => setForm({ ...form, followedPlan: e.target.value === 'sim' })}
          >
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </label>
      </div>
      <label className="text-xs">
        Data e hora
        <input
          type="datetime-local"
          className={inputClass}
          value={form.tradedAt}
          onChange={(e) => setForm({ ...form, tradedAt: e.target.value })}
        />
      </label>
      <label className="text-xs">
        Anotações
        <textarea
          className={`${inputClass} h-28 py-3 resize-none`}
          placeholder="O que você observou nessa operação?"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </label>
      {form.notes && (
        <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-foreground/80">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <FileText className="size-3" /> Pré-visualização
          </div>
          {form.notes}
        </div>
      )}
      <label className="text-xs">
        Imagem / print
        <input id="trade-image" type="file" accept="image/*" className="mt-2 text-sm" />
      </label>
    </ModalShell>
  )
}

function SettingsModal({
  settings,
  setSettings,
  busy,
  error,
  close,
  save,
}: {
  settings: { initialBalance: string; taxRate: string; dailyGoal: string }
  setSettings: (s: any) => void
  busy: boolean
  error: string
  close: () => void
  save: (s: { initialBalance: number; taxRate: number; dailyGoal: number }) => void
}) {
  return (
    <ModalShell
      title="Configurações"
      onClose={close}
      error={error}
      footer={
        <div className="flex gap-2">
          <button
            onClick={close}
            className="h-11 rounded-lg border border-border px-4 text-sm"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            onClick={() =>
              save({
                initialBalance: Number(settings.initialBalance),
                taxRate: Number(settings.taxRate),
                dailyGoal: Number(settings.dailyGoal),
              })
            }
            className="h-11 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold inline-flex items-center gap-1"
          >
            <Save className="size-4" /> Salvar configurações
          </button>
        </div>
      }
    >
      <label className="text-xs">
        Saldo inicial
        <input
          className={inputClass}
          type="number"
          value={settings.initialBalance}
          onChange={(e) => setSettings({ ...settings, initialBalance: e.target.value })}
        />
      </label>
      <label className="text-xs">
        Taxa de imposto (%)
        <input
          className={inputClass}
          type="number"
          value={settings.taxRate}
          onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
        />
      </label>
      <label className="text-xs">
        Meta diária
        <input
          className={inputClass}
          type="number"
          value={settings.dailyGoal}
          onChange={(e) => setSettings({ ...settings, dailyGoal: e.target.value })}
        />
      </label>
    </ModalShell>
  )
}

function ProfileModal({
  name,
  setName,
  busy,
  error,
  close,
  save,
}: {
  name: string
  setName: (n: string) => void
  busy: boolean
  error: string
  close: () => void
  save: () => void
}) {
  return (
    <ModalShell
      title="Perfil"
      onClose={close}
      error={error}
      footer={
        <div className="flex gap-2">
          <button
            onClick={close}
            className="h-11 rounded-lg border border-border px-4 text-sm"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            onClick={save}
            className="h-11 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold inline-flex items-center gap-1"
          >
            <Save className="size-4" /> Salvar nome
          </button>
        </div>
      }
    >
      <label className="text-xs">
        Nome de exibição
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
    </ModalShell>
  )
}

function PairsModal({
  pairs,
  setPairs,
  pairInput,
  setPairInput,
  editingPair,
  setEditingPair,
  editingPairValue,
  setEditingPairValue,
  busy,
  error,
  close,
  add,
  saveEdit,
  remove,
}: {
  pairs: string[]
  setPairs: (updater: (prev: string[]) => string[]) => void
  pairInput: string
  setPairInput: (s: string) => void
  editingPair: string | null
  setEditingPair: (s: string | null) => void
  editingPairValue: string
  setEditingPairValue: (s: string) => void
  busy: boolean
  error: string
  close: () => void
  add: () => void
  saveEdit: (oldValue: string) => void
  remove: (symbol: string) => void
}) {
  return (
    <ModalShell
      title="Pares de moedas"
      onClose={close}
      error={error}
      footer={
        <div className="flex gap-2">
          <button
            onClick={close}
            className="h-11 rounded-lg border border-border px-4 text-sm"
          >
            Fechar
          </button>
          <button
            disabled={busy || !pairInput.trim()}
            onClick={add}
            className="h-11 rounded-lg bg-primary text-primary-foreground px-4 text-sm font-semibold inline-flex items-center gap-1"
          >
            <Plus className="size-4" /> Adicionar par
          </button>
        </div>
      }
    >
      <div className="flex gap-2">
        <input
          className={inputClass + ' flex-1 mt-0'}
          placeholder="Ex.: ETH/USD"
          value={pairInput}
          onChange={(e) => setPairInput(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {pairs.map((x) => (
          <div
            key={x}
            className="rounded-full border border-border pl-3 pr-1 py-1 text-xs flex items-center gap-1"
          >
            {editingPair === x ? (
              <input
                value={editingPairValue}
                onChange={(e) => setEditingPairValue(e.target.value)}
                className="bg-transparent outline-none w-24"
              />
            ) : (
              <span>{x}</span>
            )}
            {editingPair === x ? (
              <button
                disabled={busy}
                onClick={() => saveEdit(x)}
                title="Salvar"
                className="size-5 rounded-full grid place-items-center text-emerald-400 hover:bg-muted"
              >
                <Check className="size-3" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingPair(x)
                  setEditingPairValue(x)
                }}
                title="Editar par"
                className="size-5 rounded-full grid place-items-center text-primary hover:bg-muted"
              >
                <Edit3 className="size-3" />
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Remover ${x}?`)) remove(x)
              }}
              title="Remover par"
              className="size-5 rounded-full grid place-items-center text-destructive hover:bg-muted"
            >
              <Trash2 className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Você pode adicionar, editar ou remover qualquer par, inclusive os sugeridos.
      </p>
    </ModalShell>
  )
}

function BlockModal({ reason, close }: { reason: string; close: () => void }) {
  return (
    <ModalShell title="Operação bloqueada" onClose={close}>
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
        {reason}
      </div>
      <p className="text-xs text-muted-foreground">
        Respeite o seu plano. Volte amanhã com cabeça fria e energia renovada.
      </p>
      <button
        onClick={close}
        className="h-11 rounded-lg bg-primary text-primary-foreground px-4 text-sm"
      >
        Entendi
      </button>
    </ModalShell>
  )
}

function ImageModal({ src, close }: { src: string; close: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4"
      onClick={close}
    >
      <img
        src={src}
        alt="Anexo da operação"
        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
      />
    </div>
  )
}
