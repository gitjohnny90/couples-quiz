import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useSessionSetup from '../hooks/useSessionSetup'
import { supabase } from '../lib/supabase'
import photoSections from '../data/photoSections'
import { getPhotoUrl } from '../utils/photoUtils'
import { isSectionCompleteForPlayer } from '../utils/photoGating'
import PageDoodles, { DoodleStar, DoodleHeart, SquigglyUnderline } from '../components/Doodles'
import PageGuide from '../components/PageGuide'

const PIN_COLORS = ['#E55', '#E8B84C']
const PLAYER_COLORS = { player1: '#E88D7A', player2: '#6B8DAD' }
const SLOT_CONFIG = [
  { rotate: -4, marginTop: 12 }, // player1
  { rotate: 3, marginTop: 4 },   // player2
]
const CORK_STYLE = {
  background: '#C4956A',
  backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)',
  borderRadius: 4,
  padding: '14px 10px',
  border: '3px solid #A07A52',
  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)',
  minHeight: 180,
}
const POLAROID_STYLE = {
  background: '#fff',
  padding: '6px 6px 22px',
  boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
  borderRadius: 1,
  position: 'relative',
}

export default function DailyPhotoRevealPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const { sessionId, playerId, sessionMyName, partnerName, mountedRef } = useSessionSetup()

  const section = photoSections.find(s => s.id === sectionId) ?? null

  const [boards, setBoards] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Derive display names by player role
  const player1Name = playerId === 'player1' ? sessionMyName : partnerName
  const player2Name = playerId === 'player1' ? partnerName : sessionMyName

  useEffect(() => {
    if (!sessionId || !sectionId || !section) return

    const loadBoards = async () => {
      setLoading(true)
      setError(null)

      // Fetch both player rows in parallel
      const [p1Result, p2Result] = await Promise.all([
        supabase
          .from('responses')
          .select('answers')
          .eq('session_id', sessionId)
          .eq('pack_id', 'daily-photo-section')
          .eq('player_id', 'player1')
          .maybeSingle(),
        supabase
          .from('responses')
          .select('answers')
          .eq('session_id', sessionId)
          .eq('pack_id', 'daily-photo-section')
          .eq('player_id', 'player2')
          .maybeSingle(),
      ])

      if (!mountedRef.current) return

      const p1Answers = p1Result.data?.answers ?? null
      const p2Answers = p2Result.data?.answers ?? null

      // Build per-player photo arrays using buildPlayerAnswersShape bridge
      // UI-SPEC stores answers as: { sectionId, photos: [{promptIndex, path, caption}], completedAt }
      // isSectionCompleteForPlayer expects: { [sectionId]: [{path, caption}, ...] }
      const buildBridgeShape = (answers) => {
        if (!answers?.photos) return null
        const byIndex = [null, null, null]
        for (const photo of answers.photos) {
          if (photo.promptIndex >= 0 && photo.promptIndex <= 2) {
            byIndex[photo.promptIndex] = { path: photo.path, caption: photo.caption ?? '' }
          }
        }
        return { [sectionId]: byIndex }
      }

      const p1Bridge = buildBridgeShape(p1Answers)
      const p2Bridge = buildBridgeShape(p2Answers)

      const p1Complete = isSectionCompleteForPlayer(p1Bridge, sectionId)
      const p2Complete = isSectionCompleteForPlayer(p2Bridge, sectionId)

      if (!p1Complete || !p2Complete) {
        if (mountedRef.current) {
          setError("Photos aren't ready yet. Check back when you're both done.")
          setLoading(false)
        }
        return
      }

      // Extract photos arrays (guaranteed length >= 3 by isSectionCompleteForPlayer)
      const p1Photos = p1Bridge[sectionId]
      const p2Photos = p2Bridge[sectionId]

      // Fetch all 6 signed URLs in parallel
      const urlResults = await Promise.all([
        getPhotoUrl(supabase, p1Photos[0].path),
        getPhotoUrl(supabase, p2Photos[0].path),
        getPhotoUrl(supabase, p1Photos[1].path),
        getPhotoUrl(supabase, p2Photos[1].path),
        getPhotoUrl(supabase, p1Photos[2].path),
        getPhotoUrl(supabase, p2Photos[2].path),
      ])

      if (!mountedRef.current) return

      // urlResults[i * 2] = player1 for prompt i, urlResults[i * 2 + 1] = player2 for prompt i
      const signedUrls = urlResults.map(r => r.data?.signedUrl ?? null)

      const builtBoards = [0, 1, 2].map(i => ({
        promptText: section.prompts[i].text,
        player1: {
          url: signedUrls[i * 2] ?? null,
          caption: p1Photos[i]?.caption ?? '',
        },
        player2: {
          url: signedUrls[i * 2 + 1] ?? null,
          caption: p2Photos[i]?.caption ?? '',
        },
      }))

      setBoards(builtBoards)
      setLoading(false)
    }

    loadBoards()
  }, [sessionId, sectionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleBack = () => navigate('/daily-photos/' + sessionId)
  const handleBackKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleBack()
    }
  }

  // Section not found
  if (!section) {
    return (
      <div className="page">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--accent-coral)',
          textAlign: 'center',
          paddingTop: 48,
        }}>
          Couldn't find that section.{' '}
          <span
            role="button"
            tabIndex={0}
            style={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
          >
            Tap to go back.
          </span>
        </p>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="page">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          paddingTop: 64,
        }}>
          loading your photos...
        </p>
      </div>
    )
  }

  // Error state
  if (error || !boards) {
    return (
      <div className="page">
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          color: 'var(--accent-coral)',
          textAlign: 'center',
          paddingTop: 48,
        }}>
          {error || "Photos aren't ready yet. Check back when you're both done."}
        </p>
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <span
            role="button"
            tabIndex={0}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--accent-coral)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
          >
            back to sections
          </span>
        </p>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageGuide pageKey="dailyPhotoReveal" />
      <PageDoodles seed={12} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
          <DoodleStar
            size={16}
            opacity={0.3}
            rotate={-12}
            style={{ position: 'absolute', left: -16, top: -6 }}
          />
          <DoodleHeart
            size={14}
            opacity={0.3}
            rotate={10}
            style={{ position: 'absolute', right: -14, top: -4 }}
          />
          <h1 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            your photos
          </h1>
          <SquigglyUnderline width={100} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 6px' }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 8,
          }}>
            <span style={{ fontSize: 20 }}>{section.emoji}</span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              {section.title}
            </span>
          </div>
        </div>

        {/* Cork board blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {boards.map((board, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Prompt label */}
              <h2 style={{
                fontFamily: 'var(--font-hand)',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 8,
                textAlign: 'left',
              }}>
                {board.promptText}
              </h2>

              {/* Cork board surface */}
              <div
                className="vision-board-cork"
                style={{ ...CORK_STYLE }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'flex-start',
                  padding: '10px 6px',
                  gap: 10,
                }}>
                  {/* Player 1 polaroid */}
                  <div style={{
                    flex: '1 1 0',
                    maxWidth: 140,
                    position: 'relative',
                    transform: `rotate(${SLOT_CONFIG[0].rotate}deg)`,
                    marginTop: SLOT_CONFIG[0].marginTop,
                  }}>
                    {/* Push pin */}
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 40% 35%, ${PIN_COLORS[0]}, ${PIN_COLORS[0]}88)`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      margin: '0 auto -7px',
                      position: 'relative',
                      zIndex: 10,
                    }} />
                    {/* Polaroid frame */}
                    <div style={{ ...POLAROID_STYLE }}>
                      {board.player1.url ? (
                        <img
                          src={board.player1.url}
                          alt={board.player1.caption || `${player1Name || 'player 1'}'s photo`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1 }}
                        />
                      ) : (
                        <div style={{
                          padding: 24,
                          border: '2px dashed var(--border-pencil)',
                          textAlign: 'center',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.875rem',
                          color: 'var(--text-light)',
                        }}>
                          photo unavailable
                        </div>
                      )}
                    </div>
                    {/* Player name */}
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      marginTop: 4,
                      color: PLAYER_COLORS.player1,
                    }}>
                      {player1Name || 'player 1'}
                    </p>
                  </div>

                  {/* Player 2 polaroid */}
                  <div style={{
                    flex: '1 1 0',
                    maxWidth: 140,
                    position: 'relative',
                    transform: `rotate(${SLOT_CONFIG[1].rotate}deg)`,
                    marginTop: SLOT_CONFIG[1].marginTop,
                  }}>
                    {/* Push pin */}
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 40% 35%, ${PIN_COLORS[1]}, ${PIN_COLORS[1]}88)`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      margin: '0 auto -7px',
                      position: 'relative',
                      zIndex: 10,
                    }} />
                    {/* Polaroid frame */}
                    <div style={{ ...POLAROID_STYLE }}>
                      {board.player2.url ? (
                        <img
                          src={board.player2.url}
                          alt={board.player2.caption || `${player2Name || 'player 2'}'s photo`}
                          style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1 }}
                        />
                      ) : (
                        <div style={{
                          padding: 24,
                          border: '2px dashed var(--border-pencil)',
                          textAlign: 'center',
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.875rem',
                          color: 'var(--text-light)',
                        }}>
                          photo unavailable
                        </div>
                      )}
                    </div>
                    {/* Player name */}
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.875rem',
                      textAlign: 'center',
                      marginTop: 4,
                      color: PLAYER_COLORS.player2,
                    }}>
                      {player2Name || 'player 2'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Caption strip */}
              <div style={{
                display: 'flex',
                gap: 8,
                marginTop: -1,
              }}>
                {/* Player 1 caption */}
                <div style={{
                  flex: '1 1 0',
                  background: 'rgba(232, 141, 122, 0.08)',
                  border: '1.5px solid rgba(232, 141, 122, 0.25)',
                  borderRadius: '0 0 3px 3px',
                  padding: '6px 8px 8px',
                  position: 'relative',
                }}>
                  <div
                    className="torn-edge"
                    style={{ top: -12, bottom: 'auto' }}
                  />
                  <p style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    color: board.player1.caption ? 'var(--text-secondary)' : 'var(--text-light)',
                    fontStyle: board.player1.caption ? 'normal' : 'italic',
                  }}>
                    {board.player1.caption || 'no caption'}
                  </p>
                </div>

                {/* Player 2 caption */}
                <div style={{
                  flex: '1 1 0',
                  background: 'rgba(107, 141, 173, 0.08)',
                  border: '1.5px solid rgba(107, 141, 173, 0.25)',
                  borderRadius: '0 0 3px 3px',
                  padding: '6px 8px 8px',
                  position: 'relative',
                }}>
                  <div
                    className="torn-edge"
                    style={{ top: -12, bottom: 'auto' }}
                  />
                  <p style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    color: board.player2.caption ? 'var(--text-secondary)' : 'var(--text-light)',
                    fontStyle: board.player2.caption ? 'normal' : 'italic',
                  }}>
                    {board.player2.caption || 'no caption'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Back link */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <span
            role="button"
            tabIndex={0}
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--accent-coral)',
              cursor: 'pointer',
            }}
          >
            ← back to sections
          </span>
        </div>

      </motion.div>
    </div>
  )
}
