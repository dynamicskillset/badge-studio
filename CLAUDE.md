# Badge Studio

SVG badge designer — choose a template, colour palette, mask, and glyph, then download as PNG.

## Architecture

- `index.html` — entry point; contains HTML templates for overlays
- `src/main.js` — entry point; imports FA6 CSS, app CSS, and calls `initStudio()`
- `src/studio.js` — all UI logic (settings, glyph selector, template/palette/mask/glyph update, rasterise)
- `src/palette.js` — `Palette` class (parses/applies colour palettes)
- `src/icons.js` — curated FA6 icon list (~250 solid + brand icons)
- `src/styles/main.css` — application styles (flexbox layout, graph-paper grid, overlays)
- `public/templates/` — SVG badge templates (basic, standard, detailed)
- `public/masks/` — SVG overlay masks (lines)
- `vite.config.js` — Vite config (root: `.`, publicDir: `public`)

## Commands

- `npm run dev` — start development server (http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build

## Standards

- ES modules throughout (`import`/`export`)
- `async/await` for SVG loading (`fetch` + `DOMParser`) and rendering
- FA6 icons: solid uses `fa-solid fa-{name}` + `font-weight: 900 "Font Awesome 6 Free"`, brands use `fa-brands fa-{name}` + `400 "Font Awesome 6 Brands"`
- SVG templates use `href` (not `xlink:href`)
- Rasterise uses `encodeURIComponent` (not `btoa`) for safe SVG data URIs
- Fonts: Lora (display) + Plus Jakarta Sans (body) via Bunny Fonts CDN; FA6 via npm

## Verification

- `npm run build` — must succeed with no errors
- Manual browser test: select template, change palette, toggle options, pick glyph, verify badge renders

## State

> Updated: 2026-03-17
> Phase 1–6 complete: Vite setup, JS modernisation, FA4→FA6, Mozilla branding removed, CSS modernised, HTML cleaned up.

## Known Issues

- None currently

## Lessons Learned

- The stitching path in SVG templates is ~5000 chars of bezier segments — always copy programmatically, not by hand
