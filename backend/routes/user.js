const {editUser, deleteUser, getAllUsers} = require('../controller/user');
const express = require('express');
const router = express.Router();

router.put('/users/:id', editUser);
router.delete('/users/:id', deleteUser);
router.get('/users', getAllUsers);

module.exports = router;