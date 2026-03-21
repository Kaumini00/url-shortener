const express = require('express');
const { shorten, getLinks, redirect } = require('../controllers/urlController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/shorten', authMiddleware, shorten);
router.get('/links', authMiddleware, getLinks);

// redirect route should be mounted on app root (not /api) for /:shortCode
router.get('/:shortCode', redirect);

module.exports = router;