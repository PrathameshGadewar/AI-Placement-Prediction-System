import React, { useState } from 'react';
import { recruiterService } from '../services/api';
import { Briefcase, Upload, Download, Search, Filter, Award, CheckCircle, AlertTriangle, ArrowUpDown, FileSpreadsheet } from 'lucide-react';

const RecruiterDashboard = () => {
  const [jobDescription, setJobDescription] = useState(`Senior Software Engineer - Full Stack & ML.
Required: Python, React, FastAPI, SQL, Docker, Machine Learning.
Qualifications: B.Tech / MCA in Computer Science / IT with 7.5+ CGPA.`);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rankedData, setRankedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('ALL');
  const [sortKey, setSortKey] = useState('overall_rank');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleBatchEvaluate = async (e) => {
    e.preventDefault();
    if (!files.length) {
      setError('Please select at least one resume file to evaluate.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('job_description', jobDescription);
    files.forEach((f) => formData.append('resumes', f));

    try {
      const res = await recruiterService.batchRank(formData);
      setRankedData(res.data);
    } catch (err) {
      setError('Batch ranking failed. Ensure backend API is active.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    if (!rankedData || !rankedData.candidates) return;
    try {
      const response = await recruiterService.exportExcel(JSON.stringify(rankedData.candidates));
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Candidate_Rankings.xlsx');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  // Search & Filter Logic
  const filteredCandidates = (rankedData?.candidates || []).filter((c) => {
    const matchesSearch = c.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = filterBranch === 'ALL' || c.branch === filterBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <Briefcase className="w-3.5 h-3.5" /> Automated Recruiter Suite
        </span>
        <h1 className="text-3xl font-extrabold text-white">Recruiter Candidate Ranker & Screening</h1>
        <p className="text-slate-400 text-sm mt-1">Upload target Job Description and multiple candidate resumes to automatically rank candidates by Job Match Score and Placement Probability.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Job Description (JD)</h3>
          <textarea
            rows="6"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none font-mono"
          />
        </div>

        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Upload Multiple Resumes</h3>
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40 hover:bg-slate-900/80">
              <Upload className="w-8 h-8 text-emerald-400 mb-2" />
              <span className="text-sm font-semibold text-white">Click to Select Multiple PDF/DOCX Resumes</span>
              <span className="text-xs text-slate-500 mt-1">Batch processing supported</span>
              <input type="file" multiple accept=".pdf,.docx,.doc" onChange={handleFileChange} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <Award className="w-4 h-4" /> {files.length} candidate resume file(s) selected
              </div>
            )}
          </div>

          <button
            onClick={handleBatchEvaluate}
            disabled={loading || !files.length}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Analyzing & Ranking Candidate Batch...' : 'Batch Evaluate & Rank Candidates'}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {rankedData && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-white">Automated Candidate Ranking Leaderboard</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evaluated {rankedData.total_candidates} candidate resumes against target job profile.</p>
            </div>

            <button
              onClick={handleExcelExport}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel Rankings
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search candidate name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Branches</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="ME">ME</option>
                <option value="Civil">Civil</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Degree / Branch</th>
                  <th className="px-4 py-3">Placement Prob</th>
                  <th className="px-4 py-3">Job Match Score</th>
                  <th className="px-4 py-3">ATS Score</th>
                  <th className="px-4 py-3">Missing Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-extrabold text-blue-400">#{c.overall_rank}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white">{c.candidate_name}</div>
                      <div className="text-[10px] text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{c.degree} ({c.branch})</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full font-bold ${
                        c.placement_probability >= 70 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {c.placement_probability}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-purple-400">{c.job_match_score}%</td>
                    <td className="px-4 py-3.5 font-bold text-blue-400">{c.ats_score}%</td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-400">
                      {c.missing_skills?.join(', ') || 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
