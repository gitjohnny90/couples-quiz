/**
 * Hand-drawn SVG doodle elements scattered throughout the app.
 * Every shape is intentionally wonky and imperfect.
 */

// Wobbly heart
export function DoodleHeart({ size = 24, color = '#E88D7A', opacity = 0.4, rotate = 0, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path
        d="M16 28 C12 24, 2 18, 3 11 C4 6, 9 4, 13 7 C14.5 8.5, 15.5 9, 16 10 C16.5 9, 17.5 8.5, 19 7 C23 4, 28 6, 29 11 C30 18, 20 24, 16 28Z"
        fill={color}
        opacity="0.7"
      />
    </svg>
  )
}

// Wonky star
export function DoodleStar({ size = 24, color = '#D4A843', opacity = 0.35, rotate = 0, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path
        d="M16 3 L18.5 12 L28 12.5 L20.5 18 L23 27 L16 21.5 L9 27 L11.5 18 L4 12.5 L13.5 12 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  )
}

// Squiggly arrow
export function DoodleArrow({ width = 60, color = '#B8A08A', opacity = 0.4, rotate = 0, style = {} }) {
  return (
    <svg width={width} height="20" viewBox="0 0 60 20" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path
        d="M4 12 Q15 6, 25 11 T48 9"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M44 5 L49 9 L43 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// Spiral / swirl
export function DoodleSpiral({ size = 28, color = '#D4C4B0', opacity = 0.4, rotate = 0, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path
        d="M16 18 C14 18, 13 16, 13 15 C13 13, 15 12, 17 12 C20 12, 21 14.5, 21 16.5 C21 20, 18 22, 15 22 C11 22, 9 19, 9 15.5 C9 11, 12.5 8, 16.5 8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// Tiny flower
export function DoodleFlower({ size = 22, color = '#E88D7A', opacity = 0.35, rotate = 0, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <circle cx="12" cy="12" r="2.5" fill="#D4A843" opacity="0.8" />
      <ellipse cx="12" cy="7" rx="2" ry="3" fill={color} opacity="0.6" />
      <ellipse cx="12" cy="17" rx="2" ry="3" fill={color} opacity="0.6" />
      <ellipse cx="7" cy="12" rx="3" ry="2" fill={color} opacity="0.6" />
      <ellipse cx="17" cy="12" rx="3" ry="2" fill={color} opacity="0.6" />
      <path d="M12 18 L12 24" stroke="#7CAE7A" strokeWidth="1" opacity="0.5" />
      <path d="M11 21 Q12 19, 14 20" stroke="#7CAE7A" strokeWidth="0.8" opacity="0.4" fill="none" />
    </svg>
  )
}

// Cloud / thought bubble
export function DoodleCloud({ size = 40, color = '#D4C4B0', opacity = 0.3, style = {} }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 48 28" fill="none" style={{ opacity, ...style }}>
      <path
        d="M12 22 Q6 22, 6 17 Q6 13, 10 12 Q9 8, 13 6 Q17 4, 21 6 Q23 3, 28 4 Q33 5, 33 9 Q37 8, 39 11 Q42 14, 39 18 Q40 22, 36 22 Z"
        fill={color}
        opacity="0.5"
      />
    </svg>
  )
}

// Exclamation doodle
export function DoodleBang({ size = 20, color = '#E88D7A', opacity = 0.45, rotate = -5, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 24" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path d="M7 2 L9 2 L8.5 15 L7.5 15 Z" fill={color} />
      <circle cx="8" cy="20" r="2" fill={color} />
    </svg>
  )
}

// Little leaf
export function DoodleLeaf({ size = 18, color = '#7CAE7A', opacity = 0.35, rotate = 0, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" style={{ opacity, transform: `rotate(${rotate}deg)`, ...style }}>
      <path
        d="M10 18 Q4 14, 4 8 Q4 3, 10 2 Q16 3, 16 8 Q16 14, 10 18Z"
        fill={color}
        opacity="0.6"
      />
      <path d="M10 17 L10 4" stroke="#5A8A58" strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

// Squiggly underline (for text decoration)
export function SquigglyUnderline({ width = 120, color = '#E88D7A', opacity = 0.5, style = {} }) {
  return (
    <svg width={width} height="6" viewBox={`0 0 ${width} 6`} fill="none" style={{ opacity, display: 'block', ...style }}>
      <path
        d={`M0 3 ${Array.from({ length: Math.floor(width / 10) }, (_, i) =>
          `Q${i * 10 + 5} ${i % 2 === 0 ? 1 : 5}, ${(i + 1) * 10} 3`
        ).join(' ')}`}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * PageDoodles — Scatters doodles in the corners and margins of a page.
 * Pass a `seed` prop to get different arrangements per page.
 */
export default function PageDoodles({ seed = 0 }) {
  // Simple seeded "randomness" for consistent-but-varied placement
  const v = (i) => ((seed * 7 + i * 13) % 17) / 17

  return (
    <>
      {/* Top-right corner doodles */}
      <div className="doodle" style={{ top: 8, right: 12 }}>
        <DoodleHeart size={18 + v(0) * 8} rotate={-8 + v(1) * 16} opacity={0.3 + v(2) * 0.15} />
      </div>

      {/* Top-left margin area */}
      <div className="doodle" style={{ top: 60 + v(3) * 40, left: 12 }}>
        <DoodleStar size={14 + v(4) * 6} color="#D4A843" rotate={v(5) * 30} opacity={0.25 + v(6) * 0.15} />
      </div>

      {/* Mid-right spiral */}
      <div className="doodle" style={{ top: 280 + v(7) * 100, right: 8 }}>
        <DoodleSpiral size={20 + v(8) * 8} rotate={v(9) * 40 - 20} />
      </div>

      {/* Bottom-left flower */}
      <div className="doodle" style={{ bottom: 140 + v(10) * 60, left: 16 }}>
        <DoodleFlower size={16 + v(11) * 8} rotate={-10 + v(12) * 20} />
      </div>

      {/* Bottom-right leaf */}
      <div className="doodle" style={{ bottom: 120 + v(13) * 80, right: 16 }}>
        <DoodleLeaf size={14 + v(14) * 6} rotate={20 + v(15) * 30} />
      </div>

      {/* Extra heart in the left margin */}
      <div className="doodle" style={{ top: 180 + v(16) * 60, left: 20 }}>
        <DoodleHeart size={11 + v(0) * 5} color="#D4A843" rotate={10} opacity={0.25} />
      </div>
    </>
  )
}
