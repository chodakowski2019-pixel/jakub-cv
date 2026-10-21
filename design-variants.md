# Background design variants — jakubchodakowski.com

Reference for mesh gradient + glassmorphism background experiments.

---

## Variant 1 — Pastel Lavender (ACTIVE)

**Vibe:** soft, dreamy, modern. Apple Vision Pro / Stripe / Linear feel.

**Palette:** lavender, sky blue, peach, mint, pink. Light bg.

**Colors (HSL approx):**
- Lavender `hsl(265, 85%, 78%)`
- Sky blue `hsl(210, 95%, 82%)`
- Mint `hsl(190, 90%, 84%)`
- Peach `hsl(28, 100%, 84%)`
- Soft purple `hsl(255, 80%, 80%)`
- Pink `hsl(330, 90%, 85%)`

**Text:** dark `#1a1a2e` on light. Cards = white glass (`bg-white/40 backdrop-blur-xl`).

**Status:** implemented in `app/globals.css`.

---

## Variant 2 — Dark Teal / Cyan Glow

**Vibe:** futuristic, tech, premium SaaS. Linear dark mode + cyan accent.

**Palette:** near-black base with cyan/teal glow waves.

**Colors:**
- Base `#0a1218` (very dark navy-black)
- Cyan glow `hsl(190, 90%, 55%)` at 30% opacity
- Teal accent `hsl(175, 80%, 50%)` at 20% opacity
- Deep blue shadow `hsl(220, 80%, 15%)`

**Text:** light `#e8f4f8` on dark. Cards = dark glass (`bg-white/[0.04] backdrop-blur-xl border-white/[0.08]`).

**Best for:** "AI Strategist" credibility, tech audience, code/dev positioning.

---

## Variant 3 — Deep Midnight Blue

**Vibe:** corporate-trust, luxury, premium consulting. JP Morgan / McKinsey energy.

**Palette:** monochrome deep navy with subtle lighter blue highlights.

**Colors:**
- Base `#0d1b2a` (deep navy)
- Mid blue `hsl(215, 50%, 25%)` highlights
- Soft blue glow `hsl(210, 70%, 60%)` at 15% opacity
- White overlay `rgba(255, 255, 255, 0.03)` for glass

**Text:** light `#f0f4f8` on dark. Cards = subtle glass.

**Best for:** Miami HNW networking, enterprise consulting, "trusted advisor" frame.

---

## Decision matrix

| Use case | Variant |
|---|---|
| Personal brand, creative, AI-forward | 1 (Pastel) |
| Tech credibility, dev/AI builder | 2 (Dark Cyan) |
| Enterprise consulting, Miami HNW | 3 (Deep Navy) |

Pick depends on dominant audience. Switch by swapping `body::before` in `globals.css`.
