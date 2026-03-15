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
  const triggerRef = useRef(null)
  const gotItRef = useRef(null)

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
    // Restore focus to the (?) trigger button after closing
    setTimeout(() => triggerRef.current?.focus(), 50)
  }

  const reopen = () => {
    setShowOverlay(true)
  }

  // Escape key handler — close overlay when Escape is pressed
  useEffect(() => {
    if (!showOverlay) return
    const handleKey = (e) => { if (e.key === 'Escape') dismiss() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showOverlay])

  // Focus management — move focus into dialog on open, prevent body scroll
  useEffect(() => {
    if (!showOverlay) return
    document.body.style.overflow = 'hidden'
    // Small delay for framer-motion animation to start before focusing
    const timer = setTimeout(() => gotItRef.current?.focus(), 100)
    return () => {
      clearTimeout(timer)
      document.body.style.overflow = ''
    }
  }, [showOverlay])

  return (
    <>
      {/* Persistent help button — always visible when overlay is closed */}
      <AnimatePresence>
        {!showOverlay && (
          <motion.button
            ref={triggerRef}
            initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            onClick={reopen}
            aria-label="Page help"
            style={{
              position: 'fixed',
              top: 10,
              left: 10,
              zIndex: 998,
              width: 34,
              height: 34,
              borderRadius: 3,
              border: '1.5px solid var(--border-pencil)',
              background: 'var(--bg-card)',
              color: 'var(--accent-coral)',
              fontFamily: 'var(--font-hand)',
              fontSize: '1.2rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 3px 8px rgba(61, 44, 44, 0.12)',
              padding: 0,
              lineHeight: 1,
              transform: 'rotate(-2deg)',
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
              role="dialog"
              aria-modal="true"
              aria-label={guide.title}
              tabIndex={-1}
              initial={{ opacity: 0, y: -16, scale: 0.96, rotate: -1 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0.5 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault()
                  gotItRef.current?.focus()
                }
              }}
              className="glass"
              style={{
                padding: '22px 22px 18px',
                maxWidth: 340,
                width: 'calc(100% - 40px)',
                position: 'relative',
                transform: 'rotate(0.5deg)',
              }}
            >
              {/* Second tape mark — top right, opposite angle */}
              <div style={{
                position: 'absolute',
                top: -6,
                right: 28,
                transform: 'rotate(3deg)',
                width: 40,
                height: 11,
                background: 'rgba(212, 168, 67, 0.22)',
                borderRadius: 1,
              }} />

              <h3 style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.6rem',
                color: 'var(--accent-coral)',
                margin: '0 0 10px 0',
                lineHeight: 1.2,
              }}>
                {guide.title}
              </h3>

              {guide.lines.map((line, i) => (
                <p key={i} style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  margin: i < guide.lines.length - 1 ? '0 0 10px 0' : 0,
                  lineHeight: 1.5,
                }}>
                  {line}
                </p>
              ))}

              <button
                ref={gotItRef}
                onClick={dismiss}
                style={{
                  marginTop: 18,
                  width: '100%',
                  padding: '9px 0',
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.15rem',
                  color: '#fff',
                  background: 'var(--accent-coral)',
                  border: 'none',
                  borderRadius: 4,
                }}
              >
                got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
