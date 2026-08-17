import { createContext, useContext } from 'react'
import type { FocusSession, SessionItem, Settings, Task, TimerMode, TimerState } from '../types'

export interface CompletionInfo {
  fromMinutes: number
  totalTodayMinutes: number
}

export interface AppStore {
  tasks: Task[]
  sessions: FocusSession[]
  sessionList: SessionItem[]
  weekNames: Record<string, string>
  groupOrder: number[]
  settings: Settings
  timer: TimerState
  now: number
  remainingMs: number
  completion: CompletionInfo | null
  dismissCompletion: () => void
  addTask: (title: string, week?: number) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  renameTask: (id: string, title: string) => void
  reorderTask: (id: string, targetId: string) => void
  setWeekName: (week: number, name: string) => void
  reorderGroup: (week: number, targetWeek: number) => void
  addTaskGroup: () => void
  deleteTaskGroup: (week: number) => void
  updateSettings: (patch: Partial<Settings>) => void
  setTimerMode: (mode: TimerMode) => void
  beginSession: (title: string) => void
  exitSession: () => void
  addSessionItem: (title: string) => void
  renameSessionItem: (id: string, title: string) => void
  deleteSessionItem: (id: string) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  stopStopwatch: () => void
  finishTimer: () => void
  skipTimer: () => void
  clearSessions: () => void
  deleteSession: (id: string) => void
  updateSession: (
    id: string,
    patch: Partial<Pick<FocusSession, 'taskTitle' | 'minutes' | 'startedAt' | 'completedAt'>>
  ) => void
  addManualSession: (
    taskTitle: string | null,
    minutes: number,
    startedAt: number,
    durationMs: number
  ) => void
  exportSessions: () => Promise<'ok' | 'canceled' | 'error'>
  importSessions: () => Promise<{ ok: boolean; count: number } | null>
}

export const StoreContext = createContext<AppStore | null>(null)

export function useStore(): AppStore {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within AppProvider')
  return ctx
}
