# Anti-Vibecode Engineering & Design Standard

This document is the authoritative standard for eliminating "vibe coding" (superficial, generic, bloated AI-generated templates and UI slop) across all DOVAN codebases and interfaces.

Every agent and engineer must adhere strictly to these rules before authoring, modifying, or shipping any interface or feature.

---

## 1. What is "Vibe Code"?

**Vibe code** is code that prioritizes superficial visual fluff ("the vibe") over structural integrity, genuine craft, responsive restraint, and architectural purpose.

It typically manifests in two domains:
1. **Visual Slop (Vibe UI)**: Cards inside cards, rainbow pastel pill badges, glowing gradient buttons, fake macOS window chrome, giant distorted image containers, and decorative decorative icons inside circles.
2. **Code Slop (Vibe Logic)**: Div soup, brittle `useEffect` cascades, silent `catch {}` blocks, duplicate state variables, hardcoded mock arrays leaking into production, and unsemantic non-accessible DOM trees.

---

## 2. Core Visual & Design Laws

### 2.1. Eliminate "Cards Inside Cards" (Carding UI)
* **The Slop Tell:** Nesting a `rounded-xl border bg-card p-4 shadow-xs` inside an outer `rounded-xl border bg-card divide-y shadow-xs`, creating boxy, claustrophobic container clutter.
* **The Law:** Present information directly on the canvas using an **Architectural Ledger layout**.
* **Implementation:**
  - Use subtle hairline dividers (`border-b border-border/80` or `divide-y divide-border/60`).
  - Rely on optical whitespace and typographical hierarchy rather than wrapping every chunk of text in an elevated card.
  - Never stack parallel divider lines (e.g. do not pair `border-b` on a header with `border-t` on the adjacent section separated by `space-y-*`).

### 2.2. Ban Glowing Pill Buttons & Rounded-Full Capsules
* **The Slop Tell:** Buttons with `rounded-full bg-gradient-to-r shadow-lg shadow-primary/25` or floating pill chips.
* **The Law:** Use crisp, intentional, border-driven buttons with rectangular or subtle rounded geometry (`rounded-none` or `rounded-xs`/`rounded-sm`).
* **Implementation:**
  - Primary button: Solid high-contrast fill (`bg-foreground text-background hover:bg-foreground/90 transition-colors`).
  - Secondary/Outline button: Clean crisp border (`border border-border/80 text-foreground hover:border-foreground hover:bg-muted/30`).
  - Never add all-around blurred drop shadows or colored ambient glows under buttons.

### 2.3. No Rainbow Pastel Pill Badges
* **The Slop Tell:** `rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700` and similar 6-color pastel rainbow chips for status labels.
* **The Law:** Use architectural monospace status tags with clean colored status dots.
* **Implementation:**
  - Status indicator: `inline-flex items-center gap-1.5 border border-foreground/20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-foreground`.
  - Colored status dot: `h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400`.

### 2.4. Ban Decorative "Icon in Colored Circle" Empty States
* **The Slop Tell:** `mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground` inside a dashed rounded box.
* **The Law:** Design an editorial archive empty state.
* **Implementation:**
  - Monospace eyebrow: `text-[10px] font-mono uppercase tracking-widest text-muted-foreground/75`.
  - Direct, honest headline: `No Saved Items in Archive` (not "Oops! Nothing here yet").
  - Understated primary call to action button.
  - Hairline bounding borders (`border-t border-b border-border/80`).

### 2.5. Product Card & Rail Sizing Laws
* **The Slop Tell:** Giant 300px square image cards that dominate the screen height and crop products aggressively with `object-cover`.
* **The Law:** Rails must be compact, proportional, and invite horizontal exploration.
* **Implementation:**
  - Rail card width: `w-[125px] xs:w-[135px] sm:w-[145px] md:w-[155px] shrink-0`.
  - Image aspect ratio: Balanced 1:1 square with subtle padding or clean object-cover.
  - Multi-rail viewport rule: On a 1080p display, at least two complete section rails plus their headers must fit vertically without being cut off.
  - Action buttons: Quick view as an icon button (`h-7 w-7 p-0`), Add as a compact button (`h-7 px-2 text-[11px]`).

### 2.6. No Em Dashes in Copy
* **The Slop Tell:** Overusing em dashes (`—`) in titles, metadata fallbacks, and alerts (`Title — DOVAN`, `SKU: —`, `Return — pending`).
* **The Law:** Never emit an em dash `—`.
* **Implementation:** Use a standard colon (`:`), a simple hyphen (`-`), a middle dot (`·`), or separate into two distinct sentences.

---

## 3. Core Architecture & Frontend Code Laws

### 3.1. Zero "Div Soup"
* Never write nested `<div><div><div>` chains solely for styling.
* Always select semantic HTML:
  - `<article>` for independent documents (e.g. tax invoice, product card).
  - `<section>` for named page areas with heading tags (`<h2>`, `<h3>`).
  - `<nav>` for navigation links.
  - `<main>` for primary route outlets.
  - `<dl>`, `<dt>`, `<dd>` for key-value invoice summaries and metadata pairs.
  - `<button type="button">` for actionable interactive triggers (never `<div onClick>`).

### 3.2. Resilient Data Fetching (No Fake Mocks)
* Always fetch from the primary backend API route first (`/api/*`), with fallback to authenticated Supabase client queries where applicable.
* Transform raw database fields defensively (e.g. `price_paise / 100`, handle `null` arrays gracefully).
* Provide crisp, non-flashing skeletons matching the exact dimensions of the ledger row.
* Invalidate query caches accurately on mutations (`qc.invalidateQueries({ queryKey: [...] })`).

### 3.3. No Silent Catches or Error Swallowing
* **Vibe code anti-pattern:** `catch (err) {}` or `catch (e) { console.log(e) }` leaving user in a broken loading state.
* **The Law:** Always notify the user through high-visibility toast notifications (`toast.error(...)`) and release busy/loading flags in a `finally {}` block.

### 3.4. Layout Continuity Across All Viewports
* Never hardcode fixed desktop widths without mobile/tablet responsive constraints.
* Avoid horizontal overflow leaks:
  - Use `truncate` or `line-clamp-1` on user-supplied text (product titles, emails, addresses).
  - Add `min-w-0` to all flex children that contain truncated text.
  - Use `overflow-x-auto no-scrollbar scroll-smooth` for horizontal rails.

---

## 4. The Anti-Vibecode Pull Request Checklist

Before submitting or approving any change, verify every checkbox:

- [ ] **No Cards Inside Cards:** Are data items rendered directly on the canvas or in a flat hairline ledger?
- [ ] **No Double Borders:** Are there any redundant stacked borders between headers and adjacent sections?
- [ ] **No Em Dashes:** Search for `—` in the diff. Replace any occurrences with `:` or `-`.
- [ ] **No Rainbow Pill Badges:** Are status badges formatted as architectural monospace tags with status dots?
- [ ] **No Glowing/Pill Buttons:** Are buttons crisp, rectangular, and free of blurred all-around drop shadows?
- [ ] **Proportional Card Dimensions:** Are product cards in rails set to compact widths (`125px-155px`) so images do not dominate the screen?
- [ ] **No Empty-State Decorative Circles:** Are empty states designed as clean editorial archives?
- [ ] **Zero TypeScript / Build Errors:** Does `npm --prefix frontend run build` complete with code 0?
- [ ] **Dual Remote Sync:** Have changes been merged and pushed to both `origin/main` and `yugant/update`?
