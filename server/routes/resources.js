const express = require('express');
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/resource-usage', authenticateToken, getResourceUsage);
router.get('/metrics/history/:namespace', getMetricsHistory);

module.exports = router;
