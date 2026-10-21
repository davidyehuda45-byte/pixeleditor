# Daftar Pengujian Manual PixelForge (Checklist)

Dokumen ini berisi daftar verifikasi pengujian manual pada PixelForge di lingkungan peramban modern (Chrome, Edge, Firefox, Safari).

---

## 1. Gambar Bebas & Performa Kanvas
- [x] **Stroke cepat tanpa bolong**: Goreskan pensil dengan cepat di kanvas 32x32 dan 512x512; garis terinterpolasi penuh tanpa jeda piksel.
- [x] **Pixel-perfect**: Aktifkan toggle `Pixel-perfect`, goreskan sudut diagonal; piksel L-corner ganda dieliminasi secara otomatis.
- [x] **Hard pixels**: Periksa warna piksel yang dihasilkan; semua nilai alpha adalah `255` (atau `0` saat dihapus), tidak ada anti-aliasing atau blur.
- [x] **Zoom & Pan**:
  - Scroll roda mouse memperbesar/memperkecil dengan pusat di kursor (100% sampai 6400%).
  - Tahan tombol `Spasi` atau tombol tengah mouse untuk pan kanvas.
  - Pixel grid otomatis muncul di tingkat zoom tinggi (>800%).

---

## 2. Alat Gambar & Bentuk
- [x] **Garis & Bentuk**: Uji alat Garis (Bresenham), Persegi, Persegi Bulat (rounded-rect), Elips, Poligon, dan Kurva Bezier.
- [x] **Flood Fill**:
  - Isi area tertutup dengan mode contiguous (scanline iteratif).
  - Uji toleransi warna dan opsi global fill.
- [x] **Dithering & Gradient**:
  - Gambar kuas dither (Bayer 2x2, 4x4, 8x8, checker).
  - Buat gradien linear dan radial berpalet; batas antar warna menggunakan dithering berpola.
- [x] **Simetri & Tiled**:
  - Simetri horizontal, vertikal, keduanya, dan radial (2-12 sumbu).
  - Tiled mode membungkus goresan di tepi kanvas (wrap-around seamless).

---

## 3. Seleksi & Transformasi
- [x] **Alat Seleksi**: Marquee persegi, elips, lasso, magic wand.
- [x] **Manipulasi**: Geser seleksi (panah keyboard 1px, Shift+panah 8px).
- [x] **Transformasi**: Flip horizontal/vertikal, rotasi 90/180/270°, scale nearest neighbor tanpa blur.
- [x] **Efek**: Outline otomatis (dalam/luar), drop shadow, replace color, adjust HSV/kontras.

---

## 4. Layer & Animasi
- [x] **Layer**: Tambah, hapus, duplikat, rename, ubah opacity, blend mode (multiply, screen, overlay, dll.), clipping mask, dan grup layer.
- [x] **Timeline & Playback**:
  - Navigasi frame (tombol `,` dan `.`), playback `Enter` / tombol Play.
  - Atur FPS global dan durasi per frame (ms).
  - Onion skinning (tint merah frame sebelumnya, tint biru frame berikutnya).
  - Tag animasi (rentang frame, forward, reverse, ping-pong).
  - Linked cels (Alt+klik atau tombol tengah mouse pada cel) berbagi data piksel antar frame.

---

## 5. Ekspor, Impor & Penyimpanan
- [x] **Ekspor Multi-Format**:
  - PNG transparansi utuh.
  - Sprite sheet dengan layout horizontal/vertikal/grid/packed, opsi trim, dedupe, dan border extrude.
  - JSON kompatibel Aseprite, TexturePacker, dan Unity slices.
  - Godot 4 `.tres` SpriteFrames yang langsung dapat dimuat di Godot.
  - GIF animasi berputar tanpa glitch transparansi.
  - ZIP sequence.
- [x] **Penyimpanan .pfx**:
  - Simpan dan buka kembali berkas `.pfx`; semua layer, frame, cel, link, tag, slice, dan palet identik byte-per-pixel.
  - Autosave berkala ke IndexedDB dan dialog pemulihan crash saat reload halaman.
- [x] **PWA**: PWA manifest valid dan Service Worker terdaftar untuk mode offline.
- [x] **CLI Headless**: Ekspor via `node tools/cli.js export <file.pfx> --sheet --godot` berjalan tanpa DOM.
