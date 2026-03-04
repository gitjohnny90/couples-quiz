import { useContext, useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SessionContext } from '../App'
import { supabase } from '../lib/supabase'
import movieGenres from '../data/movieGenres'
import SpinningWheel from '../components/SpinningWheel'
import { motion, AnimatePresence } from 'framer-motion'
import PageDoodles, { DoodleStar, SquigglyUnderline, DoodleHeart } from '../components/Doodles'

const VETO_KEY = 'movie_vetoes'
const MAX_VETOES = 2

function getVetoInfo() {
  try {
    const raw = localStorage.getItem(VETO_KEY)
    if (!raw) return { count: 0, weekStart: Date.now() }
    const data = JSON.parse(raw)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - data.weekStart > weekMs) return { count: 0, weekStart: Date.now() }
    return data
  } catch { return { count: 0, weekStart: Date.now() } }
}

function saveVeto() {
  const info = getVetoInfo()
  const updated = { count: info.count + 1, weekStart: info.weekStart || Date.now() }
  localStorage.setItem(VETO_KEY, JSON.stringify(updated))
  return updated
}

function StarRating({ rating, onRate, size = 22 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={(e) => { e.stopPropagation(); onRate(star) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            fontSize: size, color: star <= rating ? '#D4A843' : '#D4C4B0',
            transition: 'transform 0.1s',
          }}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export default function MoviesPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setSessionId, playerName } = useContext(SessionContext)

  const [items, setItems] = useState([])
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGenre, setNewGenre] = useState('')

  // Pick For Us state
  const [currentPick, setCurrentPick] = useState(null)
  const [pickRevealed, setPickRevealed] = useState(false)
  const [vetoInfo, setVetoInfo] = useState(getVetoInfo())

  // Genre wheel state
  const [selectedGenre, setSelectedGenre] = useState(movieGenres[0]?.id)
  const [wheelResult, setWheelResult] = useState(null)

  const playerId = localStorage.getItem('playerId') || 'player1'

  useEffect(() => {
    if (sessionId) setSessionId(sessionId)
    fetchData()
    const channel = supabase
      .channel(`shared-items-movies-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_items', filter: `session_id=eq.${sessionId}` }, () => fetchData())
      .subscribe()
    // Polling fallback — realtime can be unreliable
    const interval = setInterval(fetchData, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [sessionId])

  const fetchData = async () => {
    const [{ data: sessionData }, { data: itemData }] = await Promise.all([
      supabase.from('sessions').select('*').eq('id', sessionId).single(),
      supabase.from('shared_items').select('*').eq('session_id', sessionId).eq('type', 'movie').order('created_at', { ascending: false }),
    ])
    setSession(sessionData)
    if (itemData) setItems(itemData)
    setLoading(false)
  }

  const addItem = async () => {
    if (!newTitle.trim()) return
    await supabase.from('shared_items').insert({
      session_id: sessionId,
      type: 'movie',
      title: newTitle.trim(),
      genre: newGenre || null,
      added_by: playerId,
      source: 'manual',
    })
    setNewTitle('')
    setNewGenre('')
    setShowAdd(false)
    fetchData()
  }

  const addFromWheel = async (title) => {
    const genre = movieGenres.find((g) => g.id === selectedGenre)
    await supabase.from('shared_items').insert({
      session_id: sessionId,
      type: 'movie',
      title: title,
      genre: genre?.name || null,
      added_by: playerId,
      source: 'wheel',
    })
    fetchData()
  }

  const updateStatus = async (item, newStatus) => {
    await supabase.from('shared_items').update({ status: newStatus }).eq('id', item.id)
    fetchData()
  }

  const rateItem = async (item, rating) => {
    const field = playerId === 'player1' ? 'player1_rating' : 'player2_rating'
    await supabase.from('shared_items').update({ [field]: rating }).eq('id', item.id)
    fetchData()
  }

  const deleteItem = async (item) => {
    await supabase.from('shared_items').delete().eq('id', item.id)
    fetchData()
  }

  // Categorize items
  const wantItems = items.filter((i) => i.status === 'want')
  const currentItems = items.filter((i) => i.status === 'current')
  const finishedItems = items.filter((i) => i.status === 'finished')

  // Fun stats
  const totalWatched = finishedItems.length
  const avgMatch = useMemo(() => {
    const rated = finishedItems.filter((i) => i.player1_rating && i.player2_rating)
    if (rated.length === 0) return null
    const matchCount = rated.filter((i) => i.player1_rating === i.player2_rating).length
    return Math.round((matchCount / rated.length) * 100)
  }, [finishedItems])

  // Pick For Us logic
  const pickRandom = () => {
    if (wantItems.length === 0) return
    const idx = Math.floor(Math.random() * wantItems.length)
    setCurrentPick(wantItems[idx])
    setPickRevealed(false)
    setTimeout(() => setPickRevealed(true), 600)
  }

  const acceptPick = async () => {
    if (!currentPick) return
    await updateStatus(currentPick, 'current')
    setCurrentPick(null)
    setPickRevealed(false)
    setTab('list')
  }

  const vetoPick = () => {
    const updated = saveVeto()
    setVetoInfo(updated)
    pickRandom()
  }

  const tabs = [
    { id: 'list', label: 'our list' },
    { id: 'pick', label: '🎲 pick' },
    { id: 'wheel', label: '🎡 wheel' },
  ]

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', color: 'var(--text-secondary)' }}>
            loading the watchlist...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={20} />
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', fontWeight: 700, marginBottom: 2 }}>
            🎬 movies
          </h1>
          <SquigglyUnderline width={90} color="#E88D7A" opacity={0.4} style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.4 }}>
            build a shared watchlist, spin the genre wheel, or let us pick
          </p>
          {totalWatched > 0 && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {totalWatched} watched together
              {avgMatch !== null && <> &middot; {avgMatch}% rating match</>}
            </p>
          )}
        </div>

        {/* Tab switcher */}
        <div className="media-tabs" style={{ marginBottom: 16 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`media-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== OUR LIST TAB ===== */}
        {tab === 'list' && (
          <div>
            {/* Add movie */}
            {!showAdd ? (
              <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 16 }} onClick={() => setShowAdd(true)}>
                + add a movie
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 16, marginBottom: 16 }}>
                <input
                  className="input"
                  placeholder="movie title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  autoFocus
                  style={{ marginBottom: 10 }}
                />
                <select value={newGenre} onChange={(e) => setNewGenre(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">genre (optional)</option>
                  {movieGenres.map((g) => <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={addItem}>add</button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowAdd(false); setNewTitle(''); setNewGenre('') }}>cancel</button>
                </div>
              </motion.div>
            )}

            {/* Currently watching */}
            {currentItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--accent-coral)', marginBottom: 8 }}>
                  🍿 currently watching
                </h3>
                {currentItems.map((item) => (
                  <MovieCard key={item.id} item={item} session={session} playerId={playerId}
                    onStatusChange={updateStatus} onRate={rateItem} onDelete={deleteItem} />
                ))}
              </div>
            )}

            {/* Want to watch */}
            {wantItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--accent-mustard)', marginBottom: 8 }}>
                  ✨ want to watch ({wantItems.length})
                </h3>
                {wantItems.map((item) => (
                  <MovieCard key={item.id} item={item} session={session} playerId={playerId}
                    onStatusChange={updateStatus} onRate={rateItem} onDelete={deleteItem} />
                ))}
              </div>
            )}

            {/* Finished */}
            {finishedItems.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--accent-sage)', marginBottom: 8 }}>
                  ✓ finished ({finishedItems.length})
                </h3>
                {finishedItems.map((item) => (
                  <MovieCard key={item.id} item={item} session={session} playerId={playerId}
                    onStatusChange={updateStatus} onRate={rateItem} onDelete={deleteItem} />
                ))}
              </div>
            )}

            {items.length === 0 && (
              <div className="sticky-note" style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                  no movies yet!
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
                  add one above or spin the genre wheel ~
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== PICK FOR US TAB ===== */}
        {tab === 'pick' && (
          <div style={{ textAlign: 'center' }}>
            <div className="sticky-note" style={{ padding: 22, marginBottom: 18, textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', marginBottom: 4 }}>
                can't decide what to watch?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                we'll pick from your "want to watch" list!
              </p>
            </div>

            {wantItems.length === 0 ? (
              <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                  add some movies to your list first!
                </p>
                <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setTab('list')}>
                  go to list →
                </button>
              </div>
            ) : (
              <>
                {!currentPick && (
                  <motion.button
                    className="btn btn-primary"
                    style={{ fontSize: '1.2rem', padding: '16px 32px' }}
                    onClick={pickRandom}
                    whileTap={{ scale: 0.95 }}
                  >
                    🎲 pick for us!
                  </motion.button>
                )}

                <AnimatePresence>
                  {currentPick && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: pickRevealed ? 0 : 180 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: 'spring', damping: 12 }}
                      className="glass"
                      style={{ padding: 28, textAlign: 'center', marginTop: 12, marginBottom: 16 }}
                    >
                      {pickRevealed ? (
                        <>
                          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                            tonight you're watching:
                          </p>
                          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-coral)', lineHeight: 1.2, marginBottom: 4 }}>
                            {currentPick.title}
                          </p>
                          {currentPick.genre && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: 14 }}>
                              {currentPick.genre}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-primary" style={{ flex: 1 }} onClick={acceptPick}>
                              this one! 🍿
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ flex: 1 }}
                              onClick={vetoPick}
                              disabled={vetoInfo.count >= MAX_VETOES}
                            >
                              nah, next 🙅
                            </button>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: 8 }}>
                            {MAX_VETOES - vetoInfo.count} veto{MAX_VETOES - vetoInfo.count !== 1 ? 'es' : ''} left this week
                          </p>
                        </>
                      ) : (
                        <div style={{ fontFamily: 'var(--font-hand)', fontSize: '2rem', color: 'var(--text-light)' }}>
                          🤫
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {currentPick && pickRevealed && (
                  <button className="btn btn-secondary" style={{ marginTop: 4 }} onClick={() => { setCurrentPick(null); setPickRevealed(false) }}>
                    pick again
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== GENRE WHEEL TAB ===== */}
        {tab === 'wheel' && (
          <div>
            {/* Genre selector */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
              {movieGenres.map((g) => (
                <button
                  key={g.id}
                  className={`genre-chip${selectedGenre === g.id ? ' active' : ''}`}
                  onClick={() => { setSelectedGenre(g.id); setWheelResult(null) }}
                >
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>

            {/* Wheel */}
            {selectedGenre && (
              <SpinningWheel
                key={selectedGenre}
                items={movieGenres.find((g) => g.id === selectedGenre)?.titles || []}
                onResult={(title) => setWheelResult(title)}
              />
            )}

            {/* Add to list button */}
            {wheelResult && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 12, textAlign: 'center' }}>
                <button className="btn btn-primary" onClick={() => addFromWheel(wheelResult)}>
                  + add "{wheelResult}" to our list
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Watch together guide link */}
        <div
          className="sticky-note"
          style={{ padding: 16, marginTop: 22, textAlign: 'center', cursor: 'pointer', transform: 'rotate(-0.5deg)' }}
          onClick={() => navigate(`/watch-guide/${sessionId}`)}
        >
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            🍿 how to actually watch together →
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 2 }}>
            apps & tools for long-distance movie nights
          </p>
        </div>

        {/* Back button */}
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 14 }} onClick={() => navigate(`/fun/${sessionId}`)}>
          ← back to fun stuff
        </button>
      </motion.div>
    </div>
  )
}

// ===== Movie Card Component =====
function MovieCard({ item, session, playerId, onStatusChange, onRate, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusOptions = [
    { value: 'want', label: 'want to watch', color: 'var(--accent-mustard)' },
    { value: 'current', label: 'watching now', color: 'var(--accent-coral)' },
    { value: 'finished', label: 'finished', color: 'var(--accent-sage)' },
  ]

  const currentStatus = statusOptions.find((s) => s.value === item.status)
  const addedByName = item.added_by === 'player1' ? session?.player1_name : session?.player2_name
  const myRating = playerId === 'player1' ? item.player1_rating : item.player2_rating
  const theirRating = playerId === 'player1' ? item.player2_rating : item.player1_rating

  return (
    <motion.div
      layout
      className="glass"
      style={{ padding: 14, marginBottom: 8, cursor: 'pointer' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', marginBottom: 1 }}>
            {item.title}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {item.genre && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: '#F5F0EA', padding: '1px 6px', borderRadius: 2 }}>
                {item.genre}
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              added by {addedByName || item.added_by}
            </span>
            {item.source === 'wheel' && (
              <span style={{ fontSize: '0.7rem' }}>🎡</span>
            )}
          </div>
        </div>
        <div style={{
          fontSize: '0.8rem', fontFamily: 'var(--font-hand)', fontWeight: 600,
          color: currentStatus?.color, flexShrink: 0,
        }}>
          {currentStatus?.label}
        </div>
      </div>

      {/* Expanded area */}
      {expanded && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, borderTop: '1px solid var(--rule-line)', paddingTop: 12 }}>
          {/* Status changer */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={(e) => { e.stopPropagation(); onStatusChange(item, s.value) }}
                style={{
                  padding: '4px 10px', fontSize: '0.8rem', fontFamily: 'var(--font-body)',
                  border: `1.5px solid ${item.status === s.value ? s.color : 'var(--border-pencil)'}`,
                  background: item.status === s.value ? s.color : 'transparent',
                  color: item.status === s.value ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 3, cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Ratings (show for finished items) */}
          {item.status === 'finished' && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                rate it:
              </p>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--accent-coral)', fontFamily: 'var(--font-hand)' }}>you</p>
                  <StarRating rating={myRating || 0} onRate={(r) => onRate(item, r)} />
                </div>
                {theirRating && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-hand)' }}>them</p>
                    <StarRating rating={theirRating} onRate={() => {}} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
              style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--text-light)', cursor: 'pointer', padding: '4px 0' }}
            >
              remove from list
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>sure?</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item) }}
                style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--accent-coral)', cursor: 'pointer', fontWeight: 600 }}
              >
                yes, remove
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: 'var(--text-light)', cursor: 'pointer' }}
              >
                cancel
              </button>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
