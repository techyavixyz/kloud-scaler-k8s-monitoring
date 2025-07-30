const express = require('express');
const { getNodes, getNodeMetrics } = require('../controllers/nodeController');
const router = express.Router();


router.get('/nodes', getNodes);

router.get('/node-metrics', getNodeMetrics);
module.exports = router;