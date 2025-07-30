const express = require('express');
const router = express.Router();
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');

router.get('/resource-usage', getResourceUsage);
router.get('/metrics/history/:namespace', getMetricsHistory);

module.exports = router;