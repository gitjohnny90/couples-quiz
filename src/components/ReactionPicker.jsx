import { motion } from 'framer-motion'

const EMOJIS = ['❤️', '😂', '🔥']

export default function ReactionPicker({ myReaction, partnerReaction, onReact, size }) {
  const isSmall = size === 'sm'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isSmall ? 4 : 6,
      marginTop: isSmall ? 4 : 8,
    }}>
      {EMOJIS.map((emoji) => {
        const isSelected = myReaction === emoji
        const partnerPicked = partnerReaction === emoji
        return (
          <motion.button
            key={emoji}
            onClick={(e) => { e.stopPropagation(); onReact(emoji) }}
            whileTap={{ scale: 0.85 }}
            style={{
              position: 'relative',
              padding: isSmall ? '2px 6px' : '4px 10px',
              border: `1.5px solid ${isSelected ? 'var(--accent-coral-light)' : 'var(--border-pencil)'}`,
              borderRadius: 14,
              background: isSelected ? '#FFF0EC' : '#fff',
              cursor: 'pointer',
              fontSize: isSmall ? '0.85rem' : '1.05rem',
              transition: 'all 0.2s',
              opacity: isSelected ? 1 : 0.65,
              lineHeight: 1,
            }}
            aria-label={`React with ${emoji}`}
            aria-pressed={isSelected}
          >
            {emoji}
            {partnerPicked && (
              <span style={{
                position: 'absolute',
                top: -7,
                right: -7,
                fontSize: '0.55rem',
                background: '#EDF3F8',
                borderRadius: '50%',
                width: 15,
                height: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #B8CFDF',
                pointerEvents: 'none',
              }}>
                {emoji}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
