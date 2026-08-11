export type TimerMode = 'stopwatch' | 'timer' | 'pomodoro'

export type TimerStage = 'focus' | 'shortBreak' | 'longBreak'

export type TimerPhase = 'idle' | 'running' | 'paused'

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: number
  completedAt: number | null
  week?: number
  order?: number
}

export interface FocusSession {
  id: string
  taskId: string | null
  taskTitle: string | null
  minutes: number
  startedAt: number
  completedAt: number
}

export interface SessionItem {
  id: string
  title: string
}

export interface Settings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  autoStartBreak: boolean
  autoStartFocus: boolean
  sound: boolean
}

export interface TimerState {
  mode: TimerMode
  stage: TimerStage
  phase: TimerPhase
  endAt: number | null
  remainingMs: number
  startAt: number | null
  elapsedMs: number
  cycleFocusCount: number
  activeSessionTitle: string
}

export type ViewId = 'timer' | 'tasks' | 'history' | 'stats'
