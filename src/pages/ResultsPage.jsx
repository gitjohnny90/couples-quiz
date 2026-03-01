import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleHeart, DoodleStar, SquigglyUnderline, DoodleCloud } from '../components/Doodles'

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
      .from('responses').select('*')
      .eq('session_id', sessionId).eq('pack_id', packId)
    if (!error && data) setResponses(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResponses()
    const channel = supabase
      .channel(`responses-${sessionId}-${packId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses', filter: `session_id=eq.${sessionId}` }, () => fetchResponses())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, packId])

  const toggleReveal = (qId) => {
    setRevealedQuestions((prev) => {
      const next = new Set(prev)
      next.has(qId) ? next.delete(qId) : next.add(qId)
      return next
    })
  }

  const revealAll = () => {
    if (!pack) return
    setRevealedQuestions(new Set(pack.questions.map((q) => q.id)))
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pack) {
    return (
      <div className="page"><div className="glass" style={{ padding: 28, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem' }}>quiz not found</h2>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/')}>go home</button>
      </div></div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            unfolding the results...
          </p>
        </motion.div>
      </div>
    )
  }

  // Waiting for partner
  if (responses.length < 2) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={10} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 24 }}>
            <DoodleCloud size={50} opacity={0.3} style={{ margin: '0 auto 8px' }} />
            <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', marginBottom: 6 }}>
              waiting for your person...
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              they need to answer the same questions first!
            </p>
          </div>

          <div className="glass" style={{ padding: 22, textAlign: 'center', marginBottom: 14 }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', marginBottom: 10 }}>send them this link:</p>
            <div style={{
              background: '#fff', borderBottom: '2px solid var(--border-pencil)',
              padding: '10px 14px', fontSize: '0.85rem', wordBreak: 'break-all',
              color: 'var(--accent-coral)', marginBottom: 14, fontFamily: 'var(--font-body)'
            }}>
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? 'copied!' : 'copy link'}
            </button>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { setLoading(true); fetchResponses() }}>
            check again
          </button>
        </motion.div>
      </div>
    )
  }

  // Both answered — show results!
  const p1 = responses.find((r) => r.player_id === 'player1')
  const p2 = responses.find((r) => r.player_id === 'player2')
  const p1A = p1?.answers || {}
  const p2A = p2?.answers || {}
  let matchCount = 0
  pack.questions.forEach((q) => { if (p1A[q.id] === p2A[q.id]) matchCount++ })

  const cardRotations = [0.4, -0.6, 0.3, -0.4, 0.7]

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={5} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>{pack.emoji}</div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700 }}>{pack.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>the answers are in!</p>
        </div>

        {/* Match counter — sticky note style */}
        <div className="sticky-note" style={{ padding: 24, textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'var(--font-hand)', fontSize: '3rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
            {matchCount} / {pack.questions.length}
          </div>
          <SquigglyUnderline width={100} color="#D4A843" opacity={0.4} style={{ margin: '6px auto' }} />
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
            {matchCount === pack.questions.length
              ? 'perfect match! are you the same person?!'
              : matchCount >= 3
              ? 'pretty in sync! nice.'
              : matchCount >= 1
              ? 'some surprises in there...'
              : 'do you even know each other?!'}
          </p>
          <div style={{ position: 'absolute', top: -8, right: 12 }}>
            <DoodleStar size={16} opacity={0.4} rotate={12} />
          </div>
        </div>

        {/* Reveal all */}
        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 18 }} onClick={revealAll}>
          unfold all answers
        </button>

        {/* Question cards — folded notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pack.questions.map((q, i) => {
            const revealed = revealedQuestions.has(q.id)
            const matched = p1A[q.id] === p2A[q.id]
            const p1Text = p1A[q.id] !== undefined ? q.options[p1A[q.id]] : 'no answer'
            const p2Text = p2A[q.id] !== undefined ? q.options[p2A[q.id]] : 'no answer'

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass reveal-card ${revealed ? (matched ? 'matched' : 'unmatched') : ''}`}
                onClick={() => toggleReveal(q.id)}
                style={{ transform: `rotate(${cardRotations[i] || 0}deg)` }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.95rem', marginBottom: revealed ? 14 : 4 }}>
                  {q.text}
                </p>

                {!revealed ? (
                  <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    tap to unfold ~
                  </p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-coral)', fontFamily: 'var(--font-hand)', fontSize: '0.95rem', marginBottom: 4 }}>
                          {p1?.player_name || 'Player 1'}
                        </p>
                        <div style={{
                          background: '#FFF5E9', border: '1px solid var(--accent-coral-light)',
                          borderRadius: 3, padding: '8px 10px', fontSize: '0.85rem',
                        }}>
                          {p1Text}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-hand)', fontSize: '0.95rem', marginBottom: 4 }}>
                          {p2?.player_name || 'Player 2'}
                        </p>
                        <div style={{
                          background: '#EDF3F8', border: '1px solid #B8CFDF',
                          borderRadius: 3, padding: '8px 10px', fontSize: '0.85rem',
                        }}>
                          {p2Text}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.1rem' }}>
                      {matched ? (
                        <span style={{ color: 'var(--accent-sage)' }}>
                          match! <DoodleHeart size={14} color="var(--accent-sage)" opacity={0.6} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)' }}>different ~</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 22 }} onClick={() => navigate(`/vault/${sessionId}`)}>
          ← back to quizzes
        </button>
      </motion.div>
    </div>
  )
}
