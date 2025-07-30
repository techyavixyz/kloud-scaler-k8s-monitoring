const express = require('express');
const router = express.Router();
const { getNamespaces } = require('../controllers/namespaceController');

router.get('/namespaces', getNamespaces);

module.exports = router;