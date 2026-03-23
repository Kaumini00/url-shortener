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

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

function isBlockedHostname(hostname) {
  if (!hostname) return true;
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '::1' || h === '[::1]') return true;

  // IPv4 checks
  const parts = h.split('.');
  if (parts.length === 4) {
    const [a, b] = parts.map(Number);
    if (a === 127) return true;                          // 127.0.0.0/8 loopback
    if (a === 10) return true;                           // 10.0.0.0/8 private
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12 private
    if (a === 192 && b === 168) return true;             // 192.168.0.0/16 private
    if (a === 169 && b === 254) return true;             // 169.254.0.0/16 link-local
    if (a === 0) return true;                            // 0.x.x.x unspecified
  }
  return false;
}

function normalizeUrl(inputUrl) {
  let parsed;
  try {
    parsed = new URL(inputUrl);
  } catch {
    try {
      parsed = new URL(`http://${inputUrl}`);
    } catch {
      const err = new Error('Invalid URL format');
      err.status = 400;
      throw err;
    }
  }

  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    const err = new Error('Only http and https URLs are allowed');
    err.status = 400;
    throw err;
  }

  if (isBlockedHostname(parsed.hostname)) {
    const err = new Error('URL hostname is not allowed');
    err.status = 400;
    throw err;
  }

  return parsed.toString();
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
