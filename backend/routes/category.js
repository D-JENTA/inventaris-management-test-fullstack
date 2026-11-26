const {createCategory, getAllCategories} = require('../controller/category');
const express = require('express');
const router = express.Router();

router.post('/categories', createCategory);
router.get('/categories', getAllCategories);

module.exports = router;