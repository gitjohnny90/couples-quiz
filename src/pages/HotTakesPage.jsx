import { useContext, useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import hotTakesCategories, { allHotTakeGroups, getGroup } from '../data/hotTakesStatements'

const PLAYER_COLORS = { player1: '#E88D7A', player2: '#7EB8D8' }
const AGREE_COLOR = '#8DAE8B'
const DISAGREE_COLOR = '#E88D7A'

const SUMMARY_LABELS = [
  "how did you even end up together? 😂",
  "this must be a fun relationship",
  "you two keep things interesting",
  "healthy amount of disagreement",
  "pretty locked in",
  "are you the same person?",
]

function partnerOf(pid) {
  return pid === 'player1' ? 'player2' : 'player1'
}

export default function HotTakesPage() {
  const { sessionId } = useParams()
  const { playerId } = useContext(SessionContext)

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allVotes, setAllVotes] = useState([]) // all hot_takes rows for this session

  // Navigation state
  const [screen, setScreen] = useState('categories') // categories | statement | waiting | agree-reveal | defense | defense-waiting | disagree-reveal | summary
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [statementIndex, setStatementIndex] = useState(0)

  // Input state
  const [defenseInput, setDefenseInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const partnerName = session
    ? (playerId === 'player1' ? session.player2_name : session.player1_name) || 'your person'
    : 'your person'

  const myName = session
    ? (playerId === 'player1' ? session.player1_name : session.player2_name) || 'you'
    : 'you'

  const activeGroup = activeGroupId ? getGroup(activeGroupId) : null
  const activeStatement = activeGroup?.statements?.[statementIndex] || null

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase
        .from('sessions').select('*').eq('id', sessionId).single()
      if (sessionData) setSession(sessionData)

      const { data: votes, error: vErr } = await supabase
        .from('hot_takes').select('*').eq('session_id', sessionId)
      if (vErr) throw vErr
      setAllVotes(votes || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('something went wrong loading takes')
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Polling ──
  useEffect(() => {
    if (screen === 'categories' || screen === 'summary') return
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [fetchAll, screen])

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase
      .channel(`hot-takes-${sessionId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hot_takes',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, fetchAll])

  // ── Derived: check current statement state from allVotes ──
  useEffect(() => {
    if (!activeStatement || screen === 'categories' || screen === 'summary') return

    const myVote = allVotes.find(v => v.statement_id === activeStatement.id && v.player_id === playerId)
    const theirVote = allVotes.find(v => v.statement_id === activeStatement.id && v.player_id === partnerOf(playerId))

    if (!myVote) {
      setScreen('statement')
    } else if (!theirVote) {
      setScreen('waiting')
    } else if (myVote.vote === theirVote.vote) {
      setScreen('agree-reveal')
    } else {
      // They disagree
      if (!myVote.defense) {
        setScreen('defense')
      } else if (!theirVote.defense) {
        setScreen('defense-waiting')
      } else {
        setScreen('disagree-reveal')
      }
    }
  }, [allVotes, activeStatement, playerId, screen])

  // ── Helpers ──
  const getVotesForStatement = (stId) => {
    const mine = allVotes.find(v => v.statement_id === stId && v.player_id === playerId)
    const theirs = allVotes.find(v => v.statement_id === stId && v.player_id === partnerOf(playerId))
    return { mine, theirs }
  }

  const getGroupStatus = (group) => {
    let completed = 0
    let agreed = 0
    for (const st of group.statements) {
      const { mine, theirs } = getVotesForStatement(st.id)
      if (mine && theirs && (mine.vote === theirs.vote || (mine.defense && theirs.defense))) {
        completed++
        if (mine.vote === theirs.vote) agreed++
      }
    }
    return { completed, agreed, total: group.statements.length }
  }

  // ── Actions ──
  const handleVote = async (vote) => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const { error: err } = await supabase.from('hot_takes').insert({
        session_id: sessionId,
        player_id: playerId,
        statement_id: activeStatement.id,
        vote,
      })
      if (err) throw err
      await fetchAll()
    } catch (err) {
      console.error('Vote error:', err)
      setError('couldn\'t save your vote — try again')
    }
    setSubmitting(false)
  }

  const handleDefense = async () => {
    if (!defenseInput.trim() || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const myVote = allVotes.find(v => v.statement_id === activeStatement.id && v.player_id === playerId)
      const { error: err } = await supabase
        .from('hot_takes')
        .update({ defense: defenseInput.trim().slice(0, 150) })
        .eq('id', myVote.id)
      if (err) throw err
      setDefenseInput('')
      await fetchAll()
    } catch (err) {
      console.error('Defense error:', err)
      setError('couldn\'t save your defense — try again')
    }
    setSubmitting(false)
  }

  const handleNext = () => {
    if (statementIndex < 4) {
      setStatementIndex(statementIndex + 1)
      setScreen('statement')
      setDefenseInput('')
    } else {
      setScreen('summary')
    }
  }

  const handleSelectGroup = (groupId) => {
    setActiveGroupId(groupId)
    // Find first unfinished statement in group
    const group = getGroup(groupId)
    let startIdx = 0
    for (let i = 0; i < group.statements.length; i++) {
      const { mine, theirs } = getVotesForStatement(group.statements[i].id)
      const done = mine && theirs && (mine.vote === theirs.vote || (mine.defense && theirs.defense))
      if (!done) { startIdx = i; break }
      if (i === group.statements.length - 1) startIdx = 0 // all done, restart at 0 for review
    }
    setStatementIndex(startIdx)
    setScreen('statement')
    setDefenseInput('')
  }

  const handleBackToCategories = () => {
    setScreen('categories')
    setActiveGroupId(null)
    setStatementIndex(0)
    setDefenseInput('')
  }

  // ── Total stats ──
  const totalVoted = new Set(allVotes.map(v => v.statement_id)).size
  const totalAgreed = (() => {
    const stIds = [...new Set(allVotes.map(v => v.statement_id))]
    let count = 0
    for (const stId of stIds) {
      const mine = allVotes.find(v => v.statement_id === stId && v.player_id === playerId)
      const theirs = allVotes.find(v => v.statement_id === stId && v.player_id === partnerOf(playerId))
      if (mine && theirs && mine.vote === theirs.vote) count++
    }
    return count
  })()
  const completedStatements = (() => {
    const stIds = [...new Set(allVotes.map(v => v.statement_id))]
    let count = 0
    for (const stId of stIds) {
      const mine = allVotes.find(v => v.statement_id === stId && v.player_id === playerId)
      const theirs = allVotes.find(v => v.statement_id === stId && v.player_id === partnerOf(playerId))
      if (mine && theirs) count++
    }
    return count
  })()

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            loading the takes...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={9} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 2 }}>
            hot takes
          </h1>
          <SquigglyUnderline width={100} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 6px' }} />
          {completedStatements > 0 && screen === 'categories' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
              agreed on {totalAgreed} out of {completedStatements} takes ({completedStatements > 0 ? Math.round((totalAgreed / completedStatements) * 100) : 0}%)
            </p>
          )}
        </div>

        {error && (
          <p style={{ color: 'var(--accent-coral)', textAlign: 'center', fontSize: '0.9rem', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* ── CATEGORIES SCREEN ── */}
        {screen === 'categories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {hotTakesCategories.map((cat, ci) => (
              <div key={cat.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cat.label}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      {cat.description}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 4 }}>
                  {cat.groups.map((group, gi) => {
                    const status = getGroupStatus(group)
                    const isDone = status.completed === 5
                    return (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.1 + gi * 0.05 }}
                        className="glass"
                        style={{
                          padding: '12px 16px', cursor: 'pointer',
                          transform: `rotate(${(gi % 3 - 1) * 0.3}deg)`,
                        }}
                        onClick={() => handleSelectGroup(group.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {group.label}
                          </span>
                          {isDone ? (
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: AGREE_COLOR, fontWeight: 600 }}>
                              {status.agreed}/5 agreed
                            </span>
                          ) : status.completed > 0 ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              {status.completed}/5
                            </span>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                              debate →
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── STATEMENT SCREEN (vote) ── */}
        {screen === 'statement' && activeStatement && (
          <motion.div key={activeStatement.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button onClick={handleBackToCategories} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)',
              padding: '4px 0', marginBottom: 12,
            }}>
              ← back to categories
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
              {activeGroup?.label} — {statementIndex + 1}/5
            </p>
            <div className="glass" style={{ padding: '28px 20px', marginBottom: 20, textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.5rem', fontWeight: 700,
                lineHeight: 1.4, color: 'var(--text-primary)',
              }}>
                {activeStatement.text}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn"
                disabled={submitting}
                onClick={() => handleVote('agree')}
                style={{
                  flex: 1, padding: '16px 12px',
                  background: AGREE_COLOR, color: '#fff',
                  fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 700,
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                agree
              </button>
              <button
                className="btn"
                disabled={submitting}
                onClick={() => handleVote('disagree')}
                style={{
                  flex: 1, padding: '16px 12px',
                  background: DISAGREE_COLOR, color: '#fff',
                  fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 700,
                  border: 'none', borderRadius: 6, cursor: 'pointer',
                }}
              >
                disagree
              </button>
            </div>
          </motion.div>
        )}

        {/* ── WAITING FOR PARTNER VOTE ── */}
        {screen === 'waiting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              waiting for {partnerName} to weigh in...
            </p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>
              this page will update automatically
            </p>
          </motion.div>
        )}

        {/* ── AGREE REVEAL ── */}
        {screen === 'agree-reveal' && activeStatement && (() => {
          const { mine, theirs } = getVotesForStatement(activeStatement.id)
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
                {activeGroup?.label} — {statementIndex + 1}/5
              </p>
              <div className="glass" style={{ padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600,
                  lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 12,
                }}>
                  {activeStatement.text}
                </p>
                <div style={{
                  display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-hand)', fontSize: '1rem',
                    color: PLAYER_COLORS.player1, fontWeight: 600,
                  }}>
                    {mine?.vote}
                  </span>
                  <span style={{ color: 'var(--text-light)' }}>•</span>
                  <span style={{
                    fontFamily: 'var(--font-hand)', fontSize: '1rem',
                    color: PLAYER_COLORS.player2, fontWeight: 600,
                  }}>
                    {theirs?.vote}
                  </span>
                </div>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1.3rem',
                  color: AGREE_COLOR, fontWeight: 700,
                }}>
                  you're on the same page 🤝
                </p>
              </div>
              <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
                {statementIndex < 4 ? 'next take →' : 'see results'}
              </button>
            </motion.div>
          )
        })()}

        {/* ── DEFENSE INPUT ── */}
        {screen === 'defense' && activeStatement && (() => {
          const { mine } = getVotesForStatement(activeStatement.id)
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
                {activeGroup?.label} — {statementIndex + 1}/5
              </p>
              <div className="glass" style={{ padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 600,
                  lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 10,
                }}>
                  {activeStatement.text}
                </p>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: DISAGREE_COLOR }}>
                  you said {mine?.vote} — {partnerName} disagrees!
                </p>
              </div>
              <div className="glass" style={{ padding: 18 }}>
                <label style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1rem',
                  color: 'var(--text-secondary)', display: 'block', marginBottom: 8,
                }}>
                  defend your take:
                </label>
                <input
                  type="text"
                  value={defenseInput}
                  onChange={e => { if (e.target.value.length <= 150) setDefenseInput(e.target.value) }}
                  placeholder="because..."
                  style={{
                    width: '100%', fontFamily: 'var(--font-hand)', fontSize: '1.05rem',
                    background: 'transparent', border: 'none',
                    borderBottom: '2px solid var(--border-pencil)',
                    padding: '8px 0', outline: 'none',
                    color: PLAYER_COLORS[playerId],
                  }}
                />
                <div style={{ textAlign: 'right', marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{defenseInput.length}/150</span>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={!defenseInput.trim() || submitting}
                  onClick={handleDefense}
                  style={{ width: '100%', marginTop: 10 }}
                >
                  {submitting ? 'sending...' : 'lock it in'}
                </button>
              </div>
            </motion.div>
          )
        })()}

        {/* ── WAITING FOR PARTNER DEFENSE ── */}
        {screen === 'defense-waiting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              waiting for {partnerName} to defend their take...
            </p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>
              this page will update automatically
            </p>
          </motion.div>
        )}

        {/* ── DISAGREE REVEAL ── */}
        {screen === 'disagree-reveal' && activeStatement && (() => {
          const { mine, theirs } = getVotesForStatement(activeStatement.id)
          const p1Vote = playerId === 'player1' ? mine : theirs
          const p2Vote = playerId === 'player1' ? theirs : mine
          const p1Name = playerId === 'player1' ? myName : partnerName
          const p2Name = playerId === 'player1' ? partnerName : myName
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 16 }}>
                {activeGroup?.label} — {statementIndex + 1}/5
              </p>
              <div className="glass" style={{ padding: '18px', marginBottom: 14, textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 600,
                  lineHeight: 1.4, color: 'var(--text-primary)',
                }}>
                  {activeStatement.text}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    background: 'var(--bg-card)', border: `2px solid ${PLAYER_COLORS.player1}`,
                    borderRadius: 6, padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', fontWeight: 600, color: PLAYER_COLORS.player1 }}>
                      {p1Name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 700,
                      color: p1Vote?.vote === 'agree' ? AGREE_COLOR : DISAGREE_COLOR,
                    }}>
                      {p1Vote?.vote}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-hand)', fontSize: '1rem',
                    color: PLAYER_COLORS.player1, lineHeight: 1.4, fontStyle: 'italic',
                  }}>
                    "{p1Vote?.defense}"
                  </p>
                </motion.div>

                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)' }}>vs</div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    background: 'var(--bg-card)', border: `2px solid ${PLAYER_COLORS.player2}`,
                    borderRadius: 6, padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', fontWeight: 600, color: PLAYER_COLORS.player2 }}>
                      {p2Name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 700,
                      color: p2Vote?.vote === 'agree' ? AGREE_COLOR : DISAGREE_COLOR,
                    }}>
                      {p2Vote?.vote}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-hand)', fontSize: '1rem',
                    color: PLAYER_COLORS.player2, lineHeight: 1.4, fontStyle: 'italic',
                  }}>
                    "{p2Vote?.defense}"
                  </p>
                </motion.div>
              </div>

              <p style={{
                textAlign: 'center', fontFamily: 'var(--font-hand)',
                fontSize: '1rem', color: 'var(--text-light)', fontStyle: 'italic',
                marginBottom: 16,
              }}>
                still love each other? 💛
              </p>
              <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
                {statementIndex < 4 ? 'next take →' : 'see results'}
              </button>
            </motion.div>
          )
        })()}

        {/* ── SUMMARY SCREEN ── */}
        {screen === 'summary' && activeGroup && (() => {
          const status = getGroupStatus(activeGroup)
          const label = SUMMARY_LABELS[status.agreed] || SUMMARY_LABELS[3]
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="glass" style={{ padding: '28px 20px', textAlign: 'center', marginBottom: 18 }}>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-light)', marginBottom: 8 }}>
                  {activeGroup.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700,
                  color: 'var(--text-primary)', marginBottom: 6,
                }}>
                  {status.agreed}/5 agreed
                </p>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '1.1rem',
                  color: 'var(--text-secondary)', fontStyle: 'italic',
                }}>
                  {label}
                </p>
              </div>

              {/* Per-statement recap */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {activeGroup.statements.map((st, i) => {
                  const { mine, theirs } = getVotesForStatement(st.id)
                  const didAgree = mine && theirs && mine.vote === theirs.vote
                  return (
                    <div key={st.id} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-pencil)',
                      borderRadius: 4, padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-primary)', flex: 1, lineHeight: 1.3 }}>
                          {st.text}
                        </p>
                        <span style={{
                          fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 600,
                          color: didAgree ? AGREE_COLOR : DISAGREE_COLOR, flexShrink: 0,
                        }}>
                          {didAgree ? '🤝' : '⚔️'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button className="btn btn-primary" onClick={handleBackToCategories} style={{ width: '100%' }}>
                back to categories
              </button>
            </motion.div>
          )
        })()}

      </motion.div>
    </div>
  )
}
