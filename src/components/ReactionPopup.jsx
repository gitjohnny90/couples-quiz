import { motion, AnimatePresence } from 'framer-motion'

const EMOJIS = ['❤️', '😂', '🔥']

export default function ReactionPopup({ targetRect, myReaction, partnerReaction, onReact, onClose }) {
  if (!targetRect) return null

  // Position popup centered above the card
  const popupWidth = 180
  const popupHeight = 56
  const gap = 10

  let top = targetRect.top - popupHeight - gap
  let left = targetRect.left + targetRect.width / 2 - popupWidth / 2

  // If too close to top, show below instead
  if (top < 10) {
    top = targetRect.bottom + gap
  }

  // Clamp horizontal to stay in viewport
  left = Math.max(10, Math.min(left, window.innerWidth - popupWidth - 10))

  // Transform origin based on position relative to card
  const showBelow = top > targetRect.top
  const originY = showBelow ? 'top' : 'bottom'

  return (
    <AnimatePresence>
      <motion.div
        key="reaction-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.12)',
          zIndex: 1000,
          touchAction: 'none',
        }}
      />

      <motion.div
        key="reaction-pill"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        style={{
          position: 'fixed',
          top,
          left,
          width: popupWidth,
          height: popupHeight,
          zIndex: 1001,
          background: '#FFFBF5',
          borderRadius: 28,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transformOrigin: `center ${originY}`,
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {EMOJIS.map((emoji, i) => {
          const isSelected = myReaction === emoji
          const partnerPicked = partnerReaction === emoji

          return (
            <motion.button
              key={emoji}
              initial={{ opacity: 0, scale: 0, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 15,
                delay: 0.05 + i * 0.06,
              }}
              whileTap={{ scale: 1.35 }}
              onClick={(e) => {
                e.stopPropagation()
                onReact(emoji)
              }}
              style={{
                position: 'relative',
                background: isSelected ? '#FFF0EC' : 'transparent',
                border: isSelected ? '2px solid var(--accent-coral, #E88D7A)' : '2px solid transparent',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.5rem',
                padding: 0,
                transition: 'background 0.15s, border-color 0.15s',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
              }}
              aria-label={`React with ${emoji}`}
              aria-pressed={isSelected}
            >
              {emoji}

              {/* Partner's reaction indicator — small blue dot */}
              {partnerPicked && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--accent-blue, #6B8DAD)',
                    border: '2px solid #FFFBF5',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </motion.div>
    </AnimatePresence>
  )
}
