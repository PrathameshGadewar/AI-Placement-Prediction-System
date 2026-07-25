import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-500/20',
    green: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'from-purple-500/20 to-pink-500/10 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/20',
    red: 'from-red-500/20 to-rose-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-white tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center border shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
