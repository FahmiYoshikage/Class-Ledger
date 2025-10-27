# PWA Icons Setup

## Cara Membuat Icon PWA:

### Opsi 1: Menggunakan Online Generator (Termudah)

1. Buka https://www.pwabuilder.com/imageGenerator
2. Upload logo/icon Kas Kelas Anda (bisa gunakan icon.svg yang sudah ada)
3. Download semua icon yang di-generate
4. Copy file `pwa-192x192.png` dan `pwa-512x512.png` ke folder `public/`

### Opsi 2: Menggunakan Figma/Canva

1. Buat design icon 512x512px dengan background #4F46E5 (warna indigo)
2. Tambahkan icon wallet dan text "KAS KELAS"
3. Export sebagai PNG:
    - `pwa-192x192.png` (192x192px)
    - `pwa-512x512.png` (512x512px)
4. Simpan di folder `public/`

### Opsi 3: Menggunakan ImageMagick (Command Line)

```bash
# Install ImageMagick terlebih dahulu
# Ubuntu/Debian:
sudo apt-get install imagemagick librsvg2-bin

# Generate PNG dari SVG
rsvg-convert -w 192 -h 192 public/icon.svg > public/pwa-192x192.png
rsvg-convert -w 512 -h 512 public/icon.svg > public/pwa-512x512.png
```

## Current Files:

-   ✅ `icon.svg` - SVG icon template (already created)
-   ⚠️ `pwa-192x192.png` - Needs to be replaced with actual PNG
-   ⚠️ `pwa-512x512.png` - Needs to be replaced with actual PNG

## After Creating Icons:

1. Replace the placeholder PNG files with your actual icons
2. Restart Vite dev server
3. Test PWA installation on mobile or desktop browser
