import { useMemo, useState } from 'react'
import { useStore } from '../lib/storeContext'
import { dayKey, fmtMinutes } from '../lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const monthTitleFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const fullDayFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const levelFor = (min: number): number =>
  min <= 0 ? 0 : min < 120 ? 1 : min < 240 ? 2 : min < 360 ? 3 : 4

interface DayCell {
  ts: number
  day: number
  minutes: number
  level: number
  isToday: boolean
  isFuture: boolean
}

export function MonthCalendar(): React.JSX.Element {
  const { sessions } = useStore()
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())

  const isCurrentMonth = (): boolean =>
    year === new Date().getFullYear() && month === new Date().getMonth()

  const data = useMemo(() => {
    const byDay = new Map<string, number>()
    for (const s of sessions) {
      const key = dayKey(s.completedAt)
      byDay.set(key, (byDay.get(key) ?? 0) + s.minutes)
    }

    const todayKey = dayKey(new Date().getTime())
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7

    const cells: (DayCell | null)[] = []
    for (let i = 0; i < lead; i++) cells.push(null)

    let totalMinutes = 0
    let activeDays = 0
    for (let d = 1; d <= daysInMonth; d++) {
      const ts = new Date(year, month, d).getTime()
      const minutes = byDay.get(dayKey(ts)) ?? 0
      totalMinutes += minutes
      if (minutes > 0) activeDays++
      cells.push({
        ts,
        day: d,
        minutes,
        level: levelFor(minutes),
        isToday: dayKey(ts) === todayKey,
        isFuture: ts > new Date().getTime()
      })
    }
    return { cells, totalMinutes, activeDays }
  }, [sessions, year, month])

  const canGoNext = (): boolean => !isCurrentMonth()

  const prevMonth = (): void => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = (): void => {
    if (!canGoNext()) return
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <div className="month-cal">
      <div className="month-cal__head">
        <button
          type="button"
          className="icon-btn icon-btn--bordered"
          aria-label="Bulan sebelumnya"
          title="Bulan sebelumnya"
          onClick={prevMonth}
        >
          <ChevronLeftIcon size={16} />
        </button>
        <span className="month-cal__title">{monthTitleFmt.format(new Date(year, month, 1))}</span>
        <button
          type="button"
          className="icon-btn icon-btn--bordered"
          aria-label="Bulan berikutnya"
          title="Bulan berikutnya"
          onClick={nextMonth}
          disabled={!canGoNext()}
        >
          <ChevronRightIcon size={16} />
        </button>
      </div>

      <div className="month-cal__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="month-cal__grid">
        {data.cells.map((c, i) =>
          c === null ? (
            <span key={`empty-${i}`} />
          ) : (
            <button
              key={c.ts}
              type="button"
              className={`month-cal__day month-cal__day--${c.level}${
                c.isToday ? ' is-today' : ''
              }${c.isFuture ? ' is-future' : ''}`}
              title={fullDayFmt.format(c.ts) + (c.minutes > 0 ? ` · ${fmtMinutes(c.minutes)}` : '')}
            >
              <span className="month-cal__num">{c.day}</span>
              <span className="month-cal__val">{c.minutes > 0 ? fmtMinutes(c.minutes) : ''}</span>
            </button>
          )
        )}
      </div>

      <div className="month-cal__foot">
        <span className="month-cal__stat">
          {data.activeDays} hari aktif · {fmtMinutes(data.totalMinutes)} fokus di bulan ini
        </span>
        <div className="month-cal__legend">
          <span className="month-cal__legend-label">Sedikit</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`heatmap__cell heatmap__cell--${l}`} />
          ))}
          <span className="month-cal__legend-label">Banyak</span>
        </div>
      </div>
    </div>
  )
}
