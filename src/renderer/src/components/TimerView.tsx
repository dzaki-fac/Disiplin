import { useState } from 'react'
import type { TimerMode } from '../types'
import { durationFor } from '../lib/constants'
import { useStore } from '../lib/storeContext'
import { fmtClock } from '../lib/utils'
import { AnimatedInView } from './AnimatedInView'
import { ProgressRing } from './ProgressRing'

const MODE_META: Record<TimerMode, { label: string; sub: string }> = {
  stopwatch: { label: 'Stopwatch', sub: 'Stopwatch' },
  timer: { label: 'Timer', sub: 'Timer' },
  pomodoro: { label: 'Pomodoro', sub: 'Pomodoro' }
}

const STAGE_META: Record<'focus' | 'shortBreak' | 'longBreak', string> = {
  focus: 'Fokus',
  shortBreak: 'Istirahat Pendek',
  longBreak: 'Istirahat Panjang'
}

function SettingsPanel({ mode }: { mode: TimerMode }): React.JSX.Element {
  const { settings, updateSettings } = useStore()
  const [focusMin, setFocusMin] = useState(String(settings.focusMinutes))
  const [shortMin, setShortMin] = useState(String(settings.shortBreakMinutes))
  const [longMin, setLongMin] = useState(String(settings.longBreakMinutes))
  const [intervalStr, setIntervalStr] = useState(String(settings.longBreakInterval))

  const commit = (setter: (n: number) => void, raw: string, min: number, max: number): void => {
    const n = Math.min(max, Math.max(min, parseInt(raw, 10) || min))
    setter(n)
  }

  const isPomodoro = mode === 'pomodoro'

  return (
    <section className="settings">
      <h3 className="settings__title">Pengaturan</h3>
      <div className="settings__grid">
        <label className="field">
          <span className="field__label">{isPomodoro ? 'Durasi fokus' : 'Durasi'} (menit)</span>
          <input
            type="number"
            min={1}
            max={120}
            value={focusMin}
            onChange={(e) => {
              setFocusMin(e.target.value)
              commit((n) => updateSettings({ focusMinutes: n }), e.target.value, 1, 120)
            }}
            onBlur={() => setFocusMin(String(settings.focusMinutes))}
          />
        </label>
        {isPomodoro && (
          <>
            <label className="field">
              <span className="field__label">Istirahat pendek (menit)</span>
              <input
                type="number"
                min={1}
                max={60}
                value={shortMin}
                onChange={(e) => {
                  setShortMin(e.target.value)
                  commit((n) => updateSettings({ shortBreakMinutes: n }), e.target.value, 1, 60)
                }}
                onBlur={() => setShortMin(String(settings.shortBreakMinutes))}
              />
            </label>
            <label className="field">
              <span className="field__label">Istirahat panjang (menit)</span>
              <input
                type="number"
                min={1}
                max={90}
                value={longMin}
                onChange={(e) => {
                  setLongMin(e.target.value)
                  commit((n) => updateSettings({ longBreakMinutes: n }), e.target.value, 1, 90)
                }}
                onBlur={() => setLongMin(String(settings.longBreakMinutes))}
              />
            </label>
            <label className="field">
              <span className="field__label">Fokus sebelum istirahat panjang</span>
              <input
                type="number"
                min={2}
                max={12}
                value={intervalStr}
                onChange={(e) => {
                  setIntervalStr(e.target.value)
                  commit((n) => updateSettings({ longBreakInterval: n }), e.target.value, 2, 12)
                }}
                onBlur={() => setIntervalStr(String(settings.longBreakInterval))}
              />
            </label>
          </>
        )}
        {isPomodoro && (
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.autoStartBreak}
              onChange={(e) => updateSettings({ autoStartBreak: e.target.checked })}
            />
            <span className="switch__track" />
            <span className="switch__label">Mulai istirahat otomatis</span>
          </label>
        )}
        <label className="switch">
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => updateSettings({ sound: e.target.checked })}
          />
          <span className="switch__track" />
          <span className="switch__label">Suara notifikasi</span>
        </label>
      </div>
    </section>
  )
}

export function TimerView(): React.JSX.Element {
  const {
    timer,
    settings,
    now,
    remainingMs,
    setTimerMode,
    startTimer,
    pauseTimer,
    resetTimer,
    stopStopwatch,
    finishTimer,
    skipTimer
  } = useStore()

  const [settingsOpen, setSettingsOpen] = useState(false)

  const isStopwatch = timer.mode === 'stopwatch'
  const isPomodoro = timer.mode === 'pomodoro'
  const duration = durationFor(timer.mode, timer.stage, settings)
  const elapsedMs =
    isStopwatch && timer.phase === 'running' && timer.startAt !== null
      ? timer.elapsedMs + (now - timer.startAt)
      : timer.elapsedMs
  const HOUR_MS = 3_600_000
  const progress = isStopwatch
    ? Math.min(1, elapsedMs / HOUR_MS)
    : duration > 0
      ? 1 - remainingMs / duration
      : 0
  const displayMs = isStopwatch ? elapsedMs : remainingMs
  const stageLabel = isPomodoro ? STAGE_META[timer.stage] : MODE_META[timer.mode].sub
  const inCycle =
    timer.cycleFocusCount +
    (isPomodoro && timer.stage === 'focus' && timer.phase === 'running' ? 1 : 0)

  const running = timer.phase === 'running'
  const ringColor =
    timer.phase === 'running'
      ? '#d43008'
      : timer.phase === 'paused'
        ? 'var(--violet)'
        : isStopwatch || !isPomodoro || timer.stage === 'focus'
          ? 'var(--ember)'
          : 'var(--carbon)'

  const hasProgress = isStopwatch
    ? timer.elapsedMs > 0
    : timer.phase !== 'idle' || (duration > 0 && remainingMs < duration)

  return (
    <div className="view timer-view timer-view--active">
      <div className="mode-tabs" role="tablist" aria-label="Mode timer">
        {(Object.keys(MODE_META) as TimerMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={timer.mode === mode}
            className={`mode-tab${timer.mode === mode ? ' is-active' : ''}`}
            disabled={timer.phase !== 'idle'}
            onClick={() => setTimerMode(mode)}
          >
            {MODE_META[mode].label}
          </button>
        ))}
      </div>

      <div
        className={`timer-main${running ? ' is-running' : timer.phase === 'paused' ? ' is-paused' : ''}`}
      >
        {!isStopwatch && (
          <button
            type="button"
            className={`settings-toggle${settingsOpen ? ' is-open' : ''}`}
            aria-label="Pengaturan"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.08a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.08a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" />
            </svg>
          </button>
        )}
        <div className="timer-main__ring">
          <ProgressRing
            size={280}
            stroke={3}
            progress={progress}
            color={ringColor}
            trackColor="rgb(102 102 102 / 0.18)"
          >
            <span className="ring__mode">{stageLabel}</span>
            <span className={`ring__clock${running ? '' : ' is-idle'}`}>{fmtClock(displayMs)}</span>
            {isPomodoro && (
              <span className="ring__cycle">
                Sesi {inCycle} / {settings.longBreakInterval}
              </span>
            )}
          </ProgressRing>

          {isPomodoro && (
            <div className="cycle-dots" aria-hidden="true">
              {Array.from({ length: settings.longBreakInterval }, (_, i) => (
                <span
                  key={i}
                  className={`cycle-dot${i < inCycle ? ' is-filled' : ''}${
                    i < inCycle && timer.stage !== 'focus' ? ' cycle-dot--break' : ''
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="timer-main__side">
          <div className="session-now">
            {timer.activeSessionTitle ? (
              <span className="session-now__name">{timer.activeSessionTitle}</span>
            ) : (
              <span className="session-now__name session-now__name--empty">
                Belum ada sesi — pilih atau buat di bawah
              </span>
            )}
          </div>

          <div className="controls">
            {hasProgress && (
              <button type="button" className="cta cta--ghost" onClick={resetTimer}>
                Reset
              </button>
            )}
            <button
              type="button"
              className="cta cta--primary"
              onClick={running ? pauseTimer : startTimer}
            >
              {running ? 'Jeda' : 'Mulai'}
              <span className="arrow">→</span>
            </button>
            {isStopwatch ? (
              hasProgress && (
                <button type="button" className="cta cta--ghost" onClick={stopStopwatch}>
                  Selesai
                </button>
              )
            ) : isPomodoro ? (
              <button type="button" className="cta cta--ghost" onClick={skipTimer}>
                Lewati
              </button>
            ) : hasProgress ? (
              <button type="button" className="cta cta--ghost" onClick={finishTimer}>
                Selesai
              </button>
            ) : null}
          </div>
        </div>

        {!isStopwatch && settingsOpen && (
          <div className="settings-popover">
            <SettingsPanel mode={timer.mode} />
          </div>
        )}
      </div>

      <SessionManager />
    </div>
  )
}

function SessionManager(): React.JSX.Element {
  const { timer, sessionList, beginSession, addSessionItem, renameSessionItem, deleteSessionItem } =
    useStore()
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const submitNew = (e: React.FormEvent): void => {
    e.preventDefault()
    const trimmed = newTitle.trim()
    if (!trimmed) return
    addSessionItem(trimmed)
    beginSession(trimmed)
    setNewTitle('')
  }

  const startEdit = (item: { id: string; title: string }): void => {
    setEditingId(item.id)
    setDraft(item.title)
  }

  const commitEdit = (): void => {
    if (editingId === null) return
    renameSessionItem(editingId, draft)
    setEditingId(null)
    setDraft('')
  }

  const cancelEdit = (): void => {
    setEditingId(null)
    setDraft('')
  }

  const activeTitle = timer.activeSessionTitle

  return (
    <section className="session-manager">
      <div className="session-manager__head">
        <h2 className="session-manager__title">Sesi</h2>
        <span className="session-manager__count">{sessionList.length} sesi</span>
      </div>

      <ul className="session-manager__list">
        {sessionList.map((item) => {
          const isActive = item.title === activeTitle
          if (editingId === item.id) {
            return (
              <AnimatedInView as="li" key={item.id} className="session-manager__row">
                <form
                  className="session-manager__edit"
                  onSubmit={(e) => {
                    e.preventDefault()
                    commitEdit()
                  }}
                >
                  <input
                    type="text"
                    maxLength={80}
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                  />
                  <button type="submit" className="cta cta--primary" disabled={!draft.trim()}>
                    Simpan
                  </button>
                  <button type="button" className="cta cta--ghost" onMouseDown={cancelEdit}>
                    Batal
                  </button>
                </form>
              </AnimatedInView>
            )
          }
          return (
            <AnimatedInView
              as="li"
              key={item.id}
              className={`session-manager__row${isActive ? ' is-active' : ''}`}
              onClick={() => beginSession(item.title)}
            >
              <span className="session-manager__dot" aria-hidden="true" />
              <span className="session-manager__name">{item.title}</span>
              <span className="session-manager__actions">
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Edit ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    startEdit(item)
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  aria-label={`Hapus ${item.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSessionItem(item.id)
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4h8v2m1 0-1 14H8L7 6" />
                  </svg>
                </button>
              </span>
            </AnimatedInView>
          )
        })}
      </ul>

      <form className="session-manager__new" onSubmit={submitNew}>
        <input
          type="text"
          placeholder="Nama sesi baru"
          maxLength={80}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" className="cta cta--primary" disabled={!newTitle.trim()}>
          Tambah
          <span className="arrow">→</span>
        </button>
      </form>
    </section>
  )
}
