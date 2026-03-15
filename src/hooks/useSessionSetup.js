import { useState, useEffect, useRef, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'

/**
 * Standard session setup: sync sessionId from URL, create mountedRef,
 * and fetch player names from the sessions table.
 *
 * @returns {{ sessionId, playerId, playerName, partnerId, partnerName, sessionMyName, mountedRef }}
 */
export default function useSessionSetup() {
  const { sessionId } = useParams()
  const { setSessionId, playerName, playerId } = useContext(SessionContext)
  const partnerId = playerId === 'player1' ? 'player2' : 'player1'

  const [partnerName, setPartnerName] = useState(null)
  const [sessionMyName, setSessionMyName] = useState(null)
  const mountedRef = useRef(true)

  // Sync sessionId to context
  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
  }, [sessionId])

  // Mounted ref
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Fetch player names from session (authoritative source)
  useEffect(() => {
    if (!sessionId || !playerId) return
    const fetchNames = async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('player1_name, player2_name')
        .eq('id', sessionId)
        .maybeSingle()
      if (!mountedRef.current) return
      setPartnerName(session?.[`${partnerId}_name`] || null)
      setSessionMyName(session?.[`${playerId}_name`] || null)
    }
    fetchNames()
  }, [sessionId, playerId, partnerId])

  return { sessionId, playerId, playerName, partnerId, partnerName, sessionMyName, mountedRef }
}
