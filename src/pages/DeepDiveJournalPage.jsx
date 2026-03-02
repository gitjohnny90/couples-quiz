import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import deepDiveDecks, { MOOD_TAGS, SERIES } from '../data/deepDiveDecks'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleStar, SquigglyUnderline } from '../components/Doodles'

export default function DeepDiveJournalPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const playerId = localStorage.getItem('playerId')

  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedDeck, setExpandedDeck] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('deep_dive_responses').select('*')
        .eq('session_id', sessionId)
      if (!error && data) setResponses(data)
      setLoading(false)
    }
    fetch()
  }, [sessionId])

  // A deck is "completed" when both players have answered all 3 questions
  const getCompletedDecks = () => {
    return deepDiveDecks.filter((deck) => {
      return deck.questions.every((q) => {
        const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
        const theirs = responses.find((r) => r.question_id === q.id && r.player_id !== playerId)
        return mine && theirs
      })
    })
  }

  const completedDecks = loading ? [] : getCompletedDecks()
  const totalFires = responses.filter((r) => r.is_fired).length

  // Fire handler
  const handleFire = async (responseId, currentFired) => {
    await supabase
      .from('deep_dive_responses')
      .update({ is_fired: !currentFired })
      .eq('id', responseId)
    // Refetch
    const { data } = await supabase
      .from('deep_dive_responses').select('*')
      .eq('session_id', sessionId)
    if (data) setResponses(data)
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={88} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            Our Journal 📖
          </h1>
          <SquigglyUnderline width={110} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
            everything you've answered together, saved here
          </p>
        </div>

        {/* Stats */}
        {!loading && completedDecks.length > 0 && (
          <div className="sticky-note" style={{ padding: 16, textAlign: 'center', marginBottom: 20, transform: 'rotate(-0.5deg)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
                  {completedDecks.length}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>decks done</p>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
                  🔥 {totalFires}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>ones that hit</p>
              </div>
            </div>
            <div style={{ position: 'absolute', top: -6, right: 12 }}>
              <DoodleStar size={14} opacity={0.35} rotate={15} />
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', paddingTop: 20 }}>
            opening the journal...
          </p>
        ) : completedDecks.length === 0 ? (
          <div className="glass" style={{ padding: 28, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📓</p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              no entries yet
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
              complete a deck together to see your answers here
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => navigate(`/deep-dive/${sessionId}`)}
            >
              start a deck →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {completedDecks.map((deck, i) => {
              const series = SERIES.find((s) => s.id === deck.series)
              const isExpanded = expandedDeck === deck.id
              const deckFires = responses.filter((r) => r.deck_id === deck.id && r.is_fired).length

              return (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass"
                  style={{ overflow: 'hidden', transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
                >
                  {/* Deck header — tap to expand */}
                  <button
                    onClick={() => setExpandedDeck(isExpanded ? null : deck.id)}
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '16px 18px', textAlign: 'left',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        {series && <span style={{ fontSize: '0.85rem' }}>{series.emoji}</span>}
                        <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {deck.title}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                        {deck.moodTags.map((tag, j) => {
                          const mood = MOOD_TAGS[tag]
                          return mood ? (
                            <span key={j} className="dd-mood-pill" style={{ fontSize: '0.68rem' }}>
                              {mood.emoji} {mood.label}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {deckFires > 0 && <span style={{ fontSize: '0.85rem' }}>🔥{deckFires}</span>}
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.25 }}
                      style={{ padding: '0 18px 18px' }}
                    >
                      {deck.questions.map((q, qi) => {
                        const mine = responses.find((r) => r.question_id === q.id && r.player_id === playerId)
                        const theirs = responses.find((r) => r.question_id === q.id && r.player_id !== playerId)
                        const mood = MOOD_TAGS[q.moodTag]

                        return (
                          <div key={q.id} style={{ marginTop: qi === 0 ? 0 : 16, paddingTop: qi === 0 ? 0 : 16, borderTop: qi === 0 ? 'none' : '1px dashed var(--border-pencil)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              {mood && <span style={{ fontSize: '0.7rem' }}>{mood.emoji}</span>}
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                                {mood?.label}
                              </p>
                            </div>
                            <p style={{ fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-primary)' }}>
                              {q.text}
                            </p>

                            {/* Journal entries */}
                            {[
                              { response: mine, bg: '#FFF5E9', border: 'var(--accent-coral-light)', nameColor: 'var(--accent-coral)' },
                              { response: theirs, bg: '#EDF3F8', border: '#B8CFDF', nameColor: 'var(--accent-blue)' },
                            ].map(({ response, bg, border, nameColor }) => response ? (
                              <div key={response.id} style={{ marginBottom: 8 }}>
                                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.92rem', color: nameColor, marginBottom: 3 }}>
                                  {response.player_name}
                                </p>
                                <div className="dd-journal-entry" style={{ background: bg, borderColor: border }}>
                                  <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {response.answer}
                                  </p>
                                </div>
                                {response.is_fired && (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-coral)' }}>🔥 this one hit</span>
                                )}
                              </div>
                            ) : null)}
                          </div>
                        )
                      })}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Back */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 22 }}
          onClick={() => navigate(`/deep-dive/${sessionId}`)}
        >
          ← back to deep dive
        </button>
      </motion.div>
    </div>
  )
}
