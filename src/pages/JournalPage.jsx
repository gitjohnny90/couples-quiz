import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import quizPacks from '../data/quizPacks'
import deepDiveDecks, { MOOD_TAGS, SERIES } from '../data/deepDiveDecks'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleStar, DoodleHeart, SquigglyUnderline } from '../components/Doodles'

export default function JournalPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)
  const playerId = localStorage.getItem('playerId')

  const [activeTab, setActiveTab] = useState('mc')
  const [mcResponses, setMcResponses] = useState([])
  const [ddResponses, setDdResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedItem, setExpandedItem] = useState(null)

  useEffect(() => {
    const fetchAll = async () => {
      const [mcRes, ddRes] = await Promise.all([
        supabase.from('responses').select('*').eq('session_id', sessionId),
        supabase.from('deep_dive_responses').select('*').eq('session_id', sessionId),
      ])
      if (mcRes.data) setMcResponses(mcRes.data)
      if (ddRes.data) setDdResponses(ddRes.data)
      setLoading(false)
    }
    fetchAll()
  }, [sessionId])

  // ── Multiple Choice helpers ──
  const getCompletedPacks = () => {
    const packMap = {}
    mcResponses.forEach((r) => { if (!packMap[r.pack_id]) packMap[r.pack_id] = []; packMap[r.pack_id].push(r) })
    return quizPacks.filter((pack) => {
      const responses = packMap[pack.id]
      return responses && responses.length >= 2
    }).map((pack) => {
      const responses = packMap[pack.id]
      const p1 = responses.find((r) => r.player_id === 'player1')
      const p2 = responses.find((r) => r.player_id === 'player2')
      let matchCount = 0
      if (p1 && p2) pack.questions.forEach((q) => { if (p1.answers[q.id] === p2.answers[q.id]) matchCount++ })
      return { pack, p1, p2, matchCount }
    })
  }

  // ── Deep Dive helpers ──
  const getCompletedDecks = () => {
    return deepDiveDecks.filter((deck) =>
      deck.questions.every((q) => {
        const mine = ddResponses.find((r) => r.question_id === q.id && r.player_id === playerId)
        const theirs = ddResponses.find((r) => r.question_id === q.id && r.player_id !== playerId)
        return mine && theirs
      })
    )
  }

  const completedPacks = loading ? [] : getCompletedPacks()
  const completedDecks = loading ? [] : getCompletedDecks()
  const totalFires = ddResponses.filter((r) => r.is_fired).length

  // Stats
  const mcTotal = completedPacks.length
  const mcMatches = completedPacks.reduce((s, p) => s + p.matchCount, 0)
  const mcQuestions = completedPacks.reduce((s, p) => s + p.pack.questions.length, 0)
  const ddTotal = completedDecks.length

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

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[['mc', 'multiple choice'], ['dd', 'deep dive']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setExpandedItem(null) }}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '6px 6px 0 0',
                border: `1.5px solid ${activeTab === key ? 'var(--border-pencil-dark)' : 'var(--border-pencil)'}`,
                borderBottom: activeTab === key ? '2px solid var(--bg-paper)' : '1.5px solid var(--border-pencil)',
                fontFamily: 'var(--font-hand)', fontWeight: activeTab === key ? 700 : 500,
                fontSize: '1.05rem', cursor: 'pointer',
                background: activeTab === key ? 'var(--bg-paper)' : 'var(--bg-card)',
                color: activeTab === key ? 'var(--accent-coral)' : 'var(--text-secondary)',
                transition: 'all 0.15s', position: 'relative', zIndex: activeTab === key ? 2 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', fontStyle: 'italic', paddingTop: 20 }}>
            opening the journal...
          </p>
        ) : (
          <AnimatePresence mode="wait">
            {/* ══ MULTIPLE CHOICE TAB ══ */}
            {activeTab === 'mc' && (
              <motion.div key="mc" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>

                {/* Stats */}
                {mcTotal > 0 && (
                  <div className="sticky-note" style={{ padding: 16, textAlign: 'center', marginBottom: 20, transform: 'rotate(-0.5deg)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
                          {mcTotal}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>quizzes done</p>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
                          {mcQuestions > 0 ? Math.round((mcMatches / mcQuestions) * 100) : 0}%
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>match rate</p>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: -6, right: 12 }}>
                      <DoodleStar size={14} opacity={0.35} rotate={15} />
                    </div>
                  </div>
                )}

                {mcTotal === 0 ? (
                  <div className="glass" style={{ padding: 28, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>🧠</p>
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                      no quizzes completed yet
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
                      finish a quiz together to see your answers here
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(`/quiz-packs/${sessionId}`)}>
                      take a quiz →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {completedPacks.map(({ pack, p1, p2, matchCount }, i) => {
                      const isExpanded = expandedItem === pack.id
                      return (
                        <motion.div
                          key={pack.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass"
                          style={{ overflow: 'hidden', transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
                        >
                          {/* Pack header */}
                          <button
                            onClick={() => setExpandedItem(isExpanded ? null : pack.id)}
                            style={{
                              width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                              padding: '16px 18px', textAlign: 'left',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: '1.4rem' }}>{pack.emoji}</span>
                              <div>
                                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {pack.title}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-sage)', fontFamily: 'var(--font-hand)' }}>
                                  {matchCount}/{pack.questions.length} matched
                                </p>
                              </div>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                              ▼
                            </span>
                          </button>

                          {/* Expanded Q&As */}
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.25 }}
                              style={{ padding: '0 18px 18px' }}
                            >
                              {pack.questions.map((q, qi) => {
                                const p1Answer = p1?.answers?.[q.id]
                                const p2Answer = p2?.answers?.[q.id]
                                const p1Text = p1Answer !== undefined ? q.options[p1Answer] : 'no answer'
                                const p2Text = p2Answer !== undefined ? q.options[p2Answer] : 'no answer'
                                const matched = p1Answer === p2Answer

                                return (
                                  <div key={q.id} style={{ marginTop: qi === 0 ? 0 : 16, paddingTop: qi === 0 ? 0 : 16, borderTop: qi === 0 ? 'none' : '1px dashed var(--border-pencil)' }}>
                                    <p style={{ fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-primary)' }}>
                                      {q.text}
                                    </p>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.92rem', color: 'var(--accent-coral)', marginBottom: 3 }}>
                                          {p1?.player_name || 'Player 1'}
                                        </p>
                                        <div style={{ background: '#FFF5E9', border: '1px solid var(--accent-coral-light)', borderRadius: 3, padding: '8px 10px', fontSize: '0.85rem' }}>
                                          {p1Text}
                                        </div>
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.92rem', color: 'var(--accent-blue)', marginBottom: 3 }}>
                                          {p2?.player_name || 'Player 2'}
                                        </p>
                                        <div style={{ background: '#EDF3F8', border: '1px solid #B8CFDF', borderRadius: 3, padding: '8px 10px', fontSize: '0.85rem' }}>
                                          {p2Text}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1rem' }}>
                                      {matched ? (
                                        <span style={{ color: 'var(--accent-sage)' }}>
                                          ✓ match! <DoodleHeart size={12} color="var(--accent-sage)" opacity={0.6} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                                        </span>
                                      ) : (
                                        <span style={{ color: 'var(--text-light)' }}>✗ different ~</span>
                                      )}
                                    </div>
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
              </motion.div>
            )}

            {/* ══ DEEP DIVE TAB ══ */}
            {activeTab === 'dd' && (
              <motion.div key="dd" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>

                {/* Stats */}
                {ddTotal > 0 && (
                  <div className="sticky-note" style={{ padding: 16, textAlign: 'center', marginBottom: 20, transform: 'rotate(-0.5deg)', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1 }}>
                          {ddTotal}
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

                {ddTotal === 0 ? (
                  <div className="glass" style={{ padding: 28, textAlign: 'center', transform: 'rotate(0.3deg)' }}>
                    <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📓</p>
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                      no entries yet
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4, fontStyle: 'italic' }}>
                      complete a deck together to see your answers here
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate(`/deep-dive/${sessionId}`)}>
                      start a deck →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {completedDecks.map((deck, i) => {
                      const series = SERIES.find((s) => s.id === deck.series)
                      const isExpanded = expandedItem === deck.id
                      const deckFires = ddResponses.filter((r) => r.deck_id === deck.id && r.is_fired).length

                      return (
                        <motion.div
                          key={deck.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="glass"
                          style={{ overflow: 'hidden', transform: `rotate(${i % 2 === 0 ? -0.3 : 0.3}deg)` }}
                        >
                          <button
                            onClick={() => setExpandedItem(isExpanded ? null : deck.id)}
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

                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ duration: 0.25 }}
                              style={{ padding: '0 18px 18px' }}
                            >
                              {deck.questions.map((q, qi) => {
                                const mine = ddResponses.find((r) => r.question_id === q.id && r.player_id === playerId)
                                const theirs = ddResponses.find((r) => r.question_id === q.id && r.player_id !== playerId)
                                const mood = MOOD_TAGS[q.moodTag]

                                return (
                                  <div key={q.id} style={{ marginTop: qi === 0 ? 0 : 16, paddingTop: qi === 0 ? 0 : 16, borderTop: qi === 0 ? 'none' : '1px dashed var(--border-pencil)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                      {mood && <span style={{ fontSize: '0.7rem' }}>{mood.emoji}</span>}
                                      <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontStyle: 'italic' }}>{mood?.label}</p>
                                    </div>
                                    <p style={{ fontSize: '0.92rem', fontWeight: 500, lineHeight: 1.5, marginBottom: 12, color: 'var(--text-primary)' }}>
                                      {q.text}
                                    </p>
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
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Back */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 22 }}
          onClick={() => navigate(`/vault/${sessionId}`)}
        >
          ← back to quizzes
        </button>
      </motion.div>
    </div>
  )
}
