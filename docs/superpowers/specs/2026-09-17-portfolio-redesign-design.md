# Portfolio Redesign — "Cyberpunk Terminal" Rebuild

Date: 2026-09-17
Status: Approved for implementation

## Goal

Rebuild `saikeshavareddych.github.io` (currently a mostly-static, partially
unfinished multi-page site) into a fully designed, animated, fully
responsive personal portfolio, deployable as-is via the existing
GitHub Pages flow (no build step).

## Current state (baseline)

- `index.html` has a decent landing page pass (hero, badges, value
  cards, metrics, featured architecture image, CTA) but no mobile nav
  and only basic scroll-reveal via `IntersectionObserver`.
- `projects.html`, `architecture.html`, `resume.html`, `blog.html` are
  bare HTML fragments — no `<!DOCTYPE>`, `<head>`, navbar, or footer.
  They render unstyled/broken if opened directly.
- `resume.html` links to `assets/Sai-Keshava-DevOps.pdf`, which does
  not exist in `assets/`.
- `posts/first-post.html` exists but is unstyled.
- Deploy is GitHub Pages serving `main` directly; `.github/workflows/deploy.yml`
  is a no-op placeholder. There is no build step — everything must work
  as static files loaded via `<script>`/`<link>` tags.

## Non-goals

- No framework/build tooling (React, Vite, bundlers). Stays plain
  HTML/CSS/JS + CDN libraries, matching the current deploy model.
- No backend/CMS for blog posts — posts remain static HTML files.
- No fabricated credentials/metrics presented as verified fact beyond
  what's plausible extrapolation of the existing DevOps positioning
  (AWS/CI-CD/Kubernetes/Terraform); content gaps (resume PDF) are
  bridged with working fallbacks, not fake files.

## Design system

- **Palette**: keep the existing dark base (`#020617` / `#000`),
  primary neon cyan `#38bdf8`, add terminal green `#22ff88` (success/
  glitch accent) and magenta `#ff2fbf` (used sparingly for glitch
  flicker only, never as a primary color).
- **Type**: `JetBrains Mono` (Google Fonts) for headings/terminal
  chrome, `Inter` for body copy.
- **Signature motifs**:
  - Low-opacity canvas matrix-rain wash behind the hero (vanilla JS,
    no library; paused/removed on narrow viewports and under
    `prefers-reduced-motion`).
  - Scanline/CRT overlay (pure CSS, cheap).
  - Glitch-flicker effect on headings when scrolled into view.
  - Glowing border-on-hover for cards (hover-only; on touch devices
    this becomes a static glow, not a hover trap).
  - Terminal boot-sequence intro in the hero (multi-line simulated
    boot log) instead of the current single typed line.
- **Motion**: GSAP + ScrollTrigger (CDN) for staggered section
  reveals, parallax on the architecture image, animated count-up
  metrics, sticky nav that shrinks on scroll.
- **Motion accessibility**: all non-essential animation (matrix rain,
  glitch, parallax) is skipped when `prefers-reduced-motion: reduce`
  is set, and simplified (parallax disabled, matrix rain removed) below
  a 768px viewport width for performance.

## Responsive requirements (explicit, cross-cutting)

Applies to every page, not just the nav:

- Fluid layout using CSS Grid/Flexbox with `minmax()`/`clamp()` —
  no fixed pixel widths that overflow small screens.
- Breakpoints: desktop (>1024px), tablet (641–1024px), mobile (≤640px).
- **Navbar**: hamburger menu below 900px, full-screen slide-down/overlay
  menu, active-link state preserved, closes on link click or outside tap.
- **Hero**: terminal boot block and heading scale via `clamp()`; button
  row stacks vertically on narrow screens; matrix-rain canvas capped/
  disabled on mobile for battery/perf.
- **Grids** (value-prop cards, project cards, architecture diagram
  cards): `repeat(auto-fit, minmax(...))` collapsing to a single column
  on mobile.
- **Metrics**: horizontal row wraps to a 2-column then 1-column stack
  as width shrinks.
- **Images/diagrams**: `max-width: 100%`, no fixed heights that crop;
  lightbox (architecture page) usable via tap on touch devices.
- **Typography**: use `clamp()` for hero/section headings so text
  never overflows or requires horizontal scroll.
- **Tap targets**: nav links, buttons, and cards sized ≥44px touch
  target on mobile.
- Tested at minimum against ~375px (small phone), ~430px (large phone),
  ~768px (tablet portrait), ~1024px+ (desktop) widths.

## Pages

1. **index.html** — hero with boot-sequence + glitch title, badges/
   value-prop/metrics sections with staggered scroll reveals, parallax
   architecture showcase, CTA. Fully responsive per above.
2. **projects.html** — rebuilt into a complete page (doctype/head/nav/
   footer, currently missing). Project grid with richer, plausible
   case-study copy extending what's already implied by the site
   (Production CI/CD Platform, Kubernetes Microservices, plus new:
   Terraform multi-env IaC provisioning, an observability/monitoring
   stack), glowing hover cards, tag chips.
3. **architecture.html** — rebuilt into a complete page. Existing
   diagrams (`aws-architecture.png`, `cicd-pipeline.png`,
   `kubernetes-architecture.png`; note `terraform-workflow.png` exists
   in `assets/` but isn't currently referenced anywhere — it will be
   added as a 4th diagram card) shown in glowing frames with captions,
   click-to-zoom lightbox (works via tap on mobile).
4. **resume.html** — rebuilt into a complete page with a styled
   experience/skills timeline (extrapolated from the site's existing
   DevOps positioning). Since the referenced PDF doesn't exist, the
   "Download Resume" button falls back to `mailto:` contact until a
   real PDF is dropped at the existing path — the path stays wired up
   so adding the file later just works.
5. **blog.html** + `posts/first-post.html`** — rebuilt into complete,
   styled pages; blog listing card links to the existing post.
6. **Shared nav/footer** — duplicated per page (no fetch-based partials
   — avoids flash-of-unstyled-nav on a 6-page static site with no build
   step), consistent active-link highlighting, mobile hamburger menu
   shared across all pages.

## Technical approach

- Rewrite `css/style.css` and `js/script.js` in place. No new build
  tooling or package.json.
- Add GSAP + ScrollTrigger CDN and Google Fonts `<link>`/`<script>`
  tags to every page's `<head>`.
- New small vanilla-JS canvas module for the matrix-rain effect,
  gated by viewport width and `prefers-reduced-motion`.
- Real placeholder email already present in `index.html`
  (`yourmail@gmail.com`) will be corrected to the user's actual email
  where contact links are used.

## Testing plan

- Serve locally (e.g. `python -m http.server`) and click through every
  nav link/internal link on every page.
- Resize/emulate at 375px, 430px, 768px, 1024px+ to confirm no
  horizontal overflow, nav collapses/expands correctly, grids reflow.
- Confirm GSAP ScrollTrigger animations fire once per element (no
  re-trigger jank) and matrix-rain/parallax respect
  `prefers-reduced-motion`.
- Check browser console for errors on each page.
- Verify the lightbox and mobile hamburger menu both work via touch
  emulation.

## Deployment

No changes to `.github/workflows/deploy.yml` needed (GitHub Pages
serves `main` directly). Implementation happens on the working tree;
**no commit/push until the user reviews the result**, since pushing to
`main` publishes directly to the live `.github.io` URL.
