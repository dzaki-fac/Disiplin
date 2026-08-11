import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'motion/react'

export function AnimatedInView({
  children,
  className,
  delay = 0.1,
  as = 'div',
  onClick
}: {
  children: ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'li' | 'section' | 'h2' | 'h3'
  onClick?: () => void
}): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { amount: 0.5, once: false })
  const common = {
    className,
    onClick,
    initial: { scale: 0.7, opacity: 0 },
    animate: inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 },
    transition: { duration: 0.2, delay }
  }
  if (as === 'li')
    return (
      <motion.li ref={ref as React.RefObject<HTMLLIElement>} {...common}>
        {children}
      </motion.li>
    )
  if (as === 'section')
    return (
      <motion.section ref={ref as React.RefObject<HTMLElement>} {...common}>
        {children}
      </motion.section>
    )
  if (as === 'h2')
    return (
      <motion.h2 ref={ref as React.RefObject<HTMLHeadingElement>} {...common}>
        {children}
      </motion.h2>
    )
  if (as === 'h3')
    return (
      <motion.h3 ref={ref as React.RefObject<HTMLHeadingElement>} {...common}>
        {children}
      </motion.h3>
    )
  return (
    <motion.div ref={ref as React.RefObject<HTMLDivElement>} {...common}>
      {children}
    </motion.div>
  )
}
