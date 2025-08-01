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
    // Accept common kubeconfig file types
    const allowedTypes = ['.yaml', '.yml', '.config', '.txt', ''];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || !ext) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a valid kubeconfig file.'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Updated upload route with error handling
router.post('/contexts/upload', 
  authenticateToken, 
  requireRole(['admin']), 
  (req, res, next) => {
    upload.single('kubeconfig')(req, res, (err) => {
      handleMulterError(err, req, res, next);
    });
  },
  uploadKubeconfig
);

// Remove the old upload route
// router.post('/contexts/upload', authenticateToken, requireRole(['admin']), upload.single('kubeconfig'), uploadKubeconfig);
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