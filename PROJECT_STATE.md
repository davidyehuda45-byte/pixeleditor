# PROJECT STATE — PixelForge

**Current State**: Production Ready (Milestones M1–M9 Complete + 42 2D Game Dev Templates)  
**Last Updated**: 2026-10-21  
**Architecture**: React 19 + Vite 6 + Vanilla JS ES Modules + Native CSS

## Quick Start
```bash
# Development server
npm run dev

# Production build
npm run build

# Unit test suite (58 tests)
npm test

# Headless CLI exporter
node tools/cli.js --help
node tools/cli.js export examples/knight.pfx --godot --out build/
```

## Key Modules
- `src/core/`: Document model (`document.js`, `layer.js`, `frame.js`, `cel.js`), compositor, history, store, effects, and `templates.js` (42 game asset templates across 7 categories).
- `src/tools/`: Pure drawing engine, raster utilities, bezier, dithering, text, fonts.
- `src/io/`: Pure PNG, GIF, ZIP encoders, spritesheet packing, `.pfx` JSON+RLE serialization, Godot 4 `.tres` and Aseprite JSON exporters.
- `src/components/`: Viewport canvas, timeline, tool rail, right panel, dialogs (including 42-template browser with category filtering and real-time previews), command palette.
- `tools/cli.js`: Headless CLI export pipeline for game build integrations.
- `examples/`: Starter projects (`knight.pfx`, `dungeon_tileset.pfx`, `ui_9slice.pfx`) and palette fixtures (`.gpl`, `.hex`, `.pal`).
- `tests/`: 58 unit & regression tests with zero test framework overhead (`node tests/run.js`).

## Browser Verification
- Tested in Chrome/Edge DevTools via CDP: 0 runtime errors, 60fps viewport, clean modal hosts.
- 42 editable game dev templates verified in browser: multi-layer separation (body, clothes, weapon, FX), animation tags, collision slices, and palette swapping.
- Service Worker & PWA manifest configured for full offline capability.
- Default language: Bahasa Indonesia (English selectable in settings).

