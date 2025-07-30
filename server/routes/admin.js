const express = require('express');
const { getUsers, createUser, updateUser, deleteUser, resetPassword } = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/reset-password', resetPassword);

module.exports = router;