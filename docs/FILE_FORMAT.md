# Format Berkas PixelForge (.pfx)

Spesifikasi resmi format berkas proyek PixelForge versi 1 (`.pfx`).

## 1. Ringkasan

Berkas `.pfx` adalah berkas teks berformat JSON (UTF-8).
Semua data raster cel piksel dikompresi menggunakan **Run-Length Encoding (RLE)** 32-bit little-endian lalu di-encode menjadi string **Base64**. Format ini dirancang agar:
1. Bebas dependensi DOM (dapat dibaca/ditulis di Node.js, CLI, maupun browser).
2. Mempertahankan keaslian 100% data piksel (lossless RGBA 8-bit per channel).
3. Mendukung cels linked (cel yang dibagi antar beberapa frame) dan cels lazy (cel kosong tanpa alokasi memori).

---

## 2. Struktur Dokumen JSON

```jsonc
{
  "format": "pixelforge",
  "version": 1,
  "meta": {
    "title": "hero",
    "created": "2026-10-21T12:00:00.000Z",
    "modified": "2026-10-21T12:30:00.000Z",
    "app": "PixelForge 1.0.0"
  },
  "canvas": {
    "width": 32,
    "height": 32,
    "pixelAspect": [1, 1],
    "background": null
  },
  "palette": {
    "active": "Sweetie 16",
    "palettes": [
      {
        "name": "Sweetie 16",
        "colors": ["#1a1c2c", "#5d275d", "#b13e53", "#ef7d57", "#ffcd75", "#a7f070"],
        "locked": false
      }
    ],
    "indexed": false
  },
  "frames": [
    { "id": "f_01", "duration": 120, "userData": null },
    { "id": "f_02", "duration": 120, "userData": null }
  ],
  "layers": [
    {
      "id": "l_01",
      "type": "layer",
      "name": "Body",
      "parentId": null,
      "visible": true,
      "locked": false,
      "lockAlpha": false,
      "opacity": 255,
      "blend": "normal",
      "reference": false,
      "clipping": false,
      "expanded": true,
      "color": null,
      "userData": null
    }
  ],
  "cels": [
    {
      "layer": "l_01",
      "frame": "f_01",
      "x": 0,
      "y": 0,
      "w": 32,
      "h": 32,
      "opacity": 255,
      "linkedTo": null,
      "data": "<base64-rle-rgba>"
    }
  ],
  "tags": [
    {
      "name": "walk",
      "from": 0,
      "to": 1,
      "direction": "forward",
      "repeat": 0,
      "color": "#41a6f6"
    }
  ],
  "slices": [
    {
      "name": "hitbox",
      "frames": [
        {
          "frame": 0,
          "rect": [4, 4, 24, 28],
          "pivot": [16, 30],
          "center": null
        }
      ]
    }
  ],
  "hitboxes": [],
  "anchors": [
    { "name": "weapon", "frame": 0, "x": 20, "y": 20 }
  ],
  "grid": { "x": 0, "y": 0, "w": 16, "h": 16 },
  "guides": [],
  "userData": null
}
```

---

## 3. Kompresi Cel (RLE + Base64)

Setiap entri dalam array `cels` yang memiliki piksel disimpan dengan skema berikut:
1. Piksel RGBA diiterasi secara berurutan: `[R, G, B, A]`.
2. Setiap run dari piksel identik dikodekan menjadi:
   - `4 byte (uint32 little-endian)`: Jumlah piksel dalam run (`count`).
   - `4 byte`: Nilai RGBA (`R, G, B, A`).
3. Seluruh deretan byte tersebut di-encode ke Base64 standar RFC 4648.
4. Jika sebuah cel kosong (tidak memiliki goresan piksel), nilai `"data"` adalah `null`.
5. Jika sebuah cel ditautkan (`linked cel`), nilainya merujuk pada cel pertama dengan atribut `"linkedTo": "f_origin"`.

---

## 4. Ekstensi Metadata Game Dev

PixelForge menambahkan objek metadata tanpa merusak skema standar:
- `slices`: Digunakan untuk 9-slice UI scaling (`center: [x, y, w, h]`), pivot origin per slice, dan user data JSON.
- `anchors`: Titik koordinat per-frame untuk lampiran senjata, partikel, atau dialog baloon.
- `hitboxes`: Area poligon atau lingkaran opsional untuk collision box.
- `userData`: String atau JSON bebas pada level dokumen, layer, frame, atau slice.

