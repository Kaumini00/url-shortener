const { createShortUrl, getUserUrls, getUrlByCode, touchUrl } = require('../services/urlService');

async function shorten(req, res, next) {
  try {
    const { longUrl } = req.body;
    if (!longUrl) {
      return res.status(400).json({ error: 'longUrl is required' });
    }

    const userId = req.user.id;
    const url = await createShortUrl(longUrl, userId);
    return res.status(201).json(url);
  } catch (err) {
    next(err);
  }
}

async function getLinks(req, res, next) {
  try {
    const userId = req.user.id;
    const urls = await getUserUrls(userId);
    return res.json({ urls });
  } catch (err) {
    next(err);
  }
}

async function redirect(req, res, next) {
  try {
    const { shortCode } = req.params;
    const url = await getUrlByCode(shortCode);
    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    await touchUrl(shortCode);
    return res.redirect(url.long_url);
  } catch (err) {
    next(err);
  }
}

module.exports = { shorten, getLinks, redirect };