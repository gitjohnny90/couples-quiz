import { useContext, useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { SquigglyUnderline } from '../components/Doodles'
import sentenceStarters from '../data/sentenceStarters'

const PLAYER_COLORS = { player1: '#E88D7A', player2: '#7EB8D8' }

function partnerOf(pid) {
  return pid === 'player1' ? 'player2' : 'player1'
}

export default function FinishSentencePage() {
  const { sessionId } = useParams()
  const { playerId } = useContext(SessionContext)

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Active round state
  const [myStarter, setMyStarter] = useState(null)       // row I wrote (this round)
  const [partnerStarter, setPartnerStarter] = useState(null) // row partner wrote (this round)
  const [currentRound, setCurrentRound] = useState(null)

  // Inputs
  const [starterInput, setStarterInput] = useState('')
  const [finishInput, setFinishInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Archive
  const [archive, setArchive] = useState([])

  // Screen: 'write' | 'wait-for-partner-starter' | 'finish' | 'wait-for-partner-finish' | 'reveal'
  const [screen, setScreen] = useState('write')
  const [revealStep, setRevealStep] = useState(0) // 0 = not started, 1 = first sentence, 2 = both

  const partnerName = session
    ? (playerId === 'player1' ? session.player2_name : session.player1_name) || 'your person'
    : 'your person'

  const myName = session
    ? (playerId === 'player1' ? session.player1_name : session.player2_name) || 'you'
    : 'you'

  // ── Fetch everything ──
  useEffect(() => {
    fetchAll()
  }, [sessionId, playerId])

  // ── Polling fallback ──
  useEffect(() => {
    if (screen === 'reveal') return
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
  }, [sessionId, playerId, screen])

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel(`finish-sentence-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'finish_sentence',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, playerId])

  const fetchAll = async () => {
    try {
      // Session info
      const { data: sessionData } = await supabase
        .from('sessions').select('*').eq('id', sessionId).single()
      if (sessionData) setSession(sessionData)

      // All rows for this session, newest first
      const { data: rows, error: fetchErr } = await supabase
        .from('finish_sentence')
        .select('*')
        .eq('session_id', sessionId)
        .order('round', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchErr) throw fetchErr
      if (!rows || rows.length === 0) {
        setCurrentRound(1)
        setMyStarter(null)
        setPartnerStarter(null)
        setArchive([])
        setScreen('write')
        setLoading(false)
        return
      }

      // Group by round
      const rounds = {}
      rows.forEach(r => {
        if (!rounds[r.round]) rounds[r.round] = []
        rounds[r.round].push(r)
      })

      const maxRound = Math.max(...Object.keys(rounds).map(Number))

      // Find completed rounds for archive
      const completedRounds = []
      const roundNums = Object.keys(rounds).map(Number).sort((a, b) => b - a)

      for (const rn of roundNums) {
        const rRows = rounds[rn]
        const allFinished = rRows.length === 2 && rRows.every(r => r.sentence_finish)
        if (allFinished) {
          completedRounds.push(rRows)
        }
      }

      // Determine active round state
      const activeRows = rounds[maxRound] || []
      const myRow = activeRows.find(r => r.player_id === playerId)
      const theirRow = activeRows.find(r => r.player_id === partnerOf(playerId))
      const bothFinished = activeRows.length === 2 &&
        activeRows.every(r => r.sentence_finish)

      setMyStarter(myRow || null)
      setPartnerStarter(theirRow || null)

      if (bothFinished) {
        // This round is complete
        setCurrentRound(maxRound)
        setArchive(completedRounds)
        setScreen('reveal')
      } else if (!myRow) {
        // Haven't written my starter yet
        setCurrentRound(maxRound)
        setArchive(completedRounds)
        setScreen('write')
      } else if (!theirRow) {
        // I wrote my starter, partner hasn't
        setCurrentRound(maxRound)
        setArchive(completedRounds)
        setScreen('wait-for-partner-starter')
      } else if (!theirRow.sentence_finish) {
        // Both starters exist, I need to finish theirs (or already did)
        if (myRow.sentence_finish) {
          // I finished, waiting on partner
          setCurrentRound(maxRound)
          setArchive(completedRounds)
          setScreen('wait-for-partner-finish')
        } else {
          setCurrentRound(maxRound)
          setArchive(completedRounds)
          setScreen('finish')
        }
      } else if (!myRow.sentence_finish) {
        // Partner finished mine, I still need to finish theirs
        setCurrentRound(maxRound)
        setArchive(completedRounds)
        setScreen('finish')
      } else {
        // Edge case — both done
        setCurrentRound(maxRound)
        setArchive(completedRounds)
        setScreen('reveal')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('something went wrong loading sentences')
    }
    setLoading(false)
  }

  // ── Submit starter ──
  const handleSubmitStarter = async () => {
    if (!starterInput.trim()) return
    setSubmitting(true)
    setError('')
    try {
      let text = starterInput.trim()
      if (text.length > 80) text = text.slice(0, 80)
      if (!text.endsWith('...')) {
        text = text.replace(/\.+$/, '') + '...'
      }

      // Figure out round number
      const { data: existing } = await supabase
        .from('finish_sentence')
        .select('round')
        .eq('session_id', sessionId)
        .order('round', { ascending: false })
        .limit(1)

      let round = 1
      if (existing && existing.length > 0) {
        const lastRound = existing[0].round
        // Check if that round is complete (both finished)
        const { data: lastRows } = await supabase
          .from('finish_sentence')
          .select('*')
          .eq('session_id', sessionId)
          .eq('round', lastRound)

        const allDone = lastRows && lastRows.length === 2 && lastRows.every(r => r.sentence_finish)
        round = allDone ? lastRound + 1 : lastRound
      }

      const { error: insertErr } = await supabase
        .from('finish_sentence')
        .insert({
          session_id: sessionId,
          round,
          player_id: playerId,
          sentence_starter: text,
        })

      if (insertErr) throw insertErr
      setStarterInput('')
      await fetchAll()
    } catch (err) {
      console.error('Submit starter error:', err)
      setError('couldn\'t send your sentence — try again')
    }
    setSubmitting(false)
  }

  // ── Submit finish ──
  const handleSubmitFinish = async () => {
    if (!finishInput.trim() || !partnerStarter) return
    setSubmitting(true)
    setError('')
    try {
      let text = finishInput.trim()
      if (text.length > 150) text = text.slice(0, 150)

      const { error: updateErr } = await supabase
        .from('finish_sentence')
        .update({ sentence_finish: text })
        .eq('id', partnerStarter.id)

      if (updateErr) throw updateErr
      setFinishInput('')
      await fetchAll()
    } catch (err) {
      console.error('Submit finish error:', err)
      setError('couldn\'t save your answer — try again')
    }
    setSubmitting(false)
  }

  // ── Start new round ──
  const handleNewRound = () => {
    setRevealStep(0)
    setMyStarter(null)
    setPartnerStarter(null)
    setStarterInput('')
    setFinishInput('')
    setScreen('write')
    fetchAll()
  }

  // ── Reveal animation trigger ──
  useEffect(() => {
    if (screen === 'reveal' && revealStep === 0) {
      setTimeout(() => setRevealStep(1), 400)
      setTimeout(() => setRevealStep(2), 1400)
    }
  }, [screen])

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            opening the notebook...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={7} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 2 }}>
            finish my sentence
          </h1>
          <SquigglyUnderline width={140} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 6px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            write a sentence for {partnerName} to finish
          </p>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: 'var(--accent-coral)', textAlign: 'center', fontSize: '0.9rem', marginBottom: 12 }}>
            {error}
          </p>
        )}

        {/* ── WRITE SCREEN ── */}
        {screen === 'write' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
              <label style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.05rem',
                color: 'var(--text-secondary)', display: 'block', marginBottom: 10,
              }}>
                write a sentence for {partnerName} to finish...
              </label>
              <input
                type="text"
                value={starterInput}
                onChange={e => {
                  if (e.target.value.length <= 80) setStarterInput(e.target.value)
                }}
                placeholder="The thing I love most about us is..."
                style={{
                  width: '100%', fontFamily: 'var(--font-hand)', fontSize: '1.1rem',
                  background: 'transparent', border: 'none',
                  borderBottom: '2px solid var(--border-pencil)',
                  padding: '8px 0', outline: 'none',
                  color: PLAYER_COLORS[playerId],
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  {starterInput.length}/80
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                  we'll add "..." if you don't
                </span>
              </div>
              <button
                className="btn btn-primary"
                disabled={!starterInput.trim() || submitting}
                onClick={handleSubmitStarter}
                style={{ width: '100%', marginTop: 14 }}
              >
                {submitting ? 'sending...' : 'send it'}
              </button>
            </div>

            {/* Suggestion chips */}
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '0.95rem',
                color: 'var(--text-light)', marginBottom: 8, textAlign: 'center',
              }}>
                need inspiration?
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {sentenceStarters.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setStarterInput(s.replace(/\.\.\.$/,''))}
                    style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-pencil)',
                      borderRadius: 3, padding: '5px 10px', cursor: 'pointer',
                      fontFamily: 'var(--font-hand)', fontSize: '0.8rem',
                      color: 'var(--text-secondary)', lineHeight: 1.3,
                      transform: `rotate(${(i % 3 - 1) * 0.8}deg)`,
                      boxShadow: '1px 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── WAITING FOR PARTNER'S STARTER ── */}
        {screen === 'wait-for-partner-starter' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              sent! now wait for {partnerName} to send you one...
            </p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>
              this page will update automatically
            </p>
          </motion.div>
        )}

        {/* ── FINISH SCREEN ── */}
        {screen === 'finish' && partnerStarter && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
                color: 'var(--text-light)', marginBottom: 10,
              }}>
                {partnerName} wrote:
              </p>
              <div style={{
                fontFamily: 'var(--font-hand)', fontSize: '1.2rem', lineHeight: 1.6,
                borderBottom: '2px solid var(--border-pencil)', paddingBottom: 4,
              }}>
                <span style={{ color: PLAYER_COLORS[partnerOf(playerId)] }}>
                  {partnerStarter.sentence_starter}
                </span>
                {' '}
                <input
                  type="text"
                  value={finishInput}
                  onChange={e => {
                    if (e.target.value.length <= 150) setFinishInput(e.target.value)
                  }}
                  placeholder="finish their sentence..."
                  style={{
                    fontFamily: 'var(--font-hand)', fontSize: '1.2rem',
                    background: 'transparent', border: 'none', outline: 'none',
                    color: PLAYER_COLORS[playerId], width: '100%',
                    padding: '4px 0',
                  }}
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  {finishInput.length}/150
                </span>
              </div>
              <button
                className="btn btn-primary"
                disabled={!finishInput.trim() || submitting}
                onClick={handleSubmitFinish}
                style={{ width: '100%', marginTop: 12 }}
              >
                {submitting ? 'sending...' : 'done!'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── WAITING FOR PARTNER TO FINISH ── */}
        {screen === 'wait-for-partner-finish' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              waiting for {partnerName} to finish yours...
            </p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 8, fontStyle: 'italic' }}>
              this page will update automatically
            </p>
          </motion.div>
        )}

        {/* ── REVEAL SCREEN ── */}
        {screen === 'reveal' && myStarter && partnerStarter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>

              {/* First sentence: my starter + partner's finish */}
              <AnimatePresence>
                {revealStep >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="glass"
                    style={{ padding: 18, transform: 'rotate(-0.3deg)' }}
                  >
                    <p style={{
                      fontFamily: 'var(--font-hand)', fontSize: '1.15rem', lineHeight: 1.6,
                    }}>
                      <span style={{ color: PLAYER_COLORS[playerId] }}>
                        {myStarter.sentence_starter}
                      </span>
                      {' '}
                      <span style={{ color: PLAYER_COLORS[partnerOf(playerId)] }}>
                        {myStarter.sentence_finish}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 6, fontStyle: 'italic' }}>
                      {myName} started, {partnerName} finished
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Second sentence: partner's starter + my finish */}
              <AnimatePresence>
                {revealStep >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="glass"
                    style={{ padding: 18, transform: 'rotate(0.2deg)' }}
                  >
                    <p style={{
                      fontFamily: 'var(--font-hand)', fontSize: '1.15rem', lineHeight: 1.6,
                    }}>
                      <span style={{ color: PLAYER_COLORS[partnerOf(playerId)] }}>
                        {partnerStarter.sentence_starter}
                      </span>
                      {' '}
                      <span style={{ color: PLAYER_COLORS[playerId] }}>
                        {partnerStarter.sentence_finish}
                      </span>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 6, fontStyle: 'italic' }}>
                      {partnerName} started, {myName} finished
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {revealStep >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <button
                  className="btn btn-primary"
                  onClick={handleNewRound}
                  style={{ width: '100%' }}
                >
                  write another?
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── ARCHIVE ── */}
        {archive.length > 0 && screen !== 'reveal' && (
          <ArchiveSection archive={archive} playerId={playerId} />
        )}
        {screen === 'reveal' && archive.length > 1 && (
          <ArchiveSection archive={archive.slice(1)} playerId={playerId} />
        )}

      </motion.div>
    </div>
  )
}

function ArchiveSection({ archive, playerId }) {
  if (!archive || archive.length === 0) return null
  return (
    <div style={{ marginTop: 28 }}>
      <p style={{
        fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-light)',
        textAlign: 'center', marginBottom: 12,
      }}>
        past sentences
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {archive.map((roundRows, i) => {
          const p1Row = roundRows.find(r => r.player_id === 'player1')
          const p2Row = roundRows.find(r => r.player_id === 'player2')
          if (!p1Row || !p2Row) return null
          return (
            <div key={i} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-pencil)',
              borderRadius: 4, padding: 14, opacity: 0.85,
            }}>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1rem', lineHeight: 1.5, marginBottom: 8,
              }}>
                <span style={{ color: PLAYER_COLORS.player1 }}>{p1Row.sentence_starter}</span>
                {' '}
                <span style={{ color: PLAYER_COLORS.player2 }}>{p1Row.sentence_finish}</span>
              </p>
              <p style={{
                fontFamily: 'var(--font-hand)', fontSize: '1rem', lineHeight: 1.5,
              }}>
                <span style={{ color: PLAYER_COLORS.player2 }}>{p2Row.sentence_starter}</span>
                {' '}
                <span style={{ color: PLAYER_COLORS.player1 }}>{p2Row.sentence_finish}</span>
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
