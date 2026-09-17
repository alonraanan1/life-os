---
name: design-references
description: Use when the user wants a UI/page/component to look like a specific well-known brand or product (e.g. "make it look like Stripe", "give me an Apple-style landing page", "Linear-inspired dashboard"). Provides pre-analyzed DESIGN.md files with real color tokens, typography, spacing, and layout rules for 74 companies, so generated UI matches that design language instead of guessing from memory.
---

# Design References

A library of analyzed design-language files (`design-md/<company>/DESIGN.md`) for 74 real products and brands, sourced from [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md). Each `DESIGN.md` documents actual colors, typography, spacing tokens, and UI rules extracted from that company's real interface — not a vague description.

## When to use

The user asks for UI "in the style of", "like", or "inspired by" a known brand or product, or names one directly while asking for a design.

## How to use

1. Match the requested brand to a folder name below (case-insensitive, hyphenated).
2. Read `design-md/<name>/DESIGN.md` for the color palette, typography scale, and layout/interaction rules.
3. Apply those exact tokens (hex colors, font stacks, spacing) when generating or redesigning the UI — don't approximate from general knowledge of the brand.
4. If no exact match exists, pick the closest stylistic neighbor (e.g. "fintech, minimal" → stripe or revolut) and say which reference you used.

## Available references

airbnb, airtable, apple, binance, bmw, bmw-m, bugatti, cal, claude, clay, clickhouse, cohere, coinbase, composio, cursor, dell-1996, elevenlabs, expo, ferrari, figma, framer, hashicorp, hp, ibm, intercom, kraken, lamborghini, linear.app, lovable, mastercard, meta, minimax, mintlify, miro, mistral.ai, mongodb, nike, nintendo-2001, notion, nvidia, ollama, opencode.ai, pinterest, playstation, posthog, raycast, renault, replicate, resend, revolut, runwayml, sanity, sentry, shopify, slack, spacex, spotify, starbucks, stripe, superhuman, supabase, tesla, theverge, together.ai, uber, vercel, vodafone, voltagent, warp, webflow, wired, wise, x.ai, zapier
