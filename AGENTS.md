# Project Agent Instructions

These instructions apply to this repository and every directory beneath it.

## Design System

Before making ANY frontend, UI, UX, styling, layout, responsive, animation, or visual change, you MUST read `DESIGN.md`.

`DESIGN.md` is the project's source of truth for visual design and UI quality.

All new or modified:

- pages
- screens
- components
- layouts
- navigation
- typography
- colors
- spacing
- buttons
- forms
- cards
- tables
- charts
- empty states
- loading states
- responsive states
- interactions
- transitions
- animations

must follow `DESIGN.md`.

Do not introduce a new visual pattern unless it is compatible with the existing design system.

## Existing Product First

Before modifying an existing screen:

1. Inspect the current implementation.
2. Understand the functionality and information hierarchy.
3. Read `DESIGN.md`.
4. Preserve functionality unless the task explicitly asks to change it.
5. Preserve useful established visual patterns that already meet the quality bar.
6. Improve inconsistency rather than creating a second design language.

Never redesign blindly without inspecting the existing product first.

## Design Quality

Do not treat frontend work as only an implementation task.

For meaningful UI work, think as:

- a senior product designer,
- an art director,
- a UX designer,
- and a frontend engineer.

The result should feel intentionally designed rather than generated from a generic template.

If something looks like a default Tailwind, Bootstrap, shadcn, SaaS template, or generic AI-generated interface, improve it before considering the task complete.

## Visual QA

Before finishing any meaningful frontend task, perform a visual quality pass.

Review the result at appropriate desktop and mobile sizes.

Check:

- Is the most important element immediately obvious?
- Is the hierarchy clear?
- Is typography doing enough of the visual work?
- Is spacing consistent?
- Is there enough whitespace?
- Are there unnecessary containers?
- Are too many things presented as cards?
- Are borders and shadows actually necessary?
- Are alignments precise?
- Are text line lengths comfortable?
- Are interactive states clear?
- Does mobile feel deliberately designed rather than merely compressed?
- Does anything look like a generic template?
- Can anything be removed or simplified?
- Does the screen feel consistent with the rest of the product?

If the answer reveals visual problems, perform another design pass before finishing.

## Functional Safety

Do not sacrifice functionality for visual design.

Do not:

- remove working features,
- change business logic,
- change APIs,
- alter data behavior,
- remove accessibility behavior,
- or introduce unnecessary dependencies

unless the user explicitly requests it.

## Responsive Design

Every UI implementation must consider:

- desktop,
- tablet where relevant,
- and mobile.

Do not simply shrink the desktop layout.

Adapt hierarchy, spacing, navigation, content density, and interaction patterns to the available screen size.

## Final Standard

The goal is not to make the product "fancy."

The goal is to make it:

- clear,
- beautiful,
- premium,
- calm,
- precise,
- coherent,
- intentional,
- and easy to use.

When uncertain, simplify.
