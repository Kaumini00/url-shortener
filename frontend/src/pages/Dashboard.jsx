import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClipboard, FiExternalLink } from 'react-icons/fi';
import { authService } from '../services/authService';
import { urlService } from '../services/urlService';
import { isAuthenticated } from '../utils/localStorageHelpers';
import '../styles/Dashboard.scss';

const Dashboard = () => {
  const [longUrl, setLongUrl] = useState('');
  const [urls, setUrls] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [copyText, setCopyText] = useState('');
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
      const newUrl = await urlService.shortenUrl(longUrl);
      setUrls([newUrl, ...urls]);
      setLongUrl('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL');
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
                  </div>
                </div>
              ))}
            </div>
          </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;