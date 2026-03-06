import { useState, useEffect, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { SquigglyUnderline, DoodleStar } from '../components/Doodles'

const PACK_ID = 'study-together'
const PLAYER_ID = 'shared'

const SHELVES = [
  { key: 'growth', label: 'Personal Growth', emoji: '🌳', color: '#8DAE8B', bg: '#EFF5EF' },
  { key: 'couples', label: 'Marriage & Couples', emoji: '💕', color: '#E88D7A', bg: '#FFF0EC' },
  { key: 'faith', label: 'Faith & Christian', emoji: '🕊️', color: '#7EB8D8', bg: '#EDF5FA' },
]

const STATUSES = ['want', 'reading', 'finished', 'reflected']
const STATUS_LABELS = {
  want: 'want to read',
  reading: 'reading',
  finished: 'finished',
  reflected: 'reflected ✨',
}

const GUIDED_PROMPTS = [
  { key: 'takeaway', label: 'biggest takeaway from this book' },
  { key: 'changedUs', label: 'something that changed how you think about us' },
  { key: 'tryApply', label: 'one thing you want to try or apply' },
  { key: 'surprised', label: 'something that surprised you' },
]

const PLAYER_COLORS = {
  player1: '#E88D7A',
  player2: '#7EB8D8',
}

const DEFAULT_DATA = { books: [] }

export default function StudyTogetherPage() {
  const { sessionId } = useParams()
  const { setSessionId, playerName, playerId } = useContext(SessionContext)
  const partnerId = playerId === 'player1' ? 'player2' : 'player1'

  const [data, setData] = useState(DEFAULT_DATA)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedBookId, setExpandedBookId] = useState(null)
  const [newBookTitles, setNewBookTitles] = useState({ growth: '', couples: '', faith: '' })
  // Per-book draft reflections so user can type before saving
  const [draftReflections, setDraftReflections] = useState({})
  const [partnerName, setPartnerName] = useState(null)

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
  }, [sessionId])

  // Fetch partner name from sessions table
  useEffect(() => {
    if (!sessionId || !playerId) return
    const fetchPartner = async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('player1_name, player2_name')
        .eq('id', sessionId)
        .maybeSingle()
      if (session) {
        setPartnerName(
          playerId === 'player1' ? session.player2_name : session.player1_name
        )
      }
    }
    fetchPartner()
  }, [sessionId, playerId])

  // Fetch data
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

  // Realtime + polling
  useEffect(() => {
    const channel = supabase
      .channel(`study-${sessionId}`)
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
    const interval = setInterval(fetchData, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
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

  // ── Handlers ──

  const handleAddBook = (shelfKey) => {
    const title = newBookTitles[shelfKey]?.trim()
    if (!title) return
    const book = {
      id: crypto.randomUUID(),
      title,
      shelf: shelfKey,
      status: 'want',
      addedBy: playerId,
      addedAt: new Date().toISOString(),
      reflections: {},
    }
    const updated = { ...data, books: [...data.books, book] }
    saveData(updated)
    setNewBookTitles(prev => ({ ...prev, [shelfKey]: '' }))
  }

  const handleUpdateStatus = (bookId, newStatus) => {
    const books = data.books.map(b => {
      if (b.id !== bookId) return b
      return { ...b, status: newStatus }
    })
    saveData({ ...data, books })
  }

  const handleSaveReflection = (bookId) => {
    const draft = draftReflections[bookId]
    if (!draft) return
    const books = data.books.map(b => {
      if (b.id !== bookId) return b
      const updatedReflections = {
        ...b.reflections,
        [playerId]: {
          guided: draft.guided || {},
          freeform: draft.freeform || '',
          savedAt: new Date().toISOString(),
        },
      }
      // Auto-set reflected when both partners have reflections
      const bothReflected = updatedReflections.player1?.savedAt && updatedReflections.player2?.savedAt
      return {
        ...b,
        reflections: updatedReflections,
        status: bothReflected ? 'reflected' : b.status,
      }
    })
    saveData({ ...data, books })
  }

  const handleDeleteBook = (bookId) => {
    const books = data.books.filter(b => b.id !== bookId)
    saveData({ ...data, books })
    if (expandedBookId === bookId) setExpandedBookId(null)
  }

  // Initialize draft reflections when expanding a book
  const handleExpandBook = (bookId) => {
    if (expandedBookId === bookId) {
      setExpandedBookId(null)
      return
    }
    setExpandedBookId(bookId)
    const book = data.books.find(b => b.id === bookId)
    if (book) {
      const existing = book.reflections?.[playerId]
      setDraftReflections(prev => ({
        ...prev,
        [bookId]: {
          guided: existing?.guided || {},
          freeform: existing?.freeform || '',
        },
      }))
    }
  }

  const updateDraft = (bookId, field, value) => {
    setDraftReflections(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        [field]: value,
      },
    }))
  }

  const updateDraftGuided = (bookId, promptKey, value) => {
    setDraftReflections(prev => ({
      ...prev,
      [bookId]: {
        ...prev[bookId],
        guided: {
          ...(prev[bookId]?.guided || {}),
          [promptKey]: value,
        },
      },
    }))
  }

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            finding your bookshelf...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={17} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700, marginBottom: 2 }}>
            study together
          </h1>
          <SquigglyUnderline width={110} color="#8DAE8B" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.4, maxWidth: 320, margin: '0 auto' }}>
            read the same book, then share what you each took away — watch how differently (and beautifully) you think
          </p>
        </div>

        {/* Shelves */}
        {SHELVES.map((shelf, si) => {
          const shelfBooks = data.books.filter(b => b.shelf === shelf.key)
          return (
            <motion.div
              key={shelf.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}
              style={{ marginBottom: 24 }}
            >
              {/* Shelf header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>{shelf.emoji}</span>
                <h2 style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: shelf.color,
                  margin: 0,
                }}>
                  {shelf.label}
                </h2>
                <span style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '0.8rem',
                  color: 'var(--text-light)',
                  marginLeft: 'auto',
                }}>
                  {shelfBooks.length > 0 ? `${shelfBooks.length} book${shelfBooks.length !== 1 ? 's' : ''}` : ''}
                </span>
              </div>

              {/* Book cards */}
              {shelfBooks.length === 0 && (
                <p style={{
                  fontFamily: 'var(--font-hand)',
                  fontSize: '0.9rem',
                  color: 'var(--text-light)',
                  textAlign: 'center',
                  padding: '12px 0',
                  fontStyle: 'italic',
                }}>
                  no books yet — add one below
                </p>
              )}

              <AnimatePresence>
                {shelfBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    shelf={shelf}
                    playerId={playerId}
                    playerName={playerName}
                    partnerId={partnerId}
                    partnerName={partnerName}
                    isExpanded={expandedBookId === book.id}
                    onToggle={() => handleExpandBook(book.id)}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={() => handleDeleteBook(book.id)}
                    onSaveReflection={() => handleSaveReflection(book.id)}
                    draft={draftReflections[book.id]}
                    onUpdateDraft={(field, value) => updateDraft(book.id, field, value)}
                    onUpdateDraftGuided={(key, value) => updateDraftGuided(book.id, key, value)}
                    saving={saving}
                  />
                ))}
              </AnimatePresence>

              {/* Add book input */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="text"
                  value={newBookTitles[shelf.key]}
                  onChange={(e) => setNewBookTitles(prev => ({ ...prev, [shelf.key]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddBook(shelf.key) }}
                  placeholder="book title..."
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.95rem',
                    padding: '8px 12px',
                    border: '1.5px solid var(--border-pencil)',
                    borderRadius: 10,
                    background: 'var(--bg-paper)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => handleAddBook(shelf.key)}
                  disabled={!newBookTitles[shelf.key]?.trim()}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${shelf.color}`,
                    background: newBookTitles[shelf.key]?.trim() ? shelf.color : 'transparent',
                    color: newBookTitles[shelf.key]?.trim() ? 'white' : shelf.color,
                    cursor: newBookTitles[shelf.key]?.trim() ? 'pointer' : 'default',
                    opacity: newBookTitles[shelf.key]?.trim() ? 1 : 0.4,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  add
                </button>
              </div>
            </motion.div>
          )
        })}

        {/* Saving indicator */}
        <AnimatePresence>
          {saving && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: 'var(--font-hand)',
                fontSize: '0.85rem',
                color: 'var(--text-light)',
                zIndex: 100,
              }}
            >
              saving...
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  )
}

// ── BookCard ──

function BookCard({
  book,
  shelf,
  playerId,
  playerName,
  partnerId,
  partnerName,
  isExpanded,
  onToggle,
  onUpdateStatus,
  onDelete,
  onSaveReflection,
  draft,
  onUpdateDraft,
  onUpdateDraftGuided,
  saving,
}) {
  const canReflect = book.status === 'finished' || book.status === 'reflected'
  const myReflection = book.reflections?.[playerId]
  const partnerReflection = book.reflections?.[partnerId]
  const isOwner = book.addedBy === playerId

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="glass"
      style={{
        marginBottom: 10,
        padding: isExpanded ? 16 : 14,
        cursor: 'pointer',
        borderLeft: `3px solid ${shelf.color}`,
        overflow: 'hidden',
      }}
      onClick={() => { if (!isExpanded) onToggle() }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}
        onClick={(e) => { if (isExpanded) { e.stopPropagation(); onToggle() } }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {book.title}
          </h3>
        </div>
        <StatusPill status={book.status} color={shelf.color} />
        <span style={{
          fontSize: '0.85rem',
          color: 'var(--text-light)',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▾
        </span>
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status selector */}
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              {STATUSES.map((s) => {
                const isActive = book.status === s
                // Don't let user manually set "reflected" — it's auto
                const isReflected = s === 'reflected'
                return (
                  <button
                    key={s}
                    onClick={() => !isReflected && onUpdateStatus(book.id, s)}
                    disabled={isReflected}
                    style={{
                      fontFamily: 'var(--font-hand)',
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 400,
                      padding: '4px 12px',
                      borderRadius: 20,
                      border: `1.5px solid ${isActive ? shelf.color : 'var(--border-pencil)'}`,
                      background: isActive ? shelf.color : 'transparent',
                      color: isActive ? 'white' : isReflected ? 'var(--text-light)' : 'var(--text-secondary)',
                      cursor: isReflected ? 'default' : 'pointer',
                      opacity: isReflected && !isActive ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                )
              })}
            </div>

            {/* Reflections section */}
            {canReflect && (
              <div style={{ marginTop: 16 }}>
                <div style={{
                  borderTop: '1px dashed var(--rule-line)',
                  paddingTop: 14,
                }}>
                  <h4 style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                  }}>
                    reflections
                  </h4>

                  {/* My reflection form */}
                  <ReflectionForm
                    draft={draft}
                    onUpdateDraft={onUpdateDraft}
                    onUpdateDraftGuided={onUpdateDraftGuided}
                    onSave={onSaveReflection}
                    saving={saving}
                    existing={myReflection}
                    playerColor={PLAYER_COLORS[playerId]}
                    label="your reflections"
                  />

                  {/* Partner's reflections */}
                  <div style={{ marginTop: 16 }}>
                    {partnerReflection?.savedAt ? (
                      <ReflectionDisplay
                        reflection={partnerReflection}
                        playerColor={PLAYER_COLORS[partnerId]}
                        label={`${partnerName || 'your partner'}'s reflections`}
                      />
                    ) : (
                      <p style={{
                        fontFamily: 'var(--font-hand)',
                        fontSize: '0.85rem',
                        color: 'var(--text-light)',
                        fontStyle: 'italic',
                        textAlign: 'center',
                        padding: '8px 0',
                      }}>
                        waiting for {partnerName || 'your partner'}'s reflections...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Delete button */}
            {isOwner && (
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button
                  onClick={onDelete}
                  style={{
                    fontFamily: 'var(--font-hand)',
                    fontSize: '0.75rem',
                    color: 'var(--text-light)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.5,
                    textDecoration: 'underline',
                    textDecorationStyle: 'wavy',
                    padding: '2px 4px',
                  }}
                >
                  remove book
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── StatusPill ──

function StatusPill({ status, color }) {
  return (
    <span style={{
      fontFamily: 'var(--font-hand)',
      fontSize: '0.72rem',
      fontWeight: 600,
      padding: '2px 10px',
      borderRadius: 12,
      background: status === 'reflected' ? color : 'transparent',
      color: status === 'reflected' ? 'white' : color,
      border: `1.5px solid ${color}`,
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

// ── ReflectionForm ──

function ReflectionForm({ draft, onUpdateDraft, onUpdateDraftGuided, onSave, saving, existing, playerColor, label }) {
  const hasExisting = !!existing?.savedAt
  const savedDate = hasExisting
    ? new Date(existing.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: playerColor, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: playerColor,
        }}>
          {label}
        </span>
        {savedDate && (
          <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', color: 'var(--text-light)' }}>
            — saved {savedDate}
          </span>
        )}
      </div>

      {/* Guided prompts */}
      {GUIDED_PROMPTS.map((prompt) => (
        <div key={prompt.key} style={{ marginBottom: 10 }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            marginBottom: 3,
          }}>
            {prompt.label}
          </label>
          <textarea
            value={draft?.guided?.[prompt.key] || ''}
            onChange={(e) => onUpdateDraftGuided(prompt.key, e.target.value)}
            rows={2}
            style={{
              width: '100%',
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              padding: '6px 10px',
              border: `1px solid ${playerColor}30`,
              borderRadius: 8,
              background: `${playerColor}08`,
              color: 'var(--text-primary)',
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.4,
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}

      {/* Freeform */}
      <div style={{ marginBottom: 10 }}>
        <label style={{
          display: 'block',
          fontFamily: 'var(--font-body)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          marginBottom: 3,
        }}>
          anything else you want to remember
        </label>
        <textarea
          value={draft?.freeform || ''}
          onChange={(e) => onUpdateDraft('freeform', e.target.value)}
          rows={3}
          style={{
            width: '100%',
            fontFamily: 'var(--font-hand)',
            fontSize: '0.9rem',
            padding: '6px 10px',
            border: `1px solid ${playerColor}30`,
            borderRadius: 8,
            background: `${playerColor}08`,
            color: 'var(--text-primary)',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.4,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '0.85rem',
          fontWeight: 600,
          padding: '6px 18px',
          borderRadius: 10,
          border: `1.5px solid ${playerColor}`,
          background: playerColor,
          color: 'white',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
      >
        {hasExisting ? 'update reflections' : 'save reflections'}
      </button>
    </div>
  )
}

// ── ReflectionDisplay (read-only partner view) ──

function ReflectionDisplay({ reflection, playerColor, label }) {
  const savedDate = new Date(reflection.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: playerColor, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: playerColor,
        }}>
          {label}
        </span>
        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '0.7rem', color: 'var(--text-light)' }}>
          — saved {savedDate}
        </span>
      </div>

      {GUIDED_PROMPTS.map((prompt) => {
        const val = reflection.guided?.[prompt.key]
        if (!val) return null
        return (
          <div key={prompt.key} style={{ marginBottom: 8 }}>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.72rem',
              color: 'var(--text-light)',
              display: 'block',
              marginBottom: 2,
            }}>
              {prompt.label}
            </span>
            <p style={{
              fontFamily: 'var(--font-hand)',
              fontSize: '0.9rem',
              color: playerColor,
              lineHeight: 1.4,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {val}
            </p>
          </div>
        )
      })}

      {reflection.freeform && (
        <div style={{ marginTop: 6 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.72rem',
            color: 'var(--text-light)',
            display: 'block',
            marginBottom: 2,
          }}>
            other thoughts
          </span>
          <p style={{
            fontFamily: 'var(--font-hand)',
            fontSize: '0.9rem',
            color: playerColor,
            lineHeight: 1.4,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {reflection.freeform}
          </p>
        </div>
      )}
    </div>
  )
}
