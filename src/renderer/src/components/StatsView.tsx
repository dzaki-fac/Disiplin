import { useMemo } from 'react'
import { useStore } from '../lib/storeContext'
import { dayKey, fmtMinutes, isToday } from '../lib/utils'
import { AnimatedInView } from './AnimatedInView'
import { FlameIcon } from './FlameIcon'
import { Heatmap } from './Heatmap'
import { MonthCalendar } from './MonthCalendar'
import { WeekAreaChart } from './WeekAreaChart'

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

    const bySession = new Map<string, number>()
    for (const s of sessions) {
      const key = s.taskTitle ?? 'Tanpa sesi'
      bySession.set(key, (bySession.get(key) ?? 0) + s.minutes)
    }
    const topSessions = [...bySession.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)

    return { totalMinutes, todayMinutes, streak, todaySessions, topSessions }
  }, [sessions])

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
        <AnimatedInView className="stat-card">
          <span className="stat-card__label">Streak</span>
          <span
            className={`stat-card__value stat-card__value--streak${
              stats.streak === 0 ? ' stat-card__value--muted' : ''
            }`}
          >
            {stats.streak}
            {stats.streak > 0 && <FlameIcon className="stat-card__flame" />}
          </span>
          <span className="stat-card__sub">
            {stats.streak > 0 ? 'hari berturut-turut' : 'mulai rutinitas'}
          </span>
        </AnimatedInView>
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
          <h2>Kalender Bulanan</h2>
          <span className="panel__hint">durasi sesi per hari</span>
        </div>
        <MonthCalendar />
      </AnimatedInView>

      <AnimatedInView as="section" className="panel">
        <div className="panel__head">
          <h2>7 Hari Terakhir</h2>
          <span className="panel__hint">dibandingkan minggu lalu</span>
        </div>
        <WeekAreaChart />
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
