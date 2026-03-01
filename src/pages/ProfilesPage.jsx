import { useContext, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

const LOVE_LANGUAGES = ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Receiving Gifts']
const MBTI_TYPES = [
  '', 'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
]
const ENNEAGRAM_TYPES = ['', '1 - Reformer', '2 - Helper', '3 - Achiever', '4 - Individualist', '5 - Investigator', '6 - Loyalist', '7 - Enthusiast', '8 - Challenger', '9 - Peacemaker']
const WORKING_GENIUS = ['Wonder', 'Invention', 'Discernment', 'Galvanizing', 'Enablement', 'Tenacity']
const ATTACHMENT_STYLES = ['', 'Secure', 'Anxious', 'Avoidant', 'Fearful-Avoidant']
const CONFLICT_STYLES = ['', 'Competing', 'Collaborating', 'Compromising', 'Avoiding', 'Accommodating']

const defaultProfile = {
  love_languages: { 'Words of Affirmation': 5, 'Quality Time': 5, 'Physical Touch': 5, 'Acts of Service': 5, 'Receiving Gifts': 5 },
  mbti: '',
  enneagram: '',
  working_genius: [],
  attachment_style: '',
  conflict_style: '',
}

export default function ProfilesPage() {
  const { sessionId } = useParams()
  const { playerName } = useContext(SessionContext)
  const playerId = localStorage.getItem('playerId')

  const [myProfile, setMyProfile] = useState({ ...defaultProfile })
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [partnerName, setPartnerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('edit') // 'edit' | 'compare'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfiles()
  }, [sessionId])

  const fetchProfiles = async () => {
    // Fetch session for names
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (session) {
      const pName = playerId === 'player1' ? session.player2_name : session.player1_name
      setPartnerName(pName || '')
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('session_id', sessionId)

    if (profiles) {
      const mine = profiles.find((p) => p.player_id === playerId)
      const theirs = profiles.find((p) => p.player_id !== playerId)

      if (mine?.profile_data) {
        setMyProfile({ ...defaultProfile, ...mine.profile_data })
      }
      if (theirs?.profile_data) {
        setPartnerProfile(theirs.profile_data)
      }
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert(
      {
        session_id: sessionId,
        player_id: playerId,
        player_name: playerName,
        profile_data: myProfile,
      },
      { onConflict: 'session_id,player_id' }
    )

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const updateLoveLanguage = (lang, value) => {
    setMyProfile((prev) => ({
      ...prev,
      love_languages: { ...prev.love_languages, [lang]: Number(value) },
    }))
  }

  const toggleWorkingGenius = (item) => {
    setMyProfile((prev) => {
      const current = prev.working_genius || []
      if (current.includes(item)) {
        return { ...prev, working_genius: current.filter((g) => g !== item) }
      }
      if (current.length >= 2) return prev // Max 2
      return { ...prev, working_genius: [...current, item] }
    })
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading profiles...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Profiles</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Compare your personality test results
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 14,
            padding: 4,
          }}
        >
          <button
            onClick={() => setActiveTab('edit')}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'edit' ? 'rgba(168,85,247,0.2)' : 'transparent',
              color: activeTab === 'edit' ? 'var(--accent-purple)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            ✏️ My Profile
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              border: 'none',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              background: activeTab === 'compare' ? 'rgba(255,107,157,0.2)' : 'transparent',
              color: activeTab === 'compare' ? 'var(--accent-pink)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            📊 Compare
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'edit' ? (
            <motion.div key="edit" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Love Languages */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>💕 Love Languages</h3>
                {LOVE_LANGUAGES.map((lang) => (
                  <div key={lang} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lang}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
                        {myProfile.love_languages[lang]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={myProfile.love_languages[lang]}
                      onChange={(e) => updateLoveLanguage(lang, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* MBTI */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>🧠 MBTI Type</h3>
                <select
                  value={myProfile.mbti}
                  onChange={(e) => setMyProfile((prev) => ({ ...prev, mbti: e.target.value }))}
                >
                  <option value="">Select your type...</option>
                  {MBTI_TYPES.filter(Boolean).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Enneagram */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>🔢 Enneagram</h3>
                <select
                  value={myProfile.enneagram}
                  onChange={(e) => setMyProfile((prev) => ({ ...prev, enneagram: e.target.value }))}
                >
                  <option value="">Select your type...</option>
                  {ENNEAGRAM_TYPES.filter(Boolean).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Working Genius */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>⚡ Working Genius</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Pick your top 2
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {WORKING_GENIUS.map((g) => {
                    const selected = myProfile.working_genius?.includes(g)
                    return (
                      <button
                        key={g}
                        onClick={() => toggleWorkingGenius(g)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 10,
                          border: `1px solid ${selected ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                          background: selected ? 'rgba(168,85,247,0.15)' : 'transparent',
                          color: selected ? 'var(--accent-purple)' : 'var(--text-secondary)',
                          fontFamily: 'var(--font)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Attachment Style */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>🔗 Attachment Style</h3>
                <select
                  value={myProfile.attachment_style}
                  onChange={(e) => setMyProfile((prev) => ({ ...prev, attachment_style: e.target.value }))}
                >
                  <option value="">Select your style...</option>
                  {ATTACHMENT_STYLES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Conflict Style */}
              <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>⚔️ Conflict Style</h3>
                <select
                  value={myProfile.conflict_style}
                  onChange={(e) => setMyProfile((prev) => ({ ...prev, conflict_style: e.target.value }))}
                >
                  <option value="">Select your style...</option>
                  {CONFLICT_STYLES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Save button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save My Profile'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="compare" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {!partnerProfile ? (
                <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8 }}>
                    {partnerName ? `${partnerName} hasn't filled in their profile yet` : 'Waiting for your partner to join'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Once they save their profile, comparisons will appear here!
                  </p>
                </div>
              ) : (
                <>
                  {/* Love Languages comparison */}
                  <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>💕 Love Languages</h3>
                    {LOVE_LANGUAGES.map((lang) => {
                      const myVal = myProfile.love_languages?.[lang] || 0
                      const theirVal = partnerProfile.love_languages?.[lang] || 0
                      return (
                        <div key={lang} style={{ marginBottom: 16 }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>{lang}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, width: 60, flexShrink: 0 }}>
                              {playerName}
                            </span>
                            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${myVal * 10}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: 4, transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, width: 20 }}>{myVal}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700, width: 60, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {partnerName}
                            </span>
                            <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${theirVal * 10}%`, height: '100%', background: 'var(--accent-pink)', borderRadius: 4, transition: 'width 0.4s' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, width: 20 }}>{theirVal}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Side by side comparisons */}
                  {[
                    { label: '🧠 MBTI', key: 'mbti' },
                    { label: '🔢 Enneagram', key: 'enneagram' },
                    { label: '🔗 Attachment Style', key: 'attachment_style' },
                    { label: '⚔️ Conflict Style', key: 'conflict_style' },
                  ].map(({ label, key }) => {
                    const myVal = myProfile[key] || 'Not set'
                    const theirVal = partnerProfile[key] || 'Not set'
                    const match = myVal === theirVal && myVal !== 'Not set'
                    return (
                      <div key={key} className="glass" style={{ padding: 20, marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>{label}</h3>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 6 }}>
                              {playerName}
                            </p>
                            <div style={{
                              background: 'rgba(168,85,247,0.1)',
                              borderRadius: 12,
                              padding: '12px 8px',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}>
                              {myVal}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>
                            {match ? '✅' : '↔️'}
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700, marginBottom: 6 }}>
                              {partnerName}
                            </p>
                            <div style={{
                              background: 'rgba(255,107,157,0.1)',
                              borderRadius: 12,
                              padding: '12px 8px',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                            }}>
                              {theirVal}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Working Genius */}
                  <div className="glass" style={{ padding: 20, marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>⚡ Working Genius</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700, marginBottom: 8 }}>
                          {playerName}
                        </p>
                        {(myProfile.working_genius || []).length > 0 ? (
                          (myProfile.working_genius || []).map((g) => (
                            <div
                              key={g}
                              style={{
                                background: 'rgba(168,85,247,0.1)',
                                borderRadius: 10,
                                padding: '8px 12px',
                                marginBottom: 6,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              {g}
                            </div>
                          ))
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Not set</p>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-pink)', fontWeight: 700, marginBottom: 8 }}>
                          {partnerName}
                        </p>
                        {(partnerProfile.working_genius || []).length > 0 ? (
                          (partnerProfile.working_genius || []).map((g) => (
                            <div
                              key={g}
                              style={{
                                background: 'rgba(255,107,157,0.1)',
                                borderRadius: 10,
                                padding: '8px 12px',
                                marginBottom: 6,
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              {g}
                            </div>
                          ))
                        ) : (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Not set</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
