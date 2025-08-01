const express = require('express');
const { getLogs } = require('../controllers/logController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/logs', authenticateToken, getLogs);
module.exports = router;