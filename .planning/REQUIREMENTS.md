# Requirements: The Us Quiz

**Defined:** 2026-03-30
**Core Value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players

## v1.2 Requirements

Requirements for Daily Photo Challenge milestone. Each maps to roadmap phases.

### Photo Capture

- [ ] **PHOTO-01**: User can take a photo with their device camera to answer a prompt
- [ ] **PHOTO-02**: User can upload a photo from their device gallery to answer a prompt
- [ ] **PHOTO-03**: User can add a short text caption below their photo (torn-paper style, no scrolling required)
- [ ] **PHOTO-04**: Photos are uploaded to Supabase Storage bucket with session-scoped access

### Content

- [ ] **CONT-01**: 15 themed sections exist with 3 photo prompts each (45 total)
- [ ] **CONT-02**: First prompt in every section is "What are you up to?"
- [ ] **CONT-03**: Last prompt in each section is a funny/unhinged question matching the theme
- [ ] **CONT-04**: Themed prompts cover a variety of subjects (food, travel, date night, etc.)

### Time Gating

- [ ] **GATE-01**: Completing a section freezes all sections until 6am the next day
- [ ] **GATE-02**: After 6am unlock, all remaining sections are available to choose from
- [ ] **GATE-03**: Once a user picks a section, all other sections lock until that section is completed
- [ ] **GATE-04**: Both partners must complete a section before the cork board reveals

### Display

- [ ] **DISP-01**: Per-section cork board shows both partners' 3 photos side by side after completion
- [ ] **DISP-02**: Cork board uses the same visual style as the Us tab vision board
- [ ] **DISP-03**: Section hub page shows all 15 sections with completion status and lock state

### Journal

- [ ] **JRNL-01**: Journal page has a dedicated tab for Daily Photo Challenge photos
- [ ] **JRNL-02**: Journal tab displays all completed section photos organized by theme

### Navigation

- [ ] **NAV-01**: Daily Photo Challenge is accessible from the quizzes tab in bottom nav

## Future Requirements

### Photo Challenge Expansion

- **PHOTO-05**: Additional themed section packs beyond the initial 15
- **PHOTO-06**: Emoji reactions on individual photos (reuse existing reaction system)
- **PHOTO-07**: Photo filters or stickers before submitting

## Out of Scope

| Feature | Reason |
|---------|--------|
| Video prompts | Complexity and storage costs; photos only for v1.2 |
| Social sharing of photos outside the app | Privacy-first approach; couples-only |
| AI-generated photo prompts | Keep content hand-crafted for quality |
| Photo editing/cropping in-app | Rely on device camera/gallery for editing |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PHOTO-01 | — | Pending |
| PHOTO-02 | — | Pending |
| PHOTO-03 | — | Pending |
| PHOTO-04 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| GATE-01 | — | Pending |
| GATE-02 | — | Pending |
| GATE-03 | — | Pending |
| GATE-04 | — | Pending |
| DISP-01 | — | Pending |
| DISP-02 | — | Pending |
| DISP-03 | — | Pending |
| JRNL-01 | — | Pending |
| JRNL-02 | — | Pending |
| NAV-01 | — | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 0
- Unmapped: 18 ⚠️

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after initial definition*
