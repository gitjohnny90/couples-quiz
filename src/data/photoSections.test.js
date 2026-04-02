import { describe, it, expect } from 'vitest'
import photoSections from './photoSections'

describe('photoSections data integrity', () => {
  it('exports exactly 15 sections', () => {
    expect(Array.isArray(photoSections)).toBe(true)
    expect(photoSections).toHaveLength(15)
  })

  it('each section has required fields: id, title, emoji, description, prompts', () => {
    for (const section of photoSections) {
      expect(typeof section.id, `id missing in section: ${JSON.stringify(section)}`).toBe('string')
      expect(typeof section.title, `title missing in section ${section.id}`).toBe('string')
      expect(typeof section.emoji, `emoji missing in section ${section.id}`).toBe('string')
      expect(typeof section.description, `description missing in section ${section.id}`).toBe('string')
      expect(Array.isArray(section.prompts), `prompts not an array in section ${section.id}`).toBe(true)
    }
  })

  it('each section has exactly 3 prompts', () => {
    for (const section of photoSections) {
      expect(section.prompts, `${section.id} should have 3 prompts`).toHaveLength(3)
    }
  })

  it('each prompt has id (string) and text (string)', () => {
    for (const section of photoSections) {
      for (const prompt of section.prompts) {
        expect(typeof prompt.id, `prompt id missing in section ${section.id}`).toBe('string')
        expect(typeof prompt.text, `prompt text missing in section ${section.id}`).toBe('string')
      }
    }
  })

  it('prompts[0].text is always "What are you up to?" for all 15 sections', () => {
    for (const section of photoSections) {
      expect(section.prompts[0].text, `section ${section.id} first prompt should be "What are you up to?"`).toBe('What are you up to?')
    }
  })

  it('all section IDs are unique and kebab-case URL-safe', () => {
    const ids = photoSections.map((s) => s.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
    for (const id of ids) {
      expect(id, `ID "${id}" should match kebab-case pattern`).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('all prompt IDs are unique across all sections', () => {
    const allPromptIds = photoSections.flatMap((s) => s.prompts.map((p) => p.id))
    const uniquePromptIds = new Set(allPromptIds)
    expect(uniquePromptIds.size).toBe(allPromptIds.length)
  })

  it('prompt IDs follow the {sectionId}-{n} pattern', () => {
    for (const section of photoSections) {
      section.prompts.forEach((prompt, index) => {
        expect(prompt.id, `prompt ${index + 1} in section ${section.id} should follow ID pattern`).toBe(
          `${section.id}-${index + 1}`
        )
      })
    }
  })
})
