# Tri-Lane Roofing — Image optimization phase (2026-10-22)

## Scope and preservation
Five-page static site; preserve **all previously approved imagery, typography, icons, styling, animation, spacing, and copy**. Do not represent illustration as verified construction work. Work performed on branch `optimization-image-assets-20261022`, not on the default branch.

## Changes prepared
1. **Services:** extract four inline WebP images (Windows, Garage Doors, Gutters, Paint & Siding) from `services.html` to `assets/images/services-*.webp`.
2. **Gallery:** extract four inline WebP images (illustrative concepts 02, 03, 06, 07) from `gallery.html` to `assets/images/gallery-concept-*.webp`.
3. **Metadata:** set verified width/height on these eight WebPs:
   - Services: 960 × 720 each.
   - Gallery: 1053 × 790 each.
4. **Existing JPEGs:** set intrinsic width/height wherever already referenced in Home, About, Services and Gallery:
   - `home-gallery-feature.jpg`: 1350 × 760.
   - `home-gallery-secondary.jpg`: 1350 × 1012.
   - `home-gallery-detail.jpg`: 1350 × 1012.
5. Preserve original `loading` and `decoding` values; preserve all ALT texts, DOM order, galleries, links, component classes, visual styles, and hero images.

## Measurements — source HTML uncompressed character length
| Page | Before | Prepared branch | Change |
| --- | ---: | ---: | ---: |
| Home | 43,798 | 43,904 | +106 (intrinsic dimensions) |
| About | 38,786 | 38,813 | +27 (intrinsic dimensions) |
| Services | 575,756 | 46,924 | −528,832 (−91.85%) |
| Gallery | 719,596 | 43,600 | −675,996 (−93.94%) |
| Contact | 25,626 | 25,626 | unchanged |

The approximately **1.20 million source characters** removed across two HTML documents were inline Base64 representations, replaced by independently cached image files. This is **not** a verified PageSpeed, LCP, or transfer-size improvement: network compression, request behavior and cache depend on runtime.

## Verification already completed
- Extracted eight WebP binary files using GitHub's binary blob API with `encoding=base64`.
- Read each committed binary back from the optimization branch using GitHub and verified that its Base64 is exactly identical to the corresponding original inline data (8 of 8); image **pixels and bytes therefore unchanged**.
- Verified WebP dimensions from their embedded VP8 headers (960 × 720; 1053 × 790).
- Verified JPEG dimensions from each file's embedded JPEG frame metadata, not guesses.
- Confirmed five pages contain the same number and order of `img` elements as `main`.
- Confirmed ALT and loading/decoding attributes unchanged and image tag differences are limited to the eight asset references and known dimensions.
- Confirmed no new inline WebP remains on Services and Gallery.
- Confirmed no change to existing JavaScript, CSS, testimonials, forms, `h1`, `noindex` or approved visuals.

## NO COMPROBADO
- GitHub Pages deployment of the new binary image paths and actual HTTP status responses.
- Visual comparison across desktop, tablet, mobile at 375 / 768 / 1024 / 1440 px.
- Gallery viewer opening every image and thumbnail, and mobile swiping.
- Real Google PageSpeed/Lighthouse scores, transfer/network waterfall, LCP/INP/CLS.
- Intrinsic dimensions or safe compression of `home-hero.png` / `home-intro.png`; available GitHub connector returned empty base64 for these large files. **Do not modify without image verification.**
- Cross-device accessibility/contrast, although alt texts were preserved.

## Integration gate
Do not merge into `main` before visual and functional inspection on a staging preview (especially gallery lightbox and Services responsive cards). Fix any visual discrepancy before merge. Design fidelity and losslessness take priority over a synthetic PageSpeed score.

## Next technical priority
Check the large `home-hero.png` / `home-intro.png` assets and render-blocking Tailwind CDN in a separate, tested change set. A compiled CSS alternative must be compared visually before replacing any CDN.
