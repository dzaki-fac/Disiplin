import { useEffect, useMemo, useState } from 'react'
import { animate, motion } from 'motion/react'
import { useStore } from '../lib/storeContext'
import { dayKey, fmtHourMin } from '../lib/utils'
import { FlameIcon } from './FlameIcon'

export function SessionCompletePopup(): React.JSX.Element | null {
  const { completion, sessions, dismissCompletion } = useStore()
  const [display, setDisplay] = useState(() => completion?.fromMinutes ?? 0)

  useEffect(() => {
    if (!completion) return
    const controls = animate(completion.fromMinutes, completion.totalTodayMinutes, {
      duration: 5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v))
    })
    return () => controls.stop()
  }, [completion])

  useEffect(() => {
    if (!completion) return
    const id = window.setTimeout(dismissCompletion, 5000)
    return () => window.clearTimeout(id)
  }, [completion, dismissCompletion])

  const streak = useMemo(() => {
    const daySet = new Set(sessions.map((s) => dayKey(s.completedAt)))
    let streak = 0
    const cursor = new Date()
    if (!daySet.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1)
    while (daySet.has(dayKey(cursor.getTime()))) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }, [sessions])

  if (!completion) return null

  return (
    <div className="complete-overlay" role="dialog" aria-modal="true" aria-label="Sesi selesai">
      <motion.div
        className="complete-card"
        initial={{ scale: 0.6, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        <button
          type="button"
          className="complete-card__close"
          onClick={dismissCompletion}
          aria-label="Tutup"
          data-sound-none
        >
          ✕
        </button>
        <div className="flame" aria-hidden="true">
          <FlameIcon className="flame__svg" />
        </div>
        <h2 className="complete-card__title">Sesi Selesai!</h2>
        <p className="complete-card__streak">
          {streak > 0 ? `Streak ${streak} hari berturut-turut` : 'Awal dari rutinitas baru'}
        </p>
        <div className="complete-card__total">
          <span className="complete-card__total-label">Total hari ini</span>
          <span className="complete-card__total-value">{fmtHourMin(display)}</span>
          <span className="complete-card__added">
            +{completion.totalTodayMinutes - completion.fromMinutes} menit
          </span>
        </div>
      </motion.div>
    </div>
  )
}
