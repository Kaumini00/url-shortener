const { URL } = require('url');
const {
  createUrl,
  findUrlByShortCode,
  getUrlsByUserId,
  incrementClicks,
  existsShortCode,
  recordClick,
  getClickAnalytics,
} = require('../models/urlModel');
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
      const error = new Error('Invalid URL format');
      error.status = 400;
      throw error;
    }
  }
}

const ALIAS_RE = /^[a-zA-Z0-9_-]{3,50}$/;

async function createShortUrl(longUrl, userId, customAlias) {
  const normalizedUrl = normalizeUrl(longUrl);

  let shortCode;
  if (customAlias) {
    if (!ALIAS_RE.test(customAlias)) {
      const err = new Error(
        'Custom alias must be 3–50 characters and contain only letters, numbers, hyphens, or underscores'
      );
      err.status = 400;
      throw err;
    }
    const taken = await existsShortCode(customAlias);
    if (taken) {
      const err = new Error(`The alias "${customAlias}" is already taken`);
      err.status = 409;
      throw err;
    }
    shortCode = customAlias;
  } else {
    shortCode = await generateUniqueShortCode(existsShortCode);
  }

  const record = await createUrl(normalizedUrl, shortCode, userId);
  return record;
}

async function getUrlByCode(shortCode) {
  return findUrlByShortCode(shortCode);
}

async function touchUrl(shortCode, ipAddress, userAgent) {
  await incrementClicks(shortCode);
  await recordClick(shortCode, ipAddress, userAgent);
}

async function getUserUrls(userId) {
  return getUrlsByUserId(userId);
}

async function getAnalytics(shortCode) {
  const url = await findUrlByShortCode(shortCode);
  if (!url) return null;
  return getClickAnalytics(shortCode);
}

module.exports = { normalizeUrl, createShortUrl, getUrlByCode, touchUrl, getUserUrls, getAnalytics };
