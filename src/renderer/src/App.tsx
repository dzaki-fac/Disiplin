import { useEffect, useState } from 'react'
import { AppProvider } from './lib/store'
import { useStore } from './lib/storeContext'
import { TopNav } from './components/TopNav'
import { TimerView } from './components/TimerView'
import { TasksView } from './components/TasksView'
import { HistoryView } from './components/HistoryView'
import { StatsView } from './components/StatsView'
import PixelBlast from './components/PixelBlast'
import type { ViewId } from './types'
import { click, isToday } from './lib/utils'

const PIXEL_PALETTE = ['#d43008', '#e2723d', '#e7a33a'] as const

function Shell(): React.JSX.Element {
  const { sessions, settings } = useStore()
  const [view, setView] = useState<ViewId>('timer')

  useEffect(() => {
    if (!settings.sound) return
    const handler = (e: MouseEvent): void => {
      const target = e.target as Element | null
      if (target && target.closest('button')) click()
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [settings.sound])

  const todayMinutes = sessions
    .filter((s) => isToday(s.completedAt))
    .reduce((acc, s) => acc + s.minutes, 0)

  return (
    <div className="app">
      <div className="scroll-wrap">
        <div className="app-bg" aria-hidden="true">
          <PixelBlast
            variant="circle"
            pixelSize={10}
            colors={PIXEL_PALETTE}
            patternScale={3}
            patternDensity={0.9}
            pixelSizeJitter={0.35}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            speed={0.4}
            edgeFade={0.45}
            transparent
          />
        </div>
        <TopNav active={view} onChange={setView} todayMinutes={todayMinutes} />
        <main className="content">
          {view === 'timer' && <TimerView />}
          {view === 'tasks' && <TasksView />}
          {view === 'history' && <HistoryView />}
          {view === 'stats' && <StatsView />}
        </main>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}

export default App
