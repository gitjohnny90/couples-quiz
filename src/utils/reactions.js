import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const REACTIONS = ['❤️', '😂', '🔥']

/**
 * Fetch all reactions for a session + target_type.
 */
export async function fetchReactions(sessionId, targetType) {
  const { data, error } = await supabase
    .from('reactions')
    .select('id, player_id, target_id, reaction')
    .eq('session_id', sessionId)
    .eq('target_type', targetType)
  if (error) return []
  return data
}

/**
 * Toggle a reaction. Same emoji = remove, different = switch, none = create.
 */
export async function toggleReaction(sessionId, playerId, targetType, targetId, emoji) {
  const { data: existing } = await supabase
    .from('reactions')
    .select('id, reaction')
    .eq('session_id', sessionId)
    .eq('player_id', playerId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()

  if (existing && existing.reaction === emoji) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else if (existing) {
    await supabase.from('reactions').update({ reaction: emoji }).eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({
      session_id: sessionId,
      player_id: playerId,
      target_type: targetType,
      target_id: targetId,
      reaction: emoji,
    })
  }
}

/**
 * Subscribe to realtime reaction changes for a session + target_type.
 * Returns a channel — caller must unsubscribe in cleanup.
 */
export function subscribeToReactions(sessionId, targetType, onUpdate) {
  const channel = supabase
    .channel(`reactions-${sessionId}-${targetType}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'reactions',
      filter: `session_id=eq.${sessionId}`,
    }, (payload) => {
      if (payload.new?.target_type === targetType || payload.old?.target_type === targetType) {
        onUpdate()
      }
    })
    .subscribe()
  return channel
}

/**
 * Build a lookup map: { targetId: { player1: '❤️', player2: '🔥' } }
 */
export function buildReactionMap(reactions) {
  const map = {}
  for (const r of reactions) {
    if (!map[r.target_id]) map[r.target_id] = {}
    map[r.target_id][r.player_id] = r.reaction
  }
  return map
}

/**
 * Hook: manages reactions state + realtime for a given session & target type.
 * Returns { reactionMap, handleReact }
 */
export function useReactions(sessionId, targetType) {
  const [reactions, setReactions] = useState([])
  const channelId = useRef(`reactions-${sessionId}-${targetType}-${Math.random().toString(36).slice(2, 8)}`)

  const refresh = useCallback(async () => {
    const data = await fetchReactions(sessionId, targetType)
    setReactions(data)
  }, [sessionId, targetType])

  useEffect(() => {
    refresh()
    const channel = supabase
      .channel(channelId.current)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reactions',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new?.target_type === targetType || payload.old?.target_type === targetType) {
          refresh()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId, targetType, refresh])

  const reactionMap = buildReactionMap(reactions)

  const handleReact = async (playerId, targetId, emoji) => {
    await toggleReaction(sessionId, playerId, targetType, targetId, emoji)
    await refresh()
  }

  return { reactionMap, handleReact, reactions }
}
