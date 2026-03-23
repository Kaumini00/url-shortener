import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiExternalLink, FiBarChart2, FiX } from 'react-icons/fi';
import { authService } from '../services/authService';
import { urlService } from '../services/urlService';
import { isAuthenticated } from '../utils/localStorageHelpers';
import '../styles/Dashboard.scss';

// Returns 0–4 filled circles based on click count
const activityLevel = (clicks) => {
  if (clicks >= 50) return 4;
  if (clicks >= 21) return 3;
  if (clicks >= 6)  return 2;
  if (clicks >= 1)  return 1;
  return 0;
};

const Dashboard = () => {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsUrl, setAnalyticsUrl] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) { navigate('/login'); return; }
    fetchUrls();
  }, [navigate]);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const userUrls = await urlService.getUserUrls();
      setUrls(userUrls);
    } catch {
      setError('Failed to load URLs');
    } finally {
      setLoading(false);
    }
  };

  const handleShorten = async (e) => {
    e.preventDefault();
    setError('');
    setShortening(true);
    try {
      const newUrl = await urlService.shortenUrl(longUrl, customAlias.trim() || null);
      setUrls([newUrl, ...urls]);
      setLongUrl('');
      setCustomAlias('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setShortening(false);
    }
  };

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  const getShortUrl = (code) => `http://localhost:3000/${code}`;

  const handleCopy = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch { /* ignore */ }
  };

  const handleOpenAnalytics = async (url) => {
    setAnalyticsUrl(url);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    try {
      const data = await urlService.getAnalytics(url.short_code);
      setAnalyticsData(data);
    } catch {
      setAnalyticsData({ error: 'Failed to load analytics' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCloseAnalytics = () => { setAnalyticsUrl(null); setAnalyticsData(null); };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const maxDailyCount = analyticsData?.dailyClicks?.length
    ? Math.max(...analyticsData.dailyClicks.map((d) => d.count), 1)
    : 1;

  return (
    <div className="dashboard-page">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="navbar-brand">🔗 URL Shortener</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">

        {/* ── Shorten form ── */}
        <div className="form-card">
          <h2 className="form-card-title">Shorten a URL</h2>
          <form onSubmit={handleShorten}>
            <div className="form-row">
              <input
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://your-long-url.com/goes/here"
                required
                className="url-input"
              />
              <button type="submit" disabled={shortening} className="shorten-btn">
                {shortening ? 'Shortening…' : 'Shorten'}
              </button>
            </div>
            <div className="alias-row">
              <span className="alias-prefix">localhost:3000/</span>
              <input
                type="text"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="custom-alias (optional)"
                className="alias-input"
                pattern="[a-zA-Z0-9_\-]{3,50}"
                title="3–50 characters: letters, numbers, hyphens, underscores"
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>

        {/* ── URL grid ── */}
        <div className="urls-section">
          <h2 className="section-title">Your URLs</h2>

          {loading ? (
            <p className="state-msg">Loading…</p>
          ) : urls.length === 0 ? (
            <p className="state-msg">No URLs yet — create your first one above!</p>
          ) : (
            <div className="urls-grid">
              {urls.map((url) => {
                const filled = activityLevel(url.clicks);
                const shortUrl = getShortUrl(url.short_code);
                return (
                  <div key={url.id} className="url-card">

                    {/* Header row */}
                    <div className="card-header">
                      <span className="card-code">/{url.short_code}</span>
                      <span className="card-date">
                        <span className="dot" />
                        {formatDate(url.created_at)}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="card-meta">
                      <span>{url.clicks} {url.clicks === 1 ? 'click' : 'clicks'}</span>
                      <span className="meta-sep">·</span>
                      <span>{new Date(url.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Original URL */}
                    <p className="card-description" title={url.long_url}>
                      {url.long_url.length > 72
                        ? url.long_url.slice(0, 72) + '…'
                        : url.long_url}
                    </p>

                    {/* Activity circles */}
                    <div className="card-circles">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`circle ${i < filled ? 'active' : ''}`} />
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="card-footer">
                      <div className="footer-stats">
                        <div className="footer-stat">
                          <strong>{url.clicks}</strong>
                          <span>Clicks</span>
                        </div>
                        <div className="footer-stat">
                          <button
                            className="copy-btn"
                            onClick={() => handleCopy(shortUrl, url.id)}
                            title="Copy short URL"
                          >
                            <FiClipboard size={14} />
                            {copiedId === url.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="footer-actions">
                        <button
                          className="analytics-icon-btn"
                          onClick={() => handleOpenAnalytics(url)}
                          title="Analytics"
                        >
                          <FiBarChart2 size={16} />
                        </button>
                        <button
                          className="visit-btn"
                          onClick={() => window.open(shortUrl, '_blank')}
                        >
                          <FiExternalLink size={14} style={{ marginRight: '0.3rem' }} />
                          Visit Link
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Analytics modal ── */}
      {analyticsUrl && (
        <div className="analytics-overlay" onClick={handleCloseAnalytics}>
          <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h3>Click Analytics</h3>
              <button className="analytics-close-btn" onClick={handleCloseAnalytics}>
                <FiX size={20} />
              </button>
            </div>
            <div className="analytics-short-code">{getShortUrl(analyticsUrl.short_code)}</div>

            {analyticsLoading ? (
              <p className="analytics-state">Loading analytics…</p>
            ) : analyticsData?.error ? (
              <p className="analytics-state error">{analyticsData.error}</p>
            ) : analyticsData ? (
              <div className="analytics-body">
                <div className="analytics-stats">
                  <div className="analytics-stat">
                    <div className="stat-value">{analyticsData.totalClicks}</div>
                    <div className="stat-label">Total Clicks</div>
                  </div>
                  <div className="analytics-stat">
                    <div className="stat-value">{formatDate(analyticsData.lastAccessed)}</div>
                    <div className="stat-label">Last Accessed</div>
                  </div>
                </div>
                <div className="analytics-daily">
                  <h4>Daily Clicks (last 30 days)</h4>
                  {analyticsData.dailyClicks.length === 0 ? (
                    <p className="analytics-state">No clicks recorded yet.</p>
                  ) : (
                    <div className="analytics-chart">
                      {analyticsData.dailyClicks.map((day) => (
                        <div key={day.date} className="bar-row">
                          <span className="bar-date">{formatDate(day.date)}</span>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${(day.count / maxDailyCount) * 100}%` }}
                            />
                          </div>
                          <span className="bar-count">{day.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
