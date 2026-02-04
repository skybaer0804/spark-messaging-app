const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, checkStatus } = require('../controllers/pushController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.get('/status', checkStatus);

module.exports = router;
