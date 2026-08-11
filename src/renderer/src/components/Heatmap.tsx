import { useMemo } from 'react'
import type { FocusSession } from '../types'
import { dayKey, fmtMinutes } from '../lib/utils'

const DAY_LABELS: Record<number, string> = { 1: 'S', 3: 'R', 5: 'J' }

const WEEKS = 53

const monthShortFmt = new Intl.DateTimeFormat('id-ID', { month: 'short' })
const fullDateFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
})

const monthShort = (ts: number): string => monthShortFmt.format(ts)
const fullDate = (ts: number): string => fullDateFmt.format(ts)

const levelFor = (min: number): number =>
  min <= 0 ? 0 : min < 30 ? 1 : min < 60 ? 2 : min < 120 ? 3 : 4

interface Cell {
  ts: number
  minutes: number
  level: number
  isFuture: boolean
}

interface HeatmapData {
  weeks: Cell[][]
  monthSlots: (string | null)[]
  totalMinutes: number
  activeDays: number
}

function buildData(sessions: FocusSession[]): HeatmapData {
  const minutesByDay = new Map<string, number>()
  for (const s of sessions) {
    const key = dayKey(s.completedAt)
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + s.minutes)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTs = today.getTime()

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const gridStart = new Date(weekStart)
  gridStart.setDate(weekStart.getDate() - (WEEKS - 1) * 7)

  const weeks: Cell[][] = []
  const monthSlots: (string | null)[] = []
  let totalMinutes = 0
  let activeDays = 0

  for (let w = 0; w < WEEKS; w++) {
    const column: Cell[] = []
    let colMonth: string | null = null
    for (let d = 0; d < 7; d++) {
      const dt = new Date(gridStart)
      dt.setDate(gridStart.getDate() + w * 7 + d)
      const ts = dt.getTime()
      const isFuture = ts > todayTs
      const minutes = isFuture ? 0 : (minutesByDay.get(dayKey(ts)) ?? 0)
      if (!isFuture && minutes > 0) {
        totalMinutes += minutes
        activeDays++
      }
      column.push({ ts, minutes, level: isFuture ? 0 : levelFor(minutes), isFuture })
      if (dt.getDate() === 1) colMonth = monthShort(ts)
    }
    weeks.push(column)
    monthSlots.push(colMonth)
  }

  return { weeks, monthSlots, totalMinutes, activeDays }
}

interface HeatmapProps {
  sessions: FocusSession[]
}

export function Heatmap({ sessions }: HeatmapProps): React.JSX.Element {
  const data = useMemo(() => buildData(sessions), [sessions])

  return (
    <div className="heatmap">
      <div className="heatmap__scroll">
        <div className="heatmap__inner">
          <div className="heatmap__months">
            {data.monthSlots.map((m, i) => (
              <span key={i} className="heatmap__month">
                {m ?? ''}
              </span>
            ))}
          </div>
          <div className="heatmap__row">
            <div className="heatmap__days">
              {Array.from({ length: 7 }, (_, r) => (
                <span key={r} className="heatmap__day-label">
                  {DAY_LABELS[r] ?? ''}
                </span>
              ))}
            </div>
            <div className="heatmap__weeks">
              {data.weeks.map((column, wi) => (
                <div key={wi} className="heatmap__week">
                  {column.map((cell, di) => {
                    const title =
                      fullDate(cell.ts) + (cell.minutes > 0 ? ` · ${fmtMinutes(cell.minutes)}` : '')
                    return (
                      <span
                        key={di}
                        className={`heatmap__cell heatmap__cell--${cell.level}${
                          cell.isFuture ? ' is-future' : ''
                        }`}
                        title={title}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap__foot">
        <span className="heatmap__stat">
          {data.activeDays} hari aktif · {fmtMinutes(data.totalMinutes)} fokus dalam 1 tahun
        </span>
        <div className="heatmap__legend">
          <span className="heatmap__legend-label">Sedikit</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className={`heatmap__cell heatmap__cell--${l}`} />
          ))}
          <span className="heatmap__legend-label">Banyak</span>
        </div>
      </div>
    </div>
  )
}
