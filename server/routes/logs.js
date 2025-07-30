const express = require('express');
const { getLogs } = require('../controllers/logController');
const router = express.Router();
const { getLogs } = require('../controllers/logController');

const express = require('express');
router.get('/logs', getLogs);
module.exports = router;