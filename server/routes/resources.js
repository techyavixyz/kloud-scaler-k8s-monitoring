const express = require('express');
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');
const router = express.Router();
const { getResourceUsage, getMetricsHistory } = require('../controllers/resourceController');

router.get('/resource-usage', getResourceUsage);
const express = require('express');
router.get('/metrics/history/:namespace', getMetricsHistory);
module.exports = router;