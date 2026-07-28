import { Radar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { OutlierReport } from '@/types';
import { SectionCard } from './SectionCard';
import { formatNumber, formatPct, titleCase } from '@/utils/format';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  fontSize: '12px',
};

export function OutliersSection({ outliers }: { outliers: OutlierReport }) {
  if (outliers.columns.length === 0) {
    return (
      <SectionCard icon={Radar} title="Outlier Detection" subtitle="Values outside 1.5×IQR (Tukey's method)">
        <p className="text-sm text-slate-500 italic">No outliers detected in any numeric column.</p>
      </SectionCard>
    );
  }

  const chartData = outliers.columns.map((c) => ({
    name: titleCase(c.column),
    count: c.count,
  }));

  return (
    <SectionCard icon={Radar} title="Outlier Detection" subtitle="Values outside 1.5×IQR (Tukey's method)">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Outlier counts by column</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(220,38,38,0.05)' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#dc2626' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Details</h4>
          <div className="space-y-2 max-h-72 overflow-auto scrollbar-thin pr-1">
            {outliers.columns.map((c) => (
              <div key={c.column} className="p-3 rounded-lg bg-white/70 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{titleCase(c.column)}</span>
                  <span className="badge bg-error-50 text-error-700">{c.count} outliers · {formatPct(c.pct)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Acceptable range: [{formatNumber(c.lowerBound)}, {formatNumber(c.upperBound)}]
                </p>
                {c.values.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Sample: {c.values.slice(0, 6).map((v) => formatNumber(v)).join(', ')}
                    {c.values.length > 6 ? '…' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-error-50/60 border border-error-100">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-error-700">{outliers.totalOutliers}</span> total outlier values detected across {outliers.columns.length} column(s).
          Review whether these are data-entry errors or legitimate extreme values before modeling.
        </p>
      </div>
    </SectionCard>
  );
}
