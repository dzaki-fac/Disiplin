import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { useStore } from '../lib/storeContext'
import { fmtHourMin, fmtMinutes } from '../lib/utils'

const dayFmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short' })
const fullDayFmt = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})

const SERIES_COLORS: Record<string, string> = {
  'Minggu ini': 'var(--ember)',
  'Minggu lalu': 'var(--slate)'
}

const AVG_COLOR = '#c4714d'
const AVG_PREV_COLOR = '#9c9c9c'

interface WeekDatum {
  ts: number
  cur: number
  prev: number
}

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  avg?: number
  prevAvg?: number
  payload?: ReadonlyArray<{
    name?: string | number
    value?: string | number
    color?: string
    payload?: WeekDatum
  }>
}

function ChartTooltip({
  active,
  label,
  avg,
  prevAvg,
  payload
}: ChartTooltipProps): React.JSX.Element | null {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0].payload
  const ts = datum && typeof datum.ts === 'number' ? datum.ts : Number(label)
  const dateLabel = Number.isFinite(ts) ? fullDayFmt.format(new Date(ts)) : String(label)
  return (
    <div className="week-tooltip">
      <span className="week-tooltip__label">{dateLabel}</span>
      {payload.map((p) => {
        const name = String(p.name)
        return (
          <span key={name} className="week-tooltip__row">
            <span
              className="week-tooltip__dot"
              style={{ background: SERIES_COLORS[name] ?? p.color }}
            />
            <span className="week-tooltip__name">{name}</span>
            <span className="week-tooltip__value">{fmtMinutes(Number(p.value))}</span>
          </span>
        )
      })}
      <span className="week-tooltip__row">
        <span className="week-tooltip__dot" style={{ background: AVG_COLOR }} />
        <span className="week-tooltip__name">Rata-rata (Minggu ini)</span>
        <span className="week-tooltip__value">{fmtMinutes(avg ?? 0)}</span>
      </span>
      <span className="week-tooltip__row">
        <span className="week-tooltip__dot" style={{ background: AVG_PREV_COLOR }} />
        <span className="week-tooltip__name">Rata-rata (Minggu lalu)</span>
        <span className="week-tooltip__value">{fmtMinutes(prevAvg ?? 0)}</span>
      </span>
    </div>
  )
}

export function WeekAreaChart(): React.JSX.Element {
  const { sessions } = useStore()

  const data = useMemo<WeekDatum[]>(() => {
    const byDay = new Map<string, number>()
    for (const s of sessions) {
      const key = new Date(s.completedAt).toDateString()
      byDay.set(key, (byDay.get(key) ?? 0) + s.minutes)
    }
    const out: WeekDatum[] = []
    for (let i = 6; i >= 0; i--) {
      const cur = new Date()
      cur.setDate(cur.getDate() - i)
      const prev = new Date(cur)
      prev.setDate(prev.getDate() - 7)
      out.push({
        ts: cur.getTime(),
        cur: byDay.get(cur.toDateString()) ?? 0,
        prev: byDay.get(prev.toDateString()) ?? 0
      })
    }
    return out
  }, [sessions])

  const avg = useMemo(
    () => Math.round(data.reduce((acc, d) => acc + d.cur, 0) / data.length),
    [data]
  )

  const prevAvg = useMemo(
    () => Math.round(data.reduce((acc, d) => acc + d.prev, 0) / data.length),
    [data]
  )

  return (
    <div className="week-area-chart">
      <div className="week-area-chart__legend">
        <span className="week-area-chart__key">
          <i style={{ background: 'var(--ember)' }} />
          Minggu ini
        </span>
        <span className="week-area-chart__key">
          <i style={{ background: 'var(--slate)' }} />
          Minggu lalu
        </span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="week-cur-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--ember)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--ember)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--fog)" />
          <XAxis
            dataKey="ts"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--slate)' }}
            tickFormatter={(v: number) => dayFmt.format(new Date(v))}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--slate)' }}
            tickFormatter={(v: number) => fmtHourMin(v)}
            width={44}
            allowDecimals={false}
          />
          <Tooltip
            content={<ChartTooltip avg={avg} prevAvg={prevAvg} />}
            cursor={{ stroke: 'var(--ember)', strokeOpacity: 0.25 }}
          />
          <ReferenceLine y={avg} stroke={AVG_COLOR} strokeWidth={1.5} />
          <ReferenceLine y={prevAvg} stroke={AVG_PREV_COLOR} strokeWidth={1.5} />
          <Area
            type="monotone"
            dataKey="cur"
            name="Minggu ini"
            stroke="var(--ember)"
            strokeWidth={2}
            fill="url(#week-cur-gradient)"
            fillOpacity={1}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--paper)', fill: 'var(--ember)' }}
          />
          <Area
            type="monotone"
            dataKey="prev"
            name="Minggu lalu"
            stroke="var(--slate)"
            strokeWidth={2}
            strokeDasharray="5 4"
            fill="none"
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--paper)', fill: 'var(--slate)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
