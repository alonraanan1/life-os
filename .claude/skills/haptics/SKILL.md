---
name: haptics
description: Add or troubleshoot haptic (vibration) feedback on button presses in this web app, especially for iPhone/Safari where navigator.vibrate() does not exist. Use when asked to make buttons "buzz", give tactile/haptic feedback on tap, or when a haptic call silently does nothing on iOS. Covers the checkbox-switch workaround, reduced-motion, duration, and which controls deserve it.
---

# Haptic feedback on button presses

This app is used mostly on an iPhone, and iOS Safari has no vibration API at
all — not a permissions issue, the API simply doesn't exist there. A skill for
"add haptics" has to design around that from the start, not bolt it on after
a naive `navigator.vibrate()` call does nothing.

## The utility

`lib/haptics.ts` exports a single function: `tap()`. Call it synchronously
inside the press handler, before any async work (network save, etc.), so the
buzz feels tied to the finger, not to the server response:

```ts
import {tap} from '@/lib/haptics';
// ...
onClick={()=>{tap();void save(...).catch(()=>{});}}
```

It picks the best available mechanism per platform and does nothing —
silently, without throwing or logging — when neither is available. It is
also SSR-safe: every `window`/`navigator`/`document` access is guarded,
because the module can be imported on the server.

## The platform reality

- **Android / Chrome / most non-Apple browsers**: `navigator.vibrate(ms)`
  works as documented. `tap()` calls `navigator.vibrate(10)`.
- **iOS Safari**: `navigator.vibrate` is `undefined`. There is no permission
  prompt to request — the method is absent. Don't "fix" a non-working call
  by adding permission checks; check `typeof navigator.vibrate === 'function'`
  and fall through instead.
- **The iOS workaround**: Safari 17.4 shipped `<input type="checkbox" switch>`
  (a native two-state switch control). Toggling one fires the system Taptic
  Engine as a side effect — this is the only known way to get a real haptic
  buzz out of iOS Safari. Two details that matter and are easy to get wrong:
  - You can't call `.click()` on the checkbox itself from script and expect
    a haptic. You need the checkbox wrapped in a `<label>`, and you call
    `.click()` on the **label**.
  - This must run as a direct, synchronous continuation of a real user
    gesture (the click handler that a tap produced). Don't defer it into a
    promise `.then()` or a `setTimeout`.
  - Reported caveat (verified via web search while building this, not
    independently confirmed on a device): Apple is said to have changed this
    behavior around iOS 26.5 so that a hidden switch toggled indirectly via
    script no longer reliably produces haptic feedback — only a switch that
    the user's finger *actually* lands on (an invisible switch overlaid
    directly on the real button) survives that change. If a future session
    hears "haptics stopped working on iOS" and this project is still using
    the hidden-switch-plus-`.click()` approach, that's the first thing to
    check, and the fix is to overlay a real `<input type="checkbox" switch>`
    on top of the actual button rather than triggering a detached one.
  - The switch element itself makes no sound and has no visible artifact —
    but only if you actually hide it. Keep it out of layout (`position:
    fixed`, tiny size, `opacity: 0`), unreachable by keyboard (`tabIndex:
    -1`), and hidden from assistive tech (`aria-hidden="true"` on both the
    label and the input). Do **not** mark it `inert` — that can suppress the
    native toggle behavior that produces the haptic in the first place, i.e.
    it can silently defeat the whole trick.

## Reduced motion

Treat `prefers-reduced-motion: reduce` as "this person wants less physical
feedback, not just less on-screen animation" and skip the haptic entirely.
Check it **at call time** with `window.matchMedia(...)`, not once at module
load — the user's OS setting can change while the tab stays open.

## Duration

A button tap should feel like a light tick, not a notification. ~10ms is
right for something pressed many times a day. Do not build patterns,
sequences, or "success melodies" — that's the kind of thing that's charming
once and irritating by the tenth press.

## When to wire it up (and when not to)

Haptics are worth adding to the single most important, most frequently
repeated tactile action in the app — in this app, that's marking a habit
done. They are not worth adding to every button. A phone that buzzes on
every tap (delete, cancel, navigate, open a menu) is worse than one that
never buzzes at all — it stops meaning anything and just feels noisy. When
asked to "add haptics", find the one or two controls that are pressed
constantly and give real physical confirmation of a state change, and leave
the rest alone.
