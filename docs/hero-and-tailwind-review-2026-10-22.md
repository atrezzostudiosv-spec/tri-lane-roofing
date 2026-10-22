# Tri-Lane Roofing — Hero assets and Tailwind review (2026-10-22)

## Scope
Page set: Home, About, Services, Gallery, Contact. Maintain the approved design, business copy, logo, visual effects, interactions and SEO noindex. Work on branch `optimization-hero-tailwind-20261022`.

## Hero assets: verified improvement
- Original `assets/images/home-hero.png`: **3,119,790 bytes**, **1672 × 941 RGB**.
- Original `assets/images/home-intro.png`: **2,634,921 bytes**, **1122 × 1402 RGB**.
- Converted to **lossless WebP**, preserving every original RGB pixel via Pillow decode-and-compare.
- New `assets/images/home-hero.webp`: **2,205,332 bytes**, same dimensions, exact decoded pixels.
- New `assets/images/home-intro.webp`: **1,766,526 bytes**, same dimensions, exact decoded pixels.
- Total original: **5,754,711 bytes**. WebP: **3,971,858 bytes**. Saved: **1,782,853 bytes (30.98%)**.
- Updated image URLs on Home, About, Services and Gallery only. Contact has no hero references.
- Retained original PNGs for safe rollback, alt text, media/layout properties, CSS and JavaScript unchanged.
- Network bytes are source image weights only: actual load timing, LCP and cache depend on deployment and client.

## Chromium visual regression results
Workflow run: https://github.com/atrezzostudiosv-spec/tri-lane-roofing/actions/runs/39785583320

Original `main` versus independent temporary preview variants using identical Playwright browser environments, fonts and CSS.

| Candidate | Views | Passed | Result |
|---|---:|---:|---|
| Hero PNG → **lossless WebP** | 20 | 20 | **0% pixel difference; 0px layout difference** |
| Tailwind CDN → compiled CSS v3.4.17 | 20 | 0 | **Rejected** due to unexpected visual changes |

Tested each of five HTML pages at 375, 768, 1024 and 1440 px. The temporary comparison workflow returned overall failure deliberately because the Tailwind candidate did not meet the visual acceptance gate. That does **not** indicate an issue in the lossless hero candidate.

## Tailwind candidate — why it was not integrated
- Every page currently loads both `assets/css/tailwind-fallback.css` (42,525 chars) and Tailwind development CDN.
- A custom-configured, content-scanned static Tailwind v3 candidate compiled at 22,333 bytes.
- At 375 px the new CSS produced an **8px page-height difference** in each page.
- At 768, 1024 and 1440 px it caused approximately **0.09–0.32% screenshot pixel mismatch** depending on page/viewport; threshold was 0.05%.
- As mandated by Atrezzo, **the existing Tailwind CDN and fallback styles remain unchanged**.
- Future action: diagnose cascade/compiled version mismatch and test an exact CSS equivalence solution in its own isolated branch. Do not replace the CDN merely for a theoretical speed benefit.

## Verified
- GitHub Actions Pillow original-versus-lossless pixel comparison passed for both images.
- Headless Chromium: 20/20 visual comparisons passed for the hero candidate with zero pixel/geometry differences.
- No broken image references in the tested pages. Script/form behavior remains unchanged.
- Both new WebP binaries were generated, committed and original PNG files left in place.
- All five pages retain `noindex, follow`, and their HTML structure, copy, image order, fonts and scripts.

## Not checked / after deployment
- Actual GitHub Pages CDN response and live LCP, INP, CLS.
- Performance under real mobile connections and devices.
- Re-run lighthouse/PageSpeed before claiming numeric speed improvements.
- Verify actual deployed resource requests for `.webp` via browser network panel.

The temporary test workflows and scripts must be removed before merging. Do not merge CSS alternatives that failed the visual gate.
