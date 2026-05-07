import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useSessionSetup from '../hooks/useSessionSetup'
import useRealtimeSync from '../hooks/useRealtimeSync'
import { supabase } from '../lib/supabase'
import PhotoCaptureInput from '../components/PhotoCaptureInput'
import photoSections from '../data/photoSections'
import { isSectionCompleteForPlayer } from '../utils/photoGating'
import PageDoodles from '../components/Doodles'
import PageGuide from '../components/PageGuide'

const PACK_ID = 'daily-photo-section'
const SHARED_PACK_ID = 'daily-photo-challenge'

export default function DailyPhotoSectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const { sessionId, playerId, partnerId, partnerName, mountedRef } = useSessionSetup()

  const section = photoSections.find(s => s.id === sectionId)

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [screen, setScreen] = useState('loading') // 'loading' | 'prompting' | 'waiting'
  const [submittedPhotos, setSubmittedPhotos] = useState([]) // photos saved this session, used to show "previously submitted" preview when going back

  // On mount, fetch existing player row and resume at correct prompt index
  useEffect(() => {
    if (!sessionId || !playerId || !sectionId) return
    const load = async () => {
      const { data } = await supabase
        .from('responses')
        .select('answers')
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', playerId)
        .maybeSingle()
      if (!mountedRef.current) return
      const answers = data?.answers
      // answers shape: { [sectionId]: { photos: [...], completedAt? }, ... }
      const sectionData = answers?.[sectionId]
      if (sectionData && Array.isArray(sectionData.photos)) {
        setSubmittedPhotos(sectionData.photos)
        if (sectionData.completedAt) {
          // Player already completed this section — go to waiting
          setScreen('waiting')
          return
        }
        // Find first prompt not yet submitted
        const firstMissing = [0, 1, 2].find(i =>
          !sectionData.photos.find(p => p.promptIndex === i && p.path)
        )
        if (firstMissing === undefined) {
          // All 3 present but no completedAt — treat as waiting
          setScreen('waiting')
        } else {
          setCurrentPromptIndex(firstMissing)
          setScreen('prompting')
        }
      } else {
        setSubmittedPhotos([])
        setCurrentPromptIndex(0)
        setScreen('prompting')
      }
    }
    load()
  }, [sessionId, playerId, sectionId])

  // Fresh-fetch player row, merge the new photo, upsert back
  async function savePromptAnswer(path, caption, promptIndex) {
    const { data: current } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', playerId)
      .maybeSingle()

    const existing = current?.answers ?? {}
    const existingSection = existing?.[sectionId]
    let photos = []
    if (existingSection && Array.isArray(existingSection.photos)) {
      // Keep all existing entries except the one we're replacing
      photos = existingSection.photos.filter(p => p.promptIndex !== promptIndex)
    }
    photos.push({ promptIndex, path, caption })

    const isLastPrompt = promptIndex === 2
    const updatedSection = {
      photos,
      ...(isLastPrompt ? { completedAt: new Date().toISOString() } : existingSection?.completedAt ? { completedAt: existingSection.completedAt } : {}),
    }
    // Preserve all other sections — only update this sectionId key
    const updatedAnswers = {
      ...existing,
      [sectionId]: updatedSection,
    }

    await supabase
      .from('responses')
      .upsert({
        session_id: sessionId,
        pack_id: PACK_ID,
        player_id: playerId,
        answers: updatedAnswers,
      }, { onConflict: 'session_id,pack_id,player_id' })
  }

  // Update shared gate state when current player completes
  async function markSectionCompleteInSharedState() {
    const { data: fresh } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', SHARED_PACK_ID)
      .eq('player_id', 'shared')
      .maybeSingle()

    const DEFAULT_STATE = { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }
    const currentState = fresh?.answers ?? DEFAULT_STATE
    const now = new Date().toISOString()
    const newState = {
      ...currentState,
      inProgressSectionId: null,
      completedSections: {
        ...(currentState.completedSections ?? {}),
        [sectionId]: now,
      },
      lastCompletedAt: now,
    }

    await supabase
      .from('responses')
      .upsert({
        session_id: sessionId,
        pack_id: SHARED_PACK_ID,
        player_id: 'shared',
        answers: newState,
      }, { onConflict: 'session_id,pack_id,player_id' })
  }

  // Build isSectionCompleteForPlayer-compatible shape from photos array
  function buildPlayerAnswersShape(photos) {
    if (!Array.isArray(photos) || photos.length < 3) return null
    // Convert from { promptIndex, path, caption }[] to { [sectionId]: [entry0, entry1, entry2] }
    const arr = [null, null, null]
    photos.forEach(p => {
      if (p.promptIndex >= 0 && p.promptIndex <= 2) arr[p.promptIndex] = { path: p.path, caption: p.caption }
    })
    return { [sectionId]: arr }
  }

  // Check if both players have completed this section
  const checkBothComplete = useCallback(async () => {
    if (!sessionId || !sectionId || !playerId || !partnerId) return
    const [{ data: myRow }, { data: partnerRow }] = await Promise.all([
      supabase
        .from('responses')
        .select('answers')
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', playerId)
        .maybeSingle(),
      supabase
        .from('responses')
        .select('answers')
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', partnerId)
        .maybeSingle(),
    ])
    if (!mountedRef.current) return

    const mySection = myRow?.answers?.[sectionId]
    const partnerSection = partnerRow?.answers?.[sectionId]

    // Check completedAt (more reliable) or fall back to photos array
    const myDone = !!mySection?.completedAt
    const partnerDone = !!partnerSection?.completedAt

    // Also support the isSectionCompleteForPlayer shape for flexibility
    const myDoneFallback = isSectionCompleteForPlayer(buildPlayerAnswersShape(mySection?.photos), sectionId)
    const partnerDoneFallback = isSectionCompleteForPlayer(buildPlayerAnswersShape(partnerSection?.photos), sectionId)

    if ((myDone || myDoneFallback) && (partnerDone || partnerDoneFallback)) {
      await markSectionCompleteInSharedState()
      if (mountedRef.current) {
        navigate(`/daily-photo-reveal/${sessionId}/${sectionId}`)
      }
    }
  }, [sessionId, sectionId, playerId, partnerId])

  useRealtimeSync({
    table: 'responses',
    sessionId,
    onUpdate: checkBothComplete,
    channelPrefix: 'daily-photo-section',
    pollingEnabled: screen === 'waiting',
    pollingInterval: 5000,
  })

  async function handlePhotoSubmit(path, caption) {
    await savePromptAnswer(path, caption, currentPromptIndex)
    setSubmittedPhotos(prev => {
      const next = prev.filter(p => p.promptIndex !== currentPromptIndex)
      next.push({ promptIndex: currentPromptIndex, path, caption })
      return next
    })
    if (currentPromptIndex < 2) {
      setCurrentPromptIndex(prev => prev + 1)
    } else {
      // Last prompt submitted — move to waiting and check partner
      setScreen('waiting')
      checkBothComplete()
    }
  }

  function handleBackPrompt() {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <div className="page">
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          paddingTop: 64,
        }}>
          loading...
        </p>
      </div>
    )
  }

  // ── Section not found ────────────────────────────────────────────────────

  if (!section) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          color: 'var(--accent-coral)',
          marginBottom: 16,
        }}>
          Couldn&rsquo;t find that section. Tap to go back.
        </p>
        <span
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/daily-photos/${sessionId}`)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/daily-photos/${sessionId}`) }}
          style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--accent-coral)', cursor: 'pointer' }}
        >
          &larr; back to sections
        </span>
      </div>
    )
  }

  // ── Shared header + progress pieces ─────────────────────────────────────

  const completedCount = screen === 'waiting' ? 3 : currentPromptIndex
  const progressWidth = `${(completedCount / 3) * 100}%`

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: 28, marginRight: 10 }}>{section.emoji}</span>
      <div>
        <p style={{
          fontFamily: 'Caveat, cursive',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.2,
        }}>
          {section.title}
        </p>
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          margin: 0,
        }}>
          Prompt {screen === 'waiting' ? 3 : currentPromptIndex + 1} of 3
        </p>
      </div>
    </div>
  )

  const stepIndicator = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8 }}>
      {[0, 1, 2].map(i => {
        const isDone = screen === 'waiting' || i < currentPromptIndex
        const isActive = screen !== 'waiting' && i === currentPromptIndex
        return (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isDone || isActive ? 'var(--accent-coral)' : 'var(--border-pencil)',
              opacity: isDone || isActive ? 1 : 0.6,
              boxShadow: isActive
                ? '0 0 0 2px var(--bg-paper), 0 0 0 4px var(--accent-coral)'
                : 'none',
            }}
          />
        )
      })}
    </div>
  )

  const progressBar = (
    <div className="progress-bar-track" style={{ marginBottom: 24 }}>
      <div className="progress-bar-fill" style={{ width: progressWidth }} />
    </div>
  )

  // ── Waiting screen ───────────────────────────────────────────────────────

  if (screen === 'waiting') {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageGuide pageKey="dailyPhotoSection" />
        <PageDoodles seed={12} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          {header}
          {stepIndicator}
          {progressBar}

          <div
            className="glass"
            role="status"
            style={{ padding: 24, textAlign: 'center', marginTop: 16 }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{section.emoji}</div>
            <p style={{
              fontFamily: 'Caveat, cursive',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 8px',
            }}>
              Waiting for {partnerName || 'your partner'}...
            </p>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: 280,
              margin: '8px auto 16px',
            }}>
              They&rsquo;re still working on their photos. Come back when you&rsquo;re both done!
            </p>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={checkBothComplete}
            >
              check back
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Prompting screen ─────────────────────────────────────────────────────

  const existingPhotoForCurrent = submittedPhotos.find(p => p.promptIndex === currentPromptIndex)

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageGuide pageKey="dailyPhotoSection" />
      <PageDoodles seed={12} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {header}
        {stepIndicator}
        {progressBar}

        {existingPhotoForCurrent && (
          <p style={{
            fontFamily: 'var(--font-hand)', fontSize: '0.9rem',
            color: 'var(--accent-coral)', textAlign: 'center',
            marginBottom: 12, fontStyle: 'italic',
          }}>
            you already saved a photo here — adding a new one will replace it
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPromptIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PhotoCaptureInput
              prompt={section.prompts[currentPromptIndex].text}
              onPhotoSubmit={handlePhotoSubmit}
              sessionId={sessionId}
              playerId={playerId}
              sectionId={sectionId}
              promptIndex={currentPromptIndex}
            />
          </motion.div>
        </AnimatePresence>

        {currentPromptIndex > 0 && (
          <button
            onClick={handleBackPrompt}
            type="button"
            className="btn btn-secondary"
            style={{
              width: '100%', marginTop: 12,
              fontFamily: 'var(--font-hand)', fontSize: '1rem',
            }}
          >
            ← back to previous prompt
          </button>
        )}
      </motion.div>
    </div>
  )
}
