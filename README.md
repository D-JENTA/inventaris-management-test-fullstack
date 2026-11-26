# Inventory Management System (Full Stack)

Aplikasi manajemen inventaris berbasis **Node.js**, **Sequelize**, dan **MariaDB** dengan arsitektur RESTful API, autentikasi JWT, serta pembatasan percobaan login (`express-rate-limit`).

## Tech Stack

* **Backend / API:** Node.js, RESTful API, Sequelize ORM
* **Database:** MariaDB
* **Keamanan & Auth:** JSON Web Token (JWT), `express-rate-limit` (15 menit, maksimal 5 percobaan gagal)
* **Frontend:** Sesuai direktori frontend di repository ini

## Prasyarat (Prerequisites)

Pastikan di perangkat sudah terpasang:
* **Node.js** (disarankan versi LTS terbaru)
* **MariaDB** (atau layanan MySQL/MariaDB lokal seperti Laragon / XAMPP / service MariaDB)
* **Git**

## Struktur Folder (Ringkas)

Sesuaikan bagian ini dengan struktur aktual folder di repository:

```text
.
├── backend/          # Source code RESTful API (Node.js + Sequelize)
├── frontend/         # Source code frontend (jika ada di repo yang sama)
├── .env.example      # Contoh konfigurasi environment variable
├── .gitignore
└── README.md
