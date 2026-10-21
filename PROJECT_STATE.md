# PROJECT STATE — PixelForge

**Current State**: Production Ready (Mobile Native UI Redesign + 70 Game Templates + Playtest Arena + Biome Remapper + 7 Engine Targets)  
**Last Updated**: 2026-10-21  
**Repository**: https://github.com/davidyehuda45-byte/pixeleditor  
**Live Demo (Pages)**: https://davidyehuda45-byte.github.io/pixeleditor/  
**Architecture**: React 19 + Vite 6 + Vanilla JS ES Modules + Native CSS

## Quick Start
```bash
# Development server
npm run dev

# Production build
npm run build

# Unit test suite (62 tests)
npm test

# Headless CLI exporter
node tools/cli.js --help
node tools/cli.js export examples/knight.pfx --godot --out build/
```

## Mobile UI Redesign (App-Grade Touch UI)
- **Top Header**: Replaces squeezed desktop menubar with a clean mobile header (Hamburger `☰` drawer trigger, document name badge with dirty indicator, quick Playtest and Export buttons).
- **Mobile Navigation Drawer**: Slide-over panel with quick shortcuts (New, Template, Save, Playtest) and accordion menu categories for all app commands.
- **Streamlined Mobile Tool Strip**: Replaces ~15 colliding desktop controls with active tool badge (tap to switch), brush size stepper (`[-] 1 px [+]`), Pixel-Perfect quick toggle, and `[⚙️ Opsi]` button.
- **Mobile Tool Options Bottom Sheet**: Smooth bottom drawer for advanced tool settings (brush shape, opacity slider, dither mode, symmetry mode, pen pressure, tiled wrapping, alpha lock).
- **Clean Fullscreen Canvas**: Rulers (0, 4, 8, 12, 16...) automatically disabled on mobile screens (`<= 768px`) to maximize drawing area. Desktop mouse hints (`Scroll untuk zoom...`) hidden.
- **Elevated Mobile Dock**: Glassmorphism dock (`backdrop-filter: blur(12px)`) with dynamic safe-area bottom padding for gesture navigation bars.
- **Auto-collapsing Tab Strip**: Tab strip automatically hidden on mobile when only 1 document is open.

## Key Modules
- `src/core/`: Document model (`document.js`, `layer.js`, `frame.js`, `cel.js`), compositor, history, store, effects, and `templates/` (70 modular game asset templates across 7 categories: characters, buildings, weapons, items, tilesets, fx, ui).
- `src/tools/`: Pure drawing engine, raster utilities, bezier, dithering, text, fonts.
- `src/io/`: Pure PNG, GIF, ZIP encoders, spritesheet packing, `.pfx` JSON+RLE serialization, Godot 4 `.tres`, Aseprite JSON, Phaser 3, Raylib C header, and Love2D Lua exporters.
- `src/components/`: Viewport canvas, timeline, tool rail, right panel, dialogs (Playtest Sandbox, Biome Remapper, 70-template browser), mobile dock, and mobile navigation drawer.
- `tools/cli.js`: Headless CLI export pipeline for game build integrations.
- `tests/`: 62 unit & regression tests with zero test framework overhead (`node tests/run.js`).
