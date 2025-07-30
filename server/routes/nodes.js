const express = require('express');
const { getNodes, getNodeMetrics } = require('../controllers/nodeController');
const router = express.Router();
const { getNodes, getNodeMetrics } = require('../controllers/nodeController');

router.get('/nodes', getNodes);
const express = require('express');
router.get('/node-metrics', getNodeMetrics);
module.exports = router;