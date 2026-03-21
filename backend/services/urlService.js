const { URL } = require('url');
const { createUrl, findUrlByShortCode, getUrlsByUserId, incrementClicks, existsShortCode } = require('../models/urlModel');
const { generateUniqueShortCode } = require('../utils/shortCodeGenerator');

function normalizeUrl(inputUrl) {
  try {
    const url = new URL(inputUrl);
    return url.toString();
  } catch (err) {
    // try auto-fix by adding protocol
    try {
      const url = new URL(`http://${inputUrl}`);
      return url.toString();
    } catch (innerErr) {
      throw new Error('Invalid URL format');
    }
  }
}

async function createShortUrl(longUrl, userId) {
  const normalizedUrl = normalizeUrl(longUrl);
  const shortCode = await generateUniqueShortCode(existsShortCode);
  const record = await createUrl(normalizedUrl, shortCode, userId);
  return record;
}

async function getUrlByCode(shortCode) {
  return findUrlByShortCode(shortCode);
}

async function touchUrl(shortCode) {
  return incrementClicks(shortCode);
}

async function getUserUrls(userId) {
  return getUrlsByUserId(userId);
}

module.exports = { normalizeUrl, createShortUrl, getUrlByCode, touchUrl, getUserUrls };
