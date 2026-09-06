/**
 * Regras de gamificação do Edge Journal.
 * Arquivo puro (sem acesso a banco) — pode ser importado no client e no server.
 */

export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'mitico'

export type Frame = {
  id: string
  name: string
  rarity: Rarity
  price: number
  minLevel: number
  image: string
  description: string
}

/** Catálogo de molduras. As imagens ficam em /public/frames/*.png (fundo transparente). */
export const FRAMES: Frame[] = [
  {
    id: 'bronze',
    name: 'Aprendiz de Bronze',
    rarity: 'comum',
    price: 0,
    minLevel: 1,
    image: '/frames/bronze.png',
    description: 'Moldura inicial. Todo mestre começou registrando a primeira operação.',
  },
  {
    id: 'prata',
    name: 'Guardião da Disciplina',
    rarity: 'raro',
    price: 400,
    minLevel: 3,
    image: '/frames/prata.png',
    description: 'Aço polido para quem segue o plano mesmo quando o mercado provoca.',
  },
  {
    id: 'ouro',
    name: 'Louros do Consistente',
    rarity: 'raro',
    price: 900,
    minLevel: 6,
    image: '/frames/ouro.png',
    description: 'Ouro e esmeraldas: a marca de quem transforma rotina em resultado.',
  },
  {
    id: 'platina',
    name: 'Sentinela de Platina',
    rarity: 'raro',
    price: 1300,
    minLevel: 8,
    image: '/frames/platina.png',
    description: 'Metal frio para quem executa sem pressa e sem euforia.',
  },
  {
    id: 'epica',
    name: 'Cristal do Sangue-Frio',
    rarity: 'epico',
    price: 1800,
    minLevel: 10,
    image: '/frames/epica.png',
    description: 'Energia contida. Nem o loss nem o win tiram você do eixo.',
  },
  {
    id: 'rubi',
    name: 'Rubi do Risco Calculado',
    rarity: 'epico',
    price: 2400,
    minLevel: 12,
    image: '/frames/rubi.png',
    description: 'Vermelho vivo: você respeita o stop antes de sonhar com o alvo.',
  },
  {
    id: 'esmeralda',
    name: 'Esmeralda do Juro Composto',
    rarity: 'epico',
    price: 2900,
    minLevel: 13,
    image: '/frames/esmeralda.png',
    description: 'Pequenos ganhos, repetidos, viram patrimônio.',
  },
  {
    id: 'lendaria',
    name: 'Fênix do Drawdown',
    rarity: 'lendario',
    price: 3500,
    minLevel: 15,
    image: '/frames/lendaria.png',
    description: 'Quem renasce depois da sequência negativa merece asas de fogo.',
  },
  {
    id: 'obsidiana',
    name: 'Obsidiana do Silêncio',
    rarity: 'lendario',
    price: 4500,
    minLevel: 17,
    image: '/frames/obsidiana.png',
    description: 'Pedra vulcânica: nenhum ruído do mercado atravessa seu plano.',
  },
  {
    id: 'mitica',
    name: 'Dragão do Edge',
    rarity: 'mitico',
    price: 6000,
    minLevel: 20,
    image: '/frames/mitica.png',
    description: 'O topo da jornada: processo blindado, mente imbatível.',
  },
  {
    id: 'celestial',
    name: 'Coroa Celestial',
    rarity: 'mitico',
    price: 8000,
    minLevel: 24,
    image: '/frames/celestial.png',
    description: 'Luz de outra órbita para quem virou referência de constância.',
  },
  {
    id: 'cosmica',
    name: 'Singularidade Cósmica',
    rarity: 'mitico',
    price: 12000,
    minLevel: 30,
    image: '/frames/cosmica.png',
    description: 'O fim do mapa. Poucos chegam, ninguém esquece.',
  },
]

export const FRAME_BY_ID = Object.fromEntries(FRAMES.map((f) => [f.id, f])) as Record<string, Frame>
export const DEFAULT_FRAME = 'bronze'

export const RARITY_COLOR: Record<Rarity, string> = {
  comum: '#b08d57',
  raro: '#8fd0ff',
  epico: '#c084fc',
  lendario: '#fbbf24',
  mitico: '#34d399',
}

/** Títulos por nível — inspirados em jogos, mas com a linguagem do trader. */
export const TITLES: { level: number; title: string; subtitle: string }[] = [
  { level: 1, title: 'Recruta do Gráfico', subtitle: 'Primeiros registros no diário' },
  { level: 2, title: 'Aprendiz do Candle', subtitle: 'Começando a ler o que o preço conta' },
  { level: 3, title: 'Escudeiro do Setup', subtitle: 'Já reconhece o próprio padrão' },
  { level: 4, title: 'Vigia do Stop', subtitle: 'Nunca mais entra sem proteção' },
  { level: 5, title: 'Sentinela do Risco', subtitle: 'Protege a banca antes de buscar lucro' },
  { level: 6, title: 'Cartógrafo dos Níveis', subtitle: 'Suportes e resistências na ponta do lápis' },
  { level: 8, title: 'Caçador de Confluência', subtitle: 'Só entra quando o cenário confirma' },
  { level: 9, title: 'Guardião do Diário', subtitle: 'Toda operação vira aprendizado escrito' },
  { level: 11, title: 'Templário da Disciplina', subtitle: 'O plano vale mais que a vontade' },
  { level: 12, title: 'Domador da Ansiedade', subtitle: 'Espera o gatilho sem antecipar' },
  { level: 14, title: 'Mestre do Sangue-Frio', subtitle: 'Loss não muda o tamanho da entrada' },
  { level: 16, title: 'Estrategista do Gerenciamento', subtitle: 'O tamanho da posição faz o resultado' },
  { level: 17, title: 'Arquiteto do Edge', subtitle: 'Constrói vantagem estatística' },
  { level: 18, title: 'Alquimista do Drawdown', subtitle: 'Transforma perda em ajuste de processo' },
  { level: 20, title: 'Lenda da Consistência', subtitle: 'Resultado é consequência do processo' },
  { level: 22, title: 'Guardião do Juro Composto', subtitle: 'Paciência que multiplica' },
  { level: 25, title: 'Soberano dos Mercados', subtitle: 'Mente imbatível, execução impecável' },
  { level: 28, title: 'Oráculo do Fluxo', subtitle: 'Lê intenção onde outros veem ruído' },
  { level: 32, title: 'Imperador do Processo', subtitle: 'Rotina blindada, emoção fora do gráfico' },
  { level: 36, title: 'Sentinela Celestial', subtitle: 'Constância que virou referência' },
  { level: 40, title: 'Eterno do Edge Journal', subtitle: 'A jornada virou legado' },
]

/** XP acumulado necessário para atingir determinado nível (curva suave e sempre alcançável). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  // 100, 250, 450, 700, 1000, ...
  return 50 * (level - 1) * level
}

export function levelFromXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1) && level < 99) level++
  return level
}

export function titleForLevel(level: number) {
  let current = TITLES[0]
  for (const t of TITLES) if (level >= t.level) current = t
  return current
}

export function progressForXp(xp: number) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const into = xp - floor
  const need = ceil - floor
  return {
    level,
    xp,
    xpIntoLevel: into,
    xpToNextLevel: Math.max(need - into, 0),
    percent: need > 0 ? Math.min(100, Math.round((into / need) * 100)) : 100,
    ...titleForLevel(level),
  }
}

export type TradeForXp = {
  result: string
  followedPlan: boolean
  notes?: string | null
  strategy?: string | null
  tradedAt: string | Date
}

/**
 * XP e moedas são DERIVADOS das operações já registradas — nada é gravado em duplicidade
 * e nenhuma tabela existente é alterada.
 */
export const XP_RULES = {
  registrar: 10,
  win: 25,
  breakEven: 12,
  loss: 8, // registrar um loss com honestidade também é evolução
  seguiuPlano: 15,
  anotou: 5,
  diaAtivo: 20,
} as const

export const COIN_RULES = {
  win: 12,
  breakEven: 6,
  loss: 4,
  seguiuPlano: 8,
  diaAtivo: 10,
} as const

export function computeProgress(trades: TradeForXp[]) {
  let xp = 0
  let coins = 0
  const days = new Set<string>()

  for (const t of trades) {
    xp += XP_RULES.registrar
    coins += t.result === 'win' ? COIN_RULES.win : t.result === 'break_even' ? COIN_RULES.breakEven : COIN_RULES.loss
    xp += t.result === 'win' ? XP_RULES.win : t.result === 'break_even' ? XP_RULES.breakEven : XP_RULES.loss
    if (t.followedPlan) {
      xp += XP_RULES.seguiuPlano
      coins += COIN_RULES.seguiuPlano
    }
    if ((t.notes && t.notes.trim()) || (t.strategy && t.strategy.trim())) xp += XP_RULES.anotou
    days.add(dayKey(t.tradedAt))
  }

  xp += days.size * XP_RULES.diaAtivo
  coins += days.size * COIN_RULES.diaAtivo

  return { xp, coinsEarned: coins, activeDays: days.size, totalTrades: trades.length }
}

/* -------------------------------------------------------------------------- */
/* Datas / dias úteis                                                          */
/* -------------------------------------------------------------------------- */

/** Chave AAAA-MM-DD no fuso local (evita o "dia anterior" que o toISOString causava). */
export function dayKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Sábado ou domingo = dia de descanso. */
export function isWeekendKey(key: string): boolean {
  const [y, m, d] = key.split('-').map(Number)
  const w = new Date(y, (m ?? 1) - 1, d ?? 1).getDay()
  return w === 0 || w === 6
}

/** Dia útil imediatamente anterior (pula sábado e domingo). */
export function previousBusinessDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  do {
    date.setDate(date.getDate() - 1)
  } while (date.getDay() === 0 || date.getDay() === 6)
  return dayKey(date)
}

/**
 * Sequência de disciplina.
 *
 * Regras:
 *  - Finais de semana são IGNORADOS: sexta → segunda mantém a sequência.
 *  - Operações registradas no fim de semana são bônus, não quebram nem contam como elo.
 *  - A contagem parte do último dia útil com registro, então dias antigos
 *    (ex.: 02/09, 03/09 e 04/09) contam normalmente como 3 dias de sequência.
 */
export function computeStreak(trades: TradeForXp[], _userCreatedAt?: string | Date | null): number {
  const allDays = [...new Set(trades.map((t) => dayKey(t.tradedAt)))]
  if (allDays.length === 0) return 0

  const businessDays = allDays.filter((d) => !isWeekendKey(d)).sort().reverse()
  if (businessDays.length === 0) return 1 // só registros no fim de semana

  let streak = 1
  let cursor = businessDays[0]
  for (let i = 1; i < businessDays.length; i++) {
    if (businessDays[i] === previousBusinessDay(cursor)) {
      streak++
      cursor = businessDays[i]
    } else {
      break
    }
  }
  return streak
}

/** A sequência ainda está viva hoje? (falso = precisa registrar para não perder) */
export function isStreakActive(trades: TradeForXp[]): boolean {
  const businessDays = [...new Set(trades.map((t) => dayKey(t.tradedAt)))]
    .filter((d) => !isWeekendKey(d))
    .sort()
    .reverse()
  if (!businessDays.length) return false
  const today = dayKey(new Date())
  const reference = isWeekendKey(today) ? previousBusinessDay(today) : today
  return businessDays[0] === reference || businessDays[0] === previousBusinessDay(reference)
}

/** Estágios da sequência — cada nível traz cor/efeito mais intenso. */
export type StreakStage = {
  min: number
  label: string
  emoji: string
  /** classes Tailwind para gradiente + glow + animação */
  className: string
  description: string
}

export const STREAK_STAGES: StreakStage[] = [
  { min: 3, label: 'Iniciante', emoji: '🌱', className: 'from-emerald-500/20 to-emerald-700/10 text-emerald-300 ring-emerald-500/30', description: 'Dando o primeiro passo' },
  { min: 7, label: 'Consistente', emoji: '🔥', className: 'from-orange-500/25 to-amber-500/10 text-orange-300 ring-orange-500/40', description: 'O fogo está aceso' },
  { min: 30, label: 'Disciplinado', emoji: '⚡', className: 'from-amber-400/30 to-yellow-500/10 text-amber-200 ring-amber-400/50', description: 'Energia em alta' },
  { min: 50, label: 'Imparável', emoji: '💎', className: 'from-cyan-400/30 to-blue-500/10 text-cyan-200 ring-cyan-400/60', description: 'Constância que brilha' },
  { min: 75, label: 'Lendário', emoji: '🐉', className: 'from-fuchsia-500/30 to-purple-600/10 text-fuchsia-200 ring-fuchsia-400/60', description: 'Poder de dragão' },
  { min: 125, label: 'Mítico', emoji: '🌌', className: 'from-rose-400/30 via-fuchsia-500/20 to-cyan-400/10 text-rose-100 ring-fuchsia-300/70', description: 'Além dos mercados' },
  { min: 180, label: 'Imortal', emoji: '🪐', className: 'from-indigo-400/35 via-violet-500/20 to-rose-500/10 text-indigo-100 ring-indigo-300/70', description: 'Constância sobre-humana' },
  { min: 250, label: 'Celestial', emoji: '✨', className: 'from-sky-300/35 via-indigo-400/20 to-fuchsia-500/10 text-sky-100 ring-sky-300/70', description: 'Tão raro quanto alinhamento de planetas' },
  { min: 365, label: 'Transcendente', emoji: '🔮', className: 'from-fuchsia-300/40 via-purple-500/25 to-cyan-400/15 text-fuchsia-100 ring-fuchsia-300/80', description: 'Você transcendeu o ciclo' },
]

export function streakStage(streak: number): StreakStage {
  let current = STREAK_STAGES[0]
  for (const s of STREAK_STAGES) if (streak >= s.min) current = s
  return current
}

/** Próximo marco do streak (para mostrar "faltam X dias pra Lendário"). */
export function nextStreakMilestone(streak: number): StreakStage | null {
  return STREAK_STAGES.find((s) => s.min > streak) ?? null
}
