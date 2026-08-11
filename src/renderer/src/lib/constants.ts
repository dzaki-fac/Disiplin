import type { Settings, TimerMode, TimerStage, TimerState } from '../types'

export const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreak: false,
  autoStartFocus: false,
  sound: true
}

export const defaultTimer: TimerState = {
  mode: 'stopwatch',
  stage: 'focus',
  phase: 'idle',
  endAt: null,
  remainingMs: defaultSettings.focusMinutes * 60_000,
  startAt: null,
  elapsedMs: 0,
  cycleFocusCount: 0,
  activeSessionTitle: ''
}

export const durationFor = (mode: TimerMode, stage: TimerStage, s: Settings): number => {
  if (mode !== 'pomodoro') return s.focusMinutes * 60_000
  const minutes =
    stage === 'focus'
      ? s.focusMinutes
      : stage === 'shortBreak'
        ? s.shortBreakMinutes
        : s.longBreakMinutes
  return minutes * 60_000
}
