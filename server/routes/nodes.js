const express = require('express');
const { getNodes, getNodeMetrics } = require('../controllers/nodeController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/nodes', authenticateToken, getNodes);
router.get('/node-metrics', authenticateToken, getNodeMetrics);
module.exports = router;