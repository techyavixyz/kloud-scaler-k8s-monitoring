const express = require('express');
const { getNamespaces } = require('../controllers/namespaceController');
const router = express.Router();
const { getNamespaces } = require('../controllers/namespaceController');

const express = require('express');
router.get('/namespaces', getNamespaces);
module.exports = router;