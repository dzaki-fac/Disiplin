interface IconProps {
  size?: number
}

function Svg({
  size = 20,
  children
}: IconProps & { children: React.ReactNode }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const TimerIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 2h6" />
  </Svg>
)

export const TasksIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M9 6l2 2 4-4" />
    <path d="M4 12h.01M8 12h12M4 18h.01M8 18h12" />
  </Svg>
)

export const HistoryIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 8v4l3 2" />
  </Svg>
)

export const StatsIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 15v-4M12 15V7M17 15v-6" />
  </Svg>
)

export const PlayIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M6 4l14 8-14 8V4z" />
  </Svg>
)

export const PauseIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M8 5v14M16 5v14" />
  </Svg>
)

export const ResetIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </Svg>
)

export const SkipIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M5 4l10 8-10 8V4z" />
    <path d="M19 5v14" />
  </Svg>
)

export const PlusIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const TrashIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
  </Svg>
)

export const CheckIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
)

export const PencilIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
  </Svg>
)

export const GripIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <circle cx="9" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1" fill="currentColor" stroke="none" />
  </Svg>
)

export const CogIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </Svg>
)

export const FlameIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M12 22c4.4 0 7-2.6 7-6.5 0-3.1-2-5.2-3.4-6.6-.7-.7-1.2-1.8-.8-3.4-.6.2-1.2.6-1.6 1C10.4 8.7 12 11 12 12.5c-1.7-1.5-3-3.4-3.5-5.5-.5.4-1 1-1.4 1.8C5.5 11 5 12.4 5 15.5 5 19.4 7.6 22 12 22z" />
  </Svg>
)

export const ChevronRightIcon = (p: IconProps): React.JSX.Element => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
)
