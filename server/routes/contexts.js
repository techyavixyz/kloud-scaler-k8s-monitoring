const express = require('express');
const { getContexts, setContext, uploadKubeconfig, getUserContext, setUserContext } = require('../controllers/contextController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for kubeconfig file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kubeDir = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.kube');
    if (!fs.existsSync(kubeDir)) {
      fs.mkdirSync(kubeDir, { recursive: true });
    }
    cb(null, kubeDir);
  },
  filename: (req, file, cb) => {
    // Use original filename or generate a unique name
    const filename = file.originalname || `config-${Date.now()}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept any file type for kubeconfig
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 // 1MB limit
  }
});

// Public routes (with authentication)
router.get('/contexts', authenticateToken, getContexts);
router.get('/user-context', authenticateToken, getUserContext);
router.post('/user-context', authenticateToken, setUserContext);

// Admin only routes
router.post('/contexts/upload', authenticateToken, requireRole(['admin']), upload.single('kubeconfig'), uploadKubeconfig);
router.post('/contexts/set', authenticateToken, requireRole(['admin']), setContext);

module.exports = router;