import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const COLORS = [
  '#E88D7A', '#6B8DAD', '#7CAE7A', '#D4A843',
  '#B88BBF', '#E8A87A', '#7AB8AE', '#D47A8D',
  '#8DAD6B', '#AD8D6B',
]

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`
}

function truncateText(text, maxLen) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1) + '\u2026'
}

export default function SpinningWheel({ items = [], onResult, disabled = false }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState(null)
  const wheelRef = useRef(null)

  const n = items.length
  if (n === 0) return null

  const segmentAngle = 360 / n
  const cx = 160, cy = 160, r = 150

  const spin = () => {
    if (spinning || disabled) return
    setSpinning(true)
    setResult(null)

    const winnerIndex = Math.floor(Math.random() * n)
    // Spin 4-6 full rotations + land on winner segment center
    const extraSpins = (4 + Math.random() * 2) * 360
    // The pointer is at the top (0 degrees)
    // To land segment i at the top: rotate so segment center aligns with 0
    const targetAngle = winnerIndex * segmentAngle + segmentAngle / 2
    const totalRotation = rotation + extraSpins + (360 - targetAngle)

    setRotation(totalRotation)

    // Wait for animation to finish
    setTimeout(() => {
      setSpinning(false)
      setResult(items[winnerIndex])
      if (onResult) onResult(items[winnerIndex])
    }, 4200)
  }

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Pointer triangle */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div style={{
          position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, width: 0, height: 0,
          borderLeft: '12px solid transparent', borderRight: '12px solid transparent',
          borderTop: '20px solid var(--text-primary)',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
        }} />

        {/* Wheel */}
        <svg
          ref={wheelRef}
          width="320" height="320" viewBox="0 0 320 320"
          style={{
            maxWidth: '100%',
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {/* Outer ring with hand-drawn feel */}
          <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="var(--text-primary)" strokeWidth="2.5"
            strokeDasharray="4 2" opacity={0.6} />

          {/* Segments */}
          {items.map((item, i) => {
            const startAngle = i * segmentAngle
            const endAngle = startAngle + segmentAngle
            const midAngle = startAngle + segmentAngle / 2
            const color = COLORS[i % COLORS.length]

            // Text position — along the radius
            const textR = r * 0.62
            const textPos = polarToCartesian(cx, cy, textR, midAngle)
            const textRotation = midAngle

            return (
              <g key={i}>
                <path
                  d={describeArc(cx, cy, r, startAngle, endAngle)}
                  fill={color}
                  stroke="#fff"
                  strokeWidth="1.5"
                  opacity={0.85}
                />
                <text
                  x={textPos.x}
                  y={textPos.y}
                  transform={`rotate(${textRotation}, ${textPos.x}, ${textPos.y})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontFamily="'Patrick Hand', cursive"
                  fontSize={n > 15 ? '8' : n > 10 ? '9.5' : '11'}
                  fontWeight="600"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {truncateText(item, n > 15 ? 16 : 20)}
                </text>
              </g>
            )
          })}

          {/* Center circle */}
          <circle cx={cx} cy={cy} r={18} fill="var(--bg-paper)" stroke="var(--text-primary)" strokeWidth="2" />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Caveat', cursive" fontSize="12" fill="var(--text-primary)" fontWeight="700">
            spin!
          </text>
        </svg>
      </div>

      {/* Spin button */}
      <div style={{ marginTop: 14 }}>
        <button
          className="btn btn-primary"
          onClick={spin}
          disabled={spinning || disabled}
          style={{ minWidth: 140 }}
        >
          {spinning ? 'spinning...' : 'spin the wheel!'}
        </button>
      </div>

      {/* Result display */}
      {result && !spinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="sticky-note"
          style={{ padding: 18, marginTop: 16, textAlign: 'center', transform: 'rotate(-1deg)' }}
        >
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
            the wheel has spoken:
          </p>
          <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-coral)' }}>
            {result}
          </p>
        </motion.div>
      )}
    </div>
  )
}
