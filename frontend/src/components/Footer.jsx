import React from 'react';

const Footer = () => {
  return (
    <div className="wrap">
      <footer>
        <div className="footer-row">
          <div className="footer-brand">
            <div className="brand-mark" style={{ width: '26px', height: '26px', borderRadius: '7px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 15a8 8 0 0 1 16 0" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <b>AI Placement Intelligence Platform</b>
            <span className="pill-tag">Production Ready v1.0</span>
          </div>

          <div className="footer-stack">
            XGBoost · spaCy · Sentence Transformers · SHAP · FastAPI · React.js
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
