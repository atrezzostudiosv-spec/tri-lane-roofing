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

## About and Services hero mobile performance — verified 2026-10-23

- Implementation: [PR #19](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/19), published successfully via [GitHub Pages](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39871798636).
- Reencoded existing approved *same-source illustration* into three size-matched WebP copies for **About and Services only**. Original desktop 1672w photo remains intact. No CSS, JavaScript, font or icon resources were modified.
- 640px hero: 352,338 → 117,406 bytes (−66.7%); 960px: 773,278 → 247,468 (−68.0%); 1280px: 1,348,252 → 420,352 (−68.8%).
- [Responsive visual/functional test](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39871467621): **8/8** viewport groups passed at 375/768/1024/1440px on both pages, unchanged calculated typography, icons, colors, layout geometry, navigation, responsive overflow, noindex, and wizard interactions; above-fold image compression caused only a small expected photographic RGB difference. Original image is still used at 1440px.
- [Live Lighthouse post-release](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39871866319): three mobile lab tests per page, one desktop:
  - About mobile scores **72 / 68 / 89; median 72/100**; LCP **5.492 / 5.673 / 3.695s, median 5.492s**; desktop single run 83/100.
  - Services mobile scores **78 / 75 / 75; median 75/100**; LCP **5.601 / 5.821 / 5.801s, median 5.801s**; desktop single run 83/100.
- Prior single-run mobile snapshot: About 67/100, LCP 7.973s; Services 70/100, LCP 9.189s. Comparing a single older run with a new 3-run median is **directional evidence only**, not an isolated A/B benchmark or actual user experience.
- Both pages still exceed the generally recommended mobile LCP target of 2.5s; additional optimizations must preserve approved typography, icons, colors, animation and design. Avoid removing render-critical stylesheets after Gallery visual parity regression failed.

## About and Services secondary-image optimization — verified 2026-10-23

- [PR #21](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/21) integrates existing same-source Gallery WebP images for the two large secondary photos, without replacing media, labels or visual layout.
  - About section photo on standard mobile 375px: original home-gallery-secondary.jpg (396,897 bytes) → gallery-secondary-480.webp (95,782 bytes). Native JPG deliberately retained at tablet 768px for fidelity; source selection scales with viewport/device density.
  - Services roofing photo on standard mobile 375px: original home-gallery-feature.jpg (339,783 bytes) → gallery-feature-480.webp (74,284 bytes). A 900w version (247,100 bytes) is selected for larger screens or 375px DPR2, rather than the original JPEG.
- [PR #22](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/22) allows About 375px DPR2 to select gallery-secondary-900.webp (306,566 bytes) instead of reverting to the 396,897-byte original; the native JPG remains selected at 375px DPR3 and at 768px tablet for source fidelity.
- [Local Chromium 8/8 responsive verification](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39910808947) at 375/768/1024/1440px for About and Services, with image quality screening and unchanged computed layout/fonts/icons, navigation and inquiry wizard.
- [Retina 7/7 comparison](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39911287237) across mobile DPR1/2/3 and tablet/desktop confirmed source selection, image appearance and identical layout.
- [Live published GitHub Pages audit](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39911593823): **10/10** browser scenarios passed for the two pages, including standard and DPR2 mobile, tablet, and desktop. No missing local images, unexpected mobile overflow, JavaScript errors, altered icon/font families or broken inquiry modal.
- These are *transfer-size improvements for secondary images*, not measured changes to the pages' Largest Contentful Paint. Previous LCP benchmark from the hero-image optimization remains the current performance reference.

## Keyboard access fixes — verified on live preview 2026-10-23

- [PR #24](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/24): shared JavaScript fixes inquiry-dialog focus placement, Tab/Shift+Tab confinement, Escape dismissal, focus return to the opener, four-step wizard focus continuity, keyboard Escape closing of the responsive menu, and focus restoration after the menu closes. Background is temporarily `inert` while the inquiry modal is open and restored on close.
- [PR #25](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/pull/25): cache-busting URL for that exact existing JavaScript across all five HTML pages, without changing rendered markup or styling.
- [Development Chrome parity](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39917407015): **20/20** page–viewport cases at 375, 768, 1024, 1440 px. Verified 22 consecutive Tab presses remain within the active modal, Shift+Tab boundary, step navigation, Escape, focus return, inert restoration, menu keyboard interaction and no JavaScript errors. Computed design properties matched current approved site; 18 initial screenshots were pixel-exact, 2 differed by only 72 RGB channels without geometry differences.
- [Published GitHub Pages verification](https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39918183226): **20/20** page–viewport keyboard cases and **5/5 axe-core A/AA scans** on mobile with inquiry modal open. No failures. Public script URL verified on all five pages.
- This is a focused browser/automated accessibility verification, **not** a claim of full WCAG 2.2 AA conformance. A manual screen-reader evaluation on physical devices remains recommended before official client launch.
- No brand fonts, icons, CSS, photo assets, layout, text, email recipient, SEO-indexing policy or domain publishing were changed in this phase.

## Status and next prioritized actions

| Area | Status | Remaining work |
|---|---|---|
| Navigation and core UI | VERIFIED including keyboard tests (live) | Responsive menu and inquiry focus behavior passed 20/20 live viewport cases; physical-device manual review remains recommended |
| Automated A/AA accessibility scan | PASS for tested states including open inquiry | 5/5 latest live mobile modal scans passed; manual assistive-tech and physical-device review still needed for full WCAG assessment |
| Form validation and client-side mocked delivery | VERIFIED | Replace Atrezzo staging inbox only after client approves and activates their destination; re-test actual delivery |
| Responsive image selection | VERIFIED | Gallery images plus About/Services hero and secondary photos now have validated responsive variants; original source assets, high-detail fallbacks and lightbox images preserved |
| Gallery mobile performance | IMPROVED, FURTHER WORK RECOMMENDED | Mobile 3-run Lighthouse median 79/100, LCP 4.718 s; remaining render-blocking CSS/fonts and large images merit isolated testing |
| About/Services mobile performance | IMPROVED; FURTHER WORK RECOMMENDED | Post-hero mobile lab medians: About 72/100, LCP 5.492s; Services 75/100, LCP 5.801s. Do not change typography, icons or visual design |
| Contact delivery to client inbox | NOT VERIFIED | Atrezzo staging inbox is temporary; do not imply messages reach Tri-Lane |
| Business data, contact and claims | SOURCE-BOUNDED | Obtain final client sign-off on copy, phone destinations, image rights, attributed reviews, and operational procedures |
| SEO indexing / domain publication | NOT APPROVED | Demo remains `noindex`; do not publish as official business site without client approval |

## Fidelity / release restrictions

**Do not invent services, rates, geographic coverage, warranties, reviews or project portfolios.**
Preserve existing verified business contact information and clearly marked illustrations.
Never present a mocked FormSubmit success as proof of actual email delivery.
Avoid shipping additional changes without localized regression tests and published-site verification.
