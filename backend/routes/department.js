const {createDepartment, getAllDepartments} = require('../controller/department');
const express = require('express');
const router = express.Router();

router.post('/departments', createDepartment);
router.get('/departments', getAllDepartments);

module.exports = router;