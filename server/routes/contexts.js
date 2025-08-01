const express = require('express');
const multer = require('multer');
const path = require('path');
const os = require('os');
const { getContexts, setContext, uploadKubeconfig, getUserContext, setUserContext } = require('../controllers/contextController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads to temp directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use system temp directory
    cb(null, os.tmpdir());
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kubeconfig-temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept any file type for kubeconfig files
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Routes
router.get('/contexts', authenticateToken, getContexts);
router.post('/contexts/set', authenticateToken, setContext);
router.post('/contexts/upload', authenticateToken, requireRole(['admin']), upload.single('kubeconfig'), uploadKubeconfig);
router.get('/user-context', authenticateToken, getUserContext);
router.post('/user-context', authenticateToken, setUserContext);

module.exports = router;