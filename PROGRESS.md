# PixelForge — Status Perkembangan (Progress Tracker)

Dokumen pelacak status implementasi setiap milestone (M1–M9) dan catatan keputusan teknis.

---

## Ringkasan Status Milestone

| Milestone | Deskripsi | Status | Catatan Verifikasi |
|---|---|---|---|
| **M1** | Kanvas, zoom/pan, grid, pensil, penghapus, picker, palette dasar, tema | **SELESAI** | Rendering kanvas nearest-neighbor, zoom 100-6400%, tema gelap/terang/kontras |
| **M2** | Bentuk (garis, rect, rounded-rect, elips, polygon, kurva), fill, pixel-perfect, simetri/radial, dithering, undo/redo | **SELESAI** | Undo/redo berbasis diff per-rect akurat, scanline fill, Bayer dithering |
| **M3** | Layer lengkap, blend mode, opacity, grup, lock, referensi, clipping | **SELESAI** | Kompositor murni RGBA, clipping mask, grup hierarkis |
| **M4** | Seleksi (rect, elips, lasso, wand), clipboard, transformasi, efek piksel | **SELESAI** | Nearest scale/rotate, outline, drop shadow, replace color |
| **M5** | Animasi: timeline, onion skin, tags, live preview, linked cel | **SELESAI** | Navigasi frame lancar, onion skin merah/biru, tag forward/reverse/ping-pong, linked cels |
| **M6** | Ekspor: PNG, sprite sheet, Aseprite JSON, GIF, Godot 4 .tres, Unity, TexturePacker, ZIP | **SELESAI** | Pipeline ekspor murni tanpa DOM, border extrude untuk anti-bleeding |
| **M7** | Impor, .pfx simpan/buka/migrasi, autosave & recovery IndexedDB, tab multi-dokumen, slices/hitbox/anchors | **SELESAI** | Serialisasi RLE Base64 lossless, crash recovery modal |
| **M8** | Palet lanjutan (GPL, HEX, PAL), indexed color mode, kuantisasi gambar, command palette (`Ctrl+K`), i18n ID/EN, PWA | **SELESAI** | Kamus lengkap Bahasa Indonesia & English, PWA manifest & Service Worker |
| **M9** | Polishing UI, keyboard shortcuts, aksesibilitas, 58 unit test, dokumentasi lengkap, CLI headless, 70 templat game 2D | **SELESAI** | `tests/run.js` lulus 58 test, CLI `tools/cli.js` berfungsi penuh, 70 templat modular terverifikasi |

---

## Catatan Keputusan Teknis
1. **Stack**: React 19 + Vite 6 + JavaScript murni (ES Modules) + CSS murni. React hanya menjadi lapisan view UI; seluruh logika core/render/io/utils murni tanpa DOM.
2. **Piksel Selalu Tegas**: `imageSmoothingEnabled = false`, CSS `image-rendering: pixelated`, alpha 0/255.
3. **Format Proyek**: `.pfx` v1 berbasis JSON UTF-8 dengan data piksel RGBA terkompresi RLE 32-bit + Base64.
4. **Ekspor Game Dev**: Menyediakan resource asli Godot 4 `.tres` SpriteFrames, slice metadata Unity, dan kompatibilitas Aseprite / TexturePacker JSON.
5. **Headless CLI**: Modul core dan I/O dapat dijalankan langsung di Node.js via `node tools/cli.js`.

