import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import { motion } from 'framer-motion'

export default function VaultPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId, playerName } = useContext(SessionContext)

  const [session, setSession] = useState(null)
  const [completedPacks, setCompletedPacks] = useState({}) // packId -> { count, matchCount }
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (sessionId) {
      setSessionId(sessionId)
    }
    fetchData()
  }, [sessionId])

  const fetchData = async () => {
    // Fetch session info
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    setSession(sessionData)

    // Fetch all responses for this session
    const { data: responseData } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)

    // Group responses by pack
    const packMap = {}
    if (responseData) {
      responseData.forEach((r) => {
        if (!packMap[r.pack_id]) packMap[r.pack_id] = []
        packMap[r.pack_id].push(r)
      })
    }

    // Calculate completion and matches
    const completed = {}
    Object.entries(packMap).forEach(([packId, responses]) => {
      const pack = quizPacks.find((p) => p.id === packId)
      if (!pack) return

      const bothDone = responses.length >= 2
      const p1 = responses.find((r) => r.player_id === 'player1')
      const p2 = responses.find((r) => r.player_id === 'player2')

      let matchCount = 0
      if (bothDone && p1 && p2) {
        pack.questions.forEach((q) => {
          if (p1.answers[q.id] === p2.answers[q.id]) matchCount++
        })
      }

      completed[packId] = {
        count: responses.length,
        bothDone,
        matchCount,
        total: pack.questions.length,
      }
    })

    setCompletedPacks(completed)
    setLoading(false)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate overall compatibility
  const totalQuestions = Object.values(completedPacks)
    .filter((p) => p.bothDone)
    .reduce((sum, p) => sum + p.total, 0)
  const totalMatches = Object.values(completedPacks)
    .filter((p) => p.bothDone)
    .reduce((sum, p) => sum + p.matchCount, 0)
  const overallPercent = totalQuestions > 0 ? Math.round((totalMatches / totalQuestions) * 100) : null

  const completedCount = Object.values(completedPacks).filter((p) => p.bothDone).length

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading vault...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Quiz Vault</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {session?.player1_name}
            {session?.player2_name ? ` & ${session.player2_name}` : ' — waiting for partner'}
          </p>
        </div>

        {/* Share link card (if partner hasn't joined yet) */}
        {!session?.player2_name && (
          <div className="glass" style={{ padding: 20, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, marginBottom: 8, fontSize: '0.95rem' }}>
              📤 Send this link to your partner
            </p>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: '0.8rem',
                wordBreak: 'break-all',
                color: 'var(--accent-pink)',
                marginBottom: 12,
              }}
            >
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>
        )}

        {/* Overall compatibility (only if at least 1 quiz completed by both) */}
        {overallPercent !== null && (
          <div className="glass" style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>
              Overall Compatibility
            </p>
            <div className="text-gradient" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1 }}>
              {overallPercent}%
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
              {totalMatches} of {totalQuestions} answers matched across {completedCount} quiz{completedCount !== 1 ? 'zes' : ''}
            </p>
            <div className="progress-bar-track" style={{ marginTop: 12 }}>
              <div className="progress-bar-fill" style={{ width: `${overallPercent}%` }} />
            </div>
          </div>
        )}

        {/* Quiz pack cards */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Choose a Quiz</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quizPacks.map((pack, i) => {
            const status = completedPacks[pack.id]
            const bothDone = status?.bothDone
            const playerDone = status?.count >= 1

            return (
              <motion.div
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass"
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderColor: bothDone ? 'rgba(46,204,113,0.3)' : undefined,
                }}
                onClick={() => {
                  if (bothDone) {
                    navigate(`/results/${sessionId}/${pack.id}`)
                  } else {
                    navigate(`/quiz/${sessionId}/${pack.id}`)
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: `${pack.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      flexShrink: 0,
                    }}
                  >
                    {pack.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 2 }}>{pack.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                      {pack.description}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {bothDone ? (
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2ecc71' }}>
                          {status.matchCount}/{status.total}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>matched</div>
                      </div>
                    ) : playerDone ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 600 }}>
                        Waiting...
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Play →
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar for completed quizzes */}
                {bothDone && (
                  <div className="progress-bar-track" style={{ marginTop: 12 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${(status.matchCount / status.total) * 100}%`,
                        background: status.matchCount === status.total ? '#2ecc71' : undefined,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
