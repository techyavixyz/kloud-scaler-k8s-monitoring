const express = require('express');
const { getPods, getFailedPods, getPodDetails, getAllPodMetrics } = require('../controllers/podController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/pods', authenticateToken, getPods);
router.get('/failed-pods', authenticateToken, getFailedPods);
router.get('/pod-details', authenticateToken, getPodDetails);
router.get('/all-pod-metrics', authenticateToken, getAllPodMetrics);
module.exports = router;