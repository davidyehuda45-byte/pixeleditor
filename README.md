# PixelForge 🎨

> **Studio Pixel Art & Editor Animasi Sprite Lokal**  
> 100% Berjalan Lokal di Browser • Tanpa Server • Tanpa Anti-Aliasing • Siap untuk Game Engine

PixelForge adalah aplikasi web editor pixel art dan animasi sprite tingkat produksi yang dirancang khusus untuk kebutuhan game developer dan seniman piksel. Seluruh logika berjalan 100% di browser tanpa ketergantungan server, akun, atau telemetri.

---

## 🚀 Fitur Utama

- **Piksel Selalu Tegas**: Rendering menggunakan nearest-neighbor scaling (100%–6400%) tanpa blur atau anti-aliasing. Nilai alpha tegas 0 atau 255.
- **Alat Gambar Lengkap**:
  - Pensil, Penghapus, Eyedropper, Flood Fill iteratif (scanline).
  - Garis (Bresenham), Persegi, Persegi Bulat (rounded-rect), Elips, Poligon, dan Kurva Bezier.
  - Mode **Pixel-perfect** untuk menghapus piksel L-corner ekstra.
  - Kuas Dithering (Bayer 2x2/4x4/8x8, checker, garis, titik) dan gradient tool berpalet.
  - Shading/ramp brush, spray brush dengan seed tetap, dan teks dengan bitmap font bawaan.
  - Simetri (horizontal, vertikal, keduanya, radial 2–12 sumbu) dan Tiled/wrap drawing untuk tekstur seamless.
- **Seleksi & Transformasi Bebas**:
  - Marquee persegi, elips, lasso, polygon lasso, dan magic wand.
  - Transformasi rotasi, flip, scale nearest-neighbor, serta efek piksel (outline otomatis, drop shadow, replace color, adjust HSV/kontras).
- **Sistem Layer Tingkat Lanjut**:
  - Susunan hierarkis dengan grup layer (folder), lock layer, lock alpha, clipping mask, dan layer referensi (tidak ikut terekspor).
  - Berbagai blend mode: `normal`, `multiply`, `screen`, `overlay`, `darken`, `lighten`, `add`, `subtract`, `difference`.
- **Timeline Animasi & Live Preview**:
  - Manajemen frame dengan durasi kustom (ms) dan FPS global.
  - Onion skinning multi-frame dengan penandaan warna (merah untuk frame sebelumnya, biru untuk frame berikutnya).
  - Tag animasi (seperti `idle`, `walk`, `attack`) dengan arah playback forward, reverse, dan ping-pong.
  - **Linked Cels**: berbagi data cel piksel antar frame untuk efisiensi animasi.
- **Palet Warna & Swapping**:
  - Color picker lengkap (RGB, HSV, HSL, Hex, Alpha).
  - Impor dan ekspor format `.gpl` (GIMP), `.hex` (Lospec), dan `.pal` (JASC).
  - Mode **Indexed Color**: mengubah warna palet otomatis memperbarui seluruh piksel terkait secara instan.
- **Ekspor Siap Game Engine**:
  - **Godot 4.x**: Menghasilkan berkas `.tres` bertipe `SpriteFrames` yang langsung dapat diseret ke `AnimatedSprite2D`.
  - **Unity**: Menghasilkan atlas PNG dan metadata slicing 9-slice `.json`.
  - **Aseprite & TexturePacker**: Metadata format JSON (varian array dan hash).
  - **GameMaker**: Format horizontal strip dengan penomoran frame otomatis.
  - Format gambar: PNG transparan, GIF animasi (LZW lokal), dan urutan PNG dalam berkas ZIP.
  - Opsi Sprite Sheet: layout horizontal, vertikal, grid, trim transparan, deduplikasi frame identik, dan **border extrude** (mencegah bleeding tekstur saat kamera bergerak).
- **Pustaka 70 Templat Game 2D**:
  - Pustaka templat bawaan siap pakai (`Ctrl+Shift+N`) yang terbagi dalam 7 kategori esensial: Karakter & Monster, Bangunan RPG, Senjata, Item & Loot, Tileset 16×16, Efek Visual (FX), dan UI Retro 9-Slice.
  - Setiap templat dilengkapi pemisahan multi-layer independen, frame animasi, tag, dan metadata collision/anchor yang siap dikustomisasi.
- **Headless CLI**:
  - Ekspor berkas `.pfx` tanpa browser menggunakan `node tools/cli.js`.
- **PWA & Aksesibilitas**:
  - Dukungan Progressive Web App (PWA) lengkap dan bekerja saat offline.
  - Antarmuka bilingual: **Bahasa Indonesia** (default) dan **English**.
  - Tema antarmuka: Gelap (Dark), Terang (Light), dan Kontras Tinggi (High Contrast).
  - Command Palette (`Ctrl+K`) untuk mencari dan menjalankan perintah dengan cepat.

---

## ⌨️ Daftar Shortcut Keyboard

| Alat / Aksi | Shortcut |
|---|---|
| Pensil (`Pencil`) | `P` |
| Penghapus (`Eraser`) | `E` |
| Ember Cat (`Fill Bucket`) | `G` |
| Kuas Dither (`Brush`) | `B` |
| Pipet Warna (`Eyedropper`) | `I` |
| Seleksi Marquee (`Select`) | `M` |
| Alat Pindah (`Move`) | `V` |
| Garis (`Line`) | `L` |
| Persegi (`Rectangle`) | `R` |
| Elips / Lingkaran (`Ellipse`) | `O` |
| Teks (`Text`) | `T` |
| Kaca Pembesar (`Zoom`) | `Z` |
| Alat Tangan (`Hand`) | `H` |
| Tukar Warna Depan / Belakang | `X` |
| Perkecil / Perbesar Ukuran Kuas | `[` / `]` |
| Undo / Redo | `Ctrl+Z` / `Ctrl+Y` atau `Ctrl+Shift+Z` |
| Simpan / Simpan Sebagai | `Ctrl+S` / `Ctrl+Shift+S` |
| Ekspor Dialog | `Ctrl+E` |
| Salin / Potong / Tempel | `Ctrl+C` / `Ctrl+X` / `Ctrl+V` |
| Pilih Semua / Batal Pilih | `Ctrl+A` / `Ctrl+D` |
| Pan Kanvas | `Spasi` + Drag mouse atau Tombol Tengah Mouse |
| Frame Sebelumnya / Berikutnya | `,` / `.` |
| Putar / Jeda Animasi | `Enter` |
| Tampilkan / Sembunyikan Grid | `Ctrl+'` |
| Command Palette | `Ctrl+K` |

---

## 🛠️ Cara Menjalankan

### Persyaratan
- Node.js (v18 ke atas disarankan)

### Menjalankan Mode Pengembangan
```bash
# Clone atau buka direktori proyek
cd PembuatKarakterPixel

# Jalankan Vite development server
npm run dev
```
Akses di peramban pada alamat `http://localhost:5173`.

### Membangun Versi Produksi
```bash
npm run build
```
Hasil build mandiri akan tersimpan di folder `dist/` dan siap disajikan lewat web server statis apa pun.

### Menjalankan Unit Test
```bash
npm test
```
Menjalankan 58 unit test mandiri tanpa framework eksternal.

### Menggunakan CLI Headless
```bash
# Tampilkan petunjuk CLI
node tools/cli.js --help

# Ekspor sprite sheet dan resource Godot 4 dari file .pfx
node tools/cli.js export examples/knight.pfx --godot --out output/

# Ekspor format PNG urutan frame dengan skala 2x
node tools/cli.js export examples/knight.pfx --png --scale 2 --out output/
```

---

## 📁 Panduan Integrasi Game Engine

- [Panduan Godot 4.x (SpriteFrames & TileSet)](docs/GODOT.md)
- [Panduan Unity (Texture Settings & 9-Slice)](docs/UNITY.md)
- [Panduan GameMaker (Strip Import)](docs/GAMEMAKER.md)
- [Spesifikasi Format Berkas .pfx](docs/FILE_FORMAT.md)
- [Arsitektur Perangkat Lunak](docs/ARCHITECTURE.md)
- [Daftar Pengujian Manual](docs/MANUAL_TESTS.md)

---

## ⚠️ Batasan yang Diketahui (Known Limitations)

1. **Format GIF Import**: Parser GIF eksperimental saat ini memfokuskan ekstraksi frame utuh dan mengabaikan mode disposal non-standar. Disarankan mengimpor urutan PNG atau sprite sheet untuk animasi kompleks.
2. **Kustom Font Bitmap**: Alat teks menyertakan 3 font bawaan (5x7, 8x8 bold, dan serif kecil). Penggunaan font kustom saat ini memerlukan lembar PNG bitmap font.
3. **Penyimpanan Lokal**: Autosave bergantung pada IndexedDB lokal browser. Menghapus data penjelajahan (Clear Browsing Data) dapat menghapus cache autosave lokal. Selalu simpan cadangan file `.pfx` di penyimpanan berkas komputer Anda.

