import { useRef, useState, useEffect, useCallback } from 'react'

const COLORS = [
  { name: 'pencil', value: '#3D2C2C' },
  { name: 'coral', value: '#E88D7A' },
  { name: 'blue', value: '#6B8DAD' },
  { name: 'sage', value: '#7CAE7A' },
]

const CANVAS_W = 600
const CANVAS_H = 450
const LINE_WIDTH = 3.5

export default function DrawingCanvas({ onDrawingChange, disabled }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState(COLORS[0].value)
  const [strokes, setStrokes] = useState([])
  const currentStroke = useRef([])

  // Re-render all strokes onto canvas
  const redrawAll = useCallback((strokeList) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

    strokeList.forEach((stroke) => {
      if (stroke.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      const pts = stroke.points
      ctx.moveTo(pts[0].x, pts[0].y)

      // Smooth quadratic curves through midpoints
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i].x + pts[i + 1].x) / 2
        const midY = (pts[i].y + pts[i + 1].y) / 2
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
      }
      // Last point
      const last = pts[pts.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    })
  }, [])

  // Get canvas-relative coordinates from pointer event
  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    }
  }

  const handlePointerDown = (e) => {
    if (disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    canvas.setPointerCapture(e.pointerId)
    setIsDrawing(true)

    const pos = getPos(e)
    currentStroke.current = [pos]

    // Draw a dot for single taps
    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(pos.x, pos.y, LINE_WIDTH / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const handlePointerMove = (e) => {
    if (!isDrawing || disabled) return
    e.preventDefault()

    const pos = getPos(e)
    currentStroke.current.push(pos)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pts = currentStroke.current

    if (pts.length < 2) return

    // Draw just the latest segment for performance
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = LINE_WIDTH
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (pts.length === 2) {
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
    } else {
      const i = pts.length - 2
      const prev = pts[i - 1] || pts[i]
      const curr = pts[i]
      const next = pts[i + 1]
      const midX = (curr.x + next.x) / 2
      const midY = (curr.y + next.y) / 2
      const prevMidX = (prev.x + curr.x) / 2
      const prevMidY = (prev.y + curr.y) / 2
      ctx.moveTo(prevMidX, prevMidY)
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY)
    }
    ctx.stroke()
  }

  const handlePointerUp = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)

    if (currentStroke.current.length > 0) {
      const newStroke = {
        color,
        width: LINE_WIDTH,
        points: [...currentStroke.current],
      }
      const newStrokes = [...strokes, newStroke]
      setStrokes(newStrokes)
      currentStroke.current = []

      // Notify parent with latest drawing data
      if (onDrawingChange) {
        const canvas = canvasRef.current
        onDrawingChange(canvas.toDataURL('image/png'), newStrokes.length)
      }
    }
  }

  const handleUndo = () => {
    if (disabled || strokes.length === 0) return
    const newStrokes = strokes.slice(0, -1)
    setStrokes(newStrokes)
    redrawAll(newStrokes)
    if (onDrawingChange) {
      const canvas = canvasRef.current
      // Need to wait a tick for redraw to finish
      requestAnimationFrame(() => {
        onDrawingChange(canvas.toDataURL('image/png'), newStrokes.length)
      })
    }
  }

  const handleClear = () => {
    if (disabled) return
    setStrokes([])
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    }
    if (onDrawingChange) {
      onDrawingChange(null, 0)
    }
  }

  // Initialize canvas background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  }, [])

  return (
    <div className="drawing-canvas-area">
      {/* The torn paper canvas wrapper */}
      <div className="torn-paper-wrap">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="drawing-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ opacity: disabled ? 0.6 : 1 }}
        />
        {/* Torn bottom edge overlay */}
        <div className="torn-edge" />
      </div>

      {/* Toolbar */}
      {!disabled && (
        <div className="draw-toolbar">
          <div className="color-picker">
            {COLORS.map((c) => (
              <button
                key={c.name}
                className={`color-dot${color === c.value ? ' active' : ''}`}
                style={{ background: c.value }}
                onClick={() => setColor(c.value)}
                aria-label={c.name}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary draw-tool-btn"
              onClick={handleUndo}
              disabled={strokes.length === 0}
            >
              undo
            </button>
            <button
              className="btn btn-secondary draw-tool-btn"
              onClick={handleClear}
              disabled={strokes.length === 0}
            >
              clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
