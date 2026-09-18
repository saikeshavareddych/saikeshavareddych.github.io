# Portfolio Upgrade — Operator Console

Date: 2026-09-18
Status: Implemented
Supersedes: `2026-09-17-portfolio-redesign-design.md`

## Goal

Upgrade the portfolio from a generic dark-terminal template into something
recruiter-legible and specific to Sai Keshava Reddy: real positioning, animated
architecture diagrams, deep case studies, and an interactive terminal.

## Facts this site asserts

Taken from the resume PDF the user published, with one correction they supplied
directly. Nothing beyond this is claimed.

- **Sai Keshava Reddy Chinthala** — Azure DevOps Engineer.
- **Nexiotron India Pvt Ltd**, Azure DevOps Engineer, Nov 2025 to present.
- **Atya Technologies Pvt. Ltd.**, AWS DevOps Engineer, **Sep 2023 to Sep 2025**.
  The published PDF said Jun 2024; the user corrected this to Sep 2023, so the
  regenerated PDF and the site both use Sep 2023.
- In DevOps since September 2023. Hyderabad; open to remote and to relocation.
- Contact: saikeshavareddych@gmail.com, +91 7729066003,
  linkedin.com/in/saikeshavareddy
- Education: B.Tech EEE, Kamala Institute of Technology and Science (2020–23);
  Diploma EEE, Jyothishmati Institute of Technology and Sciences (2017–20).
- **No certifications held.** Four in preparation, labelled as such everywhere.

### Metrics

Real, and drawn from the resume: 40% faster deployments (Jenkins + GitHub
Actions), 25% lower monthly cloud spend (EC2 right-sizing), 60% less manual
provisioning time (Terraform), 30% better application performance (Nginx
reverse proxy). An earlier revision of this site claimed there were no
defensible numbers; that was wrong and has been corrected.

### Framing of the five builds

The five case studies are **self-directed reference architectures**, built
outside of work, and every page that lists them says so and points at the
resume for shipped work. They are not attributed to either employer.

At the user's request they also appear in the resume PDF, under a clearly
separated **"Reference Architectures (Self-Directed)"** heading with an italic
note stating they are not client deliverables.

**Open risk:** these builds reference tooling that does not appear on the
user's skills list — cosign and SLSA provenance, OPA/Conftest, Loki and Tempo,
AKS blue-green, cert-manager, external-dns. The user has been told they need to
be able to speak to these before an interview, or to have them trimmed.

Numbers inside the build write-ups remain **design targets of the
architecture**, never outcomes claimed for an employer.

## Design language

Replaces the previous acid-green-on-black terminal look, which is the default
every DevOps portfolio arrives at.

- **Colour is semantic, not decorative.** Amber `#ff9245` is identity and
  action; cyan `#45d0e8` is data in motion; green, yellow and red mean healthy,
  warning and alerting, and are used for nothing else.
- **Type:** IBM Plex Mono for all chrome, headings and data; IBM Plex Sans for
  case-study and post prose only. One superfamily.
- **Surfaces are panels, not cards** — 3px corners with a tmux-style status
  strip, instead of uniformly rounded drop-shadow cards.
- **Motion spends its budget in one place:** the hero boot sequence resolving
  into a live terminal. Elsewhere motion is user-triggered or semantic (packets
  animate along diagram paths because data flows there). There is deliberately
  no blanket fade-up on every element.

## Architecture

Still a static site. No build step, no framework, no bundler — GitHub Pages
serves `main` directly.

```
css/style.css          design tokens + all component styles
js/diagrams.js         5 diagrams authored as data, emitted as inline SVG
js/main.js             nav, diagram mounting, counters, meters, lightbox, rail, topology
js/terminal.js         the interactive hero terminal
js/resume.js           probes for the resume PDF, shows viewer or empty state
js/gate.js             PBKDF2 access gate for upload.html
js/upload.js           commits the resume PDF via the GitHub Contents API
assets/diagrams/*.png  rendered fallbacks, used by <noscript> and og:image
```

Diagrams are injected as **inline** SVG rather than `<img>` so CSS can animate
their internals. Flow animation runs only while a diagram is intersecting the
viewport, so an idle tab costs nothing.

## Resume publishing

The user asked for an upload page. GitHub Pages is static hosting, so a file
picked in a browser has nowhere to persist — it reaches other visitors only by
landing in the repository.

`upload.html` therefore commits the PDF through the GitHub Contents API using a
fine-grained token entered at the moment of publishing. The token is held in a
local variable for one request and never written to storage, a cookie, or any
host other than `api.github.com`. A copy-paste git fallback is on the same page.

`resume.html` HEAD-probes `assets/Sai-Keshava-DevOps.pdf` and shows either the
document or an empty state. Because phone browsers embed PDFs unreliably — iOS
Safari and several Android browsers render a blank box — the iframe is used only
on non-touch viewports at 760px and up; narrower or touch viewports get an
explicit open-and-download card instead.

The resume PDF itself is generated from `scratchpad/resume/resume.html` via
Chrome `--print-to-pdf`, so it can be regenerated whenever the facts change.

### Access gate

`upload.html` is gated by a key the user supplies via `upload.html#<key>` (a
fragment, so it is never sent to a server) or the on-page prompt. Only a
PBKDF2-SHA256 derivation at 210,000 iterations with a random salt is stored.

**This is a lock, not a security boundary.** The repository is public, so the
check is readable. The real boundary is the GitHub token: without one, anyone
who gets past the gate still cannot write a byte. The gate is unlinked from
navigation and carries `noindex`.

## Accessibility and degradation

- Every page passes a real-viewport overflow check at 375 / 430 / 768 / 1440px.
- `prefers-reduced-motion: reduce` disables the topology canvas, packet flow,
  typing, counters and meter fills.
- Diagrams carry `<title>` and a full `<desc>`; `<noscript>` supplies the PNG.
- Terminal output is an `aria-live` log; the whole site is keyboard navigable
  with a visible focus ring and a skip link.

## Verification

Driven with puppeteer-core against the installed Chrome:

- No horizontal overflow on any page at any of the four widths.
- No console errors; the resume viewer resolves to an iframe on desktop and
  an open/download card on touch viewports.
- Terminal boots, accepts commands, handles unknown input, keeps history.
- Counters settle to 40% / 25% / 60% / 3; all 24 skill meters fill.
- Lightbox opens and closes on Escape; mobile menu opens.
- Gate stays locked by default, rejects a wrong key, opens on the fragment, and
  wipes the fragment from the address bar.
