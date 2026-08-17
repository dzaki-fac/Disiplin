import { useMemo, useRef, useState } from 'react'
import type { FocusSession } from '../types'
import { useStore } from '../lib/storeContext'
import { AnimatedInView } from './AnimatedInView'
import { dayKey, fmtDay, fmtMinutes, fmtTime, isToday } from '../lib/utils'
import { CustomSelect } from './CustomSelect'
import { DatePicker } from './DatePicker'
import { ExportIcon, ImportIcon, PlusIcon } from './icons'

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
  const [editDate, setEditDate] = useState(() => new Date(session.startedAt))
  const [start, setStart] = useState(toTimeValue(session.startedAt))
  const [end, setEnd] = useState(toTimeValue(session.completedAt))

  const sMin = minutesOfDay(start)
  const eMin = minutesOfDay(end)
  let diff = eMin - sMin
  if (diff <= 0) diff += 24 * 60
  const minutes = Math.max(1, diff)

  const commit = (): void => {
    const baseDate = new Date(editDate)
    baseDate.setHours(0, 0, 0, 0)
    const baseTs = baseDate.getTime()
    const startTs = baseTs + minutesOfDay(start) * 60_000
    let endTs = baseTs + minutesOfDay(end) * 60_000
    if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000
    const minutes = Math.max(1, Math.round((endTs - startTs) / 60_000))
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
        <CustomSelect
          options={[
            { value: '', label: 'Tanpa tugas' },
            ...sessionList.map((s) => ({ value: s.title, label: s.title }))
          ]}
          value={sessionList.some((s) => s.title === title) ? title : ''}
          onChange={(v) => setTitle(v)}
        />

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

        <label className="session-edit__label">Tanggal</label>
        <DatePicker value={editDate} onChange={setEditDate} />

        <div className="session-edit__times">
          <span className="session-edit__label">Jam mulai</span>
          <span className="session-edit__label">Jam selesai</span>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>

        <div className="session-edit__footer">
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
  const { sessions, sessionList, clearSessions, exportSessions, importSessions, addManualSession } =
    useStore()
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDate, setManualDate] = useState(() => new Date())
  const [manualStart, setManualStart] = useState(() => toTimeValue(Date.now()))
  const [manualEnd, setManualEnd] = useState(() => {
    const d = new Date(Date.now() + 25 * 60_000)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const showNotice = (text: string): void => {
    setNotice(text)
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3000)
  }

  const handleExport = async (): Promise<void> => {
    const res = await exportSessions()
    if (res === 'ok') showNotice('Riwayat sesi berhasil diekspor')
    else if (res === 'error') showNotice('Gagal mengekspor riwayat')
  }

  const handleImport = async (): Promise<void> => {
    const res = await importSessions()
    if (!res) return
    showNotice(res.count > 0 ? `${res.count} sesi diimpor` : 'Tidak ada sesi baru di file tersebut')
  }

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
      <header className="view__header view__header--actions">
        <h1>Riwayat Sesi</h1>
        <p className="view__sub">{sessions.length} sesi fokus tercatat</p>
        <div className="view__actions">
          <button
            type="button"
            className="icon-btn icon-btn--bordered"
            aria-label="Export riwayat sesi"
            title="Export riwayat sesi"
            disabled={sessions.length === 0}
            onClick={handleExport}
          >
            <ExportIcon size={16} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--bordered"
            aria-label="Import riwayat sesi"
            title="Import riwayat sesi"
            onClick={handleImport}
          >
            <ImportIcon size={16} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--bordered"
            aria-label="Tambah sesi manual"
            title="Tambah sesi manual"
            onClick={() => setManualOpen((o) => !o)}
            data-sound-none
          >
            <PlusIcon size={16} />
          </button>
        </div>
      </header>

      {manualOpen && (
        <div className="modal-overlay" onMouseDown={() => setManualOpen(false)}>
          <form
            className="session-edit"
            onSubmit={(e) => {
              e.preventDefault()
              const baseDate = new Date(manualDate)
              baseDate.setHours(0, 0, 0, 0)
              const baseTs = baseDate.getTime()
              const startTs = baseTs + minutesOfDay(manualStart) * 60_000
              let endTs = baseTs + minutesOfDay(manualEnd) * 60_000
              if (endTs <= startTs) endTs += 24 * 60 * 60 * 1000
              const mins = Math.max(1, Math.round((endTs - startTs) / 60_000))
              addManualSession(manualTitle.trim() || null, mins, startTs, endTs - startTs)
              setManualOpen(false)
              setManualTitle('')
              setManualDate(new Date())
              setManualStart(toTimeValue(Date.now()))
              const d2 = new Date(Date.now() + 25 * 60_000)
              setManualEnd(
                `${String(d2.getHours()).padStart(2, '0')}:${String(d2.getMinutes()).padStart(2, '0')}`
              )
              showNotice('Sesi berhasil ditambahkan')
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h3 className="session-edit__title">Tambah sesi</h3>

            <label className="session-edit__label" htmlFor="manual-session-pick">
              Pilih sesi yang ada
            </label>
            <CustomSelect
              options={[
                { value: '', label: 'Tanpa tugas' },
                ...sessionList.map((s) => ({ value: s.title, label: s.title }))
              ]}
              value={sessionList.some((s) => s.title === manualTitle) ? manualTitle : ''}
              onChange={(v) => setManualTitle(v)}
            />

            <label className="session-edit__label" htmlFor="manual-session-title">
              Nama sesi
            </label>
            <input
              id="manual-session-title"
              type="text"
              maxLength={80}
              placeholder="Nama sesi"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />

            <label className="session-edit__label">Tanggal</label>
            <DatePicker value={manualDate} onChange={setManualDate} />

            <div className="session-edit__times">
              <span className="session-edit__label">Jam mulai</span>
              <span className="session-edit__label">Jam selesai</span>
              <input type="time" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
              <input type="time" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
            </div>

            <div className="session-edit__footer">
              <p className="session-edit__total">
                Durasi:{' '}
                <strong>
                  {(() => {
                    let diff = minutesOfDay(manualEnd) - minutesOfDay(manualStart)
                    if (diff <= 0) diff += 24 * 60
                    return Math.max(1, diff)
                  })()}{' '}
                  menit
                </strong>
              </p>

              <div className="session-edit__actions">
                <button type="submit" className="cta cta--primary">
                  Tambah
                </button>
                <button
                  type="button"
                  className="cta cta--ghost"
                  onMouseDown={() => setManualOpen(false)}
                >
                  Batal
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {notice && <p className="history-notice">{notice}</p>}

      {sessions.length > 0 && (
        <button
          type="button"
          className="cta cta--danger"
          onClick={() => {
            if (!window.confirm('Yakin ingin menghapus semua riwayat?')) return
            clearSessions()
          }}
        >
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
