# Panduan Integrasi Godot 4.x dengan PixelForge

Panduan resmi untuk mengimpor sprite, sprite sheet, dan animasi dari PixelForge ke Godot Engine 4 (diuji pada Godot 4.2+ / 4.3).

---

## 1. Pengaturan Tekstur Pixel Art di Godot 4

Secara default, Godot 4 menerapkan filtering linear pada tekstur 2D. Untuk pixel art, tekstur wajib menggunakan **Nearest**:

### Pengaturan Global Project (Disarankan)
1. Buka **Project > Project Settings...**
2. Cari bagian **Rendering > Textures > Canvas Textures**.
3. Ubah **Default Texture Filter** menjadi `Nearest`.

### Pengaturan Per-File
1. Klik berkas `.png` di panel FileSystem Godot.
2. Buka tab **Import** di samping tab Scene.
3. Di bawah **Compress**, pastikan **Mode** adalah `Lossless`.
4. Di bawah **CanvasTexture**, atur **Texture Filter** ke `Nearest`.
5. Klik **Reimport**.

---

## 2. Mengimpor SpriteFrames (.tres)

PixelForge menyediakan opsi ekspor format **Godot** (`.tres` SpriteFrames) secara otomatis:

1. Di PixelForge: buka dialog **Berkas > Ekspor** (`Ctrl+E`), pilih format **Godot 4 (.tres + Sheet)**.
   * Atau lewat CLI:
     ```bash
     node tools/cli.js export hero.pfx --godot --out path/to/godot_project/
     ```
2. PixelForge menghasilkan dua berkas:
   * `<nama>.png` (Sprite sheet dengan bleed-free padding / extrude)
   * `<nama>_spriteframes.tres` (Resource Godot bertipe `SpriteFrames`)
3. Di Godot:
   * Buat node `AnimatedSprite2D`.
   * Di panel Inspector, seret berkas `_spriteframes.tres` ke properti **Sprite Frames**.
   * Semua tag animasi (seperti `idle`, `walk`, `attack`) langsung terbaca dengan durasi FPS yang tepat dan mode loop yang sesuai.

---

## 3. Mengimpor TileSet

1. Ekspor lembar tileset dari PixelForge dengan layout grid (misalnya 16x16).
2. Di Godot:
   * Buat node `TileMapLayer` (atau `TileMap` pada Godot < 4.3).
   * Buat resource `TileSet` baru.
   * Atur **Tile Size** (misal `16x16 px`).
   * Seret berkas PNG tileset ke tab **TileSet** di panel bawah Godot.
   * Godot akan otomatis menawarkan membuat atlas tiles sesuai ukuran grid 16x16.

---

## 4. Tips Mencegah Texture Bleeding (Garis Tepi Berkedip)

Saat kamera pixel art bergerak atau melakukan zoom, sub-pixel rendering dapat menyebabkan tepi tile lain di atlas ikut terlihat (bleeding).
* Di PixelForge, centang opsi **Extrude (1-2 px)** saat mengekspor sprite sheet.
* Fitur Extrude akan menduplikasi 1 piksel garis tepi ke luar batas frame sehingga tidak ada warna latar/tile lain yang bocor saat interpolasi kamera.
