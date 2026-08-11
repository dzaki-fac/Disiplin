import { useMemo, useState } from 'react'
import type { FocusSession } from '../types'
import { useStore } from '../lib/storeContext'
import { AnimatedInView } from './AnimatedInView'
import { dayKey, fmtDay, fmtMinutes, fmtTime, isToday } from '../lib/utils'

function toTimeValue(ts: number): string {
  const d = new Date(ts)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function minutesOfDay(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function applyTime(ts: number, time: string): number {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(ts)
  d.setHours(h || 0, m || 0, 0, 0)
  return d.getTime()
}

function EditPopup({
  session,
  onSave,
  onCancel
}: {
  session: FocusSession
  onSave: (
    patch: Partial<Pick<FocusSession, 'taskTitle' | 'minutes' | 'startedAt' | 'completedAt'>>
  ) => void
  onCancel: () => void
}): React.JSX.Element {
  const { sessionList } = useStore()
  const [title, setTitle] = useState(session.taskTitle ?? '')
  const [start, setStart] = useState(toTimeValue(session.startedAt))
  const [end, setEnd] = useState(toTimeValue(session.completedAt))

  const sMin = minutesOfDay(start)
  const eMin = minutesOfDay(end)
  let diff = eMin - sMin
  if (diff <= 0) diff += 24 * 60
  const minutes = Math.max(1, diff)

  const commit = (): void => {
    const startTs = applyTime(session.startedAt, start)
    let endTs = applyTime(session.completedAt, end)
    if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000
    onSave({ taskTitle: title.trim() || null, minutes, startedAt: startTs, completedAt: endTs })
  }

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <form
        className="session-edit"
        onSubmit={(e) => {
          e.preventDefault()
          commit()
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="session-edit__title">Edit sesi</h3>

        <label className="session-edit__label" htmlFor="session-pick">
          Pilih sesi yang ada
        </label>
        <select
          id="session-pick"
          className="session-edit__select"
          value={sessionList.some((s) => s.title === title) ? title : ''}
          onChange={(e) => setTitle(e.target.value)}
        >
          <option value="">Tanpa tugas</option>
          {sessionList.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
        </select>

        <label className="session-edit__label" htmlFor="session-title">
          Nama sesi
        </label>
        <input
          id="session-title"
          type="text"
          maxLength={80}
          placeholder="Nama sesi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="session-edit__times">
          <label className="session-edit__label">
            Jam mulai
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="session-edit__time"
            />
          </label>
          <label className="session-edit__label">
            Jam selesai
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="session-edit__time"
            />
          </label>
        </div>

        <p className="session-edit__total">
          Durasi: <strong>{minutes} menit</strong>
        </p>

        <div className="session-edit__actions">
          <button type="submit" className="cta cta--primary">
            Simpan
          </button>
          <button type="button" className="cta cta--ghost" onMouseDown={onCancel}>
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

function SessionRow({ session }: { session: FocusSession }): React.JSX.Element {
  const { deleteSession, updateSession } = useStore()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <AnimatedInView key={session.id} as="li" className="session-row">
        <span className="session-row__dot" />
        <div className="session-row__body">
          <span className="session-row__title">{session.taskTitle ?? 'Tanpa tugas'}</span>
          <span className="session-row__time">
            {fmtTime(session.startedAt)} – {fmtTime(session.completedAt)}
          </span>
        </div>
        <span className="session-row__minutes">{fmtMinutes(session.minutes)}</span>
        <span className="session-row__actions">
          <button
            type="button"
            className="icon-btn"
            aria-label="Edit sesi"
            onClick={() => setEditing(true)}
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
            aria-label="Hapus sesi"
            onClick={() => deleteSession(session.id)}
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
      {editing && (
        <EditPopup
          session={session}
          onSave={(patch) => {
            updateSession(session.id, patch)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </>
  )
}

export function HistoryView(): React.JSX.Element {
  const { sessions, clearSessions } = useStore()

  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.completedAt - a.completedAt)
    const map = new Map<string, typeof sorted>()
    for (const s of sorted) {
      const key = dayKey(s.completedAt)
      const list = map.get(key)
      if (list) list.push(s)
      else map.set(key, [s])
    }
    return [...map.entries()].map(([key, list]) => ({
      key,
      label: isToday(list[0].completedAt) ? 'Hari ini' : fmtDay(list[0].completedAt),
      total: list.reduce((acc, s) => acc + s.minutes, 0),
      list
    }))
  }, [sessions])

  return (
    <div className="view">
      <header className="view__header">
        <h1>Riwayat Sesi</h1>
        <p className="view__sub">{sessions.length} sesi fokus tercatat</p>
      </header>

      {sessions.length > 0 && (
        <button type="button" className="cta cta--danger" onClick={clearSessions}>
          Hapus semua riwayat
          <span className="arrow">→</span>
        </button>
      )}

      {groups.map((group) => (
        <section key={group.key} className="history-group">
          <AnimatedInView className="history-group__head">
            <h2>{group.label}</h2>
            <span className="history-group__total">{fmtMinutes(group.total)}</span>
          </AnimatedInView>
          <ul className="session-list">
            {group.list.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        </section>
      ))}

      {sessions.length === 0 && (
        <div className="empty-state">
          <p>Belum ada sesi fokus.</p>
          <p className="empty-state__sub">Mulai timer di halaman Focus untuk mencatat sesi.</p>
        </div>
      )}
    </div>
  )
}
