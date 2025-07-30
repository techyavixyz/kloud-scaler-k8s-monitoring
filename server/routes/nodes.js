const express = require('express');
const router = express.Router();
const { getNodes, getNodeMetrics } = require('../controllers/nodeController');

router.get('/nodes', getNodes);
router.get('/node-metrics', getNodeMetrics);

module.exports = router;