# PixelForge

A browser-native, offline-first pixel art editor and sprite animation studio engineered for 2D game pipelines. Built with zero UI framework bloat, hard-pixel raster guarantees, pure JavaScript media encoders, interactive game playtest arena, and direct export targets for Godot 4, Unity, Aseprite, GameMaker, Phaser 3, Raylib, and Love2D.

**[🚀 Launch Live Web App](https://davidyehuda45-byte.github.io/pixeleditor/)**

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-ff4081.svg)](https://davidyehuda45-byte.github.io/pixeleditor/)
[![CI](https://github.com/davidyehuda45-byte/pixeleditor/actions/workflows/ci.yml/badge.svg)](https://github.com/davidyehuda45-byte/pixeleditor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 62 passed](https://img.shields.io/badge/Tests-62%20passed-brightgreen.svg)](#testing)
[![Dependencies: 2](https://img.shields.io/badge/Dependencies-React%20%7C%20Vite-informational.svg)](package.json)
[![Offline: PWA](https://img.shields.io/badge/Offline-PWA%20Ready-success.svg)](#architecture)

---

## Why PixelForge?

Most web-based drawing tools treat pixel art as scaled HTML5 canvas drawings, causing subpixel bleeding, anti-aliased interpolation, and lossy compression artifacts. PixelForge was designed from the ground up for technical pixel artists and game developers:

1. **Hard Pixel Guarantee**: Nearest-neighbor scaling from 100% to 6400%. Alpha channel is strictly binary (0 or 255) by default to eliminate transparent halos in game engines.
2. **Deterministic Raster Engine**: In-house implementations of Bresenham line/ellipse, scanline flood fill, RotSprite, Scale2x/xBRZ, Bayer matrix dithering, and 47-tile autotile bitmasking.
3. **Engine-First Exporters**: Generates ready-to-use Godot 4 `.tres` `SpriteFrames`, Unity 9-slice slicing metadata, Aseprite-compatible JSON (hash/array), and TexturePacker formats with border extrude to prevent tile bleeding.
4. **Local-First & Zero Telemetry**: Operates completely client-side. Saves projects directly to your filesystem via the File System Access API with automatic IndexedDB crash recovery.
5. **Headless Node CLI**: Automate sprite sheet baking and format conversions in your CI/CD pipelines without launching a browser.
6. **Self-Contained Encoders**: Zero external binary dependencies. Pure JavaScript encoders for PNG (zlib/deflate via `CompressionStream` with uncompressed block fallback), animated GIF (LZW compression), and ZIP archives.

---

## Quickstart

### Prerequisites
- Node.js 18 or newer
- npm 9 or newer

```bash
# Clone the repository
git clone https://github.com/davidyehuda45-byte/pixeleditor.git
cd pixeleditor

# Install dependencies (only React 19 and Vite)
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173` in any modern Chromium, Firefox, or Safari browser.

### Production Build
```bash
npm run build
```
Generates a static production bundle in `dist/` that can be served from any static host (GitHub Pages, Vercel, Netlify, or an internal file server) with zero server-side runtime.

---

## Core Capabilities

### Drawing & Raster Tools
- **Precision Drawing**: Pencil, Eraser, Eyedropper, Scanline Flood Fill with tolerance and contiguous/global modes.
- **Pixel-Perfect Filter**: Real-time removal of unsightly L-corner pixel nubs on freehand strokes.
- **Parametric Shapes**: Bresenham lines, rectangles, rounded rectangles, ellipses, polygons, and Bezier curves (linear, quadratic, cubic).
- **Advanced Brushes**: Bayer ordered dithering (2×2, 4×4, 8×8), checkerboard, palette-ramp shading brush, deterministic seeded spray brush, and bitmap text with 3 built-in micro-fonts.
- **Symmetry & Tiling**: Real-time horizontal, vertical, dual-axis, and 2–12 axis radial symmetry. Seamless tile-wrap drawing mode for infinite textures.

### Layers & Compositing
- Layer hierarchy with folders/groups, individual opacity, visibility, layer locking, and alpha locking.
- **Blend Modes**: Normal, Multiply, Screen, Overlay, Darken, Lighten, Add, Subtract, Difference.
- **Clipping Masks**: Clip upper layers strictly to the alpha boundary of base layers.
- **Reference Layers**: Trace sketches and model sheets without including them in final exports.

### Timeline & Cel Animation
- Multi-frame timeline with per-frame duration overrides (ms) and global FPS playback.
- **Linked Cels**: Share pixel cel data across multiple frames—edits propagate automatically.
- **Multi-Frame Onion Skinning**: Configurable past (red tint) and future (blue tint) frame shadows.
- **Animation Tags**: Define ranges (`idle`, `walk`, `attack`, `hurt`) with playback directions: Forward, Reverse, Ping-Pong.

### 70 Modular 2D Game Templates
Press `Ctrl+Shift+N` to open the template catalog. Includes 70 procedural templates across 7 categories:
- **Characters & Monsters (14)**: Warrior, Rogue, Mage, Cleric, Archer, Paladin, Necromancer, Goblin, Skeleton, Slime, Orc, Golem, Dragon, Boss Demon. (Multi-layer structure: shadow, base, clothes, armor, weapon, helm).
- **Buildings (10)**: Village House, Blacksmith, Wizard Tower, Dungeon Entrance, Tavern, Windmill, Castle Gate, Shop, Guard Post, Church.
- **Weapons (10)**: Iron Sword, Wooden Bow, Magic Staff, Battle Axe, Dagger, Crossbow, Warhammer, Halberd, Spellbook, Shield.
- **Items & Loot (10)**: Health Potion, Mana Potion, Gold Coin, Treasure Chest, Dungeon Key, Gemstone, Ancient Scroll, Meat/Food, Ring, Crown.
- **16×16 Tilesets (10)**: Grassland, Dungeon Stone, Desert Sand, Snow/Ice, Cave Rock, Castle Interior, Forest Path, Lava, Water/Coast, Sci-Fi Metal.
- **Combat FX (8)**: Fireball, Lightning, Slash, Ice Spike, Poison Cloud, Magic Shield, Heal Sparkle, Explosion.
- **Retro UI (8)**: Dialog Box, Health/Mana Bar, Inventory Slot 9-Slice, Action Button, Tooltip, Minimap Frame, Quest Window, Pause Menu.

---

## Headless CLI

Export, slice, and convert `.pfx` project files directly from the command line:

```bash
# Print CLI usage and available options
node tools/cli.js --help

# Inspect document dimensions, frames, layers, and tags
node tools/cli.js info assets/hero.pfx

# Export sprite sheet + Godot 4 .tres SpriteFrames with 2x scale
node tools/cli.js export assets/hero.pfx --godot --scale 2 --out dist/assets/

# Export single animation tag to an animated GIF
node tools/cli.js export assets/hero.pfx --gif --tag walk --out dist/previews/

# Export trimmed horizontal sprite sheet with 1px border extrude (anti-bleed)
node tools/cli.js export assets/tiles.pfx --sheet --trim --extrude 1 --out build/
```

### CLI Flag Reference
| Flag | Description | Default |
|---|---|---|
| `--format <fmt>` | Output format: `sheet`, `png`, `gif`, `godot`, `zip` | `sheet` |
| `--scale <n>` | Integer multiplier (1–16) via nearest-neighbor | `1` |
| `--tag <name>` | Restrict export to frames belonging to specified tag | All |
| `--layout <type>` | Layout structure: `horizontal`, `vertical`, `grid`, `packed` | `horizontal` |
| `--columns <n>` | Column count when using `--layout grid` | `8` |
| `--padding <n>` | Pixel gap placed between frames | `0` |
| `--extrude <n>` | Repeat edge pixels outward to prevent texture atlas bleeding | `0` |
| `--trim` | Crop uniform transparent margins per frame | `false` |
| `--dedupe` | Map identical cels to identical atlas positions | `false` |
| `--power-of-two` | Pad overall sheet width/height to nearest power-of-two | `false` |

---

## Game Engine Integration

PixelForge outputs native, production-tested formats for major engines:

- **Godot 4.x**: Generates `.tres` (`SpriteFrames`) referencing atlas regions, preserving animation tags, frame durations, and loop flags. Drag directly onto an `AnimatedSprite2D`. Read the [Godot Integration Guide](docs/GODOT.md).
- **Unity**: Generates PNG atlas and JSON slicing data including 9-slice borders. Read the [Unity Integration Guide](docs/UNITY.md).
- **GameMaker**: Horizontal strip export with uniform frame stride. Read the [GameMaker Guide](docs/GAMEMAKER.md).
- **Aseprite & TexturePacker**: Compatible `.json` array and hash schemas for custom game engines.
- **File Format Specification**: Document schema for native `.pfx` JSON files is documented in [docs/FILE_FORMAT.md](docs/FILE_FORMAT.md).

---

## Keyboard Shortcuts

| Command | Key | Command | Key |
|---|---|---|---|
| Pencil | `P` | Zoom Tool | `Z` |
| Eraser | `E` | Pan Canvas | `Space` + Drag / Middle Mouse |
| Fill Bucket | `G` | Toggle Grid | `Ctrl + '` |
| Dither Brush | `B` | Swap Colors | `X` |
| Eyedropper | `I` | Brush Size Dec/Inc | `[` / `]` |
| Marquee Select | `M` | Undo / Redo | `Ctrl + Z` / `Ctrl + Y` |
| Move Tool | `V` | Save Project | `Ctrl + S` |
| Line Tool | `L` | Export Dialog | `Ctrl + E` |
| Rectangle | `R` | Template Catalog | `Ctrl + Shift + N` |
| Ellipse | `O` | Command Palette | `Ctrl + K` |
| Text Tool | `T` | Play / Pause | `Enter` |
| Prev / Next Frame | `,` / `.` | Next / Prev Frame | `.` / `,` |

---

## Architecture

```
PembuatKarakterPixel/
├── docs/                   # Engine integration guides & specs
│   ├── ARCHITECTURE.md     # Full architectural documentation
│   ├── FILE_FORMAT.md      # .pfx schema specification
│   ├── GODOT.md            # Godot 4.x SpriteFrames guide
│   ├── UNITY.md            # Unity 9-slice and sprite guide
│   └── GAMEMAKER.md        # GameMaker strip guide
├── src/
│   ├── core/               # PixelDocument model, history, compositor
│   │   ├── templates/      # 70 modular game asset templates
│   │   ├── compositor.js   # Blend modes, clipping masks, layer tree
│   │   ├── history.js      # Memory-capped command stack + byte diffs
│   │   └── document.js     # Frames, cels, layers, tags, metadata
│   ├── tools/              # Raster algorithms (Bresenham, flood fill, etc.)
│   ├── io/                 # Native pure JS encoders (PNG, GIF, ZIP, PFX)
│   ├── render/             # Canvas viewport, checkerboard, onion skin
│   ├── components/         # Clean React 19 UI panels
│   └── App.jsx             # Main application orchestrator
├── tools/
│   └── cli.js              # Headless CLI exporter (Node.js)
└── tests/                  # 58 zero-dependency unit tests
```

---

## Testing

PixelForge maintains an internal, dependency-free test runner (`tests/run.js`) to guarantee deterministic pixel math across environments:

```bash
npm test
```

The test suite validates:
- Bresenham lines, symmetric ellipses, iterative scanline flood fills.
- Nearest-neighbor scaling, RotSprite, xBRZ 2x, 47-tile autotiling bitmasks, tangent-space 2D normal maps.
- Blend mode math, clipping mask alpha isolation, and group opacity compositing.
- State history (byte-diff reversibility, structural undo/redo, timeline jumping).
- Pure JS encoders: PNG bitstreams, LZW GIF compression, ZIP headers, and CRC-32 validity.
- Sprite sheet layout engines: border extrude, deduplication, power-of-two padding, and transparent trimming.
- Game engine exporters: Godot `.tres`, Unity JSON, Aseprite JSON, TexturePacker JSON, and palette parsers (`.gpl`, `.hex`, `.pal`).
- All 70 procedural game templates: cel population, layer integrity, and slice metadata.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

## Architecture

```
PembuatKarakterPixel/
├── docs/                   # Engine integration guides & specs
│   ├── ARCHITECTURE.md     # Full architectural documentation
│   ├── FILE_FORMAT.md      # .pfx schema specification
│   ├── GODOT.md            # Godot 4.x SpriteFrames guide
│   ├── UNITY.md            # Unity 9-slice and sprite guide
│   └── GAMEMAKER.md        # GameMaker strip guide
├── src/
│   ├── core/               # PixelDocument model, history, compositor
│   │   ├── templates/      # 70 modular game asset templates
│   │   ├── compositor.js   # Blend modes, clipping masks, layer tree
│   │   ├── history.js      # Memory-capped command stack + byte diffs
│   │   └── document.js     # Frames, cels, layers, tags, metadata
│   ├── tools/              # Raster algorithms (Bresenham, flood fill, etc.)
│   ├── io/                 # Native pure JS encoders (PNG, GIF, ZIP, PFX)
│   ├── render/             # Canvas viewport, checkerboard, onion skin
│   ├── components/         # Clean React 19 UI panels
│   └── App.jsx             # Main application orchestrator
├── tools/
│   └── cli.js              # Headless CLI exporter (Node.js)
└── tests/                  # 58 zero-dependency unit tests
```

---

## Testing

PixelForge maintains an internal, dependency-free test runner (`tests/run.js`) to guarantee deterministic pixel math across environments:

```bash
npm test
```

The test suite validates:
- Bresenham lines, symmetric ellipses, iterative scanline flood fills.
- Nearest-neighbor scaling, RotSprite, xBRZ 2x, 47-tile autotiling bitmasks, tangent-space 2D normal maps.
- Blend mode math, clipping mask alpha isolation, and group opacity compositing.
- State history (byte-diff reversibility, structural undo/redo, timeline jumping).
- Pure JS encoders: PNG bitstreams, LZW GIF compression, ZIP headers, and CRC-32 validity.
- Sprite sheet layout engines: border extrude, deduplication, power-of-two padding, and transparent trimming.
- Game engine exporters: Godot `.tres`, Unity JSON, Aseprite JSON, TexturePacker JSON, and palette parsers (`.gpl`, `.hex`, `.pal`).
- All 70 procedural game templates: cel population, layer integrity, and slice metadata.

---

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

