---
name: match-ui
description: Inspects a current UI image against a target UI image, identifies visual deltas, writes TDD tests, and refactors Next.js/Tailwind code to match the target design.
disable-model-reveal: true
user-action-required: false
---

# Skill: UI Visual Matcher & Refactoring Specialist (`/match-ui`)

## Objective
Automatically inspect a `current-ui` screenshot and a `target-ui` screenshot, perform a high-precision visual diff, locate the corresponding local component source code, and refactor the component to match the target UI while preserving TDD principles and tech stack conventions.

## Usage
`/match-ui <path-to-current-image> <path-to-target-image> [component-file]`

---

## Execution Instructions for Claude

When this skill is invoked, always use the `ui-ux-pro-max` skill for any UI design decisions (colors, typography, spacing, component styling) — treat it as the source of truth over ad-hoc styling choices.

1. **Vision Analysis**:
   - Compare the current image against the target image.
   - List visual mismatches (colors, dynamic headers, w-fit badge sizing, legal text bloat, acronym usage, animation style).

2. **TDD Setup (Red State)**:
   - Locate test files in `/web/lib/__tests__/` or component spec files.
   - Write failing unit/integration tests asserting the target design rules (e.g., full institution display names, compact inline badges).
   - Run tests to confirm failure.

3. **Code Modification (Green State)**:
   - Refactor the React/Next.js component in `/web/components/` using Tailwind CSS.
   - Strip legal clutter (`(Pty) Ltd`, `(The)`, `NPC`) while preserving full names (`University of Pretoria`, not `UP`).
   - Fix badge layouts (`w-fit inline-flex`) and clean up category pill horizontal bars.

4. **Validation**:
   - Run full test suite (`npm run test`).
   - Run production build check (`npm run build`).