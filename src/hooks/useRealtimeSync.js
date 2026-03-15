import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to realtime changes on a Supabase table with polling fallback.
 *
 * @param {Object} options
 * @param {string} options.table - Supabase table name
 * @param {string} options.sessionId - Session ID for filter
 * @param {Function} options.onUpdate - Callback when data changes (the useCallback-wrapped fetch)
 * @param {string} [options.channelPrefix='sync'] - Prefix for channel name
 * @param {boolean} [options.pollingEnabled=true] - Whether polling fallback is active
 * @param {number} [options.pollingInterval=5000] - Polling interval ms
 */
export default function useRealtimeSync({
  table,
  sessionId,
  onUpdate,
  channelPrefix = 'sync',
  pollingEnabled = true,
  pollingInterval = 5000,
}) {
  const channelId = useRef(
    `${channelPrefix}-${sessionId}-${Math.random().toString(36).slice(2, 8)}`
  )

  // Realtime subscription
  useEffect(() => {
    if (!sessionId || !onUpdate) return
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table,
        filter: `session_id=eq.${sessionId}`,
      }, () => onUpdate())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, table, onUpdate])

  // Polling fallback
  useEffect(() => {
    if (!sessionId || !onUpdate || !pollingEnabled) return
    const interval = setInterval(onUpdate, pollingInterval)
    return () => clearInterval(interval)
  }, [sessionId, onUpdate, pollingEnabled, pollingInterval])
}
