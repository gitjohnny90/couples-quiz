import { useContext, useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import loveNoteSuggestions from '../data/loveNoteSuggestions'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from '../components/Doodles'

const PHASE = { SETUP: 'setup', WAITING: 'waiting', HUNTING: 'hunting', REVEAL: 'reveal' }
const GRID_SIZE = 6
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE
const NOTES_REQUIRED = 3

export default function LoveNoteHuntPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName, setSessionId } = useContext(SessionContext)
  const playerId = localStorage.getItem('playerId')

  const [phase, setPhase] = useState(PHASE.SETUP)
  const [round, setRound] = useState(1)
  const [loading, setLoading] = useState(true)

  // Setup state
  const [myNotes, setMyNotes] = useState([]) // [{ position, message }]
  const [activeCell, setActiveCell] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Hunting state
  const [partnerNotes, setPartnerNotes] = useState([]) // fetched when hunting starts
  const [guesses, setGuesses] = useState([])
  const [hits, setHits] = useState([])
  const [revealedNote, setRevealedNote] = useState(null) // currently shown hit note

  // Waiting state
  const [copied, setCopied] = useState(false)
  const [partnerName, setPartnerName] = useState(null)

  const textareaRef = useRef(null)

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    resumeGame()
    fetchPartnerName()
  }, [sessionId])

  const fetchPartnerName = async () => {
    const { data } = await supabase.from('sessions').select('player1_name, player2_name').eq('id', sessionId).single()
    if (!data) return
    const myKey = playerId === 'player1' ? 'player1_name' : 'player2_name'
    const partnerKey = playerId === 'player1' ? 'player2_name' : 'player1_name'
    if (data[partnerKey]) setPartnerName(data[partnerKey])
  }

  // Resume from existing DB state
  const resumeGame = async () => {
    setLoading(true)

    // Find current round — latest round number for this session
    const { data: allNotes, error: notesErr } = await supabase
      .from('love_notes').select('*')
      .eq('session_id', sessionId)
      .order('round', { ascending: false })

    if (notesErr || !allNotes || allNotes.length === 0) {
      setRound(1)
      setPhase(PHASE.SETUP)
      setLoading(false)
      return
    }

    const latestRound = allNotes[0].round
    const roundNotes = allNotes.filter(n => n.round === latestRound)
    const myRoundNotes = roundNotes.filter(n => n.player_id === playerId)
    const partnerRoundNotes = roundNotes.filter(n => n.player_id !== playerId)

    // Check guesses
    const { data: guessData } = await supabase
      .from('responses').select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', `love-notes-guesses-r${latestRound}`)
      .eq('player_id', playerId)
      .maybeSingle()

    const savedGuesses = guessData?.answers?.guesses || []
    const savedHits = guessData?.answers?.hits || []

    if (myRoundNotes.length >= NOTES_REQUIRED && partnerRoundNotes.length >= NOTES_REQUIRED) {
      // Both placed notes
      if (savedHits.length >= NOTES_REQUIRED) {
        // Already found all — show reveal
        setRound(latestRound)
        setPartnerNotes(partnerRoundNotes)
        setGuesses(savedGuesses)
        setHits(savedHits)
        setPhase(PHASE.REVEAL)
      } else {
        // Still hunting
        setRound(latestRound)
        setPartnerNotes(partnerRoundNotes)
        setGuesses(savedGuesses)
        setHits(savedHits)
        setPhase(PHASE.HUNTING)
      }
    } else if (myRoundNotes.length >= NOTES_REQUIRED) {
      // I placed, partner hasn't
      setRound(latestRound)
      setMyNotes(myRoundNotes.map(n => ({ position: n.grid_position, message: n.message })))
      setPhase(PHASE.WAITING)
    } else {
      // Haven't placed yet (or partial — treat as fresh setup for this round)
      setRound(latestRound)
      setPhase(PHASE.SETUP)
    }

    setLoading(false)
  }

  // Fetch partner notes (for hunting phase)
  const fetchPartnerNotes = async () => {
    const { data, error } = await supabase
      .from('love_notes').select('*')
      .eq('session_id', sessionId)
      .eq('round', round)
      .neq('player_id', playerId)

    if (error || !data) return []
    if (data.length >= NOTES_REQUIRED) {
      setPartnerNotes(data)
      return data
    }
    return []
  }

  // Realtime + polling for waiting phase
  useEffect(() => {
    if (phase !== PHASE.WAITING) return

    const channel = supabase
      .channel(`love-notes-${sessionId}-r${round}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'love_notes',
        filter: `session_id=eq.${sessionId}`,
      }, async () => {
        const notes = await fetchPartnerNotes()
        if (notes.length >= NOTES_REQUIRED) {
          setPhase(PHASE.HUNTING)
        }
      })
      .subscribe()

    // Polling fallback
    const interval = setInterval(async () => {
      const notes = await fetchPartnerNotes()
      if (notes.length >= NOTES_REQUIRED) {
        setPhase(PHASE.HUNTING)
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [phase, sessionId, round])

  // --- SETUP HANDLERS ---

  const handleCellTap = (position) => {
    if (myNotes.find(n => n.position === position)) {
      // Remove note from this cell
      setMyNotes(prev => prev.filter(n => n.position !== position))
      setActiveCell(null)
      setNoteText('')
      return
    }
    if (myNotes.length >= NOTES_REQUIRED) return // already placed all 3
    setActiveCell(position)
    setNoteText('')
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const handlePlaceNote = () => {
    if (!noteText.trim() || activeCell === null) return
    setMyNotes(prev => [...prev, { position: activeCell, message: noteText.trim() }])
    setActiveCell(null)
    setNoteText('')
  }

  const handleReady = async () => {
    if (myNotes.length < NOTES_REQUIRED || submitting) return
    setSubmitting(true)

    const rows = myNotes.map(n => ({
      session_id: sessionId,
      player_id: playerId,
      grid_position: n.position,
      message: n.message,
      round,
    }))

    const { error } = await supabase.from('love_notes').insert(rows)

    if (error) {
      setSubmitting(false)
      return
    }

    setSubmitting(false)

    // Check if partner already placed notes
    const notes = await fetchPartnerNotes()
    if (notes.length >= NOTES_REQUIRED) {
      setPhase(PHASE.HUNTING)
    } else {
      setPhase(PHASE.WAITING)
    }
  }

  // --- HUNTING HANDLERS ---

  const handleGuess = async (position) => {
    if (guesses.includes(position)) return
    if (revealedNote) return // don't allow guessing while note is shown

    const newGuesses = [...guesses, position]
    setGuesses(newGuesses)

    const hitNote = partnerNotes.find(n => n.grid_position === position)
    let newHits = hits

    if (hitNote) {
      newHits = [...hits, position]
      setHits(newHits)
      setRevealedNote(hitNote)
    }

    // Save guesses to DB
    await supabase.from('responses').upsert({
      session_id: sessionId,
      pack_id: `love-notes-guesses-r${round}`,
      player_id: playerId,
      player_name: playerName,
      answers: { guesses: newGuesses, hits: newHits },
    }, { onConflict: 'session_id,pack_id,player_id' })

    // Note: when all found, the popup button says "see all notes"
    // and dismissNote handles the transition to reveal
  }

  const dismissNote = () => {
    setRevealedNote(null)
    if (hits.length >= NOTES_REQUIRED) {
      setPhase(PHASE.REVEAL)
    }
  }

  // --- PLAY AGAIN ---

  const handlePlayAgain = () => {
    const newRound = round + 1
    setRound(newRound)
    setMyNotes([])
    setActiveCell(null)
    setNoteText('')
    setPartnerNotes([])
    setGuesses([])
    setHits([])
    setRevealedNote(null)
    setPhase(PHASE.SETUP)
  }

  // --- COPY LINK ---

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${sessionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // --- GRID RENDERER ---

  const renderGrid = (mode) => {
    const cells = []
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const isPlacedNote = mode === 'setup' && myNotes.find(n => n.position === i)
      const isActive = mode === 'setup' && activeCell === i
      const isGuessed = mode === 'hunt' && guesses.includes(i)
      const isHit = mode === 'hunt' && hits.includes(i)
      const isMiss = mode === 'hunt' && isGuessed && !isHit
      const canTap = mode === 'setup'
        ? (myNotes.length < NOTES_REQUIRED || !!isPlacedNote)
        : (!isGuessed && !revealedNote)

      cells.push(
        <motion.div
          key={i}
          style={{
            aspectRatio: '1',
            border: '1px solid rgba(107, 141, 173, 0.3)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canTap ? 'pointer' : 'default',
            background: isActive
              ? 'rgba(232, 141, 122, 0.15)'
              : isHit
                ? 'rgba(232, 141, 122, 0.12)'
                : isMiss
                  ? 'rgba(107, 141, 173, 0.06)'
                  : 'transparent',
            position: 'relative',
            transition: 'background 0.2s',
          }}
          onClick={() => {
            if (!canTap) return
            if (mode === 'setup') handleCellTap(i)
            if (mode === 'hunt') handleGuess(i)
          }}
          whileTap={canTap ? { scale: 0.93 } : {}}
        >
          {/* Placed note heart (setup) */}
          {isPlacedNote && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              💕
            </motion.div>
          )}

          {/* Hit heart (hunt) */}
          {isHit && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ fontSize: 18, lineHeight: 1 }}
            >
              💌
            </motion.div>
          )}

          {/* Miss scribble X (hunt) */}
          {isMiss && (
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.35 }}
              transition={{ duration: 0.3 }}
              width="20" height="20" viewBox="0 0 20 20"
              style={{ position: 'absolute' }}
            >
              <motion.path
                d="M4 4 Q10 9 16 16"
                stroke="#8B7355"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25 }}
              />
              <motion.path
                d="M16 4 Q10 10 4 16"
                stroke="#8B7355"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              />
            </motion.svg>
          )}
        </motion.div>
      )
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: 0,
        background: 'var(--bg-paper)',
        border: '2px solid rgba(107, 141, 173, 0.25)',
        borderRadius: 6,
        padding: 2,
        maxWidth: 340,
        margin: '0 auto',
      }}>
        {cells}
      </div>
    )
  }

  // --- LOADING ---

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            opening the notebook...
          </p>
        </motion.div>
      </div>
    )
  }

  // ==================== SETUP PHASE ====================
  if (phase === PHASE.SETUP) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={42} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>💌</div>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
              hide your love notes
            </h1>
            <SquigglyUnderline width={120} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              tap {NOTES_REQUIRED} cells to hide notes for your person to find
            </p>
          </div>

          {/* Progress */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.1rem',
              color: myNotes.length >= NOTES_REQUIRED ? 'var(--accent-sage)' : 'var(--text-secondary)',
              fontWeight: 600,
            }}>
              {myNotes.length}/{NOTES_REQUIRED} notes placed
            </span>
          </div>

          {/* Grid */}
          {renderGrid('setup')}

          {/* Note composer */}
          <AnimatePresence>
            {activeCell !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass"
                style={{ padding: 16, marginTop: 16 }}
              >
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
                  write your love note:
                </p>
                <textarea
                  ref={textareaRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="write something sweet..."
                  maxLength={120}
                  style={{
                    width: '100%',
                    minHeight: 60,
                    padding: '10px 12px',
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1rem',
                    border: '1px solid var(--border-pencil)',
                    borderRadius: 6,
                    background: '#fff',
                    resize: 'none',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Suggestion chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                  {loveNoteSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setNoteText(suggestion)}
                      style={{
                        padding: '4px 10px',
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-pencil)',
                        borderRadius: 12,
                        background: noteText === suggestion ? 'rgba(232, 141, 122, 0.15)' : '#fff',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 12 }}
                  onClick={handlePlaceNote}
                  disabled={!noteText.trim()}
                >
                  place note
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ready button */}
          {myNotes.length >= NOTES_REQUIRED && activeCell === null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: 20 }}
            >
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1.1rem' }}
                onClick={handleReady}
                disabled={submitting}
              >
                {submitting ? 'hiding notes...' : "i'm ready!"}
              </button>
            </motion.div>
          )}

          {/* Back button */}
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => navigate(`/fun/${sessionId}`)}
          >
            ← back to fun stuff
          </button>
        </motion.div>
      </div>
    )
  }

  // ==================== WAITING PHASE ====================
  if (phase === PHASE.WAITING) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={43} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 40 }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>💌</div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>
            waiting for your person...
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 24 }}>
            they need to hide their love notes too!
          </p>

          <div className="glass" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', marginBottom: 8, color: 'var(--text-secondary)' }}>
              send them this link:
            </p>
            <div style={{
              background: '#fff',
              borderBottom: '2px solid var(--border-pencil)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              wordBreak: 'break-all',
              color: 'var(--accent-coral)',
              marginBottom: 12,
              fontFamily: 'var(--font-body)',
            }}>
              {window.location.origin}/join/{sessionId}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={copyLink}>
              {copied ? 'copied!' : 'copy link'}
            </button>
          </div>

          <button
            className="btn btn-secondary"
            style={{ marginTop: 8 }}
            onClick={() => navigate(`/fun/${sessionId}`)}
          >
            ← back to fun stuff
          </button>
        </motion.div>
      </div>
    )
  }

  // ==================== HUNTING PHASE ====================
  if (phase === PHASE.HUNTING) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={44} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🔍</div>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
              find their notes
            </h1>
            <SquigglyUnderline width={100} color="#6B8DAD" opacity={0.4} style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              tap cells to search for hidden love notes
            </p>
          </div>

          {/* Found counter */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <span style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.1rem',
              color: hits.length >= NOTES_REQUIRED ? 'var(--accent-sage)' : 'var(--accent-coral)',
              fontWeight: 600,
            }}>
              {hits.length}/{NOTES_REQUIRED} notes found
            </span>
          </div>

          {/* Grid */}
          {renderGrid('hunt')}

          {/* Hit note reveal popup */}
          <AnimatePresence>
            {revealedNote && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'fixed',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 20,
                }}
                onClick={dismissNote}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 15 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  className="glass"
                  style={{
                    padding: '28px 24px',
                    maxWidth: 300,
                    textAlign: 'center',
                    transform: 'rotate(-1deg)',
                    cursor: 'pointer',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💌</div>
                  <p style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1.3rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    marginBottom: 12,
                  }}>
                    "{revealedNote.message}"
                  </p>
                  <DoodleHeart size={12} color="#E88D7A" opacity={0.5} style={{ position: 'absolute', top: 8, right: 12 }} />
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.9rem' }}
                    onClick={dismissNote}
                  >
                    {hits.length >= NOTES_REQUIRED ? 'see all notes' : 'keep searching'}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back button */}
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 20 }}
            onClick={() => navigate(`/fun/${sessionId}`)}
          >
            ← back to fun stuff
          </button>
        </motion.div>
      </div>
    )
  }

  // ==================== REVEAL PHASE ====================
  if (phase === PHASE.REVEAL) {
    const foundNotes = partnerNotes.filter(n => hits.includes(n.grid_position))

    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={45} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>💕</div>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
              love notes from your person
            </h1>
            <SquigglyUnderline width={140} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          </div>

          {/* Love letter cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {foundNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                className="glass"
                style={{
                  padding: '20px 18px',
                  textAlign: 'center',
                  transform: `rotate(${i === 0 ? -0.8 : i === 1 ? 0.5 : -0.3}deg)`,
                  position: 'relative',
                }}
              >
                <p style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.25rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}>
                  "{note.message}"
                </p>
                <DoodleHeart
                  size={10}
                  color="#E88D7A"
                  opacity={0.4}
                  style={{ position: 'absolute', top: -3, right: 8 }}
                />
              </motion.div>
            ))}
          </div>

          {/* Attribution */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ textAlign: 'center', marginTop: 20 }}
          >
            <div className="sticky-note" style={{ padding: 14, display: 'inline-block' }}>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                with love{partnerName ? `, ${partnerName}` : ''} 💕
              </p>
              <DoodleStar size={12} opacity={0.3} rotate={15} style={{ position: 'absolute', top: -4, right: -4 }} />
            </div>
          </motion.div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => navigate(`/fun/${sessionId}`)}
            >
              ← back to fun stuff
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handlePlayAgain}
            >
              play again →
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}
