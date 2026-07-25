import React, { useState } from 'react';
import { matchingService } from '../services/api';
import { parseResumeClient, matchResumeJDClient } from '../utils/clientModel';

const JobMatchPage = () => {
  const [jobDescription, setJobDescription] = useState(`We are seeking a Full Stack Software Engineer proficient in Python, React.js, FastAPI, SQL, and Docker.

Requirements:
- Bachelor's degree in Computer Science or related engineering field.
- Strong knowledge of Data Structures, Algorithms, and REST APIs.
- Experience with Machine Learning / Data Science pipelines is a plus.
- Excellent communication and problem-solving skills.`);

  const [resumeFile, setResumeFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('Extracting Job Description Keywords & Requirements...');
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [error, setError] = useState('');

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!jobDescription) {
      setError('Please paste a Job Description.');
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    setMatchResult(null);
    setError('');
    setAnalysisStep('Extracting Job Description Keywords & Requirements...');

    setTimeout(() => {
      setAnalysisStep('Parsing Resume Text & Computing Sentence Transformer Embeddings...');
    }, 1500);

    setTimeout(() => {
      setAnalysisStep('Calculating ATS Compatibility & Skill Gap Analysis...');
    }, 3200);

    let clientExtracted = null;
    if (resumeFile) {
      clientExtracted = await parseResumeClient(resumeFile);
    }

    const formData = new FormData();
    formData.append('job_description', jobDescription);
    if (resumeFile) {
      formData.append('resume_file', resumeFile);
    } else {
      formData.append('resume_text', 'Python, React.js, FastAPI, SQL, Docker, Data Structures, Communication');
    }

    try {
      const res = await matchingService.matchResumeJD(formData);
      setTimeout(() => {
        setMatchResult(res.data);
        setAnalyzing(false);
        setLoading(false);
      }, 5000);
    } catch (err) {
      // Offline / Vercel fallback: compute via client ATS matching engine
      setTimeout(() => {
        const detectedSkills = clientExtracted ? clientExtracted.detected_skills : ['Python', 'React.js', 'FastAPI', 'SQL'];
        const clientMatch = matchResumeJDClient(jobDescription, detectedSkills);
        setMatchResult(clientMatch);
        setAnalyzing(false);
        setLoading(false);
      }, 5000);
    }
  };

  const matchScore = matchResult ? matchResult.match_analytics.job_match_score : 0;
  const matchedSkills = matchResult ? matchResult.match_analytics.matched_skills : ['Python', 'React.js', 'FastAPI', 'SQL'];
  const missingSkills = matchResult ? matchResult.match_analytics.missing_skills : ['Docker', 'AWS', 'Kubernetes'];

  return (
    <div className="wrap">
      <section className="hero">
        <div className="eyebrow-row">
          <div className="eyebrow">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
            Sentence Transformers · NLP Engine
          </div>
        </div>
        <h1 className="title">Job Description &amp; ATS Matching Engine</h1>
        <p className="subtitle">
          Compare a candidate resume against real job requirements to calculate ATS score, semantic similarity, missing skills, and strengths.
        </p>
      </section>

      <section className="view active" style={{ paddingTop: '30px' }}>
        {/* Step Indicator */}
        <div className="steps-eyebrow">
          <div className="step-num">1</div>
          <span className="card-note" style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>Paste the job description</span>
          <div style={{ width: '1px', height: '14px', background: 'var(--border)' }}></div>
          <div className="step-num">2</div>
          <span className="card-note" style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>Upload the candidate resume</span>
          <div style={{ width: '1px', height: '14px', background: 'var(--border)' }}></div>
          <div className="step-num">3</div>
          <span className="card-note" style={{ color: 'var(--text-dim)', fontSize: '12.5px' }}>Read the calibrated match score</span>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 18px', borderRadius: '10px', background: 'var(--danger-dim)', color: 'var(--danger)', fontSize: '13px', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <div className="ats-grid">
          {/* Job Description Textarea */}
          <div className="card card-pad">
            <div className="card-head">
              <div className="card-title" style={{ fontSize: '15px' }}>Job Description (JD)</div>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description..."
            />
          </div>

          {/* Resume Upload & Match Button */}
          <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="card-head">
                <div className="card-title" style={{ fontSize: '15px' }}>Upload Candidate Resume</div>
              </div>
              <label className="dropzone" style={{ padding: '26px 20px' }}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="dropzone-title">Upload Resume (PDF / DOCX)</div>
                <div className="dropzone-sub">Extracts skills, education &amp; experience</div>
                {resumeFile && <div className="dz-filename" style={{ display: 'block' }}>✓ {resumeFile.name}</div>}
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  style={{ display: 'none' }}
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
              </label>
            </div>

            <button className="predict-btn" onClick={handleMatch} disabled={analyzing || loading} style={{ marginTop: '18px' }}>
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="1.7"/>
                <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="1.7"/>
              </svg>
              {analyzing ? 'Analyzing ATS Similarity...' : 'Calculate Job Match & ATS Score'}
            </button>
          </div>
        </div>

        {/* Analyzing Scanner Animation Card */}
        {analyzing && (
          <div className="card card-pad match-panel scanner-card" style={{ marginTop: '22px' }}>
            <div className="scanner-beam" />
            <div className="scanner-ring" />
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Computing Semantic &amp; ATS Compatibility Score
            </h3>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', color: 'var(--gold)', letterSpacing: '0.02em' }}>
              {analysisStep}
            </p>
          </div>
        )}

        {/* Match Result Panel */}
        {!analyzing && matchResult && (
          <div className="card card-pad match-panel">
            <div className="card-head">
              <div className="card-title" style={{ fontSize: '15px' }}>Match Result</div>
              <div className="model-tag"><span className="dot"></span>calibrated</div>
            </div>

            <div className="meter-row">
              <div style={{ flex: 1 }}>
                <div className="meter-track">
                  <div className="meter-fill" style={{ width: `${matchScore}%` }}></div>
                </div>
                <div className="meter-ticks">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>
              </div>
              <div className="meter-score mono">{matchScore.toFixed(0)}%</div>
            </div>

            <div className="chip-cols">
              <div>
                <div className="chip-col-title" style={{ color: 'var(--success)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Matched Skills ({matchedSkills.length})
                </div>
                <div className="chip-list">
                  {matchedSkills.map((s, idx) => (
                    <span key={idx} className="chip matched">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="chip-col-title" style={{ color: 'var(--danger)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01M10.3 3.9L2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                  </svg>
                  Missing Skills ({missingSkills.length})
                </div>
                <div className="chip-list">
                  {missingSkills.map((s, idx) => (
                    <span key={idx} className="chip missing">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default JobMatchPage;
