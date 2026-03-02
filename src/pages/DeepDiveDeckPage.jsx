import { useContext, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import deepDiveDecks, { MOOD_TAGS } from '../data/deepDiveDecks'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleStar, SquigglyUnderline, DoodleHeart } from '../components/Doodles'

// Phases: answer → waiting → reveal, per question. After all 3: summary.
const PHASE = { ANSWER: 'answer', WAITING: 'waiting', REVEAL: 'reveal', SUMMARY: 'summary' }

export default function DeepDiveDeckPage() {
  const { sessionId, deckId } = useParams()
  const { playerName } = useContext(SessionContext)
  const navigate = useNavigate()
  const playerId = localStorage.getItem('playerId')

  const deck = deepDiveDecks.find((d) => d.id === deckId)

  const [currentQ, setCurrentQ] = useState(0)
  const [phase, setPhase] = useState(PHASE.ANSWER)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [responses, setResponses] = useState([]) // all responses for this deck
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef(null)

  // Fetch existing responses for this deck
  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('deep_dive_responses').select('*')
      .eq('session_id', sessionId).eq('deck_id', deckId)
    if (!error && data) {
      setResponses(data)
      return data
    }
    return []
  }

  // Determine phase + question index from existing responses
  const resumeFromResponses = (data) => {
    if (!deck) return
    for (let i = 0; i < deck.questions.length; i++) {
      const q = deck.questions[i]
      const mine = data.find((r) => r.question_id === q.id && r.player_id === playerId)
      const theirs = data.find((r) => r.question_id === q.id && r.player_id !== playerId)

      if (!mine) {
        // I haven't answered this one yet
        setCurrentQ(i)
        setPhase(PHASE.ANSWER)
        setAnswer('')
        return
      }
      if (mine && !theirs) {
        // I answered but partner hasn't
        setCurrentQ(i)
        setPhase(PHASE.WAITING)
        return
      }
      // Both answered — this one is revealed, check next
    }
    // All questions answered by both → summary
    setPhase(PHASE.SUMMARY)
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      const data = await fetchResponses()
      resumeFromResponses(data)
      setLoading(false)
    }
    init()
  }, [sessionId, deckId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`deep-dive-${sessionId}-${deckId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deep_dive_responses',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        // Only care about this deck
        if (payload.new && payload.new.deck_id === deckId) {
          // Refetch all responses for this deck
          fetchResponses().then((data) => {
            // If we're in waiting phase, check if partner answered
            setResponses(data)
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, deckId])

  // When responses update, re-evaluate phase (handles realtime partner answers)
  useEffect(() => {
    if (loading || !deck) return
    const q = deck.questions[currentQ]
    if (!q) return
    const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
    const theirs = responses.find((r) => r.question_id === q.id && r.player_id !== playerId)

    if (phase === PHASE.WAITING && mine && theirs) {
      setPhase(PHASE.REVEAL)
    }
  }, [responses, currentQ, phase, loading])

  // Submit answer
  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    const q = deck.questions[currentQ]
    const { error } = await supabase.from('deep_dive_responses').upsert(
      {
        session_id: sessionId,
        deck_id: deckId,
        question_id: q.id,
        player_id: playerId,
        player_name: playerName,
        answer: answer.trim(),
      },
      { onConflict: 'session_id,deck_id,question_id,player_id' }
    )
    if (!error) {
      const data = await fetchResponses()
      const theirs = data.find((r) => r.question_id === q.id && r.player_id !== playerId)
      if (theirs) {
        setPhase(PHASE.REVEAL)
      } else {
        setPhase(PHASE.WAITING)
      }
    }
    setSubmitting(false)
  }

  // Move to next question after reveal
  const handleNext = () => {
    const nextIdx = currentQ + 1
    if (nextIdx >= deck.questions.length) {
      setPhase(PHASE.SUMMARY)
    } else {
      const q = deck.questions[nextIdx]
      const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
      const theirs = responses.find((r) => r.question_id === q.id && r.player_id !== playerId)
      setCurrentQ(nextIdx)
      setAnswer('')
      if (!mine) {
        setPhase(PHASE.ANSWER)
      } else if (!theirs) {
        setPhase(PHASE.WAITING)
      } else {
        setPhase(PHASE.REVEAL)
      }
    }
  }

  // Fire reaction
  const handleFire = async (responseId, currentFired) => {
    await supabase
      .from('deep_dive_responses')
      .update({ is_fired: !currentFired })
      .eq('id', responseId)
    await fetchResponses()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!deck) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={42} />
        <div className="glass" style={{ padding: 28, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📖</div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', marginBottom: 8 }}>can't find that deck</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontStyle: 'italic' }}>
            this page seems to be missing from the notebook
          </p>
          <button className="btn btn-primary" onClick={() => navigate(`/deep-dive/${sessionId}`)}>back to deep dive</button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            opening the deck...
          </p>
        </motion.div>
      </div>
    )
  }

  const question = deck.questions[currentQ]
  const moodTag = question ? MOOD_TAGS[question.moodTag] : null
  const progressPercent = ((currentQ + 1) / deck.questions.length) * 100

  // Helper to get response pairs for a question
  const getResponsePair = (q) => {
    const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
    const theirs = responses.find((r) => r.question_id === q.id && r.player_id !== playerId)
    return { mine, theirs }
  }

  // ── SUMMARY PHASE ──
  if (phase === PHASE.SUMMARY) {
    const totalFires = responses.filter((r) => r.is_fired).length
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={deck.id.length + 20} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700 }}>
              {deck.title}
            </h1>
            <SquigglyUnderline width={120} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 6px' }} />
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              all answered — here's everything
            </p>
          </div>

          {/* Fire count */}
          {totalFires > 0 && (
            <div className="sticky-note" style={{ padding: 16, textAlign: 'center', marginBottom: 18, transform: 'rotate(-0.5deg)' }}>
              <span style={{ fontSize: '1.8rem' }}>🔥</span>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--accent-coral)' }}>
                {totalFires} {totalFires === 1 ? 'answer' : 'answers'} hit different
              </p>
            </div>
          )}

          {/* All Q&As */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {deck.questions.map((q, i) => {
              const { mine, theirs } = getResponsePair(q)
              const mood = MOOD_TAGS[q.moodTag]
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass"
                  style={{ padding: 18, transform: `rotate(${i % 2 === 0 ? -0.4 : 0.4}deg)` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    {mood && (
                      <span className="dd-mood-pill" style={{ fontSize: '0.75rem' }}>
                        {mood.emoji} {mood.label}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: 14, lineHeight: 1.5 }}>
                    {q.text}
                  </p>
                  <JournalEntryPair mine={mine} theirs={theirs} onFire={handleFire} />
                </motion.div>
              )
            })}
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(`/deep-dive/${sessionId}`)}>
              ← all decks
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate(`/deep-dive-journal/${sessionId}`)}>
              journal 📖
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── PER-QUESTION PHASES ──
  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={deck.id.length + currentQ} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1, width: '100%' }}>

        {/* Deck header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', fontWeight: 700 }}>
            {deck.title}
          </h1>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 18 }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', marginBottom: 6 }}>
            {currentQ + 1} of {deck.questions.length}
          </p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Mood tag pill */}
        {moodTag && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span className="dd-mood-pill">
              {moodTag.emoji} {moodTag.label}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── ANSWER PHASE ── */}
          {phase === PHASE.ANSWER && (
            <motion.div
              key={`answer-${currentQ}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="glass" style={{ padding: '22px 18px', transform: 'rotate(0.2deg)' }}>
                <p style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, marginBottom: 18, color: 'var(--text-primary)' }}>
                  {question.text}
                </p>

                <div className="dd-textarea-wrapper">
                  <textarea
                    ref={textareaRef}
                    className="dd-textarea"
                    placeholder="write your answer here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={5}
                    maxLength={1000}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    {answer.length}/1000
                  </span>
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitting}
                    style={{ minWidth: 100 }}
                  >
                    {submitting ? 'saving...' : 'submit'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── WAITING PHASE ── */}
          {phase === PHASE.WAITING && (
            <motion.div
              key={`waiting-${currentQ}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="glass" style={{ padding: '28px 20px', textAlign: 'center', transform: 'rotate(-0.3deg)' }}>
                <p style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, marginBottom: 18, color: 'var(--text-primary)' }}>
                  {question.text}
                </p>

                <div style={{ margin: '10px 0 18px' }}>
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    style={{ fontSize: '2rem', marginBottom: 8 }}
                  >
                    ✏️
                  </motion.div>
                  <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
                    waiting for your person...
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 6 }}>
                    your answer is locked in — they need to answer too!
                  </p>
                </div>

                {/* Share link */}
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    make sure they have the link:
                  </p>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={copyLink}>
                    {copied ? 'copied!' : 'copy session link'}
                  </button>
                </div>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={async () => {
                    const data = await fetchResponses()
                    // Manually re-check if partner has answered
                    const q = deck.questions[currentQ]
                    const theirs = data.find((r) => r.question_id === q.id && r.player_id !== playerId)
                    if (theirs) setPhase(PHASE.REVEAL)
                  }}
                >
                  check again
                </button>
              </div>
            </motion.div>
          )}

          {/* ── REVEAL PHASE ── */}
          {phase === PHASE.REVEAL && (
            <motion.div
              key={`reveal-${currentQ}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass" style={{ padding: '22px 18px', transform: 'rotate(-0.2deg)' }}>
                <p style={{ fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.6, marginBottom: 18, color: 'var(--text-primary)' }}>
                  {question.text}
                </p>

                {(() => {
                  const { mine, theirs } = getResponsePair(question)
                  return <JournalEntryPair mine={mine} theirs={theirs} onFire={handleFire} />
                })()}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 18 }}
                  onClick={handleNext}
                >
                  {currentQ < deck.questions.length - 1 ? 'next question →' : 'see summary'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to decks (always visible) */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 14 }}
          onClick={() => navigate(`/deep-dive/${sessionId}`)}
        >
          ← back to decks
        </button>
      </motion.div>
    </div>
  )
}

// ── Journal Entry Pair component ──
function JournalEntryPair({ mine, theirs, onFire }) {
  if (!mine || !theirs) return null

  // Show mine on left (coral), theirs on right (blue)
  const entries = [
    { response: mine, bg: '#FFF5E9', border: 'var(--accent-coral-light)', nameColor: 'var(--accent-coral)', label: mine.player_name },
    { response: theirs, bg: '#EDF3F8', border: '#B8CFDF', nameColor: 'var(--accent-blue)', label: theirs.player_name },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {entries.map(({ response, bg, border, nameColor, label }) => (
        <div key={response.id} style={{ position: 'relative' }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: nameColor, marginBottom: 4 }}>
            {label}
          </p>
          <div className="dd-journal-entry" style={{ background: bg, borderColor: border }}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {response.answer}
            </p>
          </div>
          <button
            className={`dd-fire-btn ${response.is_fired ? 'fired' : ''}`}
            onClick={() => onFire(response.id, response.is_fired)}
          >
            🔥 {response.is_fired ? 'this one hit' : 'this one hit'}
          </button>
        </div>
      ))}
    </div>
  )
}
