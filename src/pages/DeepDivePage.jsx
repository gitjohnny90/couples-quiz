import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import deepDiveDecks, { MOOD_TAGS, SERIES } from '../data/deepDiveDecks'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleStar, SquigglyUnderline } from '../components/Doodles'

export default function DeepDivePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const playerId = localStorage.getItem('playerId')

  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [randomCard, setRandomCard] = useState(null) // { question, deckId }

  // Fetch all deep dive responses for this session
  const fetchResponses = async () => {
    const { data, error } = await supabase
      .from('deep_dive_responses').select('*')
      .eq('session_id', sessionId)
    if (!error && data) setResponses(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResponses()
  }, [sessionId])

  // Compute deck completion status
  const getDeckStatus = (deck) => {
    const deckResponses = responses.filter((r) => r.deck_id === deck.id)
    const myAnswers = deckResponses.filter((r) => r.player_id === playerId)
    const theirAnswers = deckResponses.filter((r) => r.player_id !== playerId)
    const totalQs = deck.questions.length

    // "done" = both answered all questions
    const bothDone = deck.questions.every((q) => {
      const mine = deckResponses.find((r) => r.question_id === q.id && r.player_id === playerId)
      const theirs = deckResponses.find((r) => r.question_id === q.id && r.player_id !== playerId)
      return mine && theirs
    })
    if (bothDone) return { label: 'done', color: 'var(--accent-sage)' }

    // "in progress" = at least one answer exists
    if (deckResponses.length > 0) return { label: 'in progress', color: 'var(--accent-coral)' }

    // "new"
    return { label: 'new', color: 'var(--text-light)' }
  }

  // Random card — pick an unanswered question
  const pullRandomCard = () => {
    const unanswered = []
    deepDiveDecks.forEach((deck) => {
      deck.questions.forEach((q) => {
        const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
        if (!mine) {
          unanswered.push({ question: q, deckId: deck.id, deckTitle: deck.title })
        }
      })
    })
    if (unanswered.length === 0) {
      setRandomCard({ empty: true })
      return
    }
    const pick = unanswered[Math.floor(Math.random() * unanswered.length)]
    setRandomCard(pick)
  }

  // Stats
  const completedDecks = deepDiveDecks.filter((d) => getDeckStatus(d).label === 'done').length
  const totalDecks = deepDiveDecks.length

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={77} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            Deep Dive 📖
          </h1>
          <SquigglyUnderline width={120} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4, maxWidth: 320, margin: '0 auto' }}>
            open-ended questions you both answer — then reveal together
          </p>
          {!loading && completedDecks > 0 && (
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--accent-coral)', marginTop: 6 }}>
              {completedDecks} / {totalDecks} decks done
            </p>
          )}
        </div>

        {/* Random Card button */}
        <motion.button
          className="sticky-note"
          onClick={pullRandomCard}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: '16px 20px', marginTop: 16, marginBottom: 20,
            cursor: 'pointer', border: 'none', textAlign: 'center',
            transform: 'rotate(-0.6deg)',
          }}
        >
          <div style={{ position: 'absolute', top: -6, right: 14 }}>
            <DoodleStar size={14} opacity={0.35} rotate={20} />
          </div>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-coral)' }}>
            🎲 random card
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            pull a question from any unanswered deck
          </p>
        </motion.button>

        {/* Random card modal overlay */}
        <AnimatePresence>
          {randomCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 20,
              }}
              onClick={() => setRandomCard(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass"
                style={{
                  padding: '28px 22px', maxWidth: 360, width: '100%',
                  transform: 'rotate(-0.5deg)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {randomCard.empty ? (
                  <>
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', textAlign: 'center', color: 'var(--accent-coral)' }}>
                      you've answered them all! 🎉
                    </p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 8 }}>
                      check the journal to revisit your answers
                    </p>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: 16 }}
                      onClick={() => setRandomCard(null)}
                    >
                      close
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 6 }}>
                      from "{randomCard.deckTitle}"
                    </p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 20 }}>
                      {randomCard.question.text}
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        setRandomCard(null)
                        navigate(`/deep-dive/${sessionId}/${randomCard.deckId}`)
                      }}
                    >
                      go to this deck →
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ width: '100%', marginTop: 8 }}
                      onClick={() => {
                        setRandomCard(null)
                        pullRandomCard()
                      }}
                    >
                      🎲 different one
                    </button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Series + Decks */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', paddingTop: 20 }}>
            loading decks...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {SERIES.map((series) => {
              const seriesDecks = deepDiveDecks.filter((d) => d.series === series.id)
              return (
                <div key={series.id}>
                  {/* Series header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: '1.3rem' }}>{series.emoji}</span>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {series.title}
                      </h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                        {series.description}
                      </p>
                    </div>
                  </div>

                  {/* Deck cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {seriesDecks.map((deck, i) => {
                      const status = getDeckStatus(deck)
                      return (
                        <motion.button
                          key={deck.id}
                          className="glass dd-deck-card"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/deep-dive/${sessionId}/${deck.id}`)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          style={{ transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                                {deck.title}
                              </h3>
                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {deck.moodTags.map((tag, j) => {
                                  const mood = MOOD_TAGS[tag]
                                  return mood ? (
                                    <span key={j} className="dd-mood-pill" style={{ fontSize: '0.7rem' }}>
                                      {mood.emoji} {mood.label}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '0.72rem', fontFamily: 'var(--font-hand)', fontWeight: 600,
                              color: status.color, whiteSpace: 'nowrap', marginLeft: 8, marginTop: 2,
                            }}>
                              {status.label === 'done' && '✓ '}{status.label}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Journal link */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 24 }}
          onClick={() => navigate(`/journal/${sessionId}`)}
        >
          📖 open journal
        </button>

        {/* Back */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 10 }}
          onClick={() => navigate(`/vault/${sessionId}`)}
        >
          ← back to quizzes
        </button>
      </motion.div>
    </div>
  )
}
