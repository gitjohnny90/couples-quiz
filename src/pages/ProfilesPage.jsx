import { useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { AuthContext } from '../contexts/AuthContext'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from '../components/Doodles'

export default function ProfilesPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { playerId } = useContext(SessionContext)
  const { signOut } = useContext(AuthContext)

  const activities = [
    {
      emoji: '📖',
      title: 'Journal',
      description: 'a shared space to write and reflect together',
      rotation: -0.4,
      onClick: () => navigate(`/journal/${sessionId}`),
    },
    {
      emoji: '🧠',
      title: 'Personality Tests',
      description: 'fill in your types and compare side by side',
      rotation: 0.3,
      onClick: () => navigate(`/personality/${sessionId}`),
    },
    {
      emoji: '🌟',
      title: 'Our Vision',
      description: 'north star, vision board, dreams, and milestones',
      rotation: -0.5,
      onClick: () => navigate(`/vision/${sessionId}`),
    },
    {
      emoji: '📚',
      title: 'Study Together',
      description: 'read, grow, and reflect on books together',
      rotation: 0.5,
      onClick: () => navigate(`/study/${sessionId}`),
    },
  ]

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={6} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4, marginTop: 16 }}>
            <DoodleHeart size={36} color="#E88D7A" opacity={0.6} rotate={-5} />
            <div style={{ position: 'absolute', top: -8, right: -18 }}>
              <DoodleHeart size={18} color="#D4A843" opacity={0.4} rotate={12} />
            </div>
            <div style={{ position: 'absolute', bottom: -4, left: -14 }}>
              <DoodleStar size={14} opacity={0.3} rotate={-8} />
            </div>
          </div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700, marginBottom: 2 }}>
            about us
          </h1>
          <SquigglyUnderline width={90} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            the deeper stuff — who you are and where you're going
          </p>
        </div>

        {/* Activity cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {activities.map((activity, i) => (
            <motion.div
              key={activity.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass"
              style={{
                padding: 18,
                cursor: 'pointer',
                transform: `rotate(${activity.rotation}deg)`,
              }}
              onClick={activity.onClick}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{activity.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', fontWeight: 600, marginBottom: 1, color: 'var(--text-primary)' }}>
                    {activity.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    {activity.description}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                    open →
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ textAlign: 'center', marginTop: 32, marginBottom: 8 }}>
          <button
            onClick={async () => {
              await signOut()
              navigate('/auth')
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-hand)',
              fontSize: '1rem',
              color: 'var(--text-light)',
              padding: '8px 16px',
              textDecoration: 'underline',
              textDecorationStyle: 'wavy',
              textDecorationColor: 'var(--border-pencil)',
              textUnderlineOffset: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-coral)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}
          >
            sign out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
