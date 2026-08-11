export const uid = (): string => crypto.randomUUID()

export const dayKey = (ts: number): string => new Date(ts).toDateString()

export const startOfDay = (ts: number): number => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export function fmtMinutes(min: number): string {
  if (min <= 0) return '0m'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function fmtHourMin(min: number): string {
  if (min <= 0) return '0:00'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

const timeFmt = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit'
})

const dayFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short'
})

const shortDayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short' })

export const fmtTime = (ts: number): string => timeFmt.format(ts)
export const fmtDay = (ts: number): string => dayFmt.format(ts)
export const fmtShortDay = (ts: number): string => shortDayFmt.format(ts)

export const isToday = (ts: number): boolean => dayKey(ts) === dayKey(Date.now())

export function beep(): void {
  try {
    const Ctx = window.AudioContext
    const ctx = new Ctx()
    const play = (freq: number, delay: number, dur: number): void => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + delay
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur + 0.05)
    }
    play(880, 0, 0.4)
    play(1174, 0.35, 0.5)
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // audio not available
  }
}

export function click(): void {
  try {
    const Ctx = window.AudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 640
    const start = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.15, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.1)
    setTimeout(() => ctx.close(), 120)
  } catch {
    // audio not available
  }
}
