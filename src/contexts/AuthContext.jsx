import { createContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext({
  user: null,
  loading: true,
  authEvent: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPasswordForEmail: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authEvent, setAuthEvent] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setAuthEvent(event)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  const resetPasswordForEmail = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('sessionId')
    localStorage.removeItem('playerName')
    localStorage.removeItem('playerId')
  }

  return (
    <AuthContext.Provider value={{ user, loading, authEvent, signUp, signIn, signOut, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  )
}
