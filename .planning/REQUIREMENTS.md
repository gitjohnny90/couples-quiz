# Requirements: The Us Quiz

**Defined:** 2026-03-30
**Core Value:** Partners can connect and learn about each other through shared interactive experiences that update live for both players

## v1.2 Requirements

Requirements for Daily Photo Challenge milestone. Each maps to roadmap phases.

### Photo Capture

- [x] **PHOTO-01**: User can take a photo with their device camera to answer a prompt
- [x] **PHOTO-02**: User can upload a photo from their device gallery to answer a prompt
- [x] **PHOTO-03**: User can add a short text caption below their photo (torn-paper style, no scrolling required)
- [x] **PHOTO-04**: Photos are uploaded to Supabase Storage bucket with session-scoped access

### Content

- [x] **CONT-01**: 15 themed sections exist with 3 photo prompts each (45 total)
- [x] **CONT-02**: First prompt in every section is "What are you up to?"
- [x] **CONT-03**: Last prompt in each section is a funny/unhinged question matching the theme
- [x] **CONT-04**: Themed prompts cover a variety of subjects (food, travel, date night, etc.)

### Time Gating

- [x] **GATE-01**: Completing a section freezes all sections until 6am the next day
- [x] **GATE-02**: After 6am unlock, all remaining sections are available to choose from
- [x] **GATE-03**: Once a user picks a section, all other sections lock until that section is completed
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
| PHOTO-01 | Phase 10 | Complete |
| PHOTO-02 | Phase 10 | Complete |
| PHOTO-03 | Phase 10 | Complete |
| PHOTO-04 | Phase 10 | Complete |
| CONT-01 | Phase 11 | Complete |
| CONT-02 | Phase 11 | Complete |
| CONT-03 | Phase 11 | Complete |
| CONT-04 | Phase 11 | Complete |
| GATE-01 | Phase 11 | Complete |
| GATE-02 | Phase 11 | Complete |
| GATE-03 | Phase 11 | Complete |
| GATE-04 | Phase 12 | Pending |
| DISP-01 | Phase 12 | Pending |
| DISP-02 | Phase 12 | Pending |
| DISP-03 | Phase 11 | Pending |
| JRNL-01 | Phase 13 | Pending |
| JRNL-02 | Phase 13 | Pending |
| NAV-01 | Phase 11 | Pending |

**Coverage:**
- v1.2 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-04-02 — CONT-01 through CONT-04, GATE-01 through GATE-03 marked complete (Phase 11 Plan 01)*
