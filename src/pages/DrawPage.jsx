import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import drawingPrompts, { drawingRoundMeta, getDrawPackId } from '../data/drawingPrompts'
import DrawingCanvas from '../components/DrawingCanvas'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleSpiral, DoodleStar, SquigglyUnderline } from '../components/Doodles'

export default function DrawPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName, playerId } = useContext(SessionContext)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [donePromptIds, setDonePromptIds] = useState(new Set())
  const [strokeCount, setStrokeCount] = useState(0)
  const [drawingData, setDrawingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const prompt = drawingPrompts[currentIndex]
  const isDone = donePromptIds.has(prompt.id)
  const doneCount = donePromptIds.size

  // Fetch which prompts this player has already completed
  useEffect(() => {
    const fetchDonePrompts = async () => {
      const allPackIds = drawingPrompts.map(p => getDrawPackId(p.id))
      const { data } = await supabase
        .from('responses')
        .select('pack_id')
        .eq('session_id', sessionId)
        .eq('player_id', playerId)
        .in('pack_id', allPackIds)

      if (data) {
        const doneIds = new Set(data.map(r => r.pack_id.replace('draw-', '')))
        setDonePromptIds(doneIds)

        // Start at first unanswered prompt
        const firstUnanswered = drawingPrompts.findIndex(p => !doneIds.has(p.id))
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered)
        }
      }
      setLoading(false)
    }
    fetchDonePrompts()
  }, [sessionId])

  // Reset drawing state when switching prompts
  useEffect(() => {
    setStrokeCount(0)
    setDrawingData(null)
  }, [currentIndex])

  const handleDrawingChange = (dataUrl, strokes) => {
    setDrawingData(dataUrl)
    setStrokeCount(strokes)
  }

  const handleSubmit = async () => {
    if (!drawingData || strokeCount === 0 || submitting) return
    setSubmitting(true)

    try {
      const { error } = await supabase.from('responses').upsert(
        {
          session_id: sessionId,
          pack_id: getDrawPackId(prompt.id),
          player_id: playerId,
          player_name: playerName,
          answers: {
            promptId: prompt.id,
            promptText: prompt.text,
            drawing: drawingData,
          },
        },
        { onConflict: 'session_id,pack_id,player_id' }
      )
      if (error) throw error

      // Mark as done locally
      setDonePromptIds(prev => new Set([...prev, prompt.id]))
      navigate(`/draw-results/${sessionId}/${prompt.id}`)
    } catch (err) {
      console.error('could not save drawing:', err)
      setSubmitting(false)
    }
  }

  const goToPrompt = (direction) => {
    setCurrentIndex(i => (i + direction + drawingPrompts.length) % drawingPrompts.length)
  }

  const shufflePrompt = () => {
    const unanswered = drawingPrompts
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => !donePromptIds.has(p.id))
    if (unanswered.length > 0) {
      const pick = unanswered[Math.floor(Math.random() * unanswered.length)]
      setCurrentIndex(pick.idx)
    } else {
      setCurrentIndex(Math.floor(Math.random() * drawingPrompts.length))
    }
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            getting your canvas ready...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={7} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{drawingRoundMeta.emoji}</div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            {drawingRoundMeta.title}
          </h1>
          <SquigglyUnderline width={100} color="#6B8DAD" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4, maxWidth: 300, margin: '0 auto' }}>
            you both get the same prompt — draw it and reveal together
          </p>
          {doneCount > 0 && (
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-blue)', marginTop: 6 }}>
              {doneCount} / {drawingPrompts.length} prompts drawn
            </p>
          )}
        </div>

        {/* Prompt card with navigation */}
        <div className="glass" style={{ padding: 20, marginBottom: 16, textAlign: 'center', position: 'relative', transform: 'rotate(-0.5deg)' }}>
          {/* Nav row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <button
              onClick={() => goToPrompt(-1)}
              style={{
                background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer',
                padding: '4px 10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-hand)',
              }}
            >
              ←
            </button>

            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
              {currentIndex + 1} / {drawingPrompts.length}
            </span>

            <button
              onClick={() => goToPrompt(1)}
              style={{
                background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer',
                padding: '4px 10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-hand)',
              }}
            >
              →
            </button>
          </div>

          {/* Prompt text */}
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            "{prompt.text}"
          </p>

          {/* Done badge */}
          {isDone && (
            <span style={{
              display: 'inline-block', marginTop: 8,
              fontFamily: 'var(--font-hand)', fontSize: '0.85rem', fontWeight: 600,
              color: 'var(--accent-sage)', background: '#EDF5ED',
              padding: '3px 10px', borderRadius: 3,
            }}>
              ✓ done
            </span>
          )}

          {/* Shuffle button */}
          <div style={{ marginTop: 10 }}>
            <button
              onClick={shufflePrompt}
              style={{
                background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer',
                padding: '4px 8px',
              }}
              title="random prompt"
            >
              🎲
            </button>
          </div>

          <div style={{ position: 'absolute', top: -4, right: 12 }}>
            <DoodleStar size={14} opacity={0.3} rotate={12} />
          </div>
        </div>

        {/* Canvas or done state */}
        {isDone ? (
          <motion.div
            key={`done-${prompt.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ padding: 28, textAlign: 'center' }}
          >
            <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>✓</p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              you already drew this one!
            </p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => navigate(`/draw-results/${sessionId}/${prompt.id}`)}
            >
              view results →
            </button>
          </motion.div>
        ) : (
          <motion.div key={`canvas-${prompt.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <DrawingCanvas
              key={prompt.id}
              onDrawingChange={handleDrawingChange}
              disabled={submitting}
            />

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1.15rem', padding: '14px 28px' }}
                onClick={handleSubmit}
                disabled={strokeCount === 0 || submitting}
              >
                {submitting ? 'saving...' : "done! ✏️"}
              </button>
              {strokeCount === 0 && (
                <p style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '0.95rem',
                  color: 'var(--text-light)',
                  marginTop: 8,
                  fontStyle: 'italic'
                }}>
                  draw something first ~
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Back */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => navigate(`/fun/${sessionId}`)}
        >
          ← back to fun stuff
        </button>

        <div style={{ position: 'absolute', bottom: 120, right: -8 }}>
          <DoodleSpiral size={20} opacity={0.2} rotate={-15} />
        </div>
      </motion.div>
    </div>
  )
}
