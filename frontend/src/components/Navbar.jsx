import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="topbar">
      <div className="topbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 15a8 8 0 0 1 16 0" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="15" r="1.6" fill="#fff"/>
              <path d="M12 15L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="brand-name">Placement <em>AI</em></div>
            <div className="brand-sub">Intelligence Platform</div>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="nav-links">
          <Link
            to="/student"
            className={`nav-link ${isActive('/student') ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 15a8 8 0 0 1 16 0M12 15l3.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Placement Predictor
          </Link>

          <Link
            to="/matching"
            className={`nav-link ${isActive('/matching') ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M10 12h6M10 16h6M10 8h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            ATS &amp; JD Match
          </Link>
        </div>

        {/* Right Action Items */}
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M12 2.5v2.4M12 19v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19 12h2.4M4.9 19l1.7-1.7M17.4 6.6l1.7-1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <Link className="btn-ghost" to="/login">Sign In</Link>
          <Link className="btn-primary" to="/register">Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
