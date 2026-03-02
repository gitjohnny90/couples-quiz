import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageDoodles, { DoodleStar, SquigglyUnderline } from '../components/Doodles'

const tools = [
  {
    name: 'Teleparty',
    tag: 'Most Popular',
    tagColor: '#D4A843',
    emoji: '⭐',
    bullets: [
      'Free Chrome extension, syncs playback with chat',
      'Works with: Netflix, Disney+, Hulu, Amazon Prime, Max, YouTube, and more',
      'Premium ($4/mo) adds video chat',
    ],
    bestFor: 'Desktop watching, widest platform support',
    link: 'https://teleparty.com',
    linkLabel: 'teleparty.com',
    rotation: -0.6,
  },
  {
    name: 'Flickcall',
    tag: 'Best for Couples',
    tagColor: '#E88D7A',
    emoji: '💕',
    bullets: [
      'Chrome extension with built-in video call during the movie',
      'Works with: Netflix, Disney+, Prime Video, Hulu, YouTube, HBO Max, and more',
      'Free to use, no separate video call app needed',
    ],
    bestFor: "Seeing each other's reactions while you watch",
    link: 'https://flickcall.com',
    linkLabel: 'flickcall.com',
    rotation: 0.4,
  },
  {
    name: 'Discord',
    tag: 'Free & Easy',
    tagColor: '#7B68C4',
    emoji: '🎮',
    bullets: [
      'Free, screen share any streaming service',
      'Works with: literally anything on your screen',
      'Voice/video chat built in, no extra extensions',
    ],
    bestFor: 'People who already use Discord',
    link: 'https://discord.com',
    linkLabel: 'discord.com',
    rotation: -0.3,
  },
  {
    name: 'Rave',
    tag: 'Best for Phone',
    tagColor: '#6B8DAD',
    emoji: '📱',
    bullets: [
      'Mobile app for watching together from your phone',
      'Works with: Netflix, YouTube, and other platforms',
      'Built-in chat and sync',
    ],
    bestFor: 'Watching from bed on your phone',
    link: null,
    linkLabel: 'Available on iOS and Android',
    rotation: 0.5,
  },
  {
    name: 'Watch2Gether',
    tag: 'Best for YouTube',
    tagColor: '#7CAE7A',
    emoji: '🎵',
    bullets: [
      'Browser-based, no install needed',
      'Works with: YouTube, Vimeo, and more',
      'Create a room and share the link',
    ],
    bestFor: 'YouTube videos, music videos, anime on YouTube',
    link: 'https://w2g.tv',
    linkLabel: 'w2g.tv',
    rotation: -0.4,
  },
  {
    name: 'Hulu',
    tag: 'Built-in!',
    tagColor: '#4CAF50',
    emoji: '📺',
    bullets: [
      'Only major streaming platform with its own watch party feature still active',
      'Desktop/browser only',
      'No extra apps needed if you both have Hulu',
    ],
    bestFor: 'The easiest possible setup',
    link: null,
    linkLabel: null,
    rotation: 0.3,
  },
]

export default function WatchGuidePage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={33} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, marginBottom: 2 }}>
            Watch Together 🍿
          </h1>
          <SquigglyUnderline width={120} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 10px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.4, maxWidth: 340, margin: '0 auto' }}>
            The wheel picked your movie — now here's how to watch it at the same time from different couches.
          </p>
        </div>

        {/* Tool cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
          {tools.map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass watch-guide-card"
              style={{ padding: 18, transform: `rotate(${tool.rotation}deg)`, position: 'relative' }}
            >
              {/* Star doodle on top picks */}
              {i < 2 && (
                <div style={{ position: 'absolute', top: -6, right: i === 0 ? 12 : 'auto', left: i === 1 ? 12 : 'auto' }}>
                  <DoodleStar size={14} opacity={0.35} rotate={i * 25 - 10} />
                </div>
              )}

              {/* Name + tag row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22 }}>{tool.emoji}</span>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tool.name}
                </h3>
                <span style={{
                  fontSize: '0.72rem', fontFamily: 'var(--font-hand)', fontWeight: 600,
                  background: tool.tagColor, color: '#fff',
                  padding: '2px 8px', borderRadius: 10,
                }}>
                  {tool.tag}
                </span>
              </div>

              {/* Bullets */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px 0' }}>
                {tool.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: tool.tagColor }}>~</span>
                    {b}
                  </li>
                ))}
              </ul>

              {/* Best for */}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>
                Best for: <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>{tool.bestFor}</span>
              </p>

              {/* Link */}
              {tool.link ? (
                <a
                  href={tool.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.85rem', fontFamily: 'var(--font-hand)', fontWeight: 600,
                    color: tool.tagColor, textDecoration: 'underline', textUnderlineOffset: 3,
                  }}
                >
                  {tool.linkLabel} →
                </a>
              ) : tool.linkLabel ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>
                  {tool.linkLabel}
                </p>
              ) : null}
            </motion.div>
          ))}
        </div>

        {/* Pro tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="sticky-note"
          style={{ padding: 20, marginTop: 20, transform: 'rotate(-0.8deg)', position: 'relative' }}
        >
          <div style={{ position: 'absolute', top: -6, left: 14 }}>
            <DoodleStar size={12} opacity={0.3} rotate={15} />
          </div>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-coral)', marginBottom: 6 }}>
            pro tip:
          </p>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Start with Discord. For a dedicated movie night vibe, try Flickcall — seeing each other while watching hits different. 💛
          </p>
        </motion.div>

        {/* Quick note */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass"
          style={{ padding: 16, marginTop: 14, textAlign: 'center', transform: 'rotate(0.3deg)' }}
        >
          <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
            Most of these need both people to have their own subscription to the streaming service. The tool just syncs the playback — it doesn't share the account.
          </p>
        </motion.div>

        {/* Back button */}
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 22 }} onClick={() => navigate(`/movies/${sessionId}`)}>
          ← back to movies
        </button>
      </motion.div>
    </div>
  )
}
