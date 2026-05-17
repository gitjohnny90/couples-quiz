import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('capacitor.config.json', () => {
  const cfg = JSON.parse(fs.readFileSync(path.resolve('capacitor.config.json'), 'utf8'))
  it('has correct appId', () => { expect(cfg.appId).toBe('com.theusquiz.app') })
  it('has correct appName', () => { expect(cfg.appName).toBe('The Us Quiz') })
  it('webDir points to dist', () => { expect(cfg.webDir).toBe('dist') })
  it('does NOT set server.url (NATIVE-04)', () => { expect(cfg.server?.url).toBeUndefined() })
  it('configures StatusBar plugin with paper color', () => {
    expect(cfg.plugins?.StatusBar?.style).toBe('DARK')
    expect(cfg.plugins?.StatusBar?.backgroundColor).toBe('#FFF8F0')
  })
  it('configures Android edge-to-edge handling', () => {
    expect(cfg.android?.adjustMarginsForEdgeToEdge).toBe('auto')
  })
})

describe('vite.config.js', () => {
  const src = fs.readFileSync(path.resolve('vite.config.js'), 'utf8')
  it("sets base: './' for Capacitor scheme compatibility", () => {
    expect(src).toMatch(/base:\s*['"]\.\/['"]/)
  })
})
