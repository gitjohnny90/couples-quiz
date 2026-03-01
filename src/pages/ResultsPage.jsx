import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import { motion } from 'framer-motion'

export default function ResultsPage() {
  const { sessionId, packId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)
  const pack = quizPacks.find((p) => p.id === packId)

  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [revealedQuestions, setRevealedQuestions] = useState(new Set())
  const [copied, setCopied] = useState(false)

  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', packId)

    if (!error && data) {
      setResponses(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResponses()

    // Subscribe to realtime changes so we know when partner finishes
    const channel = supabase
      .channel(`responses-${sessionId}-${packId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'responses',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchResponses()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, packId])

  const toggleReveal = (questionId) => {
    setRevealedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  const revealAll = () => {
    if (!pack) return
    const allIds = new Set(pack.questions.map((q) => q.id))
    setRevealedQuestions(allIds)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/join/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pack) {
    return (
      <div className="page">
        <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
          <h2>Quiz not found</h2>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading results...</p>
        </motion.div>
      </div>
    )
  }

  // Waiting for partner
  if (responses.length < 2) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 32 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
              Waiting for your partner...
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              They need to answer the same questions before you can see results!
            </p>
          </div>

          <div className="glass" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>Share this link with them:</p>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                color: 'var(--accent-pink)',
                marginBottom: 16,
              }}
            >
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? '✅ Copied!' : '📋 Copy Link'}
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => {
              setLoading(true)
              fetchResponses()
            }}
          >
            🔄 Refresh
          </button>
        </motion.div>
      </div>
    )
  }

  // Both players answered — show results
  const p1Response = responses.find((r) => r.player_id === 'player1')
  const p2Response = responses.find((r) => r.player_id === 'player2')
  const p1Answers = p1Response?.answers || {}
  const p2Answers = p2Response?.answers || {}

  let matchCount = 0
  pack.questions.forEach((q) => {
    if (p1Answers[q.id] === p2Answers[q.id]) matchCount++
  })

  return (
    <div className="page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{pack.emoji}</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{pack.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Results are in!</p>
        </div>

        {/* Match counter */}
        <div
          className="glass"
          style={{ padding: 28, textAlign: 'center', marginBottom: 24 }}
        >
          <div className="text-gradient" style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1 }}>
            {matchCount} / {pack.questions.length}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontWeight: 600 }}>
            {matchCount === pack.questions.length
              ? '🎉 Perfect match! You ARE the same person!'
              : matchCount >= 3
              ? '💕 Pretty in sync! Nice.'
              : matchCount >= 1
              ? '🤔 Some surprises in there...'
              : '😬 Do you even know each other?!'}
          </p>
        </div>

        {/* Reveal all button */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 20 }}
          onClick={revealAll}
        >
          👀 Reveal All Answers
        </button>

        {/* Question cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pack.questions.map((q, i) => {
            const revealed = revealedQuestions.has(q.id)
            const matched = p1Answers[q.id] === p2Answers[q.id]
            const p1OptionIdx = p1Answers[q.id]
            const p2OptionIdx = p2Answers[q.id]
            const p1Text = p1OptionIdx !== undefined ? q.options[p1OptionIdx] : 'No answer'
            const p2Text = p2OptionIdx !== undefined ? q.options[p2OptionIdx] : 'No answer'

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass reveal-card ${revealed ? (matched ? 'matched' : 'unmatched') : ''}`}
                onClick={() => toggleReveal(q.id)}
                style={{ cursor: 'pointer' }}
              >
                <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: revealed ? 16 : 4 }}>
                  {q.text}
                </p>

                {!revealed ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    👆 Tap to reveal
                  </p>
                ) : (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 4 }}>
                          {p1Response?.player_name || 'Player 1'}
                        </p>
                        <div
                          style={{
                            background: 'rgba(168, 85, 247, 0.1)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {p1Text}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700, marginBottom: 4 }}>
                          {p2Response?.player_name || 'Player 2'}
                        </p>
                        <div
                          style={{
                            background: 'rgba(255, 107, 157, 0.1)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {p2Text}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                      {matched ? '✅ Match!' : '❌ Different'}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Back button */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 24 }}
          onClick={() => navigate(`/vault/${sessionId}`)}
        >
          ← Back to Vault
        </button>
      </motion.div>
    </div>
  )
}
