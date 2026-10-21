# PixelForge — Architecture

> Status: living document. Update when the architecture changes.

## 1. Stack decision (override)

The original brief forbids frameworks and build tools. Per the product owner's
explicit instruction, PixelForge is built with **React 19 + Vite + plain
JavaScript**. TypeScript is not used. React is only a view layer; all editor
logic stays in framework-free ES modules under `src/core`, `src/utils`,
`src/render`, and `src/io`, so it remains testable in Node and usable by the CLI.

```
React components  ──reads──▶  AppStore (event bus, sessions, UI state)
       │                         │
       │ commands                │ history
       ▼                         ▼
  ToolController  ────────▶  PixelDocument (layers/frames/cels/palette)
       │                         │
       └──── dirty rect ───▶  compositor (pure) ──▶ canvas 2D viewport
```

## 2. Module map

| Path | Responsibility |
|---|---|
| `src/core/document.js` | `PixelDocument`, layers, frames, cels, clone/restore, tree helpers |
| `src/core/layer.js`, `frame.js`, `cel.js` | Model factories/classes |
| `src/core/compositor.js` | Pure RGBA compositor, blend modes, groups, clipping, trim |
| `src/core/selection.js` | Boolean selection mask + rect/ellipse/wand/invert/grow operations |
| `src/core/history.js` | Bounded undo/redo stack, jump-to-step, memory accounting |
| `src/core/store.js` | AppStore: documents/tabs, UI preferences, event bus |
| `src/core/commands.js` | Undoable document/selection/palette commands |
| `src/utils/*` | Raster algorithms, colour maths, dither, symmetry, ids |
| `src/tools/*` | One module per tool family; tools never touch React |
| `src/render/viewport.js` | Imperative pan/zoom canvas renderer, grid, guides, onion skin |
| `src/io/*` | Pure PNG/GIF/ZIP encoders, spritesheet packer, `.pfx` serialise |
| `src/io/exporters/*` | Aseprite JSON, TexturePacker, Godot `.tres` |
| `src/io/importers/*` | Palette parsers, sprite-sheet slicing helpers |
| `src/components/*` | React panels, dialogs, timeline, command palette |
| `tests/*` | Node + `assert` tests for DOM-free modules |

## 3. Document model

```js
PixelDocument {
  id, title, width, height, background, version,
  layers: Layer[],              // flat array, bottom → top paint order
  frames: {id, duration}[],     // animation order
  cels: Map<"layerId|frameId", Cel>,
  tags, slices, hitboxes, anchors, guides, grid,
  palette: PaletteSet,
  selection: Selection
}

Layer { id, type: 'layer'|'group', parentId, name, visible, locked,
        lockAlpha, opacity(0-255), blend, reference, clipping, color, userData }

Cel { layerId, frameId, x, y, width, height,
      pixels: Uint8ClampedArray|null, opacity(0-255) }
```

* Cels are lazily allocated: an empty cel has `pixels === null`.
* **Linked cels** are represented by storing the *same Cel object* under multiple
  `(layer, frame)` keys. Cloning uses an identity map so links survive undo,
  autosave and `.pfx` round trips.
* Groups are referenced by `parentId`; the compositor builds an isolated tree so
  group opacity and blend mode apply to the group as a whole.
* Coordinates are integer pixels, origin top-left.

## 4. Command / history flow

Every mutation is one of two history entry types:

1. **Pixel diff** — freehand strokes and fills capture the cel before the stroke,
   apply directly, then store only the changed bounding rect (`before` and
   `after` RGBA). Undo/redo writes those rects back. One stroke = one entry.
2. **Structural snapshot** — layer/frame/tag/slice/canvas/palette changes clone
   the document before and after. This is deliberately simple and extremely
   hard to get wrong; history is capped (default 200 MB) and old entries are
   evicted. Pixel entries normally dominate.

`History.jumpTo(index)` walks entries backwards/forwards, so the history panel
can time-travel deterministically. All history entries are keyed by layer/frame
IDs, not object references, so they remain valid after a snapshot restore.

## 5. Rendering

* `compositor.js` is pure and works on `Uint8ClampedArray`; it knows nothing
  about canvas or DOM.
* The viewport renders the document into an `ImageData` buffer. Only dirty
  rectangles are recomposited while drawing. A final `drawImage` uses
  `imageSmoothingEnabled = false` at integer zoom.
* Blend modes: normal/source-over, multiply, screen, overlay, darken, lighten,
  add, subtract, difference. Alpha is straight (non-premultiplied); blend
  functions operate on colour then source-over.
* Checkerboard, grid, guides, selection ants and cursor live in screen space and
  never affect exported pixels.
* Onion skin composites neighbouring frames into a tinted buffer behind the
  active frame.
* Export runs asynchronously in small chunks with progress and cancellation, so
  the main thread stays responsive. Encoders themselves are pure modules and
  are exercised by Node tests.

## 6. Tools

Tools receive a small context object (`doc`, `cel`, `selection`, `settings`,
`paint()`, `invalidate()`) and operate on pixel buffers. Freehand tools commit
per-dab into the cel and record a final diff. Shape tools draw into a preview
overlay and commit on pointer-up. The viewport owns pointer capture,
coalesced-event draining and pan/zoom gestures.

## 7. Persistence

* `.pfx` is UTF-8 JSON. RGBA buffers are RLE-compressed and base64-encoded
  (`"encoding": "rle-rgba"`) for deterministic, synchronous, DOM-free
  serialisation. The schema has an explicit version and a migration table.
* Autosave writes the same serialised project to IndexedDB every 30 s while
  dirty; the newest snapshot is offered for recovery on load.
* File System Access API is used when available; download/upload fallback
  covers Firefox/Safari. Opening validates every field and reports readable
  errors instead of throwing.

## 8. State

`AppStore` owns sessions (one per open document, with independent history),
active session, UI preferences (tool, colours, brush, theme, grid, symmetry,
language, shortcuts) and a tiny event bus (`emit`, `subscribe`). React uses
events to re-read the store; the canvas renderer subscribes directly and
redraws without a React render.

## 9. Intentional deviations from the brief

* React + Vite replace hand-rolled DOM and no-build constraint (owner request).
* External UI libraries are still avoided; all icons are inline SVG/CSS.
* Features that are not production-ready are listed honestly in `PROGRESS.md`
  and `README.md` rather than being silently omitted.
