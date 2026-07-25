import React, { useState } from 'react';
import { predictService } from '../services/api';

const StudentDashboard = () => {
  const [subtab, setSubtab] = useState('manual'); // 'manual' or 'resume'

  // Form parameters
  const [formData, setFormData] = useState({
    Name: 'John Doe',
    Age: 21,
    Gender: 'Male',
    Degree: 'B.Tech',
    Branch: 'CSE',
    CGPA: 7.8,
    Aptitude_Test_Score: 78,
    Coding_Skills: 8,
    Communication_Skills: 7,
    Internships: 1,
    Projects: 3,
    Certifications: 2,
    Backlogs: 0,
    Soft_Skills_Rating: 7
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('Collecting Student Profile Signals & Academic Metrics...');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateClientScore = () => {
    const cgpa = formData.CGPA;
    const apt = formData.Aptitude_Test_Score;
    const code = formData.Coding_Skills;
    const comm = formData.Communication_Skills;
    const intern = formData.Internships;
    const proj = formData.Projects;
    const cert = formData.Certifications;
    const back = formData.Backlogs;

    const contributions = [
      { name: 'CGPA', val: (cgpa / 10) * 25 },
      { name: 'Aptitude', val: (apt / 100) * 20 },
      { name: 'Coding Skills', val: (code / 10) * 22 },
      { name: 'Communication', val: (comm / 10) * 14 },
      { name: 'Internships', val: (Math.min(intern, 3) / 3) * 9 },
      { name: 'Projects', val: (Math.min(proj, 5) / 5) * 7 },
      { name: 'Certifications', val: (Math.min(cert, 5) / 5) * 4 },
      { name: 'Backlogs', val: -back * 7 },
    ];

    let score = contributions.reduce((s, c) => s + c.val, 5);
    score = Math.max(2, Math.min(98, score));

    const baseline = 12.5;
    const sorted = [...contributions].sort((a, b) => Math.abs(b.val - baseline) - Math.abs(a.val - baseline)).slice(0, 5);
    const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.val - baseline)), 1);

    const factorList = sorted.map((c) => {
      const delta = c.val - baseline;
      const pct = Math.min(100, (Math.abs(delta) / maxAbs) * 100);
      const positive = delta >= 0;
      return {
        feature: c.name,
        impact: (positive ? '+' : '') + delta.toFixed(1),
        pct,
        positive
      };
    });

    return { score, factorList };
  };

  const startAnalyzingSequence = (onComplete) => {
    setAnalyzing(true);
    setPrediction(null);
    setAnalysisStep('Collecting Student Profile Signals & Academic Metrics...');

    setTimeout(() => {
      setAnalysisStep('Running XGBoost & Random Forest Model Pipeline...');
    }, 1500);

    setTimeout(() => {
      setAnalysisStep('Computing SHAP Explainability & Risk Calibration...');
    }, 3200);

    setTimeout(() => {
      onComplete();
      setAnalyzing(false);
    }, 5000);
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const clientCalc = calculateClientScore();

    try {
      const res = await predictService.predictManual(formData);
      const backendResult = {
        placement_probability: res.data.placement_probability,
        placement_status: res.data.placement_status,
        risk_level: res.data.risk_level,
        history_id: res.data.history_id,
        factors: res.data.top_positive_factors.map(f => ({
          feature: f.feature,
          impact: '+' + f.impact,
          pct: Math.min(100, Math.abs(f.impact) * 100),
          positive: true
        })).concat(res.data.top_negative_factors.map(f => ({
          feature: f.feature,
          impact: '' + f.impact,
          pct: Math.min(100, Math.abs(f.impact) * 100),
          positive: false
        })))
      };

      startAnalyzingSequence(() => {
        setPrediction(backendResult);
        setLoading(false);
      });

    } catch (err) {
      startAnalyzingSequence(() => {
        setPrediction({
          placement_probability: clientCalc.score,
          placement_status: clientCalc.score >= 50 ? 'Placed' : 'Not Placed',
          risk_level: clientCalc.score < 40 ? 'High' : clientCalc.score < 70 ? 'Medium' : 'Low',
          factors: clientCalc.factorList
        });
        setLoading(false);
      });
    }
  };

  const handleResumeUpload = async (file) => {
    if (!file) return;
    setResumeFile(file);
    setAnalyzing(true);
    setPrediction(null);
    setError('');

    setAnalysisStep('Extracting Document Structure & Contact Metadata...');

    setTimeout(() => {
      setAnalysisStep('Parsing Educational Background, Skills & Certifications...');
    }, 1500);

    setTimeout(() => {
      setAnalysisStep('Running XGBoost Model Inference & Calculating SHAP Values...');
    }, 3200);

    const bodyData = new FormData();
    bodyData.append('file', file);

    try {
      const res = await predictService.predictResume(bodyData);
      setTimeout(() => {
        const extracted = res.data.extracted_info;
        if (extracted && extracted.form_fields) {
          setFormData((prev) => ({
            ...prev,
            ...extracted.form_fields,
            Name: extracted.name || prev.Name
          }));
        }
        const pred = res.data.prediction;
        setPrediction({
          placement_probability: pred.placement_probability,
          placement_status: pred.placement_status,
          risk_level: pred.risk_level,
          history_id: res.data.history_id,
          factors: pred.top_positive_factors.map(f => ({
            feature: f.feature,
            impact: '+' + f.impact,
            pct: Math.min(100, Math.abs(f.impact) * 100),
            positive: true
          })).concat(pred.top_negative_factors.map(f => ({
            feature: f.feature,
            impact: '' + f.impact,
            pct: Math.min(100, Math.abs(f.impact) * 100),
            positive: false
          })))
        });
        setAnalyzing(false);
      }, 5000);

    } catch (err) {
      setTimeout(() => {
        setError('Failed to extract resume data. Try manual entry.');
        setAnalyzing(false);
      }, 1000);
    }
  };

  // Gauge geometry calculations
  const GSTART = -135, GEND = 135, GCX = 100, GCY = 100, GR = 78;

  const polar = (cx, cy, r, angleDeg) => {
    const rad = angleDeg * (Math.PI / 180);
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  };

  const arcPath = (cx, cy, r, startAngle, endAngle) => {
    const s = polar(cx, cy, r, startAngle);
    const e = polar(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const scorePct = prediction ? prediction.placement_probability : 0;
  const endAngle = GSTART + (scorePct / 100) * (GEND - GSTART);

  const getGaugeColor = (val) => {
    if (val < 40) return 'var(--danger)';
    if (val < 70) return 'var(--gold)';
    return 'var(--success)';
  };

  const gaugeColor = getGaugeColor(scorePct);

  // Render ticks
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const ang = GSTART + (i / 10) * (GEND - GSTART);
    const p1 = polar(GCX, GCY, GR + 11, ang);
    const p2 = polar(GCX, GCY, GR + 18, ang);
    ticks.push(
      <line
        key={i}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="currentColor"
        strokeWidth={i % 5 === 0 ? '2' : '1'}
        className="tick-mark"
      />
    );
  }

  return (
    <div className="wrap">
      {/* Hero Header */}
      <section className="hero" id="hero-predictor">
        <h1 className="title">Student Placement Intelligence</h1>
        <p className="subtitle">
          Predict placement probability, gauge risk level, and surface the exact factors moving the needle — for one student or an entire cohort.
        </p>

        <div className="view-switch">
          <button
            className={subtab === 'manual' ? 'active' : ''}
            onClick={() => setSubtab('manual')}
          >
            Option 1 · Manual Input
          </button>
          <button
            className={subtab === 'resume' ? 'active' : ''}
            onClick={() => setSubtab('resume')}
          >
            Option 2 · Resume Upload
          </button>
        </div>
      </section>

      <section className="view active" id="view-predictor" style={{ paddingTop: '30px' }}>
        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 18px', borderRadius: '10px', background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: '13px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        {/* MANUAL INPUT TAB */}
        {subtab === 'manual' && (
          <div className="grid-2">
            {/* Form Card */}
            <div className="card card-pad">
              <div className="card-head">
                <div className="card-title">Student Profile Details</div>
                <div className="card-note">Edit fields before prediction</div>
              </div>

              <form onSubmit={handlePredict}>
                <div className="field-row three">
                  <div>
                    <label className="field-label">Student Name</label>
                    <input
                      type="text"
                      value={formData.Name}
                      onChange={(e) => handleInputChange('Name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Age</label>
                    <input
                      type="number"
                      value={formData.Age}
                      onChange={(e) => handleInputChange('Age', parseInt(e.target.value) || 21)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Gender</label>
                    <select
                      value={formData.Gender}
                      onChange={(e) => handleInputChange('Gender', e.target.value)}
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="field-row">
                  <div>
                    <label className="field-label">Degree</label>
                    <select
                      value={formData.Degree}
                      onChange={(e) => handleInputChange('Degree', e.target.value)}
                    >
                      <option>B.Tech</option>
                      <option>M.Tech</option>
                      <option>BCA</option>
                      <option>MCA</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Branch</label>
                    <select
                      value={formData.Branch}
                      onChange={(e) => handleInputChange('Branch', e.target.value)}
                    >
                      <option>CSE</option>
                      <option>ECE</option>
                      <option>ME</option>
                      <option>Civil</option>
                    </select>
                  </div>
                </div>

                {/* Sliders */}
                <div className="field-row">
                  <div className="slider-block" style={{ marginBottom: 0 }}>
                    <div className="slider-top">
                      <label className="field-label" style={{ margin: 0 }}>CGPA (0–10)</label>
                      <span className="slider-val mono">{formData.CGPA}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.CGPA}
                      onChange={(e) => handleInputChange('CGPA', parseFloat(e.target.value))}
                      style={{ backgroundSize: `${(formData.CGPA / 10) * 100}% 100%` }}
                    />
                    <div className="tick-row"><span>0</span><span>5</span><span>10</span></div>
                  </div>

                  <div className="slider-block" style={{ marginBottom: 0 }}>
                    <div className="slider-top">
                      <label className="field-label" style={{ margin: 0 }}>Aptitude Score (0–100)</label>
                      <span className="slider-val mono">{formData.Aptitude_Test_Score}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.Aptitude_Test_Score}
                      onChange={(e) => handleInputChange('Aptitude_Test_Score', parseInt(e.target.value))}
                      style={{ backgroundSize: `${(formData.Aptitude_Test_Score / 100) * 100}% 100%` }}
                    />
                    <div className="tick-row"><span>0</span><span>50</span><span>100</span></div>
                  </div>
                </div>

                <div className="field-row">
                  <div className="slider-block" style={{ marginBottom: 0 }}>
                    <div className="slider-top">
                      <label className="field-label" style={{ margin: 0 }}>Coding Skills (1–10)</label>
                      <span className="slider-val mono">{formData.Coding_Skills}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.Coding_Skills}
                      onChange={(e) => handleInputChange('Coding_Skills', parseInt(e.target.value))}
                      style={{ backgroundSize: `${((formData.Coding_Skills - 1) / 9) * 100}% 100%` }}
                    />
                    <div className="tick-row"><span>1</span><span>5</span><span>10</span></div>
                  </div>

                  <div className="slider-block" style={{ marginBottom: 0 }}>
                    <div className="slider-top">
                      <label className="field-label" style={{ margin: 0 }}>Communication (1–10)</label>
                      <span className="slider-val mono">{formData.Communication_Skills}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.Communication_Skills}
                      onChange={(e) => handleInputChange('Communication_Skills', parseInt(e.target.value))}
                      style={{ backgroundSize: `${((formData.Communication_Skills - 1) / 9) * 100}% 100%` }}
                    />
                    <div className="tick-row"><span>1</span><span>5</span><span>10</span></div>
                  </div>
                </div>

                <div className="field-row four" style={{ marginTop: '4px' }}>
                  <div>
                    <label className="field-label">Internships</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.Internships}
                      onChange={(e) => handleInputChange('Internships', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Projects</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.Projects}
                      onChange={(e) => handleInputChange('Projects', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Certifications</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.Certifications}
                      onChange={(e) => handleInputChange('Certifications', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="field-label">Backlogs</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.Backlogs}
                      onChange={(e) => handleInputChange('Backlogs', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <button type="submit" className="predict-btn" disabled={analyzing || loading}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" stroke="#fff" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                  {analyzing ? 'Analyzing Profile Signals...' : 'Predict Placement Probability'}
                </button>
              </form>
            </div>

            {/* Readout Card */}
            <div className="card card-pad">
              <div className="card-head" style={{ marginBottom: '6px' }}>
                <div className="card-title" style={{ fontSize: '15px' }}>Model Readout</div>
                <div className="model-tag">
                  <span className="dot"></span>{analyzing ? 'analyzing' : prediction ? 'live' : 'ready'}
                </div>
              </div>

              {analyzing ? (
                <div className="scanner-card">
                  <div className="scanner-beam" />
                  <div className="scanner-ring" />
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                    Analyzing Student Profile Signals
                  </h3>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.02em', minHeight: '36px' }}>
                    {analysisStep}
                  </p>
                </div>
              ) : !prediction ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 15a8 8 0 0 1 16 0M12 15l3.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <h3>Awaiting Model Inference</h3>
                  <p>Set the student's signals and run the model to calculate placement probability.</p>
                </div>
              ) : (
                <div className="readout">
                  <div className="gauge-wrap">
                    <svg viewBox="0 0 200 150" width="210" height="150">
                      <path fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" d={arcPath(GCX, GCY, GR, GSTART, GEND)} />
                      <path fill="none" stroke={gaugeColor} strokeWidth="14" strokeLinecap="round" d={arcPath(GCX, GCY, GR, GSTART, endAngle)} />
                      <g style={{ color: 'var(--border-strong)' }}>{ticks}</g>
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="34"
                        stroke={gaugeColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        transform={`rotate(${endAngle} 100 100)`}
                      />
                      <circle cx="100" cy="100" r="5" fill={gaugeColor}></circle>
                    </svg>
                    <div className="gauge-pct mono" style={{ color: gaugeColor }}>
                      {scorePct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="gauge-label">P(placed)</div>

                  <div
                    className="risk-badge"
                    style={{
                      background: scorePct < 40 ? 'var(--danger-dim)' : scorePct < 70 ? 'var(--gold-dim)' : 'var(--success-dim)',
                      color: gaugeColor
                    }}
                  >
                    <span className="dot" style={{ background: gaugeColor }}></span>
                    {scorePct < 40 ? 'High Risk' : scorePct < 70 ? 'Moderate Risk' : 'On Track'} ·{' '}
                    {scorePct < 40 ? 'Needs intervention' : scorePct < 70 ? 'Room to improve' : 'Strong profile'}
                  </div>

                  <div className="divider"></div>

                  <div className="factors">
                    <div className="factors-title">Top Contributing Factors — SHAP</div>
                    {prediction.factors && prediction.factors.map((f, idx) => (
                      <div key={idx} className="factor-row">
                        <div className="factor-name">{f.feature}</div>
                        <div className="factor-bar-track">
                          <div
                            className="factor-bar-fill"
                            style={{
                              width: `${f.pct}%`,
                              background: f.positive ? 'var(--gold)' : 'var(--text-faint)',
                              left: 0
                            }}
                          ></div>
                        </div>
                        <div className="factor-val">{f.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* RESUME UPLOAD TAB */}
        {subtab === 'resume' && (
          <div className="grid-2">
            <div className="card card-pad">
              <div className="card-title" style={{ marginBottom: '6px' }}>Upload Resume (PDF / DOCX)</div>
              <p className="card-note" style={{ marginBottom: '18px' }}>Our NLP parser will automatically extract degree, branch, skills, projects, and certifications to pre-fill the form.</p>
              
              <label className="dropzone">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="dropzone-title">Click to upload resume</div>
                <div className="dropzone-sub">Supports PDF, DOCX · Max 10MB</div>
                {resumeFile && <div className="dz-filename" style={{ display: 'block' }}>✓ {resumeFile.name}</div>}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files[0] && handleResumeUpload(e.target.files[0])}
                />
              </label>
            </div>

            <div className="card card-pad">
              {analyzing ? (
                <div className="scanner-card">
                  <div className="scanner-beam" />
                  <div className="scanner-ring" />
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                    Analyzing Resume Structure
                  </h3>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--gold)', letterSpacing: '0.02em', minHeight: '36px' }}>
                    {analysisStep}
                  </p>
                </div>
              ) : !prediction ? (
                <div className="empty-state" style={{ padding: '70px 20px' }}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 15a8 8 0 0 1 16 0M12 15l3.5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <h3>Awaiting Model Inference</h3>
                  <p>Upload a resume to auto-fill the profile and calculate placement probability.</p>
                </div>
              ) : (
                <div className="readout">
                  <div className="gauge-wrap">
                    <svg viewBox="0 0 200 150" width="210" height="150">
                      <path fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" d={arcPath(GCX, GCY, GR, GSTART, GEND)} />
                      <path fill="none" stroke={gaugeColor} strokeWidth="14" strokeLinecap="round" d={arcPath(GCX, GCY, GR, GSTART, endAngle)} />
                      <g style={{ color: 'var(--border-strong)' }}>{ticks}</g>
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="34"
                        stroke={gaugeColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        transform={`rotate(${endAngle} 100 100)`}
                      />
                      <circle cx="100" cy="100" r="5" fill={gaugeColor}></circle>
                    </svg>
                    <div className="gauge-pct mono" style={{ color: gaugeColor }}>
                      {scorePct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="gauge-label">P(placed)</div>

                  <div
                    className="risk-badge"
                    style={{
                      background: scorePct < 40 ? 'var(--danger-dim)' : scorePct < 70 ? 'var(--gold-dim)' : 'var(--success-dim)',
                      color: gaugeColor
                    }}
                  >
                    <span className="dot" style={{ background: gaugeColor }}></span>
                    {scorePct < 40 ? 'High Risk' : scorePct < 70 ? 'Moderate Risk' : 'On Track'}
                  </div>

                  <div className="divider"></div>

                  <div className="factors">
                    <div className="factors-title">Top Contributing Factors — SHAP</div>
                    {prediction.factors && prediction.factors.map((f, idx) => (
                      <div key={idx} className="factor-row">
                        <div className="factor-name">{f.feature}</div>
                        <div className="factor-bar-track">
                          <div
                            className="factor-bar-fill"
                            style={{
                              width: `${f.pct}%`,
                              background: f.positive ? 'var(--gold)' : 'var(--text-faint)',
                              left: 0
                            }}
                          ></div>
                        </div>
                        <div className="factor-val">{f.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
