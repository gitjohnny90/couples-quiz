import { useContext, useState, useEffect, useRef, useCallback } from 'react'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const PACK_ID = 'nudge'
const COOLDOWN_SECONDS = 30

export default function MissYouHeart() {
  const { sessionId, playerName, playerId } = useContext(SessionContext)
  const partnerId = playerId === 'player1' ? 'player2' : 'player1'

  const [sendState, setSendState] = useState('idle') // 'idle' | 'sending' | 'sent'
  const [cooldown, setCooldown] = useState(0)
  const [toast, setToast] = useState(null) // { senderName, key }

  const nudgeRowExistsRef = useRef(false)
  const baselineRef = useRef(0)
  const baselineLoadedRef = useRef(false)
  const cooldownRef = useRef(null)

  // Don't render if not in a session
  if (!sessionId || !playerId) return null

  // ── On mount: check if our nudge row exists + fetch partner's baseline ──
  useEffect(() => {
    if (!sessionId || !playerId) return

    const init = async () => {
      // Check if we already have a nudge row
      const { data: myRow } = await supabase
        .from('responses')
        .select('id')
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', playerId)
        .limit(1)

      if (myRow && myRow.length > 0) {
        nudgeRowExistsRef.current = true
      }

      // Fetch partner's existing nudge to establish baseline
      const { data: partnerRow } = await supabase
        .from('responses')
        .select('answers')
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', partnerId)
        .limit(1)

      if (partnerRow && partnerRow.length > 0 && partnerRow[0].answers?.timestamp) {
        baselineRef.current = partnerRow[0].answers.timestamp
      }
      baselineLoadedRef.current = true
    }

    init()
  }, [sessionId, playerId, partnerId])

  // ── Realtime subscription for incoming nudges ──
  useEffect(() => {
    if (!sessionId || !playerId) return

    const channel = supabase
      .channel(`nudge-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'responses',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new
          if (
            row?.pack_id === PACK_ID &&
            row?.player_id === partnerId &&
            baselineLoadedRef.current &&
            row?.answers?.timestamp > (baselineRef.current || 0)
          ) {
            baselineRef.current = row.answers.timestamp
            setToast({
              senderName: row.answers.senderName,
              key: row.answers.timestamp,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, playerId, partnerId])

  // ── Auto-dismiss toast ──
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4500)
    return () => clearTimeout(timer)
  }, [toast])

  // ── Cooldown timer ──
  useEffect(() => {
    if (cooldown <= 0) return
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(cooldownRef.current)
  }, [cooldown])

  // ── Send nudge ──
  const handleSend = useCallback(async () => {
    if (cooldown > 0 || sendState === 'sending' || !sessionId || !playerId) return

    setSendState('sending')

    const nudgeData = { senderName: playerName, timestamp: Date.now() }

    let error
    if (nudgeRowExistsRef.current) {
      const res = await supabase
        .from('responses')
        .update({ answers: nudgeData })
        .eq('session_id', sessionId)
        .eq('pack_id', PACK_ID)
        .eq('player_id', playerId)
      error = res.error
    } else {
      const res = await supabase
        .from('responses')
        .insert({
          session_id: sessionId,
          pack_id: PACK_ID,
          player_id: playerId,
          player_name: playerName,
          answers: nudgeData,
        })
      error = res.error
      if (!error) nudgeRowExistsRef.current = true
    }

    if (error) {
      setSendState('idle')
      return
    }

    setSendState('sent')
    setCooldown(COOLDOWN_SECONDS)
    setTimeout(() => setSendState('idle'), 2000)
  }, [cooldown, sendState, sessionId, playerId, playerName])

  const isDisabled = cooldown > 0 || sendState === 'sending'

  return (
    <>
      {/* Candy heart button — fixed wrapper keeps it pinned on mobile */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 14,
        zIndex: 50,
      }}>
      <motion.button
        onClick={handleSend}
        disabled={isDisabled}
        aria-label="Send a miss-you nudge to your partner"
        animate={{
          scale: sendState === 'sent' ? [1, 1.3, 1] : [1, 1.08, 1],
          rotate: sendState === 'sent' ? [0, -8, 8, 0] : [0, 2, -2, 0],
        }}
        transition={
          sendState === 'sent'
            ? { duration: 0.4, ease: 'easeOut' }
            : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
        }
        whileTap={!isDisabled ? { scale: 0.85 } : undefined}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: isDisabled ? 'default' : 'pointer',
          opacity: isDisabled ? 0.45 : 1,
          transition: 'opacity 0.3s',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width={44} height={40} viewBox="0 0 48 44" fill="none">
          <defs>
            <linearGradient id="candy-heart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5B0B0" />
              <stop offset="100%" stopColor="#E88D7A" />
            </linearGradient>
          </defs>
          <path
            d="M24 40 C20 36, 4 28, 4 16 C4 8, 10 4, 16 4 C19 4, 22 6, 24 9
               C26 6, 29 4, 32 4 C38 4, 44 8, 44 16 C44 28, 28 36, 24 40Z"
            fill="url(#candy-heart-grad)"
            stroke="#D47A6A"
            strokeWidth="0.5"
          />
          <text
            x="24"
            y="17"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="var(--font-hand)"
            fontSize="9.5"
            fontWeight="700"
            opacity="0.92"
            style={{ letterSpacing: '0.5px', pointerEvents: 'none' }}
          >
            MISS
          </text>
          <text
            x="24"
            y="27"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="var(--font-hand)"
            fontSize="9.5"
            fontWeight="700"
            opacity="0.92"
            style={{ pointerEvents: 'none' }}
          >
            U
          </text>
        </svg>
      </motion.button>
      </div>

      {/* "sent!" confirmation */}
      <AnimatePresence>
        {sendState === 'sent' && (
          <motion.span
            key="sent-label"
            initial={{ opacity: 0, y: -5, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{
              position: 'fixed',
              top: 54,
              right: 14,
              zIndex: 50,
              fontFamily: 'var(--font-hand)',
              fontSize: '0.85rem',
              color: 'var(--accent-coral)',
              fontWeight: 700,
              pointerEvents: 'none',
              textAlign: 'center',
              width: 44,
            }}
          >
            sent!
          </motion.span>
        )}
      </AnimatePresence>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              background: '#FFFBF5',
              border: '1.5px solid var(--accent-coral-light, #F0B8A8)',
              borderRadius: 16,
              padding: '10px 20px',
              boxShadow:
                '0 4px 16px rgba(232, 141, 122, 0.2), 0 2px 6px rgba(0,0,0,0.06)',
              fontFamily: 'var(--font-hand)',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {toast.senderName || 'your person'} misses you{' '}
            <span aria-hidden="true">💕</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
