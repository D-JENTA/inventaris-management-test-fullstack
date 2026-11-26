# Manajemen Inventaris

Antarmuka Vue 3 untuk mengelola inventaris melalui API backend.

## Menjalankan aplikasi

1. Jalankan backend pada port `3000`.
2. Dari folder `frontend`, jalankan `npm install` jika dependensi belum terpasang.
3. Jalankan `npm run dev`, lalu buka URL yang ditampilkan Vite.
4. Masuk menggunakan akun yang terdaftar di backend.

Alamat API default adalah `http://localhost:3000/api`. Untuk menggantinya, buat file `.env` di folder ini dan isi:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Token login disimpan di `localStorage` browser dan dikirim sebagai header `Authorization: Bearer <token>` untuk API yang memerlukan autentikasi.
