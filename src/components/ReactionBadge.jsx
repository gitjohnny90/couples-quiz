import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * Emoji reaction display positioned at the bottom-right edge of an answer box.
 * Shows bare emojis (no pill/background) hanging halfway off the corner.
 * Parent must have position: relative and overflow: visible.
 *
 * Pop animation only fires for reactions that arrive AFTER initial mount
 * (i.e. real-time partner reactions), not for pre-existing ones on page load.
 */
export default function ReactionBadge({ myReaction, partnerReaction }) {
  if (!myReaction && !partnerReaction) return null

  const mountedRef = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => { mountedRef.current = true }, 800)
    return () => clearTimeout(timer)
  }, [])

  const shouldAnimate = mountedRef.current

  const popSpring = {
    initial: shouldAnimate ? { scale: 0, opacity: 0 } : false,
    animate: { scale: 1, opacity: 1 },
    transition: shouldAnimate
      ? { type: 'spring', stiffness: 500, damping: 12 }
      : { duration: 0 },
  }

  const hasBoth = myReaction && partnerReaction

  return (
    <div style={{
      position: 'absolute',
      bottom: -10,
      right: -6,
      zIndex: 2,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 1,
    }}>
      {myReaction && (
        <motion.span
          key={`my-${myReaction}`}
          {...popSpring}
          style={{ fontSize: '1.1rem', lineHeight: 1, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }}
        >
          {myReaction}
        </motion.span>
      )}
      {partnerReaction && (
        <motion.span
          key={`partner-${partnerReaction}`}
          {...popSpring}
          style={{
            fontSize: '1.1rem',
            lineHeight: 1,
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            marginRight: hasBoth ? -4 : 0,
          }}
        >
          {partnerReaction}
        </motion.span>
      )}
    </div>
  )
}
