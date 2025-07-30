import express from 'express';
import { searchResources, getResourceSuggestions } from '../controllers/searchController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/resources', requirePermission('resources'), searchResources);
router.get('/suggestions', requirePermission('resources'), getResourceSuggestions);

export default router;