const express = require('express');
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');
const router = express.Router();

router.get('/resource-usage', getResourceUsage);
router.get('/metrics/history/:namespace', getMetricsHistory);

module.exports = router;
