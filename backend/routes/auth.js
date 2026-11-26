const {register, login} = require('../controller/auth');
const {loginLimiter} = require('../middleware/rateLimiter');
const express = require('express');
const router = express.Router();

router.post('/register', register);
router.post('/login', loginLimiter, login);

module.exports = router;