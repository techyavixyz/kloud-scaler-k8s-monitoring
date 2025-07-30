import express from 'express';
import { 
  getHistoricalMetrics, 
  deleteOldMetrics, 
  getMetricsSummary 
} from '../controllers/timeSeriesController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/historical', requirePermission('resources'), getHistoricalMetrics);
router.get('/summary', requirePermission('dashboard'), getMetricsSummary);
router.delete('/cleanup', requirePermission('admin'), deleteOldMetrics);

export default router;