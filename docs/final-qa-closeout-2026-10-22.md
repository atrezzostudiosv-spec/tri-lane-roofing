# TRI-LANE ROOFING — ATREZZO QA closeout (2026-10-22)

> Scope: Atrezzo's unapproved design-preview website, not Tri-Lane's official production website.
> Demo: https://atrezzostudiosv-spec.github.io/tri-lane-roofing/
> Business reference: https://trilaneroofing.com/

## Verified on 2026-10-22

- Approved current five-page UI remains in place: Home, About, Services, Gallery and Contact. Demo pages still use `noindex, follow`.
- Archived design-only preview documents now use `noindex, nofollow`; they are preserved, not presented as official client sites.
- The two attributed Home and Services testimonials were corrected to reproduce the verified published wording on the official business website.
- The original illustrations continue to be identified as *illustrative images*, not real completed Tri-Lane projects.
- The Home and interior hero images use source-validated responsive WebP variants; visual/geometry regression tests passed (Home 4/4; interiors 12/12).
- The runtime Tailwind CDN was replaced with the browser-captured equivalent local stylesheets, and 20/20 initial screenshots plus 5/5 tested interaction states matched the previous design.
- Contrast and input-label accessibility fixes passed **29/29 local automated WCAG 2.2 A/AA/2.1 A/AA/2.2 AA rule-set scans** across 375, 768, 1024 and 1440px as applicable, including wizard steps and Gallery viewer. This is an automated scan, **not** proof of full WCAG conformance.
- The public deployed website passed **20/20 viewport loads** (five pages × four widths), **15/15 selected live automated axe accessibility scans**, **9/9 interaction checks**, with no detected JS page errors or horizontal overflow.
- Public Contact form delivery was simulated using an intercepted FormSubmit response (**no real emails were sent** in the last QA run). The positive feedback and Atrezzo-recipient disclosure were confirmed.
- Last public GitHub Pages deployment of accessibility fixes succeeded (GitHub Actions run 39818489932).

## Lighthouse on the public demo (lab, one run each)

| Page | Mobile score | Desktop score | Mobile LCP |
|---|---:|---:|---:|
| About | 67 | 84 | 7.97 s |
| Services | 70 | 82 | 9.19 s |
| Gallery (original snapshot) | 67 | 85 | 10.77 s |
| Contact | 87 | 98 | 3.37 s |

The results are **single-run lab measurements**, not CrUX / real-user performance. Scores may vary between runs.
Evidence: https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39818770371

Previous internal mobile lab runs before interior responsive-image rollout reported About 58, Services 66, Gallery 68 and Contact 87; do not assume score movement is statistically significant with one sample per configuration.

The separate Home measurement after static Tailwind optimization reported a mobile **median 75/100 across three lab runs**, desktop **81/100**, and mobile LCP median approximately **6.27 s**.
Evidence: https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39812726527

## Gallery mobile image optimization — integrated and remeasured

- Pull request: https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/15
- Same original illustrative source photos; new high-fidelity WebP variants for mobile Gallery hero and thumbnail tiles. No design, copy, source claims, or layout changes.
- Gallery 800px hero variant: **972,750 bytes → 270,892 bytes** (~72.2% reduction); 480px variant: 376,638 → 120,176 bytes (~68.1% reduction).
- Source-specific Chromium visual QA: 4/4 viewport groups (375, 768, 1024, 1440px), identical geometries, average top-screen pixel differences 0.339 and 0.744/255 on mobile/tablet, none on desktop.
- 28/28 original-resolution modal photo openings across four viewport widths; image arrows and Escape close remained functional.
- Live published Gallery Lighthouse **mobile runs 78, 80, 79; median 79/100**. Corresponding LCP: 4,775 / 4,667 / 4,718 ms; median **4.718 s**. FCP median 2.673 s; TBT 0; CLS median 0.0043.
- Live Gallery desktop: 84/100, LCP 2.691 s (one run).
- Earlier Gallery baseline single mobile run: 67/100, LCP 10.77 s. This is a directional *lab* comparison rather than proof of an in-field improvement.
- Re-run evidence: https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39822528051

## Status and next prioritized actions

| Area | Status | Remaining work |
|---|---|---|
| Navigation and core UI | VERIFIED in Chromium | Manual real-device and keyboard-only review recommended |
| Automated A/AA accessibility scan | PASS for tested states | Manual screen-reader, keyboard focus and motion review not fully verified |
| Form validation and client-side mocked delivery | VERIFIED | Replace Atrezzo staging inbox only after client approves and activates their destination; re-test actual delivery |
| Responsive image selection | VERIFIED | Gallery hero and seven tiles optimized with responsive WebPs; full-size originals preserved in lightbox; continue evaluating other pages |
| Gallery mobile performance | IMPROVED, FURTHER WORK RECOMMENDED | Mobile 3-run Lighthouse median 79/100, LCP 4.718 s; remaining render-blocking CSS/fonts and large images merit isolated testing |
| About/Services mobile performance | NEEDS OPTIMIZATION | LCP ~7.97/9.19 s; repeat Lighthouse trials after localized performance improvements |
| Contact delivery to client inbox | NOT VERIFIED | Atrezzo staging inbox is temporary; do not imply messages reach Tri-Lane |
| Business data, contact and claims | SOURCE-BOUNDED | Obtain final client sign-off on copy, phone destinations, image rights, attributed reviews, and operational procedures |
| SEO indexing / domain publication | NOT APPROVED | Demo remains `noindex`; do not publish as official business site without client approval |

## Fidelity / release restrictions

**Do not invent services, rates, geographic coverage, warranties, reviews or project portfolios.**
Preserve existing verified business contact information and clearly marked illustrations.
Never present a mocked FormSubmit success as proof of actual email delivery.
Avoid shipping additional changes without localized regression tests and published-site verification.
