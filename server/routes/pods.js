const express = require('express');
const router = express.Router();
const { getPods, getFailedPods, getPodDetails, getAllPodMetrics } = require('../controllers/podController');

router.get('/pods', getPods);
router.get('/failed-pods', getFailedPods);
router.get('/pod-details', getPodDetails);
router.get('/all-pod-metrics', getAllPodMetrics);

module.exports = router;