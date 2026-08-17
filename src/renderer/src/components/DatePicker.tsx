import { useMemo, useState } from 'react'
import { useStore } from '../lib/storeContext'
import { dayKey } from '../lib/utils'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

const WEEKDAYS = ['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mn']

const monthTitleFmt = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
const fullDayFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

interface DatePickerProps {
  value: Date
  onChange: (date: Date) => void
}

export function DatePicker({ value, onChange }: DatePickerProps): React.JSX.Element {
  const { now } = useStore()
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState(() => value.getFullYear())
  const [month, setMonth] = useState(() => value.getMonth())

  const todayKey = dayKey(now)
  const selectedKey = dayKey(value.getTime())

  const days = useMemo(() => {
    const first = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (first.getDay() + 6) % 7
    const cells: (number | null)[] = []
    for (let i = 0; i < lead; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }, [year, month])

  const prevMonth = (): void => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const nextMonth = (): void => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const selectDay = (d: number): void => {
    const picked = new Date(year, month, d)
    onChange(picked)
    setOpen(false)
  }

  return (
    <div className="date-picker">
      <button
        type="button"
        className="date-picker__trigger"
        onClick={() => {
          setYear(value.getFullYear())
          setMonth(value.getMonth())
          setOpen((o) => !o)
        }}
      >
        {fullDayFmt.format(value)}
      </button>

      {open && (
        <div className="date-picker__popup">
          <div className="date-picker__head">
            <button
              type="button"
              className="icon-btn icon-btn--bordered"
              aria-label="Bulan sebelumnya"
              onClick={prevMonth}
            >
              <ChevronLeftIcon size={14} />
            </button>
            <span className="date-picker__month-title">
              {monthTitleFmt.format(new Date(year, month, 1))}
            </span>
            <button
              type="button"
              className="icon-btn icon-btn--bordered"
              aria-label="Bulan berikutnya"
              onClick={nextMonth}
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>

          <div className="date-picker__weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="date-picker__grid">
            {days.map((d, i) =>
              d === null ? (
                <span key={`e-${i}`} />
              ) : (
                <button
                  key={d}
                  type="button"
                  className={`date-picker__day${dayKey(new Date(year, month, d).getTime()) === selectedKey ? ' is-selected' : ''}${dayKey(new Date(year, month, d).getTime()) === todayKey ? ' is-today' : ''}`}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
