const express = require('express');
const { getNamespaces } = require('../controllers/namespaceController');
const router = express.Router();

router.get('/namespaces', getNamespaces);
module.exports = router;