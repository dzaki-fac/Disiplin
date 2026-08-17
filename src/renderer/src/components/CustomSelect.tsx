import { useRef, useState } from 'react'
import { ChevronRightIcon } from './icons'

interface CustomSelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  options: CustomSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder
}: CustomSelectProps): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const display = selected ? selected.label : (placeholder ?? 'Pilih...')

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select__trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={!selected ? 'custom-select__placeholder' : undefined}>{display}</span>
        <ChevronRightIcon size={14} className={`custom-select__chevron${open ? ' is-open' : ''}`} />
      </button>

      {open && (
        <div className="custom-select__popup">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`custom-select__option${o.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
