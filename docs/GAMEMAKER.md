# Panduan Integrasi GameMaker dengan PixelForge

Panduan mengimpor sprite sheet dan strip animasi dari PixelForge ke GameMaker (LTS / terkini).

---

## 1. Pengaturan Ekspor di PixelForge

GameMaker bekerja optimal dengan **Horizontal Strip** (deretan frame dari kiri ke kanan):
1. Di dialog ekspor PixelForge, pilih format **Sprite Sheet**.
2. Pilih Layout **Horizontal**.
3. Pastikan Padding `0` atau sesuai kebutuhan grid Anda.
4. Simpan berkas (misal `spr_player_walk_strip4.png`).

> **Catatan Penamaan GameMaker**: Jika Anda menambahkan akhiran `_strip<N>.png` (contoh: `player_walk_strip4.png`), GameMaker akan secara otomatis mendeteksi bahwa berkas tersebut adalah sprite animasi berisi 4 frame!

---

## 2. Mengimpor ke GameMaker

1. Di Asset Browser GameMaker, klik kanan folder **Sprites > Create > Sprite**.
2. Klik tombol **Import** di editor sprite.
3. Pilih berkas PNG Anda. Jika memakai penamaan `_stripN`, GameMaker akan langsung memotong sprite menjadi frame animasi secara otomatis.
4. Jika tidak menggunakan akhiran `_stripN`:
   * Buka menu **Image > Import Strip Image...**
   * Masukkan jumlah frame, lebar frame, dan tinggi frame.
5. Di bagian **Texture Settings / Global Game Settings**:
   * Pastikan **Interpolate colors between pixels** dalam keadaan **OFF** / tidak dicentang agar piksel tidak blur.
6. Atur **Origin** sprite (misalnya `Middle Centre` atau `Bottom Centre`) sesuai pivot karakter Anda.
