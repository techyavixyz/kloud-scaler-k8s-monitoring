const express = require('express');
const router = express.Router();
const { getContexts, setContext } = require('../controllers/contextController');

router.get('/contexts', getContexts);
router.post('/contexts/set', setContext);

module.exports = router;