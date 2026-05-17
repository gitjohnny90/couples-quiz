import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('iOS platform scaffolded', () => {
  it('Xcode project exists', () => {
    expect(fs.existsSync(path.resolve('ios/App/App.xcodeproj/project.pbxproj'))).toBe(true)
  })
  it('Info.plist contains camera usage description', () => {
    const plist = fs.readFileSync(path.resolve('ios/App/App/Info.plist'), 'utf8')
    expect(plist).toContain('NSCameraUsageDescription')
    expect(plist).toContain('Daily Photo Challenge')
  })
  it('Info.plist contains photo library usage descriptions', () => {
    const plist = fs.readFileSync(path.resolve('ios/App/App/Info.plist'), 'utf8')
    expect(plist).toContain('NSPhotoLibraryUsageDescription')
    expect(plist).toContain('NSPhotoLibraryAddUsageDescription')
  })
})

describe('Android platform scaffolded', () => {
  it('module build.gradle exists', () => {
    expect(fs.existsSync(path.resolve('android/app/build.gradle'))).toBe(true)
  })
  it('AndroidManifest.xml exists', () => {
    expect(fs.existsSync(path.resolve('android/app/src/main/AndroidManifest.xml'))).toBe(true)
  })
})
