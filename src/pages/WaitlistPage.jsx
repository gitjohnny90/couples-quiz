import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { submitWaitlistEmail } from '../utils/waitlist'
import PageDoodles from '../components/Doodles'

export default function WaitlistPage() {
  const [searchParams] = useSearchParams()
  const source = searchParams.get('src') || null

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    document.title = 'The Us Quiz — Get the App'
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const result = await submitWaitlistEmail(email, source)
    if (result.ok) {
      setStatus('done')
    } else {
      setStatus('error')
      setErrorMsg(result.error)
    }
  }

  return (
    <div className="page" style={{ position: 'relative', minHeight: '100vh' }}>
      <PageDoodles seed={42} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: '40px 20px 60px',
        }}
      >
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '2.4rem', marginBottom: 6 }}>💕</div>
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '2rem',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
          }}>
            The Us Quiz
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
          }}>
            a little app for couples who want to know each other better
          </p>
        </div>

        {/* What it is */}
        <div className="glass" style={{
          padding: '18px 16px',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.3rem',
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
          }}>
            what is this?
          </h2>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 8px 0',
          }}>
            we're a couple who built this for ourselves — quizzes to discover your differences, deep conversations to understand each other, drawing prompts, shared movie lists, love note hunts, and way more.
          </p>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0,
          }}>
            it works great for long-distance couples, but really it's for anyone who wants to be more intentional about their relationship.
          </p>
        </div>

        {/* What's coming */}
        <div className="glass" style={{
          padding: '18px 16px',
          marginBottom: 24,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.3rem',
            color: 'var(--text-primary)',
            margin: '0 0 10px 0',
          }}>
            the app version
          </h2>
          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: '0 0 10px 0',
          }}>
            we're turning this into a real app for your phone. here's what that adds:
          </p>
          <ul style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            paddingLeft: 20,
          }}>
            <li>push notifications when your partner answers</li>
            <li>works offline — answer anywhere, sync later</li>
            <li>home screen icon, feels native</li>
            <li>faster, smoother, all-around better experience</li>
          </ul>
        </div>

        {/* Email capture */}
        <div className="glass" style={{
          padding: '22px 18px',
          textAlign: 'center',
        }}>
          {status === 'done' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>💌</div>
              <p style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.4rem',
                color: 'var(--accent-sage)',
                marginBottom: 6,
              }}>
                you're on the list!
              </p>
              <p style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                marginBottom: 14,
              }}>
                we'll email you when the app is ready to download. no spam, we promise.
              </p>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
              }}>
                in the meantime, you can <a
                  href="/auth"
                  style={{ color: 'var(--accent-coral)', textDecoration: 'underline' }}
                >try the web version right now</a> — it's free.
              </p>
            </motion.div>
          ) : (
            <>
              <p style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.3rem',
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}>
                want to be first to know?
              </p>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                marginBottom: 16,
                lineHeight: 1.45,
              }}>
                drop your email and we'll let you know when the app launches. no spam — just one email when it's ready.
              </p>

              <form onSubmit={handleSubmit}>
                <label
                  htmlFor="waitlist-email"
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1.15rem',
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 6,
                    textAlign: 'left',
                  }}
                >
                  your email:
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  placeholder="your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    border: '1.5px solid var(--border-pencil)',
                    borderRadius: 4,
                    background: 'var(--bg-paper)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    marginBottom: 10,
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    fontFamily: 'var(--font-body)',
                    fontSize: '1rem',
                    background: 'var(--accent-coral)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    opacity: status === 'submitting' ? 0.6 : 1,
                  }}
                >
                  {status === 'submitting' ? 'joining...' : 'notify me when it launches'}
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

              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-light)',
                marginTop: 16,
              }}>
                or <a
                  href="/auth"
                  style={{ color: 'var(--accent-coral)', textDecoration: 'underline' }}
                >try the web version now</a> — it's free and works on any device
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
