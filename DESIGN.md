# Product Design System

This document defines Life OS's design philosophy and quality bar. It is not a spec of the current screens; the CSS custom properties in `app/globals.css` are the palette of record (see section 31).

Last reconciled with the shipped design: 2026-09-18.

## 1. Design Direction

The product should feel:

- premium
- minimal
- calm
- modern
- precise
- confident
- sophisticated
- highly polished
- intentional
- human

The quality bar is inspired by products and digital experiences from companies such as Apple, Linear, Stripe, Arc, Raycast and excellent independent digital design studios.

This is a quality reference only.

Do NOT copy another company's branding, layouts, assets, typography, or proprietary visual identity.

The goal is to achieve a similar level of attention to detail.

---

## 2. Core Design Philosophy

Design should come primarily from:

- typography
- hierarchy
- spacing
- proportion
- alignment
- composition
- contrast
- whitespace
- subtle interaction

Decoration should be secondary.

Every visible element should have a reason to exist.

Do not add UI simply to make a page feel fuller.

Empty space is a design tool.

When choosing between adding another element and strengthening hierarchy through typography or spacing, prefer hierarchy and spacing.

When choosing between complexity and clarity, prefer clarity.

---

## 3. Avoid Generic AI Design

Do NOT automatically use:

- arbitrary or decorative gradient backgrounds
- rainbow or attention-grabbing glow effects
- glassmorphism applied without a token system behind it
- decorative blobs
- neon accent colors
- giant rounded rectangles
- excessive border-radius
- a card around every piece of information
- dashboard layouts made entirely from floating cards
- repetitive 3-column card grids
- random icons
- unnecessary badges
- pill-shaped UI everywhere
- excessive shadows
- unnecessary illustrations
- fake charts used as decoration
- giant centered hero sections by default
- generic hero layouts with headline + paragraph + two buttons + random mockup
- excessive center alignment
- excessive use of bold text
- animations merely to make the page feel more impressive

Do not make every section visually independent.

Pages should feel like coherent compositions rather than collections of components.

This is not a ban on the shipped material system.

Life OS uses a deliberate light "Liquid Glass" language on an Apple-white ground: opaque content surfaces, translucent backdrop-blurred chrome reserved for the elements that float above content (the mobile tab bar, the desktop sidebar, the modal editor, the segmented filter control, the habit mark pill), and two low-opacity ambient washes (brand blue, gold) placed behind that floating chrome so the glass has something to refract.

That system is bounded and token-driven. Every surface, glow, blur, and shadow value comes from the CSS custom properties in `app/globals.css`, not invented per component.

The prohibition above targets ungoverned decoration: arbitrary gradients, rainbow palettes, attention-grabbing glow. It does not undo the approved direction.

Do not add a new gradient, glow, or blur outside those tokens. Do not apply glass to a content surface (panels, cards, the budget summary, record rows) — those stay opaque with a shadow instead.

---

## 4. Visual Hierarchy

Every screen must have a clear focal point.

The user should quickly understand:

1. Where am I?
2. What matters most?
3. What can I do here?
4. What information is secondary?

Not every element deserves equal visual weight.

Use differences in:

- size
- weight
- spacing
- placement
- contrast
- opacity

to communicate importance.

Avoid making multiple elements compete for attention.

---

## 5. Typography

Typography is one of the primary visual tools of the product.

Prefer clean, modern, highly legible typefaces appropriate for the existing technology stack.

Do not introduce a new font dependency unnecessarily.

Use a restrained typography system.

Typical hierarchy should contain:

- Display / Hero
- Page title
- Section heading
- Component heading
- Body
- Secondary body
- Label
- Caption / Metadata

Use large typography confidently when appropriate.

Headlines should have:

- intentional line breaks,
- controlled line length,
- strong hierarchy,
- comfortable tracking and line-height.

Body text should prioritize readability.

Avoid:

- too many font sizes,
- excessive font weights,
- bolding entire paragraphs,
- tiny secondary text,
- weak contrast,
- overly long lines.

Typography should often replace the need for additional boxes, borders and decoration.

---

## 6. Spacing

Use a consistent spacing rhythm.

Prefer a small set of reusable spacing values rather than arbitrary values everywhere.

Think in relationships such as:

- very tight: icon ↔ label
- tight: heading ↔ supporting text
- normal: elements inside a component
- generous: between content groups
- large: between major page sections

Major sections should have breathing room.

Do not compress interfaces unnecessarily.

At the same time, functional interfaces should not become inefficient due to excessive empty space.

Spacing should communicate structure.

---

## 7. Layout

Layouts should feel deliberate.

Use:

- consistent content widths,
- strong alignment,
- clear grids,
- generous margins,
- balanced negative space.

Avoid making every screen perfectly symmetrical.

Subtle asymmetry can create a more editorial and premium composition when appropriate.

Do not place everything inside a centered container by default.

Do not automatically create a three-column grid because space exists.

Choose layout according to content importance.

---

## 8. Containers and Cards

Cards should only exist when grouping content provides meaningful structure.

Do NOT wrap every section in a card.

Before creating a card, ask:

"Would typography, spacing, alignment, or a subtle divider communicate this grouping better?"

If yes, avoid the card.

When cards are appropriate:

- keep them simple,
- avoid excessive shadows,
- use restrained radii,
- keep internal hierarchy strong.

Nested cards should be rare.

---

## 9. Borders

Borders should be subtle and functional.

Use them when they:

- separate interactive controls,
- clarify structure,
- communicate input boundaries,
- or distinguish meaningful regions.

Do not use borders around everything.

Low-contrast dividers are generally preferable to heavy outlines.

---

## 10. Border Radius

Use a consistent radius system.

Avoid extreme rounding unless there is a clear visual reason.

Not every element should be pill-shaped.

Buttons, inputs, cards, menus and modals should feel related but do not necessarily require identical radius values.

The interface should feel refined rather than bubbly.

---

## 11. Shadows and Elevation

Use shadows sparingly.

Prefer:

- spacing,
- contrast,
- borders,
- background differentiation

before using large shadows.

Shadows should communicate actual elevation, such as:

- menus,
- popovers,
- modals,
- floating controls.

Avoid dramatic shadows on ordinary content containers.

---

## 12. Color

Color should be restrained.

Prefer a neutral foundation with a controlled accent system.

Use accent colors primarily for:

- actions,
- selection,
- status,
- important highlights.

Do not use accent colors simply to decorate empty space.

Maintain accessible contrast.

Use muted colors for secondary content without making it difficult to read.

If the project already has a brand palette, preserve and refine it rather than replacing it without instruction.

Life OS has one interactive accent and one status color, not an open palette: `--brand` for actions and selection, `--success` reserved for completion states only. See section 31 for the token list. Do not introduce a second general-purpose accent color.

---

## 13. Buttons

Establish clear button hierarchy.

Typical levels:

Primary:
The main action on the screen.

Secondary:
Alternative important actions.

Tertiary / Ghost:
Lower-priority actions.

Destructive:
Actions that remove, delete or irreversibly modify something.

Avoid showing many primary buttons simultaneously.

Buttons should have:

- clear labels,
- consistent sizing,
- intentional spacing,
- hover state,
- active state,
- keyboard focus state,
- disabled state where relevant.

Do not make every button oversized or pill-shaped.

---

## 14. Forms

Forms should feel simple and calm.

Prefer:

- clear labels,
- logical grouping,
- helpful validation,
- predictable controls,
- comfortable input height.

Avoid:

- unnecessary containers around each field,
- excessive instructions,
- placeholder-only labels,
- unclear error states.

Errors should explain how to fix the problem.

In Life OS, a small fixed set of choices is a row of 44px chips, seven to a row, with the input inside each chip: the habit's days (checkboxes) and its icon (radios, each named by `aria-label`). Money fields ask for the decimal keypad (`inputMode="decimal"`) and counts for the number pad (`inputMode="numeric"`), keeping `type="number"` for its limits.

---

## 15. Icons

Icons should support comprehension.

Do not use icons as decoration everywhere.

Prefer a consistent icon family already available in the project.

Avoid mixing visual icon styles.

Do not add an icon to every button.

Text-only controls are often preferable when the action is already clear.

---

## 16. Navigation

Navigation should make the product's structure obvious.

The current location should be clear.

Avoid:

- excessive navigation items,
- decorative navigation elements,
- multiple competing navigation systems.

Prioritize frequently used destinations.

Secondary destinations can be progressively disclosed.

---

## 17. Tables and Data-Dense UI

Do not convert useful tables into cards purely for visual style.

For structured data, prioritize:

- scanability,
- alignment,
- comparison,
- density,
- filtering,
- sorting,
- readability.

Use typography and subtle separators.

For mobile, adapt data presentation intelligently rather than simply shrinking desktop tables.

---

## 18. Charts and Data Visualization

Charts must communicate information, not decorate dashboards.

Avoid:

- unnecessary 3D effects,
- rainbow palettes,
- excessive gridlines,
- decorative charts without decisions attached to them.

Emphasize the data that matters.

De-emphasize supporting data.

Charts should have clear labels and useful context.

---

## 19. Motion

Motion should feel subtle, smooth and intentional.

Use animation to communicate:

- appearance,
- disappearance,
- hierarchy,
- spatial relationship,
- feedback,
- state changes.

Prefer animations based on:

- opacity,
- small translations,
- subtle scale,
- smooth layout transitions.

Typical interface motion should often fall around 150–500ms depending on context.

Avoid:

- excessive bouncing,
- spinning decoration,
- aggressive parallax,
- animation on every element,
- animations that delay interaction,
- dramatic entrance animations for ordinary UI.

Motion should support the experience rather than become the experience.

Sheets: on a phone (up to 520px) the editor and every other modal sheet rise from the bottom edge, full width with 26px top corners, in 320ms on `cubic-bezier(.32,.72,0,1)`, and leave the same way in 200ms, the way they came. There is no grabber and no drag: the scrim, Escape and the sheet's own button close it. Wider screens keep the centred glass window and its short zoom. The sheet owns its open state (`Sheet` in `components/life/editor.tsx`), so the exit plays before the parent unmounts it.

Celebration is the one exception to "subtle", and it stays small. When a tap completes the day's last due habit, the completed count pops once (about 450ms, no confetti). That tap is the only trigger, never a data load. Streaks and medals are shown as quiet text lines with a gold flame or medal icon, not badges or banners. The budget-pace streak leaves fixed expenses out: they come off the budget first, so rent on the 1st doesn't break the run. Fixed expenses reach a new month only through one quiet button ("הוספת N הוצאות קבועות · ₪X"), never on their own.

---

## 20. Micro-interactions

High-quality products should respond clearly to interaction.

Consider:

- hover
- active
- pressed
- selected
- focused
- loading
- success
- error
- disabled
- drag
- copied
- saved

Feedback should usually be immediate and subtle.

---

## 21. Loading States

Avoid blank screens when possible.

Use appropriate:

- skeletons,
- progress indicators,
- optimistic updates,
- localized loaders.

Do not show a full-page spinner for a small local operation.

Loading UI should reflect the shape of the content being loaded when reasonable.

In Life OS, the session check and the first data load show nothing for 600ms, then one quiet line (`.app-status`). The first paint never shows a screen that is about to change: the sign-in card appears only once the server says there is no session. It used to flash on every open.

---

## 22. Empty States

Empty states should be useful.

Explain:

- what is missing,
- why the area is empty when necessary,
- and what the user can do next.

Avoid giant decorative illustrations unless they genuinely fit the product identity.

Keep empty states concise.

---

## 23. Error States

Errors should be human-readable.

Explain:

- what happened,
- what the user can do,
- whether their data is safe,
- and whether retrying makes sense.

Avoid raw technical errors in user-facing interfaces.

---

## 24. Responsive Design

Responsive design is not desktop design scaled down.

For smaller screens reconsider:

- information priority,
- navigation,
- spacing,
- number of columns,
- control placement,
- interaction model,
- content density.

Stack when necessary, but do not blindly stack every desktop element.

Mobile should feel intentionally designed.

Touch targets should be comfortable.

Avoid horizontal overflow unless it is an intentional interaction pattern.

---

## 25. Accessibility

Visual quality must not reduce usability.

Maintain:

- sufficient contrast,
- visible keyboard focus,
- semantic HTML,
- keyboard navigation,
- meaningful labels,
- alt text where appropriate,
- accessible form states,
- adequate touch targets.

Do not rely on color alone to communicate critical state.

Honor reduced-motion preferences where appropriate.

---

## 26. Content

Interface copy is part of the design.

Prefer:

- short,
- clear,
- specific,
- human language.

Avoid unnecessary technical jargon.

Buttons should describe actions.

Headings should communicate meaning rather than use generic labels where possible.

---

## 27. Premium Design Details

Premium design usually comes from precision rather than decoration.

Pay attention to:

- optical alignment,
- baseline alignment,
- consistent icon size,
- text wrapping,
- balanced whitespace,
- intentional section rhythm,
- subtle states,
- precise responsive behavior.

Fix awkward spacing even when technically valid.

Small inconsistencies matter.

---

## 28. Page Composition

Do not treat pages as stacks of unrelated components.

Consider the page as one complete visual composition.

Create rhythm using:

- dense areas,
- quiet areas,
- typography,
- whitespace,
- visual anchors.

Major page sections should feel connected.

---

## 29. Design Review Questions

Before finalizing a screen, ask:

- What does the eye see first?
- Is that what should be seen first?
- Is anything competing unnecessarily?
- Is there too much UI?
- Can a container be removed?
- Can typography replace decoration?
- Is whitespace being used intentionally?
- Are alignments exact?
- Does this feel custom to this product?
- Would a professional designer remove anything?
- Does mobile feel considered?
- Does this look like an AI-generated SaaS template?

If the last answer is yes, redesign it.

---

## 30. Final Principle

Do not optimize for maximum visual complexity.

Optimize for:

clarity + hierarchy + restraint + usability + precision.

The design should feel confident enough that it does not need to constantly demand attention.

When uncertain:

remove,
simplify,
align,
and improve hierarchy.

---

## 31. Design System of Record (Tokens)

The palette and material system that ship today live in `app/globals.css`, as CSS custom properties on `:root`.

Light is the only theme. The dark variant was removed outright, not demoted behind a media query. Do not restore it without a deliberate decision to add one back.

Core tokens:

- `--bg` — page background: an Apple-white parchment ground (`#f5f5f7`), not pure white.
- `--surface` / `--surface-2` / `--surface-solid` — opaque content-panel backgrounds, from card white to a faint tint.
- `--stroke` / `--stroke-strong` — hairline borders.
- `--text` / `--text-2` / `--text-3` — primary, secondary, and tertiary text opacity steps, on dark ink (`#1d1d1f`): 100%, 70%, 64%. `--text-3` is the floor: 4.76:1 on the lightest grey the app sits on (the gold dad card) and 5.09:1 on white. Don't go lighter for text; `--text-2` stays a step darker than `--text-3`.
- `--brand` — the single interactive accent, Apple Action Blue (`#0066cc`): links, nav/filter selection, primary buttons, focus rings. `--brand-tint` / `--brand-tint-strong` are its low-opacity fills.
- `--success` — a narrow, deliberate green (`#1a7f4f`, 5.0:1 on white, darkened from `#1f8a57` which read 4.35:1) that means "completed" only: the habit mark, the daily progress bar, the weekly history dots, goal-reached confirmations. It is not a general-purpose accent. `--income` maps to `--success` by financial convention.
- `--gold` — kept in its narrow semantic role: goal amounts, the dad-card, and the icons for streaks (flame) and medals.
- `--danger` / `--danger-ink` — destructive actions and error states. `#b3261e`: 5.0:1 as text on its own tint (the error banner), which the brighter `#d9342b` missed at 3.7:1.
- `--disabled-opacity` (.5) — the one dimming step for every disabled control.
- `--glass-bg` / `--glass-bg-dense` / `--glass-highlight` / `--glass-shade` / `--glass-blur` / `--glass-saturate` — the Liquid Glass material: translucency, backdrop blur with saturation, and a specular top-edge highlight.
- `--glass-clear` (30% white, 8px blur) / `--glass-sheet` (55% white, 28px blur) — the sheer glass for the two surfaces that float over moving content: the mobile tab bar and the editor sheet. At `--glass-bg`'s 66% over a white section they read as an opaque white slab, so these let the content show through. Fields inside the sheet are tinted glass too (50% white, no blur of their own).
- `--shadow-rest` / `--shadow-pill` / `--shadow-float` / `--shadow-modal` — a four-step elevation scale. Every shadow in the app comes from one of these four, not a one-off value.
- `--glow-a` (brand blue) / `--glow-b` (gold) — two ambient washes at roughly 4-5% opacity, fixed behind the page. Glass is invisible on a flat white ground, so the material needs faint color behind it to refract. They are not decoration.

Every control answers a press, since the tap highlight is off everywhere: a `scale(.96)` from the moment the finger lands (120ms, the habit-pill curve); the week dots tint their 44px cell instead, and record rows dim. `:hover` rules sit inside `@media (hover:hover)` so they never stick after a tap on a phone.

The mobile tab bar is a detached glass capsule. It floats 12px above the bottom edge, is inset 16px from each side, and is capped at 400px wide, centred with logical insets. The active tab uses the same `--brand-tint` capsule as the sidebar's active item. In every glass rule, write `-webkit-backdrop-filter` before `backdrop-filter`: the minifier keeps only the last declaration of the pair, and Chromium needs the unprefixed one.

Material discipline: the glass tokens (`--glass-*`, backdrop blur) apply only to chrome that floats above content — the mobile tab bar, the desktop sidebar, the modal editor, the segmented filter control, the habit mark pill. Content surfaces — panels, cards, the budget summary, record rows — stay opaque and use the elevation shadow scale instead.

A `prefers-reduced-transparency: reduce` query drops every glass surface to the same opaque material the content panels already use, and removes the ambient washes.

This is the palette of record. Change color, glow, blur, or shadow by editing these tokens, not by hunting through component files for hardcoded values.

---

## 32. Direction and RTL

Life OS is Hebrew-first and right-to-left.

Use logical CSS properties (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`, and similar) instead of physical `left` / `right` properties, so layout stays correct under RTL.

Do not hardcode `left` or `right` for direction-sensitive spacing or positioning.
