# FunLearn — Complete Phase 1–4 Test Build

This repository is the complete FunLearn application with the Question Master enhancements and Interactive Activities Phase 1–4.

## Run in GitHub Codespaces

```bash
npm install
npm run dev
```

The development server uses port **3000** and listens on `0.0.0.0` for Codespaces.

Open the forwarded **3000** port from the Ports panel.

## Main Question Master hierarchy

`Country → Region → Curriculum → Subject → Grade → Category → Skill → Question`

Category uniqueness is case-insensitive within Curriculum + Subject + Grade. Skills remain grade-specific.

## Interactive Activities hierarchy

`Grade(s) → Subject → Activity → Activity Format → Activity Content`

Activities do not require Country, Region, or Curriculum mapping in this initial version.

## Activity capabilities

- Activity Master
- Multiple applicable grades
- Subject
- Activity Format
- Difficulty
- Learning Tags
- Draft / Published / Archived
- Preview
- Activity Builder
- Question Bank question steps
- Standalone game tasks
- Step reordering
- Student game player
- Timer, score, stars, sound and animation settings
- Memory, matching, sorting, ordering, drag/drop and arcade-style tasks

## Question capabilities

- Single/manual question creation
- Batch generation
- CSV bulk upload
- Visual / animated layer
- Picture counting and visual objects
- Animation
- Audio/image URL support
- Question Preview
- Draft → Published / Ready

## Local development data

Question Master and Interactive Activity Master data are currently stored in browser `localStorage` for development/testing. Supabase integration can be finalized after the UI and workflows are validated.
