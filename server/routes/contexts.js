const express = require('express');
const { getContexts, setContext } = require('../controllers/contextController');
const router = express.Router();


router.get('/contexts', getContexts);

router.post('/contexts/set', setContext);
module.exports = router;