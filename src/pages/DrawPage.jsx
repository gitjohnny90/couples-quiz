import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import drawingPrompts, { drawingRoundMeta } from '../data/drawingPrompts'
import DrawingCanvas from '../components/DrawingCanvas'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleSpiral, DoodleStar, SquigglyUnderline } from '../components/Doodles'

export default function DrawPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)

  const [strokeCount, setStrokeCount] = useState(0)
  const [drawingData, setDrawingData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)

  // Pick a deterministic prompt based on sessionId so both players get the same one
  const promptIndex = sessionId
    ? [...sessionId].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % drawingPrompts.length
    : 0
  const prompt = drawingPrompts[promptIndex]

  // Check if player already submitted a drawing for this session
  useEffect(() => {
    const checkExisting = async () => {
      const playerId = localStorage.getItem('playerId')
      const { data } = await supabase
        .from('responses')
        .select('id')
        .eq('session_id', sessionId)
        .eq('pack_id', drawingRoundMeta.id)
        .eq('player_id', playerId)
        .maybeSingle()

      if (data) {
        // Already submitted — go to results
        navigate(`/draw-results/${sessionId}`, { replace: true })
      } else {
        setChecking(false)
      }
    }
    checkExisting()
  }, [sessionId, navigate])

  const handleDrawingChange = (dataUrl, strokes) => {
    setDrawingData(dataUrl)
    setStrokeCount(strokes)
  }

  const handleSubmit = async () => {
    if (!drawingData || strokeCount === 0 || submitting) return
    setSubmitting(true)

    try {
      const playerId = localStorage.getItem('playerId')
      const { error } = await supabase.from('responses').upsert(
        {
          session_id: sessionId,
          pack_id: drawingRoundMeta.id,
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
      navigate(`/draw-results/${sessionId}`)
    } catch (err) {
      console.error('could not save drawing:', err)
      setSubmitting(false)
    }
  }

  if (checking) {
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
          <SquigglyUnderline width={100} color="#6B8DAD" opacity={0.4} style={{ margin: '0 auto 4px' }} />
        </div>

        {/* Prompt card */}
        <div className="glass" style={{ padding: 20, marginBottom: 16, textAlign: 'center', transform: 'rotate(-0.5deg)' }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.35rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
            "{prompt.text}"
          </p>
          <div style={{ position: 'absolute', top: -4, right: 12 }}>
            <DoodleStar size={14} opacity={0.3} rotate={12} />
          </div>
        </div>

        {/* Canvas */}
        <DrawingCanvas
          onDrawingChange={handleDrawingChange}
          disabled={submitting}
        />

        {/* Submit button */}
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

        <div style={{ position: 'absolute', bottom: 120, right: -8 }}>
          <DoodleSpiral size={20} opacity={0.2} rotate={-15} />
        </div>
      </motion.div>
    </div>
  )
}
