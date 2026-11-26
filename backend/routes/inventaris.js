const {    createInventaris,
    getAllInventaris,
    deleteInventaris,
    updateInventaris } = require('../controller/inventaris');
const express = require('express');
const router = express.Router();

router.post('/inventaris', createInventaris);
router.get('/inventaris', getAllInventaris);
router.delete('/inventaris/:id', deleteInventaris);
router.put('/inventaris/:id', updateInventaris);

module.exports = router;