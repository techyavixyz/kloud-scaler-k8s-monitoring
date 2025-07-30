const express = require('express');
const { getContexts, setContext } = require('../controllers/contextController');
const router = express.Router();
const { getContexts, setContext } = require('../controllers/contextController');

router.get('/contexts', getContexts);
const express = require('express');
router.post('/contexts/set', setContext);
module.exports = router;