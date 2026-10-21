# Panduan Integrasi Unity dengan PixelForge

Panduan pengaturan import tekstur dan slicing sprite sheet PixelForge di Unity (2022 LTS / 2023 / Unity 6).

---

## 1. Pengaturan Texture Import Unity

Agar piksel tetap tegas tanpa blur dan tanpa artefak kompresi, ikuti langkah berikut pada berkas PNG di Project Window:

1. Pilih berkas `.png` hasil ekspor PixelForge di Project Window Unity.
2. Di panel **Inspector**, atur nilai berikut:
   * **Texture Type**: `Sprite (2D and UI)`
   * **Sprite Mode**: `Multiple` (jika sprite sheet) atau `Single` (jika single frame)
   * **Pixels Per Unit (PPU)**: Cocokkan dengan ukuran grid proyek Anda (default umum: `16` atau `32`).
   * **Generate Physics Shape**: Opsional (centang jika ingin physics collision otomatis).
   * **Advanced > sRGB (Color Texture)**: `Checked`
   * **Advanced > Alpha Is Transparency**: `Checked`
   * **Filter Mode**: Wajib **`Point (no filter)`** (agar tidak blur)
   * **Compression**: Wajib **`None`** (agar warna tidak terdistorsi)
3. Klik **Apply**.

---

## 2. Menggunakan Metadata Slices & 9-Slice (.json)

PixelForge secara otomatis mengekspor `<nama>_unity.json` bersamaan dengan sprite sheet:
* Berisi daftar nama frame/slice, `x, y, w, h`, pivot `(0..1)`, dan border 9-slice `[left, bottom, right, top]`.
* Anda dapat memakai script editor sederhana di folder `Editor/` Unity atau mengiris melalui **Sprite Editor**:
  * Buka **Sprite Editor** di Inspector tekstur.
  * Masukkan pivot dan ukuran slice sesuai metadata.
  * Untuk 9-slice UI, atur border L/B/R/T sesuai nilai pada `_unity.json`.

