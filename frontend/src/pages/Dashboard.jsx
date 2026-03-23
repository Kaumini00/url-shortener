import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiExternalLink, FiBarChart2, FiX } from 'react-icons/fi';
import { authService } from '../services/authService';
import { urlService } from '../services/urlService';
import { isAuthenticated } from '../utils/localStorageHelpers';
import '../styles/Dashboard.scss';

const Dashboard = () => {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [copyText, setCopyText] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsUrl, setAnalyticsUrl] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchUrls();
  }, [navigate]);

  const fetchUrls = async () => {
    setLoading(true);
    try {
      const userUrls = await urlService.getUserUrls();
      setUrls(userUrls);
    } catch (err) {
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

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getShortUrl = (shortCode) => `http://localhost:3000/${shortCode}`;

  const handleCopy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyText('Copied!');
      setTimeout(() => setCopyText(''), 1600);
    } catch (err) {
      setCopyText('Copy failed');
      setTimeout(() => setCopyText(''), 1600);
    }
  };

  const handleOpenAnalytics = async (url) => {
    setAnalyticsUrl(url);
    setAnalyticsData(null);
    setAnalyticsLoading(true);
    try {
      const data = await urlService.getAnalytics(url.short_code);
      setAnalyticsData(data);
    } catch (err) {
      setAnalyticsData({ error: 'Failed to load analytics' });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCloseAnalytics = () => {
    setAnalyticsUrl(null);
    setAnalyticsData(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const maxDailyCount = analyticsData?.dailyClicks?.length
    ? Math.max(...analyticsData.dailyClicks.map((d) => d.count), 1)
    : 1;

  return (
    <div className="dashboard-page">
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-content">
            <div className="navbar-brand">URL Shortener</div>
            <div className="navbar-actions">
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Shorten a URL</h2>
          </div>
          <form className="shorten-form" onSubmit={handleShorten}>
            <div className="form-row">
              <input
                type="url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="Enter long URL"
                required
                className="url-input"
              />
              <button
                type="submit"
                disabled={shortening}
                className="shorten-btn"
              >
                {shortening ? 'Shortening...' : 'Shorten'}
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
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your URLs</h2>
          </div>
          {loading ? (
            <p className="loading-message">Loading...</p>
          ) : urls.length === 0 ? (
            <p className="empty-message">No URLs yet. Create your first short URL above!</p>
          ) : (
            <>
              <div className={copyText ? 'toast show' : 'toast'}>{copyText}</div>
              <div className="urls-grid">
              {urls.map((url) => (
                <div key={url.id} className="url-card">
                  <div className="url-card-header">
                    <div className="url-card-title">
                      <h3>Shortened URL</h3>
                      <span className="url-created-date">
                        Created: {new Date(url.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="url-clicks">
                      <div className="clicks-count">{url.clicks}</div>
                      <div className="clicks-label">Clicks</div>
                    </div>
                  </div>

                  <div className="url-card-content">
                    <div className="url-section">
                      <label className="url-label">Original URL</label>
                      <p className="original-url" title={url.long_url}>
                        {url.long_url.length > 60 ? `${url.long_url.substring(0, 60)}...` : url.long_url}
                      </p>
                    </div>

                    <div className="url-section">
                      <label className="url-label">Short URL</label>
                      <div className="short-url-container">
                        <a
                          href={getShortUrl(url.short_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="short-url-link"
                        >
                          {getShortUrl(url.short_code)}
                        </a>
                        <button
                          onClick={() => handleCopy(getShortUrl(url.short_code))}
                          className="copy-btn"
                          title="Copy to clipboard"
                        >
                          <FiClipboard size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="url-card-actions">
                    <button
                      onClick={() => window.open(getShortUrl(url.short_code), '_blank')}
                      className="action-btn visit-btn"
                    >
                      <FiExternalLink size={16} style={{ marginRight: '0.4rem' }} />
                      Visit Link
                    </button>
                    <button
                      onClick={() => handleOpenAnalytics(url)}
                      className="action-btn analytics-btn"
                    >
                      <FiBarChart2 size={16} style={{ marginRight: '0.4rem' }} />
                      Analytics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
          )}
        </div>
      </main>

      {analyticsUrl && (
        <div className="analytics-overlay" onClick={handleCloseAnalytics}>
          <div className="analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="analytics-modal-header">
              <h3>Click Analytics</h3>
              <button className="analytics-close-btn" onClick={handleCloseAnalytics}>
                <FiX size={20} />
              </button>
            </div>

            <div className="analytics-short-code">
              {getShortUrl(analyticsUrl.short_code)}
            </div>

            {analyticsLoading ? (
              <p className="analytics-loading">Loading analytics...</p>
            ) : analyticsData?.error ? (
              <p className="analytics-error">{analyticsData.error}</p>
            ) : analyticsData ? (
              <div className="analytics-body">
                <div className="analytics-stats">
                  <div className="analytics-stat">
                    <div className="analytics-stat-value">{analyticsData.totalClicks}</div>
                    <div className="analytics-stat-label">Total Clicks</div>
                  </div>
                  <div className="analytics-stat">
                    <div className="analytics-stat-value">{formatDate(analyticsData.lastAccessed)}</div>
                    <div className="analytics-stat-label">Last Accessed</div>
                  </div>
                </div>

                <div className="analytics-daily">
                  <h4>Daily Clicks (last 30 days)</h4>
                  {analyticsData.dailyClicks.length === 0 ? (
                    <p className="analytics-no-data">No clicks recorded yet.</p>
                  ) : (
                    <div className="analytics-chart">
                      {analyticsData.dailyClicks.map((day) => (
                        <div key={day.date} className="analytics-bar-row">
                          <span className="analytics-bar-date">{formatDate(day.date)}</span>
                          <div className="analytics-bar-track">
                            <div
                              className="analytics-bar-fill"
                              style={{ width: `${(day.count / maxDailyCount) * 100}%` }}
                            />
                          </div>
                          <span className="analytics-bar-count">{day.count}</span>
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
