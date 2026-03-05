import { describe, it, expect } from 'vitest'
import { polarToCartesian, describeArc, truncateText } from './SpinningWheel'

describe('polarToCartesian', () => {
  const cx = 100, cy = 100, r = 50

  it('converts 0 degrees (top of circle)', () => {
    const { x, y } = polarToCartesian(cx, cy, r, 0)
    expect(x).toBeCloseTo(100)
    expect(y).toBeCloseTo(50) // top
  })

  it('converts 90 degrees (right of circle)', () => {
    const { x, y } = polarToCartesian(cx, cy, r, 90)
    expect(x).toBeCloseTo(150) // right
    expect(y).toBeCloseTo(100)
  })

  it('converts 180 degrees (bottom of circle)', () => {
    const { x, y } = polarToCartesian(cx, cy, r, 180)
    expect(x).toBeCloseTo(100)
    expect(y).toBeCloseTo(150) // bottom
  })

  it('converts 270 degrees (left of circle)', () => {
    const { x, y } = polarToCartesian(cx, cy, r, 270)
    expect(x).toBeCloseTo(50) // left
    expect(y).toBeCloseTo(100)
  })

  it('handles zero radius', () => {
    const { x, y } = polarToCartesian(100, 100, 0, 45)
    expect(x).toBeCloseTo(100)
    expect(y).toBeCloseTo(100)
  })
})

describe('describeArc', () => {
  it('returns an SVG path string starting with M', () => {
    const path = describeArc(100, 100, 50, 0, 90)
    expect(path).toMatch(/^M /)
  })

  it('includes arc command A', () => {
    const path = describeArc(100, 100, 50, 0, 90)
    expect(path).toContain(' A ')
  })

  it('closes the path with Z', () => {
    const path = describeArc(100, 100, 50, 0, 90)
    expect(path).toMatch(/Z$/)
  })

  it('uses large arc flag 0 for arcs <= 180 degrees', () => {
    const path = describeArc(100, 100, 50, 0, 180)
    // Format: A rx ry rotation largeArc sweep x y
    expect(path).toContain('A 50 50 0 0 0')
  })

  it('uses large arc flag 1 for arcs > 180 degrees', () => {
    const path = describeArc(100, 100, 50, 0, 270)
    expect(path).toContain('A 50 50 0 1 0')
  })

  it('starts the path at the center point', () => {
    const path = describeArc(200, 150, 50, 0, 90)
    expect(path.startsWith('M 200 150')).toBe(true)
  })
})

describe('truncateText', () => {
  it('returns short text unchanged', () => {
    expect(truncateText('hello', 10)).toBe('hello')
  })

  it('returns text unchanged when exactly at max length', () => {
    expect(truncateText('hello', 5)).toBe('hello')
  })

  it('truncates text longer than max with ellipsis', () => {
    expect(truncateText('hello world', 6)).toBe('hello\u2026')
  })

  it('truncates to maxLen - 1 characters plus ellipsis', () => {
    const result = truncateText('abcdefghij', 5)
    expect(result).toBe('abcd\u2026')
    expect(result.length).toBe(5)
  })

  it('handles single character max length', () => {
    expect(truncateText('hello', 1)).toBe('\u2026')
  })

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('')
  })
})
