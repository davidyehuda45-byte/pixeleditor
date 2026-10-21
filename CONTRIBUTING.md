# Contributing to PixelForge

Thank you for your interest in contributing to PixelForge! This project is an open-source, local-first pixel art studio and sprite animation tool designed specifically for game developers.

## Design Philosophy

Before submitting changes, please keep in mind the core architectural principles:
1. **Hard Pixels Guarantee**: Never introduce subpixel antialiasing or lossy compression into the raster pipeline. Alpha must be binary (0 or 255) by default.
2. **Zero Bloat**: PixelForge uses standard ES modules and native browser APIs. Do not introduce heavy runtime dependencies (e.g., UI component libraries, external canvas wrappers).
3. **Pure JavaScript Encoders**: The encoders in `src/io/` (PNG, GIF, ZIP) are intentionally written in pure JavaScript without external WASM/native dependencies for maximum portability.
4. **Deterministic Math**: Raster tools (Bresenham lines, flood fill, Bayer matrices, 47-tile autotiling) must be 100% deterministic and covered by tests.

---

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/davidyehuda45-byte/pixeleditor.git
cd pixeleditor

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run the test suite
npm test
```

---

## Adding New Game Templates

All 2D game templates live under `src/core/templates/` organized by category:
- `characters.js` — 16-bit RPG characters & monsters (multi-layer: shadow, body, clothes, armor, weapon, helm)
- `buildings.js` — RPG structures and architectural assets
- `weapons.js` — Equippable weapons
- `items.js` — Inventory loot and pickups
- `tilesets.js` — 16×16 environment autotiles
- `fx.js` — Animated combat spells & visual effects
- `ui.js` — 9-slice retro UI components

When adding or editing a template:
1. Define the pixel matrix in the corresponding category file in `src/core/templates/`.
2. Register the template metadata in `src/core/templates/catalog.js`.
3. Add Indonesian and English localization labels in `src/i18n.js`.
4. Run `npm test` to verify cel integrity and document generation.

---

## Submitting Pull Requests

1. **Create a topic branch**: `git checkout -b feat/my-new-feature` or `fix/my-bugfix`.
2. **Follow existing code conventions**: Standard ES modules, 2-space indentation, clear variable naming.
3. **Verify tests pass**: Run `npm test` and `npm run build` locally before pushing.
4. **Keep PRs focused**: One feature or bug fix per pull request.

