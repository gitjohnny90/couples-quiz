import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitWaitlistEmail } from '../utils/waitlist'

const DISMISSED_KEY = 'waitlistPromptDismissed'
const ACTIVITY_COUNT_KEY = 'completedActivityCount'

/**
 * Increment the completed activity counter. Call this when any activity finishes.
 * Returns the new count.
 */
export function trackActivityCompletion() {
  try {
    const count = parseInt(localStorage.getItem(ACTIVITY_COUNT_KEY) || '0', 10) + 1
    localStorage.setItem(ACTIVITY_COUNT_KEY, String(count))
    return count
  } catch {
    return 1
  }
}

/**
 * Post-activity prompt card for the App Store waitlist.
 * Shows once after the user's first completed activity, then never again.
 * Place this in results/reveal screens.
 */
export default function AppWaitlistPrompt() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (dismissed) return
      const count = parseInt(localStorage.getItem(ACTIVITY_COUNT_KEY) || '0', 10)
      if (count >= 1) {
        setVisible(true)
      }
    } catch {}
  }, [])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(DISMISSED_KEY, 'true') } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    // Grab source from current URL if present
    let source = null
    try {
      const params = new URLSearchParams(window.location.search)
      source = params.get('src') || null
    } catch {}

    const result = await submitWaitlistEmail(email, source)
    if (result.ok) {
      setStatus('done')
      setTimeout(dismiss, 3000)
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="glass"
        style={{
          padding: '20px 18px',
          marginTop: 20,
          marginBottom: 16,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Dismiss X */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: 'none',
            border: 'none',
            fontSize: '1.1rem',
            color: 'var(--text-light)',
            padding: '2px 6px',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {status === 'done' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.3rem',
              color: 'var(--accent-sage)',
              marginBottom: 4,
            }}>
              you're on the list!
            </p>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
            }}>
              we'll let you know as soon as the app is ready
            </p>
          </motion.div>
        ) : (
          <>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.2rem',
              color: 'var(--text-primary)',
              marginBottom: 6,
            }}>
              enjoying this? there's more coming
            </p>
            <p style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              marginBottom: 14,
              lineHeight: 1.45,
            }}>
              we're building a native app with push notifications and offline mode. drop your email to be first to know when it launches.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  border: '1.5px solid var(--border-pencil)',
                  borderRadius: 4,
                  background: 'var(--bg-paper)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                style={{
                  padding: '8px 16px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.95rem',
                  background: 'var(--accent-coral)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  opacity: status === 'submitting' ? 0.6 : 1,
                }}
              >
                {status === 'submitting' ? '...' : 'notify me'}
              </button>
            </form>

            {status === 'error' && (
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--accent-coral)',
                marginTop: 8,
              }}>
                {errorMsg}
              </p>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
