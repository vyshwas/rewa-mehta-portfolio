# Redesign validation

Validated on 25 September 2026 using installed Google Chrome through Playwright.

## Build

`npm run build` passes TypeScript checking and produces the Vite build in `dist/`. The updated direction comment remains in the production HTML. The local preview is available at http://127.0.0.1:5186/.

## Browser checks

All four tests in `tests/portfolio.spec.ts` pass:

1. Rewa's introduction and visible selected-work action; one-time hero motion; footer motion preference; work anchor; no uncaught page errors.
2. Project filtering, list/grid views, structure preview, native dialog, Escape and focus restoration, journey pan and selection, dialog accessibility, and the dating research cover.
3. Approach keyboard navigation and clipboard copy with announced success.
4. Image decoding, reduced motion, horizontal bounds, visible hero CTA at 320×667, 390×844, 768×844, 1366×768, 1440×1000 and 1920×1080, desktop/mobile accessibility, mobile menu, Escape, and anchor navigation.

The axe scans returned no WCAG 2 A/AA or WCAG 2.1 AA violations in the tested desktop, mobile, and dialog states. Coverage is Chrome automation plus visual inspection; no cross-browser claim is made.

## Design check

Desktop and mobile screenshots were reviewed together. The first pass identified obsolete small-phone padding from the garden hero. It was removed, tracking was eased, and a short-desktop-height rule was added. A confirming pass showed the intended asymmetric composition and passing viewport bounds.

The new hero uses no canvas, image preloads, cloud layers, or perpetual animation. The manual motion control now sits in the footer. The existing garden artwork remains in the biography and social preview.

## Evidence

Current captures and review notes are in `.impeccable/review/minimal/`:

- `desktop-hero.png`, `mobile-hero.png`: first viewport.
- `desktop.png`, `mobile.png`: full pages.
- `desktop-work.png`, `desktop-about.png`: supporting sections.
- `review.md`: scoped visual review.

Reference-site captures are in `.verification/minimal-references/`. The previous version is backed up in `.verification/before-minimal-hero/`. Earlier garden review evidence and original-source backups remain in their existing folders.
