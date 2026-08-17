import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { FocusSession, SessionItem, Task, TimerMode, TimerStage, TimerState } from '../types'
import { defaultSettings, defaultTimer, durationFor } from './constants'
import { StoreContext, type CompletionInfo } from './storeContext'
import { beep, clickPrimary, isToday, pauseBeep, uid } from './utils'
import { SEED_SESSIONS, SEED_TASK, SEED_TASK_ID, TRAINING_TASKS } from './seed'

const LS_TASKS = 'disiplin.tasks'
const LS_SESSIONS = 'disiplin.sessions'
const LS_SETTINGS = 'disiplin.settings'
const LS_TIMER = 'disiplin.timer'
const LS_SESSION_LIST = 'disiplin.sessionList'
const LS_WEEK_NAMES = 'disiplin.weekNames'
const LS_GROUP_ORDER = 'disiplin.groupOrder'
const LS_SEEDED = 'disiplin.seeded'
const SEED_VERSION = 4

let lastCompleteBeepAt = 0
const completeBeep = (): void => {
  const now = Date.now()
  if (now - lastCompleteBeepAt < 600) return
  lastCompleteBeepAt = now
  beep()
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const save = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable
  }
}

function seedVersion(): number {
  try {
    return Number(localStorage.getItem(LS_SEEDED) ?? 0)
  } catch {
    return SEED_VERSION
  }
}

function initTasks(): Task[] {
  const existing = loadJSON<Task[]>(LS_TASKS, [])
  if (seedVersion() >= SEED_VERSION) return existing
  const withoutLegacy = existing.filter((t) => t.id !== SEED_TASK_ID)
  const known = new Set(withoutLegacy.map((t) => t.title))
  const fresh = TRAINING_TASKS.filter((t) => !known.has(t.title))
  return [...withoutLegacy, ...fresh]
}
function initSessions(): FocusSession[] {
  const existing = loadJSON<FocusSession[]>(LS_SESSIONS, [])
  if (seedVersion() >= SEED_VERSION) return existing
  const known = new Set(existing.map((s) => s.id))
  const fresh = SEED_SESSIONS.filter((s) => !known.has(s.id))
  const migrated = existing.map((s) => {
    const seed = SEED_SESSIONS.find((x) => x.id === s.id)
    if (!seed) return s
    return { ...s, taskId: seed.taskId, taskTitle: seed.taskTitle }
  })
  save(LS_SEEDED, String(SEED_VERSION))
  return [...fresh, ...migrated]
}

function initSessionList(): SessionItem[] {
  const existing = loadJSON<SessionItem[] | null>(LS_SESSION_LIST, null)
  if (existing) return existing
  const seen = new Map<string, SessionItem>()
  const add = (title: string): void => {
    if (!seen.has(title)) seen.set(title, { id: title, title })
  }
  for (const s of loadJSON<FocusSession[]>(LS_SESSIONS, [])) {
    if (s.taskTitle) add(s.taskTitle)
  }
  add(SEED_TASK.title)
  return [...seen.values()]
}

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [tasks, setTasks] = useState<Task[]>(() =>
    initTasks().map((t, i) => ({ ...t, order: t.order ?? i }))
  )
  const [sessions, setSessions] = useState<FocusSession[]>(() => initSessions())
  const [sessionList, setSessionList] = useState<SessionItem[]>(() => initSessionList())
  const [weekNames, setWeekNames] = useState<Record<string, string>>(() =>
    loadJSON<Record<string, string>>(LS_WEEK_NAMES, {})
  )
  const [groupOrder, setGroupOrder] = useState<number[]>(() =>
    loadJSON<number[]>(LS_GROUP_ORDER, [])
  )
  const [settings, setSettings] = useState(() => ({
    ...defaultSettings,
    ...loadJSON<Partial<typeof defaultSettings>>(LS_SETTINGS, {})
  }))
  const [timer, setTimer] = useState<TimerState>(() => {
    const loaded = loadJSON<Partial<TimerState>>(LS_TIMER, {})
    const base = { ...defaultTimer, ...loaded }
    const legacy = base.mode as string
    if (legacy === 'focus' || legacy === 'shortBreak' || legacy === 'longBreak') {
      return {
        ...defaultTimer,
        mode: 'pomodoro',
        stage: legacy as TimerStage
      }
    }
    return base
  })
  const [now, setNow] = useState(() => Date.now())
  const [completion, setCompletion] = useState<CompletionInfo | null>(null)

  const settingsRef = useRef(settings)
  const timerRef = useRef(timer)
  const sessionsRef = useRef(sessions)
  const sessionListRef = useRef(sessionList)
  const tasksRef = useRef(tasks)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  useEffect(() => {
    timerRef.current = timer
  }, [timer])
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])
  useEffect(() => {
    sessionListRef.current = sessionList
  }, [sessionList])
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const celebrate = useCallback((session: FocusSession) => {
    const from = sessionsRef.current
      .filter((x) => isToday(x.completedAt))
      .reduce((a, x) => a + x.minutes, 0)
    setCompletion({
      fromMinutes: from,
      totalTodayMinutes: from + session.minutes
    })
  }, [])

  const dismissCompletion = useCallback(() => setCompletion(null), [])

  useEffect(() => save(LS_TASKS, tasks), [tasks])
  useEffect(() => save(LS_SESSIONS, sessions), [sessions])
  useEffect(() => save(LS_SETTINGS, settings), [settings])
  useEffect(() => save(LS_TIMER, timer), [timer])
  useEffect(() => save(LS_SESSION_LIST, sessionList), [sessionList])
  useEffect(() => save(LS_WEEK_NAMES, weekNames), [weekNames])
  useEffect(() => save(LS_GROUP_ORDER, groupOrder), [groupOrder])

  const completeInterval = useCallback(() => {
    const t = timerRef.current
    const s = settingsRef.current
    if (t.phase !== 'running' || t.endAt === null) return
    const at = Date.now()
    const duration = durationFor(t.mode, t.stage, s)

    if (t.mode === 'timer' || (t.mode === 'pomodoro' && t.stage === 'focus')) {
      const session: FocusSession = {
        id: uid(),
        taskId: null,
        taskTitle: t.activeSessionTitle || null,
        minutes: Math.round(duration / 60_000),
        startedAt: t.endAt - duration,
        completedAt: at
      }
      setSessions((prev) => [session, ...prev])
      celebrate(session)

      if (t.mode === 'timer') {
        setTimer({
          ...t,
          stage: 'focus',
          phase: 'idle',
          endAt: null,
          startAt: null,
          elapsedMs: 0,
          remainingMs: durationFor('timer', 'focus', s)
        })
        if (s.sound) completeBeep()
        return
      }

      const cycle = t.cycleFocusCount + 1
      const nextStage: TimerStage = cycle % s.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'
      const ms = durationFor('pomodoro', nextStage, s)
      setTimer({
        ...t,
        stage: nextStage,
        phase: s.autoStartBreak ? 'running' : 'idle',
        endAt: s.autoStartBreak ? at + ms : null,
        startAt: null,
        elapsedMs: 0,
        remainingMs: ms,
        cycleFocusCount: cycle
      })
      if (s.sound) completeBeep()
      return
    }

    const ms = durationFor('pomodoro', 'focus', s)
    setTimer({
      ...t,
      stage: 'focus',
      phase: s.autoStartFocus ? 'running' : 'idle',
      endAt: s.autoStartFocus ? at + ms : null,
      startAt: null,
      elapsedMs: 0,
      remainingMs: ms
    })
    if (s.sound) completeBeep()
  }, [celebrate])

  // Catch up: if a running timer expired while the app was closed,
  // log the elapsed focus session(s) as a single completed session.
  useEffect(() => {
    const t = timerRef.current
    if (t.phase !== 'running' || t.endAt === null || t.endAt > Date.now()) return
    completeInterval()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const running = timer.phase === 'running'

  useEffect(() => {
    if (!running) return
    const t = timerRef.current
    const isStopwatch = t.mode === 'stopwatch'
    const tick = (): void => {
      const cur = timerRef.current
      if (isStopwatch) {
        setNow(Date.now())
        return
      }
      if (cur.endAt !== null && cur.endAt - Date.now() <= 0) {
        completeInterval()
      } else {
        setNow(Date.now())
      }
    }
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [completeInterval, running])

  const remainingMs = useMemo(() => {
    if (timer.phase === 'running' && timer.endAt !== null) {
      return Math.max(0, timer.endAt - now)
    }
    return timer.remainingMs
  }, [timer, now])

  const addTask = useCallback((title: string, week?: number) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setTasks((prev) => {
      const groupTasks = prev.filter((t) => (t.week ?? 0) === (week ?? 0))
      const maxOrder = groupTasks.reduce((m, t) => Math.max(m, t.order ?? t.createdAt), 0)
      const task: Task = {
        id: uid(),
        title: trimmed,
        done: false,
        createdAt: Date.now(),
        completedAt: null,
        week,
        order: maxOrder + 1
      }
      return [task, ...prev]
    })
  }, [])

  const renameTask = useCallback((id: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)))
  }, [])

  const reorderTask = useCallback((id: string, targetId: string) => {
    setTasks((prev) => {
      const dragged = prev.find((t) => t.id === id)
      const target = prev.find((t) => t.id === targetId)
      if (!dragged || !target || id === targetId) return prev
      const groupOf = (t: Task): number => t.week ?? 0
      if (groupOf(dragged) !== groupOf(target)) return prev
      const sorted = prev
        .filter((t) => groupOf(t) === groupOf(dragged))
        .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
      const from = sorted.findIndex((t) => t.id === id)
      const to = sorted.findIndex((t) => t.id === targetId)
      if (from === -1 || to === -1) return prev
      const [item] = sorted.splice(from, 1)
      sorted.splice(to, 0, item)
      const orders = new Map(sorted.map((t, i) => [t.id, i + 1]))
      return prev.map((t) => (orders.has(t.id) ? { ...t, order: orders.get(t.id) } : t))
    })
  }, [])

  const setWeekName = useCallback((week: number, name: string) => {
    setWeekNames((prev) => {
      const next = { ...prev }
      const key = String(week)
      if (name.trim()) next[key] = name.trim()
      else delete next[key]
      return next
    })
  }, [])

  const addTaskGroup = useCallback(() => {
    setWeekNames((prev) => {
      const used = new Set([
        ...Object.keys(prev).map(Number),
        ...tasksRef.current.map((t) => t.week ?? 0)
      ])
      const nextWeek = used.size > 0 ? Math.max(...used) + 1 : 1
      return { ...prev, [String(nextWeek)]: 'Bagian baru' }
    })
  }, [])

  const deleteTaskGroup = useCallback((week: number) => {
    setTasks((prev) => prev.filter((t) => (t.week ?? 0) !== week))
    setWeekNames((prev) => {
      const next = { ...prev }
      delete next[String(week)]
      return next
    })
    setGroupOrder((prev) => prev.filter((w) => w !== week))
  }, [])

  const reorderGroup = useCallback((week: number, targetWeek: number) => {
    if (week === targetWeek) return
    setGroupOrder((prev) => {
      const weeks = [...new Set(tasksRef.current.map((t) => t.week ?? 0))]
      const known = prev.filter((w) => weeks.includes(w))
      const rest = weeks.filter((w) => !known.includes(w))
      const full = [...known, ...rest]
      const from = full.indexOf(week)
      const to = full.indexOf(targetWeek)
      if (from === -1 || to === -1) return prev
      const [item] = full.splice(from, 1)
      full.splice(to, 0, item)
      return full
    })
  }, [])

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : null } : t
      )
    )
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const updateSettings = useCallback((patch: Partial<typeof defaultSettings>) => {
    const s = settingsRef.current
    const next = { ...s, ...patch }
    setSettings(next)
    setTimer((t) => {
      if (t.phase !== 'idle') return t
      return { ...t, remainingMs: durationFor(t.mode, t.stage, next) }
    })
  }, [])

  const setTimerMode = useCallback((mode: TimerMode) => {
    if (timerRef.current.phase !== 'idle') return
    const s = settingsRef.current
    setTimer((prev) => ({
      ...prev,
      mode,
      stage: 'focus',
      phase: 'idle',
      endAt: null,
      remainingMs: durationFor(mode, 'focus', s),
      startAt: null,
      elapsedMs: 0
    }))
  }, [])

  const beginSession = useCallback((title: string) => {
    const s = settingsRef.current
    setTimer((prev) => ({
      ...prev,
      stage: 'focus',
      phase: 'idle',
      endAt: null,
      remainingMs: durationFor(prev.mode, 'focus', s),
      startAt: null,
      elapsedMs: 0,
      cycleFocusCount: 0,
      activeSessionTitle: title
    }))
  }, [])

  const exitSession = useCallback(() => {
    const s = settingsRef.current
    setTimer((prev) => ({
      ...prev,
      stage: 'focus',
      phase: 'idle',
      endAt: null,
      remainingMs: durationFor(prev.mode, 'focus', s),
      startAt: null,
      elapsedMs: 0,
      cycleFocusCount: 0,
      activeSessionTitle: ''
    }))
  }, [])

  const addSessionItem = useCallback((title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setSessionList((prev) => {
      if (prev.some((s) => s.title === trimmed)) return prev
      return [{ id: uid(), title: trimmed }, ...prev]
    })
  }, [])

  const renameSessionItem = useCallback((id: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const current = sessionListRef.current.find((s) => s.id === id)
    if (!current) return
    setSessionList((prev) => {
      if (prev.some((s) => s.title === trimmed)) return prev
      return prev.map((s) => (s.id === id ? { ...s, title: trimmed } : s))
    })
    setTimer((t) =>
      t.activeSessionTitle === current.title ? { ...t, activeSessionTitle: trimmed } : t
    )
  }, [])

  const deleteSessionItem = useCallback((id: string) => {
    const current = sessionListRef.current.find((s) => s.id === id)
    if (!current) return
    setSessionList((prev) => prev.filter((s) => s.id !== id))
    setTimer((t) => (t.activeSessionTitle === current.title ? { ...t, activeSessionTitle: '' } : t))
  }, [])

  const startTimer = useCallback(() => {
    const s = settingsRef.current
    if (s.sound && timerRef.current.phase !== 'running') clickPrimary()
    setTimer((prev) => {
      if (prev.mode === 'stopwatch') {
        return { ...prev, phase: 'running', startAt: Date.now() }
      }
      const ms = prev.phase === 'paused' ? prev.remainingMs : durationFor(prev.mode, prev.stage, s)
      return { ...prev, phase: 'running', endAt: Date.now() + ms, remainingMs: ms }
    })
  }, [])

  const pauseTimer = useCallback(() => {
    if (settingsRef.current.sound && timerRef.current.phase === 'running') pauseBeep()
    setTimer((prev) => {
      if (prev.phase !== 'running') return prev
      if (prev.mode === 'stopwatch' && prev.startAt !== null) {
        return {
          ...prev,
          phase: 'paused',
          startAt: null,
          elapsedMs: prev.elapsedMs + (Date.now() - prev.startAt)
        }
      }
      if (prev.endAt === null) return prev
      return {
        ...prev,
        phase: 'paused',
        endAt: null,
        remainingMs: Math.max(0, prev.endAt - Date.now())
      }
    })
  }, [])

  const resetTimer = useCallback(() => {
    const s = settingsRef.current
    setTimer((prev) => ({
      ...prev,
      phase: 'idle',
      endAt: null,
      startAt: null,
      elapsedMs: 0,
      remainingMs: durationFor(prev.mode, prev.stage, s)
    }))
  }, [])

  const stopStopwatch = useCallback(() => {
    const t = timerRef.current
    const s = settingsRef.current
    let elapsed = t.elapsedMs
    if (t.phase === 'running' && t.startAt !== null) elapsed += Date.now() - t.startAt
    const minutes = Math.max(1, Math.round(elapsed / 60_000))
    if (minutes > 0) {
      const session: FocusSession = {
        id: uid(),
        taskId: null,
        taskTitle: t.activeSessionTitle || null,
        minutes,
        startedAt: Date.now() - elapsed,
        completedAt: Date.now()
      }
      setSessions((prev) => [session, ...prev])
      celebrate(session)
    }
    setTimer((prev) => ({
      ...prev,
      phase: 'idle',
      endAt: null,
      startAt: null,
      elapsedMs: 0,
      remainingMs: durationFor('stopwatch', 'focus', s)
    }))
    if (s.sound) completeBeep()
  }, [celebrate])

  const finishTimer = useCallback(() => {
    const t = timerRef.current
    const s = settingsRef.current
    if (t.phase !== 'running' && t.phase !== 'paused') return
    if (s.sound) completeBeep()
    const at = Date.now()
    const duration = durationFor(t.mode, t.stage, s)
    const remaining =
      t.phase === 'running' && t.endAt !== null ? Math.max(0, t.endAt - at) : t.remainingMs
    const elapsed = Math.max(60_000, duration - remaining)
    const session: FocusSession = {
      id: uid(),
      taskId: null,
      taskTitle: t.activeSessionTitle || null,
      minutes: Math.round(elapsed / 60_000),
      startedAt: at - elapsed,
      completedAt: at
    }
    setSessions((prev) => [session, ...prev])
    celebrate(session)
    setTimer((prev) => ({
      ...prev,
      stage: 'focus',
      phase: 'idle',
      endAt: null,
      startAt: null,
      elapsedMs: 0,
      remainingMs: durationFor(prev.mode, prev.stage, s)
    }))
  }, [celebrate])

  const skipTimer = useCallback(() => {
    const s = settingsRef.current
    setTimer((prev) => {
      if (prev.mode === 'pomodoro') {
        const nextStage: TimerStage = prev.stage === 'focus' ? 'shortBreak' : 'focus'
        const ms = durationFor('pomodoro', nextStage, s)
        return {
          ...prev,
          stage: nextStage,
          phase: 'idle',
          endAt: null,
          startAt: null,
          elapsedMs: 0,
          remainingMs: ms
        }
      }
      return {
        ...prev,
        phase: 'idle',
        endAt: null,
        startAt: null,
        elapsedMs: 0,
        remainingMs: durationFor(prev.mode, 'focus', s)
      }
    })
  }, [])

  const clearSessions = useCallback(() => {
    setSessions([])
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateSession = useCallback(
    (
      id: string,
      patch: Partial<Pick<FocusSession, 'taskTitle' | 'minutes' | 'startedAt' | 'completedAt'>>
    ) => {
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
    },
    []
  )

  const addManualSession = useCallback(
    (taskTitle: string | null, minutes: number, startedAt: number, durationMs: number) => {
      const session: FocusSession = {
        id: uid(),
        taskId: null,
        taskTitle: taskTitle || null,
        minutes,
        startedAt,
        completedAt: startedAt + durationMs
      }
      setSessions((prev) => [session, ...prev])
    },
    []
  )

  const exportSessions = useCallback(async (): Promise<'ok' | 'canceled' | 'error'> => {
    if (typeof window.api?.exportSessions !== 'function') return 'error'
    const payload = JSON.stringify(
      {
        app: 'disiplin',
        kind: 'focus-sessions',
        version: 1,
        exportedAt: new Date().toISOString(),
        sessions
      },
      null,
      2
    )
    const res = await window.api.exportSessions(payload)
    if (res.canceled) return 'canceled'
    return res.ok ? 'ok' : 'error'
  }, [sessions])

  const importSessions = useCallback(async (): Promise<{ ok: boolean; count: number } | null> => {
    if (typeof window.api?.importSessions !== 'function') return null
    const res = await window.api.importSessions()
    if (!res.ok || !res.content) return null
    let parsed: unknown
    try {
      parsed = JSON.parse(res.content)
    } catch {
      return null
    }
    const arr = Array.isArray(parsed)
      ? parsed
      : (parsed as { sessions?: unknown[] } | null)?.sessions
    if (!Array.isArray(arr)) return null
    const valid = arr.filter(
      (x): x is FocusSession =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as FocusSession).id === 'string' &&
        typeof (x as FocusSession).minutes === 'number' &&
        typeof (x as FocusSession).startedAt === 'number' &&
        typeof (x as FocusSession).completedAt === 'number'
    )
    if (valid.length === 0) return { ok: true, count: 0 }
    setSessions((prev) => {
      const existing = new Set(prev.map((s) => s.id))
      return [...prev, ...valid.filter((s) => !existing.has(s.id))]
    })
    setSessionList((prev) => {
      const titles = new Set(prev.map((s) => s.title))
      const fresh: SessionItem[] = []
      for (const s of valid) {
        if (s.taskTitle && !titles.has(s.taskTitle)) {
          titles.add(s.taskTitle)
          fresh.push({ id: uid(), title: s.taskTitle })
        }
      }
      return fresh.length > 0 ? [...fresh, ...prev] : prev
    })
    return { ok: true, count: valid.length }
  }, [])

  return (
    <StoreContext.Provider
      value={{
        tasks,
        sessions,
        sessionList,
        weekNames,
        groupOrder,
        settings,
        timer,
        now,
        remainingMs,
        completion,
        dismissCompletion,
        addTask,
        toggleTask,
        deleteTask,
        renameTask,
        reorderTask,
        setWeekName,
        reorderGroup,
        addTaskGroup,
        deleteTaskGroup,
        updateSettings,
        setTimerMode,
        beginSession,
        exitSession,
        addSessionItem,
        renameSessionItem,
        deleteSessionItem,
        startTimer,
        pauseTimer,
        resetTimer,
        stopStopwatch,
        finishTimer,
        skipTimer,
        clearSessions,
        deleteSession,
        updateSession,
        addManualSession,
        exportSessions,
        importSessions
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}
