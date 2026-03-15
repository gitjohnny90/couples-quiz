import { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import hotTakesCategories, { allHotTakeGroups, getGroup } from '../data/hotTakesStatements'
import PageGuide from '../components/PageGuide'
import AppWaitlistPrompt, { trackActivityCompletion } from '../components/AppWaitlistPrompt'

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
  const { setSessionId, playerId } = useContext(SessionContext)

  // Sync URL sessionId to context (fixes direct URL navigation)
  useEffect(() => { if (sessionId) setSessionId(sessionId) }, [sessionId])

  const activityTrackedRef = useRef(false)
  const mountedRef = useRef(true)
  const channelId = useRef(`hot-takes-${sessionId}-${Math.random().toString(36).slice(2, 8)}`)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [allVotes, setAllVotes] = useState([])

  // Navigation: categories | statement | group-done | results
  const [screen, setScreen] = useState('categories')
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [statementIndex, setStatementIndex] = useState(0)

  // Defense input (used on results screen, keyed by statement id)
  const [defenseInputs, setDefenseInputs] = useState({})
  const [expandedDefense, setExpandedDefense] = useState(null)
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
        .from('sessions').select('player1_name, player2_name').eq('id', sessionId).single()
      if (!mountedRef.current) return
      if (sessionData) setSession(sessionData)

      const { data: votes, error: vErr } = await supabase
        .from('hot_takes').select('player_id, statement_id, vote, defense').eq('session_id', sessionId)
      if (!mountedRef.current) return
      if (vErr) throw vErr
      setAllVotes(votes || [])
    } catch (err) {
      console.error('Fetch error:', err)
      if (mountedRef.current) setError('something went wrong loading takes')
    }
    if (mountedRef.current) setLoading(false)
  }, [sessionId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Polling (only on group-done and results screens) ──
  useEffect(() => {
    if (screen !== 'group-done' && screen !== 'results') return
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [fetchAll, screen])

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hot_takes',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, fetchAll])

  // ── Auto-transition: group-done → results when partner finishes ──
  useEffect(() => {
    if (screen !== 'group-done' || !activeGroup) return
    const partnerVotes = activeGroup.statements.filter(st =>
      allVotes.some(v => v.statement_id === st.id && v.player_id === partnerOf(playerId))
    ).length
    if (partnerVotes === 5) {
      setScreen('results')
    }
  }, [allVotes, screen, activeGroup, playerId])

  // Track activity completion when results screen is shown
  useEffect(() => {
    if (screen === 'results' && !activityTrackedRef.current) {
      activityTrackedRef.current = true
      trackActivityCompletion()
    }
  }, [screen])

  // ── Helpers ──
  const getVotesForStatement = (stId) => {
    const mine = allVotes.find(v => v.statement_id === stId && v.player_id === playerId)
    const theirs = allVotes.find(v => v.statement_id === stId && v.player_id === partnerOf(playerId))
    return { mine, theirs }
  }

  const getGroupStatus = (group) => {
    let completed = 0
    let agreed = 0
    let myVoteCount = 0
    for (const st of group.statements) {
      const { mine, theirs } = getVotesForStatement(st.id)
      if (mine) myVoteCount++
      if (mine && theirs) {
        completed++
        if (mine.vote === theirs.vote) agreed++
      }
    }
    return { completed, agreed, total: group.statements.length, myVoteCount }
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

      // Auto-advance to next statement or finish group
      if (statementIndex < 4) {
        setStatementIndex(statementIndex + 1)
      } else {
        // Voted on all 5 — check if partner also voted all 5
        const partnerVotes = activeGroup.statements.filter(st =>
          // Check fresh allVotes + the one we just inserted
          allVotes.some(v => v.statement_id === st.id && v.player_id === partnerOf(playerId))
        ).length
        if (partnerVotes === 5) {
          setScreen('results')
        } else {
          setScreen('group-done')
        }
      }
    } catch (err) {
      console.error('Vote error:', err)
      setError('couldn\'t save your vote — try again')
    }
    setSubmitting(false)
  }

  const handleDefense = async (statementId) => {
    const text = (defenseInputs[statementId] || '').trim()
    if (!text || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const myVote = allVotes.find(v => v.statement_id === statementId && v.player_id === playerId)
      const { error: err } = await supabase
        .from('hot_takes')
        .update({ defense: text.slice(0, 150) })
        .eq('id', myVote.id)
      if (err) throw err
      setDefenseInputs(prev => ({ ...prev, [statementId]: '' }))
      setExpandedDefense(null)
      await fetchAll()
    } catch (err) {
      console.error('Defense error:', err)
      setError('couldn\'t save your defense — try again')
    }
    setSubmitting(false)
  }

  const handleSelectGroup = (groupId) => {
    const group = getGroup(groupId)
    setActiveGroupId(groupId)
    setDefenseInputs({})
    setExpandedDefense(null)

    // Count my votes and partner votes for this group
    let myVoteCount = 0
    let partnerVoteCount = 0
    let firstUnvoted = -1
    for (let i = 0; i < group.statements.length; i++) {
      const stId = group.statements[i].id
      const myVote = allVotes.find(v => v.statement_id === stId && v.player_id === playerId)
      const theirVote = allVotes.find(v => v.statement_id === stId && v.player_id === partnerOf(playerId))
      if (myVote) myVoteCount++
      if (theirVote) partnerVoteCount++
      if (!myVote && firstUnvoted === -1) firstUnvoted = i
    }

    if (myVoteCount === 5 && partnerVoteCount === 5) {
      setStatementIndex(0)
      setScreen('results')
    } else if (myVoteCount === 5) {
      setStatementIndex(0)
      setScreen('group-done')
    } else {
      setStatementIndex(firstUnvoted >= 0 ? firstUnvoted : 0)
      setScreen('statement')
    }
  }

  const handleBackToCategories = () => {
    setScreen('categories')
    setActiveGroupId(null)
    setStatementIndex(0)
    setDefenseInputs({})
    setExpandedDefense(null)
  }

  // ── Total stats ──
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
      <PageGuide pageKey="hotTakes" />
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
              agreed on {totalAgreed} out of {completedStatements} takes ({Math.round((totalAgreed / completedStatements) * 100)}%)
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
                    const bothDone = status.completed === 5
                    const iVotedAll = status.myVoteCount === 5
                    return (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ci * 0.1 + gi * 0.05 }}
                        className="glass"
                        role="button"
                        tabIndex={0}
                        aria-label={`${group.label} — debate this group of hot takes`}
                        style={{
                          padding: '12px 16px', cursor: 'pointer',
                          transform: `rotate(${(gi % 3 - 1) * 0.3}deg)`,
                        }}
                        onClick={() => handleSelectGroup(group.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectGroup(group.id) } }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {group.label}
                          </span>
                          {bothDone ? (
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: AGREE_COLOR, fontWeight: 600 }}>
                              {status.agreed}/5 agreed
                            </span>
                          ) : iVotedAll ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                              waiting...
                            </span>
                          ) : status.myVoteCount > 0 ? (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              {status.myVoteCount}/5
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

        {/* ── STATEMENT SCREEN (vote + auto-advance) ── */}
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

        {/* ── GROUP DONE — waiting for partner ── */}
        {screen === 'group-done' && activeGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button onClick={handleBackToCategories} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)',
              padding: '4px 0', marginBottom: 12,
            }}>
              ← back to categories
            </button>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                you voted on all 5!
              </p>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                waiting for {partnerName} to finish {activeGroup.label}...
              </p>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>
                this page will update automatically
              </p>
              {/* Show how many partner has done */}
              {(() => {
                const partnerCount = activeGroup.statements.filter(st =>
                  allVotes.some(v => v.statement_id === st.id && v.player_id === partnerOf(playerId))
                ).length
                return partnerCount > 0 ? (
                  <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 12 }}>
                    {partnerName} has voted on {partnerCount}/5
                  </p>
                ) : null
              })()}
            </div>
          </motion.div>
        )}

        {/* ── RESULTS SCREEN (combined reveal + defense + summary) ── */}
        {screen === 'results' && activeGroup && (() => {
          const status = getGroupStatus(activeGroup)
          const label = SUMMARY_LABELS[status.agreed] || SUMMARY_LABELS[3]
          return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <button onClick={handleBackToCategories} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)',
                padding: '4px 0', marginBottom: 12,
              }}>
                ← back to categories
              </button>

              {/* Score header */}
              <div className="glass" style={{ padding: '22px 20px', textAlign: 'center', marginBottom: 18 }}>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-light)', marginBottom: 6 }}>
                  {activeGroup.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700,
                  color: 'var(--text-primary)', marginBottom: 4,
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

              {/* Per-statement results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {activeGroup.statements.map((st, i) => {
                  const { mine, theirs } = getVotesForStatement(st.id)
                  const didAgree = mine && theirs && mine.vote === theirs.vote
                  const isExpanded = expandedDefense === st.id

                  return (
                    <motion.div
                      key={st.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-pencil)',
                        borderRadius: 6, padding: '12px 14px',
                      }}
                    >
                      {/* Statement + result */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-primary)', flex: 1, lineHeight: 1.3 }}>
                          {st.text}
                        </p>
                        <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                          {didAgree ? '🤝' : '⚔️'}
                        </span>
                      </div>

                      {/* Both votes */}
                      <div style={{ display: 'flex', gap: 12, marginBottom: didAgree ? 0 : 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 600,
                          color: mine?.vote === 'agree' ? AGREE_COLOR : DISAGREE_COLOR,
                        }}>
                          {myName}: {mine?.vote}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 600,
                          color: theirs?.vote === 'agree' ? AGREE_COLOR : DISAGREE_COLOR,
                        }}>
                          {partnerName}: {theirs?.vote}
                        </span>
                      </div>

                      {/* Defense section (only for disagreements) */}
                      {!didAgree && mine && theirs && (
                        <div style={{ marginTop: 4 }}>
                          {/* Both have defenses — show them */}
                          {mine.defense && theirs.defense ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <p style={{
                                fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
                                color: PLAYER_COLORS[playerId], fontStyle: 'italic', lineHeight: 1.3,
                              }}>
                                "{mine.defense}"
                              </p>
                              <p style={{
                                fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
                                color: PLAYER_COLORS[partnerOf(playerId)], fontStyle: 'italic', lineHeight: 1.3,
                              }}>
                                "{theirs.defense}"
                              </p>
                            </div>
                          ) : mine.defense ? (
                            <div>
                              <p style={{
                                fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
                                color: PLAYER_COLORS[playerId], fontStyle: 'italic', lineHeight: 1.3,
                              }}>
                                "{mine.defense}"
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic', marginTop: 4 }}>
                                waiting for {partnerName}'s defense...
                              </p>
                            </div>
                          ) : (
                            <div>
                              {/* Show partner's defense if they have one */}
                              {theirs.defense && (
                                <p style={{
                                  fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
                                  color: PLAYER_COLORS[partnerOf(playerId)], fontStyle: 'italic', lineHeight: 1.3,
                                  marginBottom: 6,
                                }}>
                                  "{theirs.defense}"
                                </p>
                              )}
                              {/* Defense input for me */}
                              {isExpanded ? (
                                <div style={{ marginTop: 4 }}>
                                  <input
                                    type="text"
                                    value={defenseInputs[st.id] || ''}
                                    onChange={e => {
                                      if (e.target.value.length <= 150)
                                        setDefenseInputs(prev => ({ ...prev, [st.id]: e.target.value }))
                                    }}
                                    placeholder="because..."
                                    style={{
                                      width: '100%', fontFamily: 'var(--font-hand)', fontSize: '0.95rem',
                                      background: 'transparent', border: 'none',
                                      borderBottom: '2px solid var(--border-pencil)',
                                      padding: '6px 0', outline: 'none',
                                      color: PLAYER_COLORS[playerId],
                                    }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>
                                      {(defenseInputs[st.id] || '').length}/150
                                    </span>
                                    <button
                                      className="btn btn-primary"
                                      disabled={!(defenseInputs[st.id] || '').trim() || submitting}
                                      onClick={() => handleDefense(st.id)}
                                      style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                    >
                                      {submitting ? '...' : 'lock it in'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setExpandedDefense(st.id)}
                                  style={{
                                    background: 'none', border: '1px dashed var(--border-pencil)',
                                    borderRadius: 4, padding: '6px 12px', cursor: 'pointer',
                                    fontFamily: 'var(--font-hand)', fontSize: '0.85rem',
                                    color: 'var(--text-light)', width: '100%',
                                  }}
                                >
                                  defend your take
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <AppWaitlistPrompt />

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
