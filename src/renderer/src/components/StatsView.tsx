import { useMemo } from 'react'
import { useStore } from '../lib/storeContext'
import { dayKey, fmtHourMin, fmtMinutes, fmtShortDay, isToday, startOfDay } from '../lib/utils'
import { AnimatedInView } from './AnimatedInView'
import { Heatmap } from './Heatmap'

function statCard(label: string, value: string, sub?: string, muted = false): React.JSX.Element {
  return (
    <AnimatedInView className="stat-card">
      <span className="stat-card__label">{label}</span>
      <span className={`stat-card__value${muted ? ' stat-card__value--muted' : ''}`}>{value}</span>
      {sub && <span className="stat-card__sub">{sub}</span>}
    </AnimatedInView>
  )
}

export function StatsView(): React.JSX.Element {
  const { sessions } = useStore()

  const stats = useMemo(() => {
    const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0)
    const todayMinutes = sessions
      .filter((s) => isToday(s.completedAt))
      .reduce((a, s) => a + s.minutes, 0)

    const daySet = new Set(sessions.map((s) => dayKey(s.completedAt)))
    let streak = 0
    const cursor = new Date()
    if (!daySet.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
    while (daySet.has(dayKey(cursor.getTime()))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    const todaySessions = sessions.filter((s) => isToday(s.completedAt)).length

    const week: { label: string; minutes: number; isToday: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const start = startOfDay(d.getTime())
      const end = start + 86_400_000
      const minutes = sessions
        .filter((s) => s.completedAt >= start && s.completedAt < end)
        .reduce((a, s) => a + s.minutes, 0)
      week.push({ label: fmtShortDay(start), minutes, isToday: isToday(start) })
    }

    const bySession = new Map<string, number>()
    for (const s of sessions) {
      const key = s.taskTitle ?? 'Tanpa sesi'
      bySession.set(key, (bySession.get(key) ?? 0) + s.minutes)
    }
    const topSessions = [...bySession.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    return { totalMinutes, todayMinutes, streak, todaySessions, week, topSessions }
  }, [sessions])

  const weekMax = Math.max(1, ...stats.week.map((d) => d.minutes))
  const sessionMax = Math.max(1, ...stats.topSessions.map(([, m]) => m))

  return (
    <div className="view">
      <header className="view__header">
        <h1>Statistik</h1>
        <p className="view__sub">Ringkasan kebiasaan fokusmu</p>
      </header>

      <div className="stat-grid">
        {statCard(
          'Total fokus',
          fmtMinutes(stats.totalMinutes),
          undefined,
          stats.totalMinutes === 0
        )}
        {statCard(
          'Fokus hari ini',
          fmtMinutes(stats.todayMinutes),
          undefined,
          stats.todayMinutes === 0
        )}
        {statCard(
          'Sesi hari ini',
          String(stats.todaySessions),
          undefined,
          stats.todaySessions === 0
        )}
        {statCard(
          'Streak',
          String(stats.streak),
          stats.streak > 0 ? 'hari berturut-turut' : 'mulai rutinitas',
          stats.streak === 0
        )}
      </div>

      <AnimatedInView as="section" className="panel">
        <div className="panel__head">
          <h2>1 Tahun Terakhir</h2>
          <span className="panel__hint">menit fokus per hari</span>
        </div>
        <Heatmap sessions={sessions} />
      </AnimatedInView>

      <AnimatedInView as="section" className="panel">
        <div className="panel__head">
          <h2>7 Hari Terakhir</h2>
          <span className="panel__hint">menit fokus per hari</span>
        </div>
        <div className="week-chart">
          {stats.week.map((d, i) => (
            <AnimatedInView key={i} className="week-col">
              <span className="week-col__value">{d.minutes > 0 ? fmtHourMin(d.minutes) : ''}</span>
              <div className="week-col__bar-wrap">
                <div
                  className={`week-col__bar${d.isToday ? ' week-col__bar--today' : ''}`}
                  style={{ height: `${Math.round((d.minutes / weekMax) * 100)}%` }}
                />
              </div>
              <span className="week-col__label">{d.label}</span>
            </AnimatedInView>
          ))}
        </div>
      </AnimatedInView>

      <AnimatedInView as="section" className="panel">
        <div className="panel__head">
          <h2>Per Sesi</h2>
          <span className="panel__hint">alokasi waktu fokus</span>
        </div>
        {stats.topSessions.length === 0 ? (
          <p className="panel__empty">Belum ada data sesi.</p>
        ) : (
          <ul className="task-bars">
            {stats.topSessions.map(([title, minutes]) => (
              <AnimatedInView as="li" key={title} className="task-bar">
                <div className="task-bar__row">
                  <span className="task-bar__title">{title}</span>
                  <span className="task-bar__value">{fmtMinutes(minutes)}</span>
                </div>
                <div className="task-bar__track">
                  <div
                    className="task-bar__fill"
                    style={{ width: `${Math.round((minutes / sessionMax) * 100)}%` }}
                  />
                </div>
              </AnimatedInView>
            ))}
          </ul>
        )}
      </AnimatedInView>
    </div>
  )
}
