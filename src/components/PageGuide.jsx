import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import pageGuides from '../data/pageGuides'

const STORAGE_KEY = 'pageGuideSeen'

function getSeenPages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function markSeen(pageKey) {
  try {
    const seen = getSeenPages()
    seen[pageKey] = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen))
  } catch {}
}

export default function PageGuide({ pageKey }) {
  const guide = pageGuides[pageKey]
  if (!guide) return null

  const [showOverlay, setShowOverlay] = useState(false)
  const hasAutoShown = useRef(false)

  // Show overlay automatically on first visit
  useEffect(() => {
    if (hasAutoShown.current) return
    hasAutoShown.current = true
    const seen = getSeenPages()
    if (!seen[pageKey]) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowOverlay(true), 400)
      return () => clearTimeout(timer)
    }
  }, [pageKey])

  const dismiss = () => {
    setShowOverlay(false)
    markSeen(pageKey)
  }

  const reopen = () => {
    setShowOverlay(true)
  }

  return (
    <>
      {/* Persistent help button — always visible when overlay is closed */}
      <AnimatePresence>
        {!showOverlay && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            onClick={reopen}
            aria-label="Page help"
            style={{
              position: 'fixed',
              top: 12,
              right: 12,
              zIndex: 998,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1.5px solid var(--border-pencil)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '1px 2px 6px rgba(61, 44, 44, 0.1)',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ?
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tooltip overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismiss}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: 48,
              background: 'rgba(61, 44, 44, 0.3)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-pencil)',
                borderRadius: 6,
                padding: '20px 22px 16px',
                maxWidth: 340,
                width: 'calc(100% - 40px)',
                boxShadow: '2px 4px 16px rgba(61, 44, 44, 0.15)',
                position: 'relative',
              }}
            >
              {/* Tape mark decoration */}
              <div style={{
                position: 'absolute',
                top: -7,
                left: '50%',
                transform: 'translateX(-50%) rotate(-1deg)',
                width: 50,
                height: 12,
                background: 'rgba(212, 168, 67, 0.25)',
                borderRadius: 1,
              }} />

              <h3 style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
                margin: '0 0 10px 0',
                lineHeight: 1.2,
              }}>
                {guide.title}
              </h3>

              {guide.lines.map((line, i) => (
                <p key={i} style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  margin: i < guide.lines.length - 1 ? '0 0 8px 0' : 0,
                  lineHeight: 1.45,
                }}>
                  {line}
                </p>
              ))}

              <button
                onClick={dismiss}
                style={{
                  marginTop: 16,
                  width: '100%',
                  padding: '8px 0',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  color: 'var(--accent-coral)',
                  background: 'transparent',
                  border: '1.5px solid var(--accent-coral)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
