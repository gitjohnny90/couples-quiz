import { motion } from 'framer-motion'

/**
 * Small inline display of existing reactions on a card.
 * Shows your reaction (coral pill) and/or partner's reaction (blue pill).
 * Returns null if nobody has reacted.
 */
export default function ReactionBadge({ myReaction, partnerReaction }) {
  if (!myReaction && !partnerReaction) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 6,
    }}>
      {myReaction && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFF0EC',
            border: '1.5px solid var(--accent-coral-light, #F0B8A8)',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: '0.85rem',
            lineHeight: 1,
          }}
        >
          {myReaction}
        </motion.span>
      )}
      {partnerReaction && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: myReaction ? 0.08 : 0 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#EDF3F8',
            border: '1.5px solid #B8CFDF',
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: '0.85rem',
            lineHeight: 1,
          }}
        >
          {partnerReaction}
        </motion.span>
      )}
    </div>
  )
}
