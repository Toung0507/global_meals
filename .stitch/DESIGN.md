# Design System: 懶飽飽 LazyBaoBao — Stitch Generation Guide

## 1. Visual Theme & Atmosphere
A warm, appetite-stimulating mobile-first interface. The mood is **Taiwan night market heat meets modern food brand** — deep amber-orange primary, cream canvas background, artisanal feel without being rustic. Density 4/10 on customer screens — generous breathing room, one action at a time. Motion: spring-physics, 5/10 — smooth CSS transitions, springy buttons, no gimmicks.

The left-brand / right-form split on desktop collapses to full-width form on mobile. Every touch target minimum 44px. Full-height sections use `min-h-[100dvh]`.

---

## 2. Color Palette & Roles

### Customer App (Primary Palette)
- **Cream Canvas** (`#FFFAF3`) — Page background, warmer than pure white
- **Ember Amber** (`#D95C1A`) — Primary CTA, brand color, active states
- **Caramel Deep** (`#A84210`) — Hover states, gradient end, depth layer
- **Honey Accent** (`#F0A500`) — Tags, badges, secondary emphasis
- **Teak Ink** (`#3D2010`) — Primary text, never pure black
- **Tea Secondary** (`#6A4830`) — Description text, placeholders
- **Straw Border** (`#F0D8B8`) — Input borders, dividers
- **Chili Red** (`#C0392B`) — Error messages, danger actions

### POS Terminal (Dark Palette)
- **Void Base** (`#0D1117`) — Page background
- **Lantern Gold** (`#C49756`) — Buttons, selected states, amounts
- **Gold Light** (`#F0C68C`) — Amount text, important numbers
- **Porcelain Text** (`#E2E8F8`) — Primary text

### Country Variant Overrides
- **Japan**: Primary `#B5451A`, bg `#FAF7F2` (washi paper white)
- **Korea**: Primary `#D94F2B`, bg `#FFF8F5` (Korean translucent pink)

---

## 3. Typography Rules
- **Chinese Display**: `'LXGW WenKai TC', 'Noto Serif TC', serif` — brand name only, weight 900
- **Chinese Body**: `'Noto Sans TC', sans-serif` — all UI text
- **English Brand**: `'Fraunces', serif` — italic, uppercase, brand tagline only
- **Numbers/Mono**: `'JetBrains Mono', monospace` — prices, order numbers, table IDs

**Scale:**
- Display: `clamp(2rem, 5vw, 3.5rem)` weight 800
- H1: `clamp(1.5rem, 3vw, 2rem)` weight 700
- Body: `0.9375rem` (15px) weight 400
- Caption: `0.75rem` (12px) weight 500

**BANNED**: Inter, Arial, Helvetica, Times New Roman, Georgia

---

## 4. Component Stylings
- **Primary Button**: `#D95C1A` fill, white text, `border-radius: 14-16px`, active `-1px translateY + scale(0.99)`, NO outer glow
- **Secondary Button**: white bg, `#D95C1A` border 2px, hover fills with primary color
- **Cards**: `border-radius: 16px`, shadow `0 2px 12px rgba(61,32,16,0.08)`
- **Inputs**: label above (never floating), focus ring `2px solid #D95C1A`, `border-radius: 14px`
- **Loaders**: skeleton shimmer matching layout — NO circular spinners
- **Country Switcher**: pill row of 3 compact buttons, active = `#D95C1A` fill white text, inactive = muted, 8px flag dot

---

## 5. Layout Principles
- Split Screen login: `grid-template-columns: 42% 58%`, collapses to full-width on <860px
- Customer Home: 240px fixed sidebar + flex-grow main, sidebar → bottom tab bar on mobile
- All full-height: `min-h-[100dvh]` NEVER `h-screen`
- Grid over flexbox percentage math
- Touch targets: minimum 44px
- Asymmetric layouts — centered single-column hero BANNED

---

## 6. Motion & Interaction
- Spring physics: `stiffness: 120, damping: 18`
- Page enter: `opacity 0→1 + translateY(8px→0), 280ms`
- Button active: `translateY(1px) scale(0.99), 80ms`
- Logo ring: `spin 20-30s linear infinite`
- Loading dots: `steps(4) infinite` for `...` animation
- Animate ONLY `transform` and `opacity` — never top/left/width/height
- `prefers-reduced-motion`: disable all animations

---

## 7. Anti-Patterns (NEVER DO)
- No emoji in UI (replace all with SVG icons)
- No Inter, Arial, Helvetica fonts
- No pure black `#000000`
- No neon gradients or outer glow box-shadows
- No centered single-column hero layouts
- No 3-equal-column card rows
- No circular loading spinners
- No fake statistics or placeholder data
- No "Seamless", "Unleash", "Next-Gen" copywriting
- No broken image links — use `picsum.photos` or SVG placeholders
- No `<img>` without `width` and `height` attributes
- No `h-screen` (use `min-h-[100dvh]`)
