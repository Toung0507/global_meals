---
page: qr-entry
deviceType: MOBILE
---

Design a full-screen mobile brand splash screen for "懶飽飽 LazyBaoBao" that appears when a customer scans a QR code to start their takeaway order. This is the very first screen the customer sees on their phone — it should feel premium, warm, and instantly recognizable.

**Screen purpose:** QR Code entry animation while loading the branch/table data. Auto-redirects after ~1.4 seconds.

**DESIGN SYSTEM (REQUIRED):**

Visual atmosphere: Taiwan night market warmth meets modern food brand. Cream canvas background `#FFFAF3`. Deep amber-orange `#D95C1A` as primary. Spring-physics motion, breathing room, single focal point.

Colors:
- Background: `#FFFAF3` (Cream Canvas)
- Primary: `#D95C1A` (Ember Amber)
- Text primary: `#3D2010` (Teak Ink)
- Text secondary: `#6A4830` (Tea Secondary)
- Border/accent: `rgba(217,92,26,0.25)`

Typography:
- Brand name "懶 飽 飽": `'LXGW WenKai TC', serif`, weight 900, `#3D2010`, letter-spacing 5px, 28px
- "LazyBaoBao": `'Fraunces', serif`, italic uppercase, `#D95C1A`, 14px
- Loading hint: `'Noto Sans TC', sans-serif`, `#6A4830`, 14px
- Table ID badge: `'JetBrains Mono', monospace`, amber bg pill

**Page Structure:**
1. Full-screen centered layout (`min-height: 100dvh`, cream background `#FFFAF3`)
2. Center cluster:
   - Two concentric rotating rings around the logo (outer: dashed `rgba(217,92,26,0.30)` 200px, inner: solid `rgba(240,165,0,0.25)` 160px — both spinning slowly opposite directions)
   - Circular logo image 120px, white border 4px, warm drop shadow
   - Brand name "懶 飽 飽" in calligraphic font below logo
   - "LazyBaoBao" in italic serif, ember color
   - Optional table badge (amber pill, monospace text): "桌位：A3"
   - Loading text: "正在載入您的桌位" with animated ellipsis `...`
3. Subtle food-themed floating icons at corners (opacity 0.3, gentle float animation)
4. Bottom: tiny legal text "© 懶飽飽 Global Meals" in `#C8A888`

**DO NOT:**
- No emoji anywhere
- No circular spinner
- No neon colors
- No dark background (use cream `#FFFAF3`)
- No generic loading bar
