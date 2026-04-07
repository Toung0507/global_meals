# 👨‍💻 To Claude Code: Global Meals Angular 19 Project Migration Blueprint (Updated V2)

This document acts as your strict instruction manual to successfully transfer tested components, configurations, and core modifications into THIS main Angular 19 project. You MUST replicate the following changes exactly without causing build breaks.

---

## 1. Project Dependencies & Configuration Requirements
We are introducing sophisticated animations and a unified design logic.
1. **Install Packages**: Run `npm i lottie-web gsap` immediately.
2. **Update `angular.json`**:
   - In `projects.*.architect.build.options`, append this field to suppress CommonJS warnings: `"allowedCommonJsDependencies": ["lottie-web"]`.
   - In `projects.*.architect.build.configurations.production.budgets`:
     - Update `initial` budget: `"maximumWarning": "4MB", "maximumError": "5MB"`.
     - Update `anyComponentStyle` budget: `"maximumWarning": "1MB", "maximumError": "2MB"`.

---

## 2. Global Skills Integration (Web Animation Design)
We have adopted the **Web Animation Design** (Emil Kowalski) methodology.
- **Principle**: Use `ease-out` (`cubic-bezier(0.165, 0.84, 0.44, 1)`) for entrance and `ease-in-out` for movement.
- **Physical Feedback**: All interactive elements MUST have `:active { transform: scale(0.92); }` for tactile feel.
- **Performance**: Only animate `transform` and `opacity` to ensure 60fps GPU acceleration.
- **Accessibility**: Wrap ALL animations in `@media (prefers-reduced-motion: no-preference)`.

---

## 3. Directory Structure & Files to Migrate

### A. Shared Services (`src/app/shared/`)
- `auth.service.ts`: 
  - Updated `MockUser` interface to include `role: 'guest'` and `isGuest: boolean`.
  - Added `loginAsGuest(phone: string)` method.
- `loading.service.ts`: Global state for `isLoading`.
- `customer-loading/`: Core Lottie overlay. 
  - **TIMING SYNC**: Animation MUST span EXACTLY `6200ms` (progress bar CSS + TS timer).

### B. Access & Auth Modules
- `global_meals_login/customer-login/`: Primary portal. 
  - **GUEST ACCESS**: Add a link to `/customer-guest`.
- `global_meals_login/customer-guest/`: **NEW COMPONENT**.
  - Logic: Validate phone (min 8 digits), call `authService.loginAsGuest(phone)`, show 6.2s Loading, then navigate to `/customer-home`.

### C. Main Front-Of-House Shell (`customer-home/`)
- **Responsive Shell Layout**:
  - HTML: Wrapped in `.ch-shell`.
  - **New Structure**: `.ch-sidebar` (for desktop) + `.ch-content-wrapper` (containing `.ch-topbar` and `.ch-main`).
- **Identity Topbar**:
  - Right side MUST show User Identity Badge (`userRoleLabel`) and name/phone (`formattedName`).
- **Desktop Sidebar (1024px+)**:
  - Fixed left sidebar with branding, navigation items, and logout footer.
  - Sidebar items use staggered entrance and `active` state with `scale` feedback.

### D. Menu Optimization (`customer-home` Tab Menu)
- **Bento Grid Layout**: 
  - Vertical cards with image on top (`150px` height).
  - Overlay Badges: "Hot" (Orange) and "New" (Gold) floating on images.
  - Staggered Entrance: Use `nth-child(n)` delay on `.menu-item-card`.

---

## 4. Navigation Timing Table (CRITICAL)

| Route Jump | Loading Style | Timeout |
|------------|---------------|---------|
| Login -> Home | Orange Bar | `6200ms` |
| Home -> Member | Orange Bar | `6200ms` |
| Guest -> Home | Orange Bar | `6200ms` |
| Login -> Staff | Blue Spinner | `1500ms` |

---

## 5. Final Validation Checklist
1. Run `ng build`. Ensure 0 warnings and successful bundle generation.
2. Check `dist/` size.
3. Test Responsive breakpoints (Mobile < 768px, Tablet 768px-1024px, Desktop > 1024px).
7. Verify "Guest" identity display in Topbar after guest login.

---

## 6. Update V3: Guest Access Restrictions & Advanced UI Patterns

### A. Security: Strict Guest Routing Restrictions
- **`customer-home.component.ts`**:
  - Introduced `isGuest` computed signal reading from `authService.currentUser?.isGuest`.
  - **Dynamic Navigation:** `navTabs` updated to a computed signal. When `isGuest` is true, it drops the `"member"` tab.
  - **Hard Protection:** Within `setTab(tabId)`, added an explicit block. This ensures soft-routing completely denies guests access to `/customer-member`.

### B. Precision UI Enhancements (Premium Dining Aesthetic)
- **Fluid Layout (`.ch-topbar` & `.ch-sidebar`)**:
  - Upgraded spacing and z-indexes for sticky/fixed navigation, supporting an overlapping content layout.
- **Sidebar (`.ch-sidebar`)**:
  - Added `.sidebar-logo-ring` featuring a rotating conic gradient.
  - Inserted `.sidebar-user-card` to explicitly show the authenticated user identity (Avatar + Name + Custom Badge).
  - Active states heavily enhanced with solid pills (`.bg-cream` before-layering and scaling) matching the *Warm Orange & Cream* palette.
- **Top Navigation (`.ch-topbar`)**:
  - **Desktop Tabs:** Introduced explicit Tab navigation (`.ch-topbar-tabs`) inside the topbar acting as pill-shaped segments. 
  - **Identity Badge Context:** Restructured `.ch-identity-wrap`. If `!isGuest()`, it shows a clickable arrow entering the Customer Member Center. If `isGuest()`, it gracefully disables click events (`pointer-events: none`).
  - **Premium Cart Button:** Replaced standard cart badge with a highly polished `.ch-cart-btn`. Includes a sleek 135deg gradient, dynamic sum `cartTotal()`, and tactile hover scaling conforming to physical feedback concepts.
- **Code Quality:**
  - Changed inline SVG `stroke-width=2` into refined `stroke-width=1.8` for more delicate visual aesthetics required for high-end dining applications.

### C. Visual Bug Fixes & Refined UI Components

- **Sidebar Redevelopment (Professional Full-Height Drawer Design)**:
  - Completely eradicated the "white gap cliff" defect by transforming the sidebar into a rigid, full-height Drawer. 
  - **Structural Update**: Set `.ch-sidebar` to `position: fixed`, `top: 0`, `bottom: 0`, and `height: 100vh` on desktop, guaranteeing it anchors natively from the absolute top to the absolute bottom of the viewport without exceptions.
  - **Fluid Content Layout**: Applied `margin-left: 280px` to `.ch-content-wrapper` on desktop to prevent the fixed sidebar from overlapping the scrollable content, ensuring the layout scales robustly. Background set to a pristine `#FFFFFF` to distinguish it architecturally from the cream shell background `var(--bg-cream)`.
  - **Responsive Height Adaptation**: Implemented internal `overflow-y: auto` to prevent content cutoff (like the logout button disappearing) on displays with limited vertical resolution. Built a custom translucent orange Webkit scrollbar that matches the premium aesthetic. In addition, leveraged `@media (max-height: 768px)` to dynamically collapse vertical margins and padding across `.ch-sidebar`, `.sidebar-brand`, and `.sidebar-user-card`, maintaining a dense, proportional layout even on short 13-inch laptop screens.
  - **Premium Filler Element**: Introduced `.sidebar-promo-card` inside `.sidebar-footer`. This frosted glass gradient card natively fills the lower vertical space of the sidebar while displaying a high-value marketing call-to-action (ex: "Join the VIP Foodies"). Features complex interaction states: `-2px` Y-transform and vibrant icon inverse coloring on hover.
- **Floating Cart Optimization (`.menu-cart-float`)**:
  - **Redesign**: Converted the generic full-width bar into an elegant, fixed glassmorphism pill (`backdrop-filter: blur(12px)` + `rgba(255, 255, 255, 0.95)`).
  - **Desktop Placement**: Instead of spanning the entire width causing bleeding across the desktop sidebar, added `@media (min-width: 1024px)` to lock it as a stylish `340px` floating widget positioned neatly at the `bottom-right: 40px`.
  - **Interior Architecture**: Restructured the cart interior into distinct flex groups (`.cart-float-icon`, `.cart-float-right`), adding an SVG cart icon inside a circular orange container, resulting directly in a substantially more premium feel.

### D. Refactoring & Compiler Stability
- **Sass Mixed Declarations Fix**: 
  - Addressed deprecation warnings (`mixed-decls`) flagged by the modern `[plugin angular-sass]` compiler during `npm run build`.
  - Refactored nested SCSS structures (specifically within `.menu-cart-float` and other hover-based UI components) by strictly ordering standard CSS attributes (`opacity`, `animation`, `transition`, `will-change`) *before* any nested pseudoclasses (`&:hover`, `&:active`) or `@media` queries. This complies precisely with upcoming native CSS nesting specs and ensures warning-free zero-exit-code builds.
- **Global SVG & Icon Consistency**: 
  - Swept through HTML structures to substitute basic text boundaries with modern `<svg>` vectors. Standardized inline `stroke-width` attributes (`1.8` for delicate sidebar labels, `2.0` or `2.2` for prominent badges/promos) matching the *Warm Orange Cream* branding guidelines seamlessly.

### E. Extreme UI Simplification
- **Redundant Topbar Removal**: 
  - To eliminate UI clutter and duplicated navigational actions, the desktop Topbar component (`<header class="ch-topbar">`) was entirely removed from `customer-home.component.html`.
  - Content hierarchy is now driven entirely by the robust Full-Height Sidebar drawer for spatial navigation, and the precise Floating Pill Card (`.menu-cart-float`) in the bottom-right corner for shopping cart awareness. This satisfies elite application design standards for visual conciseness without any functional sacrifice.

### F. Home Page UX Refinements (Top Spacing & In-Feed Search)
- **Hero Banner Spacing Corrections**: 
  - Adjusted the top-level container `<section class="tab-home">` with inline `padding-top: 24px;` resolving the uncomfortable full-bleed visual collision caused by removing the Topbar. This provides exact proportions and allows the brand hero image to sit inside an elite "framed" composition rather than feeling "cut off."
- **Home Feed Search Integration**: 
  - Transported and cloned the `.menu-header` (which originally exclusively existed within the native Menu tab) directly into the Home payload structure.
  - Inserted the seamless search bar (`.menu-search-wrap`) and category pill-bar (`.menu-cat-bar`) snugly between the Hero Banner (Yellow Box) and the "Chef's Recommendations" list (Red Box). This gives users immediate, friction-less access to catalog filtering without requiring an explicit navigational redirect to the menu tab, greatly diminishing action-depth and enhancing UX flexibility.

### G. Sidebar Profile Drawer & Database Representation
- **Interactive Accordion Conversion**: 
  - Transformed the previously static `.sidebar-user-card` into a semantic `<button>` toggle injected with responsive HTML/CSS. This allows a clean click-to-expand mechanism directly from the sidebar.
  - Implemented advanced SCSS `grid-template-rows: 0fr -> 1fr` interpolation. This ensures that the drawer slides open and closed impeccably smoothly without injecting hard-coded pixel heights or triggering layout jolts capable of breaking the `overflow-y` sidebar scrolling.
- **Embedded Member Profile Grid**: 
  - Constructed a `.pr-grid` nested within the drawer that replicates the exact structure of the Member Tab (Name, Phone Number, concise Email, masked Password indicator). This supports the radical UI simplication goal by absorbing the Member Tab entirely into the Sidebar.
- **Mock DB State Visualizer (Voucher System)**: 
  - Simulated backend data schema interactions (specifically `order_count` and `is_discount` mapping from `members` table schema) within the `.pr-database-status` module.
  - Computed frontend signals (`ordersUntilDiscount`, `hasDiscountReady`) are dynamically piped into an aesthetic progress bar (`.pr-progress-fill`) featuring a visually satisfying gradient indicating orders placed out of 10. When 10 is reached, a distinct "可使用" badge emerges in `#166534` emerald typography atop a `#DCFCE7` badge, communicating robust e-commerce readiness.
- **Enhanced Profile Editing UX**: 
  - Locked `.pr-label` to a fixed `70px` width using Flexbox, preventing layout jumps when transitioning between text and input modes.
  - Injected an "Input Group" pattern that includes a modern password visibility toggle (Eye Icon). This leverages `showPassword` and `showConfirmPassword` signals for real-time `type="text/password"` switching.
  - Mandated a "Confirm Password" field during active editing to ensure credential integrity.
- **Checkout Efficiency (Trash Can Feature)**: 
  - Integrated a `.co-delete-btn` (Trash Can icon) directly into the shopping cart item control array.
  - Implemented `removeFromCart(id)` to allow immediate item expulsion, reducing the click-depth required to clear unwanted selections compared to repeated negative quantity increments. Styled with an `#EF4444` hover-active state for clear semantic feedback.

### H. Profile UI Clipping & Layout Overhaul
- **Full-Bleed Profile Drawer**: 
  - Removed aggressive lateral padding (`padding: 0`) from `.profile-drawer-inner` to allow the internal data grid to span the exact 100% width of the sidebar drawer, completely eliminating text truncation/clipping on narrow screens.
  - Converted the `.pr-grid` data layout from a horizontal row flex to a strictly **vertical stacked column layout**. This guarantees that long strings (like lengthy Email addresses) have ample breathing room without triggering CSS overflow hiding.
- **Pill-Shaped Data Visualization**: 
  - Enclosed each read-only profile data value (name, phone, email) inside `border-radius: 20px` pill backgrounds matching the `Warm Orange Cream` identity, significantly improving visual grouping and creating an elite iOS-like setting screen aesthetic.

### I. Order Management (SPA Internal Pipeline)
- **Elimination of Page Routing**: 
  - Removed the hard Angular route jump to `/customer-member` normally triggered by the sidebar. Replaced the "會員中心" (Member Center) tab entirely with **"訂單管理" (Order Management)** while retaining the user within the `CustomerHomeComponent` shell.
- **Embedded Segmented Dashboard**: 
  - Substituted the Member Center UI with a high-fidelity Order History dashboard rendered directly over the `activeTab === 'orders'` view state.
  - Implemented an iOS-style segmented control `.order-filter-tabs` to switch between `completed`, `cancelled`, and `refunded` signals in real-time.
  - **Color-Coded Badges**: Engineered semantic status badges using strict Hex codes (`badge-completed`: Mint text on Pale Green, `badge-refunded`: Crimson text on Pale Rose, etc.) injected into heavily-shadowed `.order-history-card` components featuring `.slide-up` stagger animations.

### J. Advanced Multi-Step Checkout Flow
- **State Exclusivity**: 
  - Upgraded payment selection functionality to utilize a strict `paymentMethod = signal('credit')` state, permanently fixing dual-selection bugs by binding inputs directly to the signal lifecycle rather than static DOM classes.
- **Virtual Routing (Seamless Funnel)**: 
  - Added a virtual `payment` state strictly inside the `TabId` union, effectively splitting the checkout sequence into a two-step funnel: **Step 1: Cart Review** -> **Step 2: Confirm Order** without requiring a shared global `CartService` or structural page reload.
  - The "Cart Review" tab was completely decluttered (removed payment blocks and notes), converting the primary action to "進入結帳頁面" (Enter Checkout).
- **High-Visibility Destructive Actions**: 
  - The "清空購物車" (Clear Cart) button was heavily emphasized through an `.enhance-clear-btn` refactor (Pale Red background `#FFF5F5`, vivid Red border `#FECACA`, and a Trash SVG).
- **"Confirm Order" View Architecture**: 
  - Drafted an elegant, receipt-style read-only summary card (`.payment-summary-card`) for the secondary payment step. Included a clear "返回" (Back to Cart) mechanism, honoring SPA UX best practices, before finalizing with the ultimate cart clearing and Tracker navigation sequence.
