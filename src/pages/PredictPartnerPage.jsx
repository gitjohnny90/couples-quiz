import { useState, useEffect, useContext, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import predictPartnerSeries, { allPredictPacks, getPredictPack, getSeriesForPack } from '../data/predictPartnerQuestions'
import PageDoodles, { SquigglyUnderline, DoodleStar } from '../components/Doodles'

const SCORE_LABELS = [
  'Start over. From the beginning. Of the relationship.',
  'Were you even guessing or just making stuff up?',
  'Time to start asking better questions.',
  "Not bad... but there's more to discover.",
  'Pretty solid. You pay attention.',
  'You two are locked in.',
  'Soulmate status. This is almost scary.',
]

const PLAYER_COLORS = { player1: '#E88D7A', player2: '#7EB8D8' }

export default function PredictPartnerPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId, playerName, playerId } = useContext(SessionContext)
  const partnerId = playerId === 'player1' ? 'player2' : 'player1'

  const [screen, setScreen] = useState('packs') // packs | question | waiting | reveal
  const [activePack, setActivePack] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [ownAnswer, setOwnAnswer] = useState('')
  const [prediction, setPrediction] = useState('')
  const [submittedAnswers, setSubmittedAnswers] = useState([]) // answers during current session
  const [allResponses, setAllResponses] = useState({}) // { packId: { player1: {...}, player2: {...} } }
  const [partnerName, setPartnerName] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
  }, [sessionId])

  // Fetch partner name
  useEffect(() => {
    if (!sessionId || !playerId) return
    const fetchPartner = async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('player1_name, player2_name')
        .eq('id', sessionId)
        .maybeSingle()
      if (session) {
        setPartnerName(playerId === 'player1' ? session.player2_name : session.player1_name)
      }
    }
    fetchPartner()
  }, [sessionId, playerId])

  // Fetch all predict responses
  const fetchResponses = async () => {
    const { data } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .like('pack_id', 'predict-pack-%')

    if (data) {
      const mapped = {}
      data.forEach(r => {
        if (!mapped[r.pack_id]) mapped[r.pack_id] = {}
        mapped[r.pack_id][r.player_id] = r.answers || {}
      })
      setAllResponses(mapped)
    }
    setLoading(false)
  }

  useEffect(() => { fetchResponses() }, [sessionId])

  // Realtime + polling
  useEffect(() => {
    const channel = supabase
      .channel(`predict-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responses',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new && payload.new.pack_id?.startsWith('predict-pack-')) {
          fetchResponses()
        }
      })
      .subscribe()
    const interval = setInterval(fetchResponses, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [sessionId])

  // Auto-transition from waiting to reveal when partner finishes
  useEffect(() => {
    if (screen === 'waiting' && activePack) {
      const packData = allResponses[activePack.id]
      if (packData?.[playerId]?.responses && packData?.[partnerId]?.responses) {
        setScreen('reveal')
      }
    }
  }, [allResponses, screen, activePack])

  // ── Pack Status Helpers ──

  const getPackStatus = (packId) => {
    const packData = allResponses[packId]
    if (!packData) return 'new'
    const myData = packData[playerId]
    const partnerData = packData[partnerId]
    const myDone = myData?.responses?.length === 3
    const partnerDone = partnerData?.responses?.length === 3
    if (myDone && partnerDone) return 'completed'
    if (myDone || partnerDone) return 'in-progress'
    if (myData?.responses?.length > 0 || partnerData?.responses?.length > 0) return 'in-progress'
    return 'new'
  }

  // ── Handlers ──

  const handleStartPack = (pack) => {
    setActivePack(pack)
    setSubmittedAnswers([])
    setQuestionIndex(0)
    setOwnAnswer('')
    setPrediction('')
    setError('')

    const packData = allResponses[pack.id]
    const myData = packData?.[playerId]
    const partnerData = packData?.[partnerId]
    const myDone = myData?.responses?.length === 3
    const partnerDone = partnerData?.responses?.length === 3

    if (myDone && partnerDone) {
      setScreen('reveal')
    } else if (myDone) {
      setScreen('waiting')
    } else {
      setScreen('question')
    }
  }

  const handleSubmitAnswer = async () => {
    if (!ownAnswer.trim() || !prediction.trim()) {
      setError('fill in both fields before submitting')
      return
    }
    setError('')
    const newAnswer = { ownAnswer: ownAnswer.trim(), prediction: prediction.trim() }
    const updated = [...submittedAnswers, newAnswer]
    setSubmittedAnswers(updated)

    if (questionIndex < 2) {
      // Next question
      setQuestionIndex(questionIndex + 1)
      setOwnAnswer('')
      setPrediction('')
    } else {
      // All 3 done — save to DB
      setSaving(true)
      const answersPayload = {
        responses: updated,
        partnerPredictionMarks: [null, null, null],
        completedAt: new Date().toISOString(),
      }
      const { error: saveError } = await supabase.from('responses').upsert(
        {
          session_id: sessionId,
          pack_id: activePack.id,
          player_id: playerId,
          player_name: playerName || playerId,
          answers: answersPayload,
        },
        { onConflict: 'session_id,pack_id,player_id' }
      )
      setSaving(false)

      if (saveError) {
        setError('failed to save — check your connection')
        return
      }

      await fetchResponses()

      // Check if partner already done
      const partnerData = allResponses[activePack.id]?.[partnerId]
      if (partnerData?.responses?.length === 3) {
        setScreen('reveal')
      } else {
        setScreen('waiting')
      }
    }
  }

  const handleMarkPrediction = async (qIdx, isCorrect) => {
    const packData = allResponses[activePack.id]
    const myData = packData?.[playerId]
    if (!myData) return

    const marks = [...(myData.partnerPredictionMarks || [null, null, null])]
    marks[qIdx] = isCorrect

    const updatedAnswers = { ...myData, partnerPredictionMarks: marks }
    await supabase.from('responses').upsert(
      {
        session_id: sessionId,
        pack_id: activePack.id,
        player_id: playerId,
        player_name: playerName || playerId,
        answers: updatedAnswers,
      },
      { onConflict: 'session_id,pack_id,player_id' }
    )
    fetchResponses()
  }

  const handleBackToPacks = () => {
    setScreen('packs')
    setActivePack(null)
    setSubmittedAnswers([])
    setQuestionIndex(0)
    setOwnAnswer('')
    setPrediction('')
    setError('')
  }

  // ── Loading ──

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            loading packs...
          </p>
        </motion.div>
      </div>
    )
  }

  // ── SCREEN: Pack Selection ──

  if (screen === 'packs') {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={21} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '2rem', marginBottom: 2 }}>🔮</div>
            <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.9rem', fontWeight: 700, marginBottom: 2 }}>
              Predict Your Partner
            </h1>
            <SquigglyUnderline width={120} color="var(--accent-mustard)" opacity={0.4} style={{ margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4, maxWidth: 320, margin: '0 auto' }}>
              answer for yourself, then guess what your person would say
            </p>
          </div>

          {predictPartnerSeries.map((series, si) => (
            <motion.div
              key={series.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06 }}
              style={{ marginBottom: 22 }}
            >
              {/* Series header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>{series.emoji}</span>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                    {series.title}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-light)', margin: 0, fontStyle: 'italic' }}>
                    {series.subtitle}
                  </p>
                </div>
              </div>

              {/* Pack cards */}
              {series.packs.map((pack, pi) => {
                const status = getPackStatus(pack.id)
                return (
                  <motion.div
                    key={pack.id}
                    className="glass"
                    style={{
                      padding: '14px 16px',
                      marginBottom: 8,
                      cursor: 'pointer',
                      borderLeft: `3px solid ${status === 'completed' ? 'var(--accent-sage)' : status === 'in-progress' ? 'var(--accent-mustard)' : 'var(--border-pencil)'}`,
                    }}
                    onClick={() => handleStartPack(pack)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                          {pack.title}
                        </h3>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-light)', margin: '2px 0 0', fontStyle: 'italic' }}>
                          {pack.vibe}
                        </p>
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: status === 'completed' ? 'var(--accent-sage)' : status === 'in-progress' ? 'var(--accent-mustard)' : 'var(--text-light)',
                      }}>
                        {status === 'completed' ? 'reveal →' : status === 'in-progress' ? 'continue →' : 'play →'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ))}

          <button
            onClick={() => navigate(`/vault/${sessionId}`)}
            style={{
              display: 'block',
              margin: '8px auto 0',
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'var(--border-pencil)',
              textUnderlineOffset: '3px',
            }}
          >
            ← back to quizzes
          </button>
        </motion.div>
      </div>
    )
  }

  // ── SCREEN: Question ──

  if (screen === 'question' && activePack) {
    const q = activePack.questions[questionIndex]
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={22} />
        <motion.div
          key={`q-${questionIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={handleBackToPacks}
              style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← packs
            </button>
            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {questionIndex + 1} of 3
            </span>
          </div>

          {/* Pack title */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center', marginBottom: 4, fontStyle: 'italic' }}>
            {activePack.title}
          </p>

          {/* Question */}
          <div className="glass" style={{ padding: '20px 18px', marginBottom: 20, transform: 'rotate(-0.3deg)' }}>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              textAlign: 'center',
              lineHeight: 1.3,
            }}>
              {q}
            </p>
          </div>

          {/* Your answer */}
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: PLAYER_COLORS[playerId],
              fontWeight: 600,
              marginBottom: 6,
            }}>
              your answer:
            </label>
            <input
              type="text"
              value={ownAnswer}
              onChange={(e) => setOwnAnswer(e.target.value.slice(0, 100))}
              placeholder="be honest..."
              maxLength={100}
              style={{
                width: '100%',
                fontFamily: 'var(--font-hand)',
                fontSize: '1.05rem',
                padding: '8px 0',
                border: 'none',
                borderBottom: `2px solid ${PLAYER_COLORS[playerId]}40`,
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 2 }}>
              {ownAnswer.length}/100
            </div>
          </div>

          {/* Prediction */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: PLAYER_COLORS[partnerId],
              fontWeight: 600,
              marginBottom: 6,
            }}>
              what would {partnerName || 'your partner'} say?
            </label>
            <input
              type="text"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value.slice(0, 100))}
              placeholder="your best guess..."
              maxLength={100}
              style={{
                width: '100%',
                fontFamily: 'var(--font-hand)',
                fontSize: '1.05rem',
                padding: '8px 0',
                border: 'none',
                borderBottom: `2px solid ${PLAYER_COLORS[partnerId]}40`,
                background: 'transparent',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-light)', marginTop: 2 }}>
              {prediction.length}/100
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary"
            onClick={handleSubmitAnswer}
            disabled={saving || !ownAnswer.trim() || !prediction.trim()}
            style={{ width: '100%' }}
          >
            {saving ? 'saving...' : questionIndex < 2 ? 'next →' : 'submit'}
          </button>

          {error && (
            <p style={{ color: 'var(--accent-coral)', fontSize: '0.85rem', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
              {error}
            </p>
          )}
        </motion.div>
      </div>
    )
  }

  // ── SCREEN: Waiting ──

  if (screen === 'waiting' && activePack) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={23} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', paddingTop: 40, position: 'relative', zIndex: 1 }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔮</div>
          <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
            all done!
          </h2>
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
            maxWidth: 280,
            margin: '0 auto 20px',
          }}>
            waiting for {partnerName || 'your partner'} to finish this pack...
          </p>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            style={{ fontSize: '1.5rem' }}
          >
            ⏳
          </motion.div>
          <button
            onClick={handleBackToPacks}
            style={{
              marginTop: 32,
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'var(--border-pencil)',
              textUnderlineOffset: '3px',
            }}
          >
            ← pick another pack
          </button>
        </motion.div>
      </div>
    )
  }

  // ── SCREEN: Reveal ──

  if (screen === 'reveal' && activePack) {
    const packData = allResponses[activePack.id]
    const myData = packData?.[playerId] || {}
    const partnerData = packData?.[partnerId] || {}
    const myResponses = myData.responses || []
    const partnerResponses = partnerData.responses || []
    const myMarks = myData.partnerPredictionMarks || [null, null, null]
    const partnerMarks = partnerData.partnerPredictionMarks || [null, null, null]

    // My score = how many of my predictions partner marked correct
    const myScore = partnerMarks.filter(m => m === true).length
    // Partner score = how many of their predictions I marked correct
    const partnerScore = myMarks.filter(m => m === true).length
    const totalScore = myScore + partnerScore
    const allMarked = myMarks.every(m => m !== null) && partnerMarks.every(m => m !== null)

    const myName = playerName || playerId
    const theirName = partnerName || partnerId

    const series = getSeriesForPack(activePack.id)

    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={24} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 2 }}>
              {series?.emoji} {activePack.title}
            </p>
            <h2 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              the reveal
            </h2>
            <SquigglyUnderline width={80} color="var(--accent-mustard)" opacity={0.4} style={{ margin: '4px auto 0' }} />
          </div>

          {/* Questions */}
          {activePack.questions.map((q, qi) => {
            const myAnswer = myResponses[qi]
            const partnerAnswer = partnerResponses[qi]
            if (!myAnswer || !partnerAnswer) return null

            return (
              <motion.div
                key={qi}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qi * 0.15 }}
                className="glass"
                style={{ padding: '16px 14px', marginBottom: 16 }}
              >
                {/* Question */}
                <p style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 14,
                  lineHeight: 1.3,
                  textAlign: 'center',
                }}>
                  {q}
                </p>

                {/* Player 1's section (current player displayed first) */}
                <RevealSection
                  answererName={myName}
                  answererColor={PLAYER_COLORS[playerId]}
                  actualAnswer={myAnswer.ownAnswer}
                  predictorName={theirName}
                  predictorColor={PLAYER_COLORS[partnerId]}
                  predictedAnswer={partnerAnswer.prediction}
                  markValue={myMarks[qi]}
                  canMark={true}
                  onMark={(val) => handleMarkPrediction(qi, val)}
                  label="did they get you right?"
                />

                <div style={{ borderTop: '1px dashed var(--rule-line)', margin: '12px 0' }} />

                {/* Player 2's section (partner) */}
                <RevealSection
                  answererName={theirName}
                  answererColor={PLAYER_COLORS[partnerId]}
                  actualAnswer={partnerAnswer.ownAnswer}
                  predictorName={myName}
                  predictorColor={PLAYER_COLORS[playerId]}
                  predictedAnswer={myAnswer.prediction}
                  markValue={partnerMarks[qi]}
                  canMark={false}
                  label={partnerMarks[qi] === null ? `waiting for ${theirName} to judge...` : partnerMarks[qi] ? 'nailed it!' : 'not quite'}
                />
              </motion.div>
            )
          })}

          {/* Score summary */}
          <AnimatePresence>
            {allMarked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="sticky-note"
                style={{ padding: '20px 16px', textAlign: 'center', marginBottom: 16 }}
              >
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                  score: {totalScore}/6
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: PLAYER_COLORS[playerId] }}>
                      {myScore}/3
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{myName}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: PLAYER_COLORS[partnerId] }}>
                      {partnerScore}/3
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{theirName}</div>
                  </div>
                </div>
                <p style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.05rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  fontStyle: 'italic',
                }}>
                  "{SCORE_LABELS[totalScore]}"
                </p>
                <div style={{ position: 'absolute', top: -6, right: 12 }}>
                  <DoodleStar size={16} opacity={0.3} rotate={10} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleBackToPacks}
            style={{
              display: 'block',
              margin: '8px auto 0',
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              color: 'var(--text-light)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'var(--border-pencil)',
              textUnderlineOffset: '3px',
            }}
          >
            ← back to packs
          </button>
        </motion.div>
      </div>
    )
  }

  return null
}


// ── RevealSection ──

function RevealSection({
  answererName,
  answererColor,
  actualAnswer,
  predictorName,
  predictorColor,
  predictedAnswer,
  markValue,
  canMark,
  onMark,
  label,
}) {
  return (
    <div>
      {/* Actual answer */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          color: answererColor,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {answererName}'s answer
        </span>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          margin: '2px 0 0',
          lineHeight: 1.3,
          padding: '4px 8px',
          background: `${answererColor}0A`,
          borderRadius: 6,
          border: `1px solid ${answererColor}20`,
        }}>
          {actualAnswer}
        </p>
      </div>

      {/* Prediction */}
      <div style={{ marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.72rem',
          color: predictorColor,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {predictorName} predicted
        </span>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          margin: '2px 0 0',
          lineHeight: 1.3,
          padding: '4px 8px',
          background: `${predictorColor}0A`,
          borderRadius: 6,
          border: `1px dashed ${predictorColor}30`,
        }}>
          {predictedAnswer}
        </p>
      </div>

      {/* Mark buttons or status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        {canMark ? (
          <>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
              {label}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button
                onClick={() => onMark(true)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${markValue === true ? 'var(--accent-sage)' : 'var(--border-pencil)'}`,
                  background: markValue === true ? 'var(--accent-sage)' : 'transparent',
                  color: markValue === true ? 'white' : 'var(--accent-sage)',
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                ✓
              </button>
              <button
                onClick={() => onMark(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${markValue === false ? 'var(--accent-coral)' : 'var(--border-pencil)'}`,
                  background: markValue === false ? 'var(--accent-coral)' : 'transparent',
                  color: markValue === false ? 'white' : 'var(--accent-coral)',
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                ✗
              </button>
            </div>
          </>
        ) : (
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            fontStyle: 'italic',
            color: markValue === null ? 'var(--text-light)' : markValue ? 'var(--accent-sage)' : 'var(--accent-coral)',
          }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
