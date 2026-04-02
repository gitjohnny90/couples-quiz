import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSessionSetup from '../hooks/useSessionSetup'
import useRealtimeSync from '../hooks/useRealtimeSync'
import { supabase } from '../lib/supabase'
import photoSections from '../data/photoSections'
import { getSectionStatus, isGloballyFrozen } from '../utils/photoGating'
import PageDoodles, { DoodleStar, DoodleHeart, SquigglyUnderline } from '../components/Doodles'
import PageGuide from '../components/PageGuide'

const STATUS_CONFIG = {
  'completed':          { stripe: 'var(--accent-sage)',   bg: 'rgba(124, 174, 122, 0.06)', titleColor: 'var(--text-primary)', emojiOpacity: 1, clickable: true },
  'in-progress':        { stripe: 'var(--accent-coral)',  bg: 'rgba(232, 141, 122, 0.06)', titleColor: 'var(--text-primary)', emojiOpacity: 1, clickable: true },
  'available':          { stripe: 'var(--accent-coral)',  bg: 'var(--bg-card)',             titleColor: 'var(--text-primary)', emojiOpacity: 1, clickable: true },
  'locked-frozen':      { stripe: 'var(--border-pencil)', bg: 'rgba(168, 152, 136, 0.06)', titleColor: 'var(--text-light)',   emojiOpacity: 0.4, clickable: false },
  'locked-in-progress': { stripe: 'var(--border-pencil)', bg: 'rgba(168, 152, 136, 0.06)', titleColor: 'var(--text-light)',   emojiOpacity: 0.4, clickable: false },
}

function getCardRotation(status, index) {
  if (status === 'locked-frozen' || status === 'locked-in-progress') return 'none'
  if (status === 'completed') return 'rotate(0.15deg)'
  return index % 2 === 0 ? 'rotate(0.25deg)' : 'rotate(-0.3deg)'
}

export default function DailyPhotosHubPage() {
  const { sessionId, mountedRef } = useSessionSetup()
  const navigate = useNavigate()

  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  const DEFAULT_STATE = { completedSections: {}, inProgressSectionId: null, lastCompletedAt: null }

  const fetchState = useCallback(async () => {
    if (!sessionId) return
    const { data, error: fetchErr } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', 'shared')
      .maybeSingle()
    if (!mountedRef.current) return
    if (fetchErr) { setError('Could not load photo challenge data'); setState(DEFAULT_STATE); return }
    setState(data?.answers ?? DEFAULT_STATE)
  }, [sessionId])

  useRealtimeSync({
    table: 'responses',
    sessionId,
    onUpdate: fetchState,
    channelPrefix: 'daily-photos-hub',
  })

  useEffect(() => {
    fetchState()
  }, [fetchState])

  // Auto-dismiss error after 3 seconds
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(t)
  }, [error])

  async function handlePickSection(sectionId) {
    // Fresh fetch before write to avoid race conditions
    const { data: fresh } = await supabase
      .from('responses')
      .select('answers')
      .eq('session_id', sessionId)
      .eq('pack_id', 'daily-photo-challenge')
      .eq('player_id', 'shared')
      .maybeSingle()
    const currentState = fresh?.answers ?? DEFAULT_STATE

    // Guard: don't overwrite if frozen or already in progress
    if (isGloballyFrozen(currentState)) return
    if (currentState.inProgressSectionId) return

    // Write new state
    const newState = { ...currentState, inProgressSectionId: sectionId }
    await supabase
      .from('responses')
      .upsert({
        session_id: sessionId,
        pack_id: 'daily-photo-challenge',
        player_id: 'shared',
        answers: newState,
      }, { onConflict: 'session_id,pack_id,player_id' })

    // Navigate to prompt flow (Phase 12 route — will 404 for now)
    navigate(`/daily-photo-section/${sessionId}/${sectionId}`)
  }

  if (state === null) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: 64 }}>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          loading your photo challenge...
        </p>
      </div>
    )
  }

  const frozen = isGloballyFrozen(state)
  const completedCount = Object.keys(state.completedSections ?? {}).length

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageGuide pageKey="dailyPhotos" />
      <PageDoodles seed={11} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header block */}
        <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <DoodleStar
              size={16}
              opacity={0.3}
              rotate={-12}
              style={{ position: 'absolute', left: -16, top: -6, pointerEvents: 'none' }}
            />
            <DoodleHeart
              size={14}
              opacity={0.3}
              rotate={10}
              style={{ position: 'absolute', right: -14, top: -4, pointerEvents: 'none' }}
            />
            <h1 style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 4,
            }}>
              daily photos
            </h1>
          </div>
          <SquigglyUnderline width={120} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            maxWidth: 340,
            margin: '0 auto',
          }}>
            take 3 photos together — a new theme every time
          </p>
        </div>

        {/* Error message */}
        {error && (
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1rem',
            color: 'var(--accent-coral)',
            textAlign: 'center',
            marginBottom: 12,
          }}>
            {error}
          </p>
        )}

        {/* Gate banner — only when frozen */}
        {frozen && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(212, 168, 67, 0.12)',
              border: '1.5px solid rgba(212, 168, 67, 0.3)',
              borderRadius: 4,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--accent-mustard)',
              margin: 0,
            }}>
              ⏰ Come back tomorrow!
            </p>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginTop: 4,
              marginBottom: 0,
            }}>
              You finished a section today. New sections unlock at 6am.
            </p>
          </motion.div>
        )}

        {/* Completion summary */}
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          marginBottom: 16,
        }}>
          {completedCount > 0 ? (
            <>
              <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', fontWeight: 600, color: 'var(--accent-sage)' }}>
                {completedCount}
              </span>
              {' of 15 sections complete'}
            </>
          ) : (
            '0 of 15 sections complete'
          )}
        </p>

        {/* Section card list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {photoSections.map((section, index) => {
            const status = getSectionStatus(section.id, state)
            const config = STATUS_CONFIG[status]
            const isLocked = status === 'locked-frozen' || status === 'locked-in-progress'
            const isHovered = hoveredId === section.id && !isLocked

            let ariaLabel = section.title
            if (status === 'in-progress') ariaLabel = `${section.title} — in progress`
            if (isLocked) ariaLabel = `${section.title} — locked`

            const cardStyle = {
              position: 'relative',
              padding: '16px 16px 16px 20px',
              background: isHovered ? 'var(--bg-card-hover)' : config.bg,
              cursor: config.clickable ? 'pointer' : 'default',
              transform: isHovered ? 'rotate(-0.3deg)' : getCardRotation(status, index),
              transition: 'background 0.15s, transform 0.15s',
            }

            const handleClick = () => {
              if (!config.clickable) return
              if (status === 'available') handlePickSection(section.id)
              else if (status === 'in-progress') navigate(`/daily-photo-section/${sessionId}/${section.id}`)
              else if (status === 'completed') navigate(`/daily-photo-reveal/${sessionId}/${section.id}`)
            }

            const handleKeyDown = (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
            }

            const interactiveProps = config.clickable
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: handleClick,
                  onKeyDown: handleKeyDown,
                  onMouseEnter: () => setHoveredId(section.id),
                  onMouseLeave: () => setHoveredId(null),
                  'aria-label': ariaLabel,
                }
              : {
                  'aria-disabled': 'true',
                  'aria-label': ariaLabel,
                }

            return (
              <motion.div
                key={section.id}
                className="glass"
                style={cardStyle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                {...interactiveProps}
              >
                {/* Left accent stripe */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  borderRadius: '3px 0 0 3px',
                  background: config.stripe,
                }} />

                {/* Card content row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Emoji */}
                  <div style={{ fontSize: 24, flexShrink: 0, opacity: config.emojiOpacity }}>
                    {section.emoji}
                  </div>

                  {/* Title + description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: config.titleColor,
                      margin: 0,
                      marginBottom: 2,
                    }}>
                      {section.title}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '0.875rem',
                      color: isLocked ? 'var(--text-light)' : 'var(--text-secondary)',
                      lineHeight: 1.4,
                      margin: 0,
                    }}>
                      {section.description}
                    </p>
                    {status === 'locked-frozen' && (
                      <p style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                        fontStyle: 'italic',
                        margin: 0,
                        marginTop: 2,
                      }}>
                        unlocks at 6am
                      </p>
                    )}
                  </div>

                  {/* Right badge */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {status === 'completed' && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(124, 174, 122, 0.18)',
                        color: 'var(--accent-sage)',
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.875rem',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}>
                        ✓ done
                      </span>
                    )}
                    {status === 'in-progress' && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(232, 141, 122, 0.15)',
                        color: 'var(--accent-coral)',
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.875rem',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}>
                        In Progress
                      </span>
                    )}
                    {(status === 'locked-frozen' || status === 'locked-in-progress') && (
                      <span style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                      }}>
                        🔒 locked
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
