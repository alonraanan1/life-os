# Product Design System

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

- gradient backgrounds
- glowing gradients
- excessive glassmorphism
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
