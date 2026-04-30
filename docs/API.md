# URL Shortener - API Reference

A full-stack URL shortening service with JWT authentication, custom aliases, click analytics, and SSRF protection.

**Base URL (local):** `http://localhost:5000`  
**Interactive Docs:** [![SwaggerHub](https://img.shields.io/badge/API%20Docs-SwaggerHub-85EA2D?logo=swagger)](https://app.swaggerhub.com/apis/ifs-e5d/url-shortener-api/1.0.0)

---

## Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Auth - Register](#post-authregister)
  - [Auth - Login](#post-authlogin)
  - [Auth - Google Sign-In](#post-authgoogle)
  - [URLs - Shorten](#post-shorten)
  - [URLs - List My Links](#get-links)
  - [URLs - Redirect](#get-shortcode)
  - [Analytics - Click Data](#get-analyticsshortcode)
- [Error Reference](#error-reference)

---

## Authentication

Protected endpoints require a **Bearer JWT token** in the `Authorization` header.

**How to get a token:** Call `POST /auth/login` or `POST /auth/google`, then use the returned `token` value:

```
Authorization: Bearer <token>
```

Tokens are signed with HS256. They do not expire by default; revoke access by not storing or by rotating the secret.

---

## Rate Limiting

| Scope | Limit |
|---|---|
| All routes | 100 requests / 15 min per IP |
| `/auth/*` routes | 10 requests / 15 min per IP |

Exceeding the limit returns `429 Too Many Requests` with a `Retry-After` header.

---

## Endpoints

---

### POST /auth/register

Create a new user account. Passwords are hashed with bcrypt before storage, plaintext is never persisted.

**Auth required:** No

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "s3cr3tP@ss"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Must be a valid email address |
| `password` | string | ✅ | Minimum 6 characters |

#### Responses

**`201 Created`**
```json
{
  "id": 1,
  "email": "user@example.com"
}
```

**`400 Bad Request`** - Missing fields or password too short
```json
{ "error": "Email and password are required." }
```

**`409 Conflict`** - Email already registered
```json
{ "error": "Email already registered." }
```

**`429 Too Many Requests`** - Auth rate limit exceeded

---

### POST /auth/login

Log in with email and password. Returns a signed JWT for use on protected endpoints.

**Auth required:** No

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "s3cr3tP@ss"
}
```

#### Responses

**`200 OK`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**`400 Bad Request`** - Missing fields
```json
{ "error": "Email and password are required." }
```

**`401 Unauthorized`** - Wrong credentials
```json
{ "error": "Invalid credentials." }
```

**`429 Too Many Requests`** - Auth rate limit exceeded

---

### POST /auth/google

Sign in (or auto-register) using a Google ID token. The token is verified server-side with `google-auth-library`. It is never stored. If no account exists for the Google email, one is created automatically.

**Auth required:** No

#### Request Body

```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `credential` | string | ✅ | Google ID token from the Google Sign-In client library |

#### Responses

**`200 OK`**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "user@google.com"
  }
}
```

**`400 Bad Request`** - Missing credential
```json
{ "error": "Google credential is required." }
```

**`401 Unauthorized`** - Token verification failed
```json
{ "error": "Invalid Google token." }
```

---

### POST /shorten

Convert a long URL into a short link. Optionally provide a custom alias instead of the auto-generated 6-character Base62 code.

**SSRF protection:** The hostname is DNS-resolved before saving. URLs that resolve to private or loopback IPs (RFC-1918, 127.x.x.x, 169.254.x.x) are rejected to prevent server-side request forgery.

**Auth required:** Yes

#### Request Body

```json
{
  "longUrl": "https://example.com/some/very/long/path?query=value",
  "customAlias": "my-link"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `longUrl` | string (URI) | ✅ | Must use `http` or `https` |
| `customAlias` | string | ❌ | 3–50 chars: letters, digits, hyphens, underscores |

#### Responses

**`201 Created`**
```json
{
  "id": 1,
  "long_url": "https://example.com/some/very/long/path?query=value",
  "short_code": "my-link",
  "clicks": 0,
  "created_at": "2026-03-23T10:00:00.000Z"
}
```

**`400 Bad Request`** - Invalid URL or alias format

| Cause | Error message |
|---|---|
| Non-HTTP/HTTPS protocol | `"URL must use http or https."` |
| Private IP (SSRF blocked) | `"URL resolves to a private or loopback address."` |
| Invalid alias characters | `"Alias must be 3–50 characters (letters, digits, hyphens, underscores)."` |

**`401 Unauthorized`** - Missing or invalid token
```json
{ "error": "Access denied. No token provided." }
```

**`409 Conflict`** - Custom alias already in use
```json
{ "error": "Custom alias already taken." }
```

**`429 Too Many Requests`**

---

### GET /links

Return all shortened URLs belonging to the authenticated user, ordered by creation date (newest first). Users can only see their own links.

**Auth required:** Yes

#### Responses

**`200 OK`**
```json
{
  "urls": [
    {
      "id": 1,
      "long_url": "https://example.com/some/very/long/path",
      "short_code": "my-link",
      "clicks": 5,
      "created_at": "2026-03-23T10:00:00.000Z"
    },
    {
      "id": 2,
      "long_url": "https://another.com/page",
      "short_code": "aB3xYz",
      "clicks": 0,
      "created_at": "2026-03-20T08:30:00.000Z"
    }
  ]
}
```

**`401 Unauthorized`** - Missing or invalid token

---

### GET /{shortCode}

Redirect to the original URL. Each successful redirect increments the click counter and records the visitor's IP, User-Agent, and timestamp for analytics.

This endpoint is **public** - no authentication required.

**Auth required:** No

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `shortCode` | string | The 6-character Base62 code or custom alias |

#### Responses

**`302 Found`** - Redirects to the original long URL via the `Location` header.

**`404 Not Found`**
```json
{ "error": "Short code not found." }
```

---

### GET /analytics/{shortCode}

Return aggregate and per-day click data for a short URL. The authenticated user must own the link. `dailyClicks` covers the last 30 days, newest first. Days with zero clicks are omitted.

**Auth required:** Yes

#### Path Parameters

| Parameter | Type | Description |
|---|---|---|
| `shortCode` | string | The short code or custom alias to query |

#### Responses

**`200 OK`**
```json
{
  "totalClicks": 25,
  "lastAccessed": "2026-03-22T10:00:00.000Z",
  "dailyClicks": [
    { "date": "2026-03-22", "count": 10 },
    { "date": "2026-03-21", "count": 15 }
  ]
}
```

> `lastAccessed` is `null` if the link has never been visited.

**`401 Unauthorized`** - Missing or invalid token

**`403 Forbidden`** - Link exists but belongs to a different user
```json
{ "error": "You do not have permission to view analytics for this link." }
```

**`404 Not Found`**
```json
{ "error": "Short code not found." }
```

---

## Error Reference

| Status | Meaning | Common Causes |
|---|---|---|
| `400` | Bad Request | Missing required fields, invalid URL format, weak password |
| `401` | Unauthorized | Missing, expired, or invalid JWT; wrong login credentials |
| `403` | Forbidden | Authenticated, but resource belongs to another user |
| `404` | Not Found | Short code does not exist |
| `409` | Conflict | Email or custom alias already registered |
| `429` | Too Many Requests | Rate limit exceeded — check `Retry-After` header |

All error responses follow this shape:

```json
{ "error": "Human-readable message describing what went wrong." }
```