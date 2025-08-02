const express = require('express');
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');
const { getHistoricalPodMetrics } = require('../controllers/metricsController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/resource-usage', authenticateToken, getResourceUsage);
router.get('/metrics/history/:namespace', getMetricsHistory);
router.get('/pod-metrics/history', authenticateToken, getHistoricalPodMetrics);

module.exports = router;
