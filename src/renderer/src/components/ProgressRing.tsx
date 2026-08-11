interface ProgressRingProps {
  size: number
  stroke: number
  progress: number
  color: string
  trackColor: string
  children: React.ReactNode
}

export function ProgressRing({
  size,
  stroke,
  progress,
  color,
  trackColor,
  children
}: ProgressRingProps): React.JSX.Element {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <div className="ring__content">{children}</div>
    </div>
  )
}
