import type { ViewId } from '../types'
import { HistoryIcon, StatsIcon, TasksIcon, TimerIcon } from './icons'

interface TopNavProps {
  active: ViewId
  onChange: (view: ViewId) => void
  todayMinutes: number
}

const items: { id: ViewId; label: string; Icon: (p: { size?: number }) => React.JSX.Element }[] = [
  { id: 'timer', label: 'Focus', Icon: TimerIcon },
  { id: 'tasks', label: 'Tugas', Icon: TasksIcon },
  { id: 'history', label: 'Riwayat', Icon: HistoryIcon },
  { id: 'stats', label: 'Statistik', Icon: StatsIcon }
]

export function TopNav({ active, onChange, todayMinutes }: TopNavProps): React.JSX.Element {
  return (
    <header className="topnav">
      <div className="brand">
        <span className="brand__dot" />
        <span className="brand__name">Disiplin</span>
      </div>
      <nav className="nav">
        {items.map((item) => {
          const Icon = item.Icon
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item${active === item.id ? ' nav-item--active' : ''}`}
              onClick={() => onChange(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
            >
              <span className="nav-item__icon">
                <Icon size={16} />
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>
      <span className="topnav__right">{todayMinutes} menit fokus hari ini</span>
    </header>
  )
}
