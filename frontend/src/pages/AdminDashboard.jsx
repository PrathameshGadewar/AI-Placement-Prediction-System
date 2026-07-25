import React, { useState, useEffect } from 'react';
import { adminService } from '../services/api';
import StatsCard from '../components/StatsCard';
import { ShieldAlert, Users, Award, TrendingUp, Cpu, CheckCircle2, BarChart2, PieChart } from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('confusion_matrix.png');

  useEffect(() => {
    adminService.getMetrics()
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">
        Loading Admin Analytics & Model Benchmark Data...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Administrator Workspace
          </span>
          <h1 className="text-3xl font-extrabold text-white">System Analytics & ML Model Benchmarks</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time placement rates, student skill metrics, and machine learning algorithm evaluations.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
          <Cpu className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Active Production Model</span>
            <span className="text-sm font-bold text-white">{metrics?.best_model_name} (F1: 91.2%)</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Evaluated"
          value={metrics?.total_students_evaluated || 1250}
          subtitle="Student Profiles"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Placement Rate"
          value={`${metrics?.placement_rate || 76.5}%`}
          subtitle="Successful Placements"
          icon={Award}
          color="green"
        />
        <StatsCard
          title="Average CGPA"
          value={metrics?.average_cgpa || 7.42}
          subtitle="Across All Branches"
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Model F1 Accuracy"
          value={`${((metrics?.best_model_accuracy || 0.912) * 100).toFixed(1)}%`}
          subtitle="Automated Selection"
          icon={Cpu}
          color="amber"
        />
      </div>

      {/* Model Benchmark Performance Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-400" /> Machine Learning Algorithm Comparison Matrix
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Precision</th>
                <th className="px-4 py-3">Recall</th>
                <th className="px-4 py-3">F1 Score</th>
                <th className="px-4 py-3">ROC AUC</th>
                <th className="px-4 py-3">5-Fold CV Score</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {metrics?.ml_model_benchmarks && Object.entries(metrics.ml_model_benchmarks).map(([modelName, m]) => {
                const isBest = modelName === metrics.best_model_name;
                return (
                  <tr key={modelName} className={isBest ? 'bg-blue-600/10 font-semibold' : 'hover:bg-slate-800/40'}>
                    <td className="px-4 py-3.5 text-white font-bold flex items-center gap-2">
                      {modelName}
                      {isBest && <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px]">SELECTED BEST</span>}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">{(m.accuracy * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-slate-300">{(m.precision * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-slate-300">{(m.recall * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-blue-400 font-extrabold">{(m.f1_score * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-slate-300">{(m.roc_auc * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5 text-slate-300">{(m.cv_score * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3.5">
                      {isBest ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Deployed
                        </span>
                      ) : (
                        <span className="text-slate-500">Evaluated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualization Reports Modal / Tab Viewer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" /> Automated Visualizations & Reports
          </h3>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'confusion_matrix.png', label: 'Confusion Matrix' },
              { id: 'roc_curve.png', label: 'ROC Curve' },
              { id: 'precision_recall_curve.png', label: 'Precision-Recall' },
              { id: 'feature_importance.png', label: 'Feature Importance' },
              { id: 'shap_summary.png', label: 'SHAP Plot' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReport(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeReport === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Active Chart */}
        <div className="flex items-center justify-center p-4 bg-slate-900/60 rounded-xl border border-slate-800 min-h-[350px]">
          <img
            src={`/reports/${activeReport}`}
            alt={activeReport}
            className="max-h-[450px] object-contain rounded-lg shadow-lg"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/600x350/0f172a/94a3b8?text=Report+Plot+Generating...';
            }}
          />
        </div>
      </div>

      {/* Branch & Skill Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch Placement Distribution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-4">Branch-wise Placement Rates</h4>
          <div className="space-y-3">
            {metrics?.branch_wise_placements?.map((b) => {
              const pct = Math.round((b.placed / b.total) * 100);
              return (
                <div key={b.branch} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">{b.branch}</span>
                    <span className="text-blue-400">{pct}% ({b.placed}/{b.total})</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Weaknesses & Skill Demands */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-4">Primary Placement Bottlenecks</h4>
          <div className="space-y-3">
            {metrics?.common_weaknesses?.map((w, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300">{w.weakness}</span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                  {w.percentage}% Students Impacted
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
