import { useContext, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleFlower } from '../components/Doodles'
import VisionTab from './VisionTab'

const LOVE_LANGUAGES = ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Receiving Gifts']
const MBTI_TYPES = ['', 'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
const ENNEAGRAM_TYPES = ['', '1 - Reformer', '2 - Helper', '3 - Achiever', '4 - Individualist', '5 - Investigator', '6 - Loyalist', '7 - Enthusiast', '8 - Challenger', '9 - Peacemaker']
const WORKING_GENIUS = ['Wonder', 'Invention', 'Discernment', 'Galvanizing', 'Enablement', 'Tenacity']
const ATTACHMENT_STYLES = ['', 'Secure', 'Anxious', 'Avoidant', 'Fearful-Avoidant']
const CONFLICT_STYLES = ['', 'Competing', 'Collaborating', 'Compromising', 'Avoiding', 'Accommodating']

const SECTION_DESCRIPTIONS = {
  love_languages: 'how you prefer to give and receive love — knowing each other\'s top languages helps you show care in the way that lands best',
  mbti: 'your Myers-Briggs type — shows how you think, recharge, and make decisions, which explains a lot about your daily dynamic',
  enneagram: 'your core motivation and fear — understanding each other\'s type builds empathy for why you react the way you do',
  working_genius: 'what energizes vs drains you in teamwork — handy for splitting chores, planning trips, or tackling projects together',
  attachment_style: 'how you connect and seek closeness — recognizing each other\'s style helps you navigate distance and intimacy with more patience',
  conflict_style: 'your go-to approach when things get tense — knowing this helps you fight less and understand each other more',
}

const defaultProfile = {
  love_languages: { 'Words of Affirmation': 5, 'Quality Time': 5, 'Physical Touch': 5, 'Acts of Service': 5, 'Receiving Gifts': 5 },
  mbti: '', enneagram: '', working_genius: [], attachment_style: '', conflict_style: '',
}

export default function ProfilesPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerName } = useContext(SessionContext)
  const playerId = localStorage.getItem('playerId')

  const [myProfile, setMyProfile] = useState({ ...defaultProfile })
  const [partnerProfile, setPartnerProfile] = useState(null)
  const [partnerName, setPartnerName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('edit')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProfiles() }, [sessionId])

  const fetchProfiles = async () => {
    const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single()
    if (session) setPartnerName(playerId === 'player1' ? session.player2_name : session.player1_name || '')
    const { data: profiles } = await supabase.from('profiles').select('*').eq('session_id', sessionId)
    if (profiles) {
      const mine = profiles.find((p) => p.player_id === playerId)
      const theirs = profiles.find((p) => p.player_id !== playerId)
      if (mine?.profile_data) setMyProfile({ ...defaultProfile, ...mine.profile_data })
      if (theirs?.profile_data) setPartnerProfile(theirs.profile_data)
    }
    setLoading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert(
      { session_id: sessionId, player_id: playerId, player_name: playerName, profile_data: myProfile },
      { onConflict: 'session_id,player_id' }
    )
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  const updateLL = (lang, val) => setMyProfile((p) => ({ ...p, love_languages: { ...p.love_languages, [lang]: Number(val) } }))

  const toggleWG = (item) => setMyProfile((p) => {
    const c = p.working_genius || []
    if (c.includes(item)) return { ...p, working_genius: c.filter((g) => g !== item) }
    if (c.length >= 2) return p
    return { ...p, working_genius: [...c, item] }
  })

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>opening profiles...</p>
        </motion.div>
      </div>
    )
  }

  // Shared section card style
  const sectionStyle = { padding: 18, marginBottom: 14 }
  const sectionTitle = (emoji, text) => (
    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.25rem', fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
      {emoji} {text}
    </h3>
  )
  const sectionDesc = (key) => SECTION_DESCRIPTIONS[key] ? (
    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 12, marginTop: -6, lineHeight: 1.4 }}>
      {SECTION_DESCRIPTIONS[key]}
    </p>
  ) : null

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={6} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700 }}>about us</h1>
          <SquigglyUnderline width={90} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 6px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
            a place to map out who you both are — fill in your personality tests, then compare side by side to see where you click and where you balance each other out
          </p>
          <p style={{ color: 'var(--text-light)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: 6, maxWidth: 320, margin: '6px auto 0' }}>
            these are real personality frameworks — you can take the full tests on their official websites or find them in books
          </p>
        </div>

        {/* Journal link */}
        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginBottom: 18 }}
          onClick={() => navigate(`/journal/${sessionId}`)}
        >
          📖 open our journal
        </button>

        {/* Tab switcher — notebook tab style */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {[['edit', 'my page'], ['compare', 'compare'], ['goals', 'our vision']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: '6px 6px 0 0',
                border: `1.5px solid ${activeTab === key ? 'var(--border-pencil-dark)' : 'var(--border-pencil)'}`,
                borderBottom: activeTab === key ? '2px solid var(--bg-paper)' : '1.5px solid var(--border-pencil)',
                fontFamily: 'var(--font-hand)', fontWeight: activeTab === key ? 700 : 500,
                fontSize: '1.1rem', cursor: 'pointer',
                background: activeTab === key ? 'var(--bg-paper)' : 'var(--bg-card)',
                color: activeTab === key ? 'var(--accent-coral)' : 'var(--text-secondary)',
                transition: 'all 0.15s', position: 'relative', zIndex: activeTab === key ? 2 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'edit' && (
            <motion.div key="edit" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }}>

              {/* Love Languages */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('💕', 'love languages')}
                {sectionDesc('love_languages')}
                {LOVE_LANGUAGES.map((lang) => (
                  <div key={lang} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.9rem' }}>{lang}</span>
                      <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.05rem', color: 'var(--accent-coral)', fontWeight: 600 }}>{myProfile.love_languages[lang]}</span>
                    </div>
                    <input type="range" min="1" max="10" value={myProfile.love_languages[lang]} onChange={(e) => updateLL(lang, e.target.value)} />
                  </div>
                ))}
              </div>

              {/* MBTI */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('🧠', 'mbti / 16 personalities')}
                {sectionDesc('mbti')}
                <select value={myProfile.mbti} onChange={(e) => setMyProfile((p) => ({ ...p, mbti: e.target.value }))}>
                  <option value="">pick your type...</option>
                  {MBTI_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Enneagram */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('🔢', 'enneagram')}
                {sectionDesc('enneagram')}
                <select value={myProfile.enneagram} onChange={(e) => setMyProfile((p) => ({ ...p, enneagram: e.target.value }))}>
                  <option value="">pick your type...</option>
                  {ENNEAGRAM_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Working Genius */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('⚡', 'working genius')}
                {sectionDesc('working_genius')}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12, fontStyle: 'italic' }}>pick your top 2</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {WORKING_GENIUS.map((g) => {
                    const sel = myProfile.working_genius?.includes(g)
                    return (
                      <button key={g} onClick={() => toggleWG(g)} style={{
                        padding: '7px 14px', borderRadius: 3,
                        border: `1.5px solid ${sel ? 'var(--accent-coral)' : 'var(--border-pencil)'}`,
                        background: sel ? '#FFF0EC' : 'transparent',
                        color: sel ? 'var(--accent-coral)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)', fontWeight: sel ? 600 : 400,
                        fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.15s',
                      }}>{g}</button>
                    )
                  })}
                </div>
              </div>

              {/* Attachment Style */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('🔗', 'attachment style')}
                {sectionDesc('attachment_style')}
                <select value={myProfile.attachment_style} onChange={(e) => setMyProfile((p) => ({ ...p, attachment_style: e.target.value }))}>
                  <option value="">pick your style...</option>
                  {ATTACHMENT_STYLES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Conflict Style */}
              <div className="glass" style={sectionStyle}>
                {sectionTitle('⚔️', 'conflict style')}
                {sectionDesc('conflict_style')}
                <select value={myProfile.conflict_style} onChange={(e) => setMyProfile((p) => ({ ...p, conflict_style: e.target.value }))}>
                  <option value="">pick your style...</option>
                  {CONFLICT_STYLES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: 6 }} onClick={saveProfile} disabled={saving}>
                {saving ? 'saving...' : saved ? 'saved!' : 'save my profile'}
              </button>
            </motion.div>
          )}
          {activeTab === 'compare' && (
            <motion.div key="compare" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
              {!partnerProfile ? (
                <div className="glass" style={{ padding: 28, textAlign: 'center' }}>
                  <DoodleFlower size={30} opacity={0.4} style={{ margin: '0 auto 10px' }} />
                  <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', marginBottom: 8 }}>
                    {partnerName ? `${partnerName} hasn't filled this in yet` : 'waiting for your person to join'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    once they save their profile, comparisons show up here!
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 6 }}>
                      compatibility is fun to compare, but don't get too caught up in the score
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.4 }}>
                      differences and opposite traits can bring balance in a lifelong partnership — it's all about understanding each other
                    </p>
                  </div>

                  {/* Love Languages comparison */}
                  <div className="glass" style={sectionStyle}>
                    {sectionTitle('💕', 'love languages')}
                    {LOVE_LANGUAGES.map((lang) => {
                      const my = myProfile.love_languages?.[lang] || 0
                      const their = partnerProfile.love_languages?.[lang] || 0
                      return (
                        <div key={lang} style={{ marginBottom: 14 }}>
                          <p style={{ fontSize: '0.9rem', marginBottom: 6 }}>{lang}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-coral)', fontFamily: 'var(--font-hand)', width: 55, flexShrink: 0 }}>{playerName}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--rule-line)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${my * 10}%`, height: '100%', background: 'var(--accent-coral)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', width: 20 }}>{my}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-hand)', width: 55, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partnerName}</span>
                            <div style={{ flex: 1, height: 6, background: 'var(--rule-line)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${their * 10}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', width: 20 }}>{their}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Side by side cards */}
                  {[
                    { emoji: '🧠', label: 'mbti / 16 personalities', key: 'mbti' },
                    { emoji: '🔢', label: 'enneagram', key: 'enneagram' },
                    { emoji: '🔗', label: 'attachment style', key: 'attachment_style' },
                    { emoji: '⚔️', label: 'conflict style', key: 'conflict_style' },
                  ].map(({ emoji, label, key }) => {
                    const myV = myProfile[key] || 'not set'
                    const theirV = partnerProfile[key] || 'not set'
                    const match = myV === theirV && myV !== 'not set'
                    return (
                      <div key={key} className="glass" style={sectionStyle}>
                        {sectionTitle(emoji, label)}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-coral)', marginBottom: 4 }}>{playerName}</p>
                            <div style={{ background: '#FFF5E9', border: '1px solid var(--accent-coral-light)', borderRadius: 3, padding: '10px 8px', fontWeight: 600, fontSize: '0.9rem' }}>{myV}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>
                            {match ? <DoodleHeart size={18} color="var(--accent-sage)" opacity={0.7} /> : '~'}
                          </div>
                          <div style={{ flex: 1, textAlign: 'center' }}>
                            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-blue)', marginBottom: 4 }}>{partnerName}</p>
                            <div style={{ background: '#EDF3F8', border: '1px solid #B8CFDF', borderRadius: 3, padding: '10px 8px', fontWeight: 600, fontSize: '0.9rem' }}>{theirV}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Working Genius */}
                  <div className="glass" style={sectionStyle}>
                    {sectionTitle('⚡', 'working genius')}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-coral)', marginBottom: 6 }}>{playerName}</p>
                        {(myProfile.working_genius || []).length > 0
                          ? (myProfile.working_genius || []).map((g) => (
                              <div key={g} style={{ background: '#FFF5E9', border: '1px solid var(--accent-coral-light)', borderRadius: 3, padding: '6px 10px', marginBottom: 5, fontSize: '0.85rem' }}>{g}</div>
                            ))
                          : <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>not set</p>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--accent-blue)', marginBottom: 6 }}>{partnerName}</p>
                        {(partnerProfile.working_genius || []).length > 0
                          ? (partnerProfile.working_genius || []).map((g) => (
                              <div key={g} style={{ background: '#EDF3F8', border: '1px solid #B8CFDF', borderRadius: 3, padding: '6px 10px', marginBottom: 5, fontSize: '0.85rem' }}>{g}</div>
                            ))
                          : <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>not set</p>
                        }
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }}>
              <VisionTab sessionId={sessionId} playerName={playerName} playerId={playerId} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
