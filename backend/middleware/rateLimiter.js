const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Rentang waktu 15 menit (dalam milidetik)
    max: 5, // Maksimal 5 kali percobaan per IP dalam rentang waktu tersebut
    skipSuccessfulRequests: true, // Percobaan yang BERHASIL login tidak dihitung sebagai kegagalan
    standardHeaders: true, // Mengirim info sisa limit di header `RateLimit-*`
    legacyHeaders: false, // Menonaktifkan header lama `X-RateLimit-*`
    message: {
        status: 429,
        message: 'Terlalu banyak percobaan login gagal. Silakan coba lagi setelah 15 menit.'
    }
});

module.exports = { loginLimiter };