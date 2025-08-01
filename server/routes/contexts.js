const express = require('express');
const multer = require('multer');
const path = require('path');
const { getContexts, setContext, uploadKubeconfig, getUserContext, setUserContext } = require('../controllers/contextController');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'kubeconfig-' + uniqueSuffix + path.extname(file.originalname));
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

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads/');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
router.get('/contexts', authenticateToken, getContexts);
router.post('/contexts/set', authenticateToken, setContext);
router.post('/contexts/upload', authenticateToken, upload.single('kubeconfig'), uploadKubeconfig);
router.get('/user-context', authenticateToken, getUserContext);
router.post('/user-context', authenticateToken, setUserContext);

module.exports = router;