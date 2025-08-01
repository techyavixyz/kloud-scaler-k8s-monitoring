const express = require('express');
const { getNamespaces } = require('../controllers/namespaceController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/namespaces', authenticateToken, getNamespaces);
module.exports = router;