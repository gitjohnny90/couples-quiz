import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { DoodleStar } from '../components/Doodles'

const PACK_ID = 'vision-data'
const PLAYER_ID = 'shared'

const CATEGORIES = [
  { id: 'gap', emoji: '🌍', label: 'Closing the Gap', color: '#7EB8D8', bg: '#EDF5FA' },
  { id: 'talk', emoji: '💬', label: 'How We Talk', color: '#B8A4D0', bg: '#F3EFF8' },
  { id: 'build', emoji: '💰', label: 'Building Together', color: '#D4A843', bg: '#FBF5E6' },
  { id: 'grow', emoji: '📚', label: 'Growing Together', color: '#7CAE7A', bg: '#EFF5EF' },
  { id: 'memories', emoji: '🎉', label: 'Making Memories', color: '#E88D7A', bg: '#FFF0EC' },
  { id: 'us', emoji: '💛', label: 'Us Goals', color: '#D4A843', bg: '#FBF5E6' },
  { id: 'dream', emoji: '🌟', label: 'Dream Big', color: '#D4889A', bg: '#FAEFF2' },
]

const STATUS_CYCLE = ['dreaming', 'growing', 'achieved']
const STATUS_DISPLAY = {
  dreaming: { emoji: '✨', label: 'dreaming' },
  growing: { emoji: '🌱', label: 'growing' },
  achieved: { emoji: '🎉', label: 'achieved!' },
}

const BOARD_SLOTS = [
  { top: '4%', left: '4%', rotate: -3, width: '42%' },
  { top: '2%', left: '54%', rotate: 2, width: '42%' },
  { top: '35%', left: '7%', rotate: 1.5, width: '38%' },
  { top: '33%', left: '53%', rotate: -2.5, width: '44%' },
  { top: '65%', left: '3%', rotate: -1, width: '43%' },
  { top: '67%', left: '55%', rotate: 3, width: '40%' },
]

const PIN_COLORS = ['#E55', '#E8B84C', '#5B8FC7', '#6BAF6B', '#D47BA0', '#E88D7A']

const DEFAULT_DATA = { northStar: '', goals: [], board: [] }

export default function VisionTab({ sessionId, playerName, playerId }) {
  const navigate = useNavigate()
  const [data, setData] = useState(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedCat, setExpandedCat] = useState(null)
  const [newGoalText, setNewGoalText] = useState('')
  const northStarTimeout = useRef(null)
  const captionTimeout = useRef(null)
  const fileInputRefs = useRef([])

  // Fetch vision data
  const fetchData = async () => {
    const { data: row } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('pack_id', PACK_ID)
      .eq('player_id', PLAYER_ID)
      .maybeSingle()

    if (row?.answers) {
      setData({ ...DEFAULT_DATA, ...row.answers })
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [sessionId])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`vision-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'responses',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.new && payload.new.pack_id === PACK_ID) {
          fetchData()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Save helper
  const saveData = async (updatedData) => {
    setSaving(true)
    await supabase.from('responses').upsert(
      {
        session_id: sessionId,
        pack_id: PACK_ID,
        player_id: PLAYER_ID,
        player_name: 'shared',
        answers: updatedData,
      },
      { onConflict: 'session_id,pack_id,player_id' }
    )
    setData(updatedData)
    setSaving(false)
  }

  // North Star handlers
  const handleNorthStarChange = (text) => {
    const updated = { ...data, northStar: text }
    setData(updated)
    clearTimeout(northStarTimeout.current)
    northStarTimeout.current = setTimeout(() => saveData(updated), 800)
  }

  // Goal handlers
  const handleAddGoal = (categoryId) => {
    if (!newGoalText.trim()) return
    const newGoal = {
      id: crypto.randomUUID(),
      category: categoryId,
      title: newGoalText.trim(),
      status: 'dreaming',
      createdBy: playerId,
      createdAt: new Date().toISOString(),
      achievedAt: null,
    }
    const updated = { ...data, goals: [...data.goals, newGoal] }
    saveData(updated)
    setNewGoalText('')
  }

  const handleStatusChange = (goalId, newStatus) => {
    const updated = {
      ...data,
      goals: data.goals.map(g =>
        g.id === goalId
          ? { ...g, status: newStatus, achievedAt: newStatus === 'achieved' ? new Date().toISOString() : null }
          : g
      ),
    }
    saveData(updated)
  }

  const handleDeleteGoal = (goalId) => {
    const updated = { ...data, goals: data.goals.filter(g => g.id !== goalId) }
    saveData(updated)
  }

  // Board handlers
  const handleBoardUpload = (slotIndex, dataUrl) => {
    const board = [...(data.board || [])]
    const idx = board.findIndex(b => b.slot === slotIndex)
    if (idx >= 0) {
      board[idx] = { ...board[idx], dataUrl }
    } else {
      board.push({ slot: slotIndex, dataUrl, caption: '', addedBy: playerId })
    }
    saveData({ ...data, board })
  }

  const handleBoardCaption = (slotIndex, caption) => {
    const board = [...(data.board || [])]
    const idx = board.findIndex(b => b.slot === slotIndex)
    if (idx >= 0) {
      board[idx] = { ...board[idx], caption }
      setData(prev => ({ ...prev, board }))
      clearTimeout(captionTimeout.current)
      captionTimeout.current = setTimeout(() => saveData({ ...data, board }), 800)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--text-secondary)' }}>
          loading your dreams...
        </p>
      </div>
    )
  }

  const achievedGoals = data.goals.filter(g => g.status === 'achieved')
  const totalGoals = data.goals.length

  return (
    <div>
      {/* ===== NORTH STAR ===== */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'absolute', top: -8, left: 10, pointerEvents: 'none' }}>
          <DoodleStar size={16} opacity={0.3} rotate={-10} />
        </div>
        <div style={{ position: 'absolute', top: 4, right: 14, pointerEvents: 'none' }}>
          <DoodleStar size={12} opacity={0.25} rotate={15} />
        </div>
        <div style={{ position: 'absolute', bottom: -6, left: '30%', pointerEvents: 'none' }}>
          <DoodleStar size={10} opacity={0.2} rotate={5} />
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: '20%', pointerEvents: 'none' }}>
          <DoodleStar size={14} opacity={0.2} rotate={-20} />
        </div>

        <div className="glass" style={{
          padding: '24px 20px', textAlign: 'center',
          background: 'linear-gradient(135deg, #FFFDF7 0%, #FFF8E7 100%)',
        }}>
          <h2 style={{
            fontFamily: 'var(--font-hand)', fontSize: '1.5rem', fontWeight: 700,
            color: '#B8942F', marginBottom: 4,
          }}>
            our north star
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 14 }}>
            the thing you're building toward, together
          </p>
          <textarea
            value={data.northStar}
            onChange={(e) => handleNorthStarChange(e.target.value)}
            placeholder="Close the distance. Build something real. Never stop laughing."
            maxLength={300}
            rows={3}
            style={{
              width: '100%', border: 'none', outline: 'none', resize: 'none',
              background: 'transparent', textAlign: 'center',
              fontFamily: 'var(--font-hand)', fontSize: '1.4rem', lineHeight: 1.5,
              color: 'var(--text-primary)',
              textShadow: '0 0 20px rgba(212, 168, 67, 0.15)',
            }}
          />
          {saving && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 4 }}>saving...</p>
          )}
        </div>
      </div>

      {/* ===== DREAM CATEGORIES ===== */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700,
          textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)',
        }}>
          our dreams
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 14 }}>
          tap a category to add dreams and track your progress together
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map((cat, i) => {
            const catGoals = data.goals.filter(g => g.category === cat.id)
            const isExpanded = expandedCat === cat.id
            const tilts = [-0.6, 0.4, -0.3, 0.7, -0.5, 0.3, -0.4]

            return (
              <div
                key={cat.id}
                className="glass"
                style={{
                  padding: 0, overflow: 'hidden',
                  borderLeft: `3px solid ${cat.color}`,
                  transform: `rotate(${tilts[i]}deg)`,
                }}
              >
                {/* Category header */}
                <div
                  onClick={() => { setExpandedCat(isExpanded ? null : cat.id); setNewGoalText('') }}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                    <span style={{
                      fontFamily: 'var(--font-hand)', fontSize: '1.1rem',
                      fontWeight: 600, color: 'var(--text-primary)',
                    }}>
                      {cat.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {catGoals.length > 0 && (
                      <span style={{
                        fontFamily: 'var(--font-hand)', fontSize: '0.85rem',
                        color: cat.color, fontWeight: 600,
                      }}>
                        {catGoals.length}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.9rem', color: 'var(--text-light)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s', display: 'inline-block',
                    }}>
                      ›
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${cat.bg}` }}>
                        {catGoals.length === 0 && (
                          <p style={{
                            fontSize: '0.85rem', color: 'var(--text-light)',
                            fontStyle: 'italic', padding: '10px 0 6px',
                          }}>
                            no dreams here yet — add one below
                          </p>
                        )}

                        {catGoals.map((goal) => (
                          <GoalItem
                            key={goal.id}
                            goal={goal}
                            onStatusChange={(s) => handleStatusChange(goal.id, s)}
                            onDelete={() => handleDeleteGoal(goal.id)}
                          />
                        ))}

                        {/* Add goal input */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                          <input
                            placeholder="add a dream..."
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newGoalText.trim()) handleAddGoal(cat.id)
                            }}
                            style={{
                              flex: 1, fontSize: '0.9rem', padding: '8px 12px',
                              border: '1.5px solid var(--border-pencil)', borderRadius: 3,
                              fontFamily: 'var(--font-body)', background: 'var(--bg-paper)',
                              outline: 'none',
                            }}
                          />
                          <button
                            className="btn btn-primary"
                            style={{ padding: '8px 14px', fontSize: '1rem' }}
                            onClick={() => handleAddGoal(cat.id)}
                            disabled={!newGoalText.trim()}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== CONSTELLATION MAP ===== */}
      {totalGoals > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700,
            textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)',
          }}>
            our sky
          </h2>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 14 }}>
            every dream you achieve becomes a star — watch your sky grow
          </p>
          <div className="glass" style={{
            padding: 20, textAlign: 'center',
            background: 'linear-gradient(180deg, #2C2C4A 0%, #1A1A2E 100%)',
            border: '1.5px solid #3D3D5C',
          }}>
            <ConstellationSVG goals={data.goals} />
            <p style={{
              fontFamily: 'var(--font-hand)', fontSize: '1.1rem',
              color: '#F0E6D3', marginTop: 10,
            }}>
              {achievedGoals.length} star{achievedGoals.length !== 1 ? 's' : ''} in our sky ✨
            </p>
          </div>
        </div>
      )}

      {/* ===== LOOK HOW FAR WE'VE COME ===== */}
      {achievedGoals.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{
            fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700,
            textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)',
          }}>
            look how far we've come
          </h2>
          <p style={{
            textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)',
            fontStyle: 'italic', marginBottom: 14,
          }}>
            everything you've achieved, saved here so you never forget
          </p>
          <p style={{
            textAlign: 'center', fontSize: '0.95rem',
            color: 'var(--accent-sage)', fontFamily: 'var(--font-hand)',
            marginBottom: 14, fontWeight: 600,
          }}>
            {achievedGoals.length} dream{achievedGoals.length !== 1 ? 's' : ''} achieved together 💛
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {achievedGoals.map((goal, i) => {
              const cat = CATEGORIES.find(c => c.id === goal.category)
              return (
                <div
                  key={goal.id}
                  className="glass"
                  style={{
                    padding: '14px 16px',
                    borderLeft: `3px solid ${cat?.color || 'var(--accent-sage)'}`,
                    transform: `rotate(${i % 2 === 0 ? '-0.4' : '0.5'}deg)`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                        fontWeight: 600, color: 'var(--text-primary)',
                      }}>
                        🎉 {goal.title}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 2 }}>
                        {cat?.emoji} {cat?.label}
                      </p>
                    </div>
                    {goal.achievedAt && (
                      <span style={{
                        fontFamily: 'var(--font-hand)', fontSize: '0.8rem',
                        color: 'var(--text-light)', flexShrink: 0,
                      }}>
                        {new Date(goal.achievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== CORK BOARD ===== */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontFamily: 'var(--font-hand)', fontSize: '1.3rem', fontWeight: 700,
          textAlign: 'center', marginBottom: 4, color: 'var(--text-primary)',
        }}>
          what we're building
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: 14 }}>
          pin photos of your dreams — places, homes, pets, adventures, anything you're working toward
        </p>

        <div style={{
          position: 'relative',
          background: '#C4956A',
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,255,255,0.06) 0%, transparent 50%)`,
          borderRadius: 4,
          padding: '16px',
          border: '3px solid #A07A52',
          boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {/* 2x3 grid for cork board slots */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}>
            {BOARD_SLOTS.map((slot, i) => {
              const boardItem = (data.board || []).find(b => b.slot === i)
              return (
                <CorkBoardSlot
                  key={i}
                  index={i}
                  slot={slot}
                  item={boardItem}
                  onImageUpload={(dataUrl) => handleBoardUpload(i, dataUrl)}
                  onCaptionChange={(caption) => handleBoardCaption(i, caption)}
                  fileInputRef={el => fileInputRefs.current[i] = el}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== SUB-COMPONENTS ===== */

function GoalItem({ goal, onStatusChange, onDelete }) {
  const status = STATUS_DISPLAY[goal.status] || STATUS_DISPLAY.dreaming

  const cycleStatus = () => {
    const currentIdx = STATUS_CYCLE.indexOf(goal.status)
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    onStatusChange(nextStatus)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: '1px dashed var(--rule-line)',
    }}>
      <button
        onClick={cycleStatus}
        title={`${status.label} — tap to change`}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.1rem', padding: 2, flexShrink: 0,
        }}
      >
        {status.emoji}
      </button>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '0.9rem', flex: 1,
        color: goal.status === 'achieved' ? 'var(--accent-sage)' : 'var(--text-primary)',
        textDecoration: goal.status === 'achieved' ? 'line-through' : 'none',
      }}>
        {goal.title}
      </span>
      <span style={{
        fontFamily: 'var(--font-hand)', fontSize: '0.75rem', color: 'var(--text-light)',
      }}>
        {status.label}
      </span>
      <button
        onClick={onDelete}
        title="remove"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.7rem', color: 'var(--text-light)', padding: '2px 4px',
          opacity: 0.5,
        }}
      >
        ✕
      </button>
    </div>
  )
}

function ConstellationSVG({ goals }) {
  const achievedGoals = goals.filter(g => g.status === 'achieved')

  const getPosition = (index) => {
    const cx = 150, cy = 100
    const angle = index * 2.4 // golden angle
    const radius = 25 + (index * 13) % 70
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    }
  }

  return (
    <svg viewBox="0 0 300 200" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      {/* Connection lines between achieved goals */}
      {achievedGoals.map((goal, i) => {
        if (i === 0) return null
        const prevIdx = goals.indexOf(achievedGoals[i - 1])
        const currIdx = goals.indexOf(goal)
        const from = getPosition(prevIdx)
        const to = getPosition(currIdx)
        return (
          <line
            key={`line-${goal.id}`}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="rgba(212, 168, 67, 0.4)" strokeWidth="1" strokeDasharray="4 3"
          />
        )
      })}

      {/* Stars for all goals */}
      {goals.map((goal, i) => {
        const pos = getPosition(i)
        const isAchieved = goal.status === 'achieved'
        const isGrowing = goal.status === 'growing'
        return (
          <g key={goal.id}>
            {isAchieved && (
              <circle cx={pos.x} cy={pos.y} r={8} fill="rgba(212, 168, 67, 0.15)">
                <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={pos.x} cy={pos.y}
              r={isAchieved ? 3.5 : isGrowing ? 2.5 : 1.5}
              fill={isAchieved ? '#D4A843' : isGrowing ? 'rgba(212, 168, 67, 0.5)' : 'rgba(255,255,255,0.25)'}
            >
              {isAchieved && (
                <animate
                  attributeName="opacity" values="0.8;1;0.8"
                  dur={`${2 + (i % 3)}s`} repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        )
      })}
    </svg>
  )
}

function CorkBoardSlot({ index, slot, item, onImageUpload, onCaptionChange, fileInputRef }) {
  return (
    <div style={{ transform: `rotate(${slot.rotate}deg)` }}>
      {/* Push pin */}
      <div style={{
        width: 14, height: 14, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${PIN_COLORS[index]}, ${PIN_COLORS[index]}88)`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        margin: '0 auto -7px', position: 'relative', zIndex: 2,
      }} />

      {/* Polaroid frame */}
      <div style={{
        background: '#fff',
        padding: '8px 8px 24px',
        boxShadow: '2px 3px 8px rgba(0,0,0,0.15)',
        borderRadius: 1,
      }}>
        {item?.dataUrl ? (
          <>
            <img
              src={item.dataUrl}
              alt={item.caption || 'vision board photo'}
              style={{
                width: '100%', height: 'auto', display: 'block',
                cursor: 'pointer', borderRadius: 1,
              }}
              onClick={() => fileInputRef?.click()}
            />
            <input
              type="text"
              value={item.caption || ''}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="add a caption..."
              maxLength={60}
              style={{
                width: '100%', border: 'none', outline: 'none',
                fontFamily: 'var(--font-hand)', fontSize: '0.7rem',
                textAlign: 'center', color: '#666',
                marginTop: 4, background: 'transparent',
              }}
            />
          </>
        ) : (
          <div
            onClick={() => fileInputRef?.click()}
            style={{
              width: '100%', aspectRatio: '4/3',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: '#F5F0EA', cursor: 'pointer', borderRadius: 1,
            }}
          >
            <span style={{ fontSize: '1.2rem', marginBottom: 4 }}>📌</span>
            <span style={{
              fontFamily: 'var(--font-hand)', fontSize: '0.7rem',
              color: '#A09080',
            }}>
              pin a dream here ✨
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) compressAndUpload(file, onImageUpload)
          e.target.value = ''
        }}
      />
    </div>
  )
}

function compressAndUpload(file, callback) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const MAX_WIDTH = 400
      let width = img.width
      let height = img.height
      if (width > MAX_WIDTH) {
        height = (height * MAX_WIDTH) / width
        width = MAX_WIDTH
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      callback(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}
