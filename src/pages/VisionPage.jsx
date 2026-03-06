import { useContext, useState } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from '../components/Doodles'
import VisionTab from './VisionTab'

export default function VisionPage() {
  const { sessionId } = useParams()
  const { playerName, playerId } = useContext(SessionContext)
  const [activeTab, setActiveTab] = useState('vision')

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={9} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 4 }}>
            <DoodleStar size={16} opacity={0.3} rotate={-10} style={{ position: 'absolute', top: -6, left: -16 }} />
            <DoodleHeart size={14} opacity={0.3} rotate={12} style={{ position: 'absolute', top: -4, right: -14 }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700 }}>our vision</h1>
          <SquigglyUnderline width={100} color="#D4A843" opacity={0.4} style={{ margin: '0 auto 6px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 340, margin: '0 auto' }}>
            the big picture of your life together — your north star, vision board, dreams, and everything you've achieved
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {[['vision', 'north star'], ['dreams', 'our dreams']].map(([key, label]) => (
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
                color: activeTab === key ? 'var(--accent-mustard)' : 'var(--text-secondary)',
                transition: 'all 0.15s', position: 'relative', zIndex: activeTab === key ? 2 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === 'vision' ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: activeTab === 'vision' ? -15 : 15 }}
          >
            <VisionTab
              sessionId={sessionId}
              playerName={playerName}
              playerId={playerId}
              visibleSection={activeTab}
            />
          </motion.div>
        </AnimatePresence>

      </motion.div>
    </div>
  )
}
