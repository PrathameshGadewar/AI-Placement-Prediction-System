import React from 'react';

const FloatingBackground = () => {
  return (
    <div className="float-field" aria-hidden="true">
      {/* graduation cap */}
      <div className="float-icon" style={{ width: '52px', height: '52px', top: '12%', left: '6%', animationDuration: '19s', animationDelay: '-2s' }}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3l10 5-10 5L2 8l10-5z" stroke="currentColor" strokeWidth="1.3"/><path d="M6 10.5V16c0 1.2 2.7 3 6 3s6-1.8 6-3v-5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M22 8v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      </div>
      {/* briefcase */}
      <div className="float-icon indigo" style={{ width: '44px', height: '44px', top: '22%', right: '9%', animationDuration: '14s', animationDelay: '-6s' }}>
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.3"/><path d="M3 13h18" stroke="currentColor" strokeWidth="1.3"/></svg>
      </div>
      {/* resume / document */}
      <div className="float-icon" style={{ width: '40px', height: '40px', top: '58%', left: '4%', animationDuration: '21s', animationDelay: '-11s' }}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M6 2h9l4 4v16H6z" stroke="currentColor" strokeWidth="1.3"/><path d="M9 12h6M9 15.5h6M9 8.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
      </div>
      {/* upward chart */}
      <div className="float-icon indigo" style={{ width: '46px', height: '46px', bottom: '14%', right: '14%', animationDuration: '17s', animationDelay: '-4s' }}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M3 17l5-6 4 3 7-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 5h5v5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {/* code brackets */}
      <div className="float-icon" style={{ width: '38px', height: '38px', top: '40%', left: '22%', animationDuration: '15s', animationDelay: '-8s' }}>
        <svg viewBox="0 0 24 24" fill="none"><path d="M8 4L3 12l5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 4l5 8-5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {/* certificate / badge */}
      <div className="float-icon indigo" style={{ width: '42px', height: '42px', bottom: '22%', left: '38%', animationDuration: '20s', animationDelay: '-13s' }}>
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M9 14l-2 7 5-2.5L17 21l-2-7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
      </div>
      {/* target / match */}
      <div className="float-icon" style={{ width: '36px', height: '36px', top: '75%', right: '30%', animationDuration: '18s', animationDelay: '-9s' }}>
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.3"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>
      </div>

      {/* drifting model-readout snippets */}
      <div className="float-text" style={{ fontSize: '15px', top: '17%', left: '14%', animationDuration: '20s', animationDelay: '-4s' }}>87.3%</div>
      <div className="float-text dim" style={{ fontSize: '11px', top: '47%', right: '22%', animationDuration: '17s', animationDelay: '-9s' }}>P(placed) = 0.82</div>
      <div className="float-text indigo" style={{ fontSize: '12px', bottom: '38%', left: '9%', animationDuration: '23s', animationDelay: '-12s' }}>Δ SHAP +2.4</div>
      <div className="float-text" style={{ fontSize: '10.5px', bottom: '16%', right: '24%', animationDuration: '15s', animationDelay: '-6s' }}>CGPA · 7.8</div>
      <div className="float-text dim" style={{ fontSize: '11px', top: '64%', left: '44%', animationDuration: '19s', animationDelay: '-1s' }}>match: 91%</div>
      <div className="float-text" style={{ fontSize: '10px', top: '4%', left: '52%', animationDuration: '16s', animationDelay: '-8s' }}>risk: low</div>
    </div>
  );
};

export default FloatingBackground;
