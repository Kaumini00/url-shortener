const express = require('express');
const { shorten, getLinks, redirect, analytics } = require('../controllers/urlController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/shorten', authMiddleware, shorten);
router.get('/links', authMiddleware, getLinks);
router.get('/analytics/:shortCode', authMiddleware, analytics);

// redirect route should be last — catches /:shortCode at app root
router.get('/:shortCode', redirect);

module.exports = router;
