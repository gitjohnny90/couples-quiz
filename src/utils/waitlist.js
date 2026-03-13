import { supabase } from '../lib/supabase'

/**
 * Submit an email to the waitlist.
 * Handles duplicates gracefully — returns success either way.
 * @param {string} email
 * @param {string|null} source - campaign source from ?src= param
 * @returns {{ ok: boolean, error?: string }}
 */
export async function submitWaitlistEmail(email, source = null) {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  const { error } = await supabase
    .from('waitlist')
    .insert({ email: trimmed, source: source || null })

  if (error) {
    // Postgres unique violation = duplicate email, treat as success
    if (error.code === '23505') {
      return { ok: true }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }

  return { ok: true }
}
