import { GitCompareArrows } from 'lucide-react';
import type { CorrelationResult } from '@/types';
import { SectionCard } from './SectionCard';
import { correlationLabel, titleCase } from '@/utils/format';

// Map a correlation value (-1..1) to a background color.
function corrColor(v: number): string {
  if (v >= 0.7) return 'bg-primary-600 text-white';
  if (v >= 0.4) return 'bg-primary-400 text-white';
  if (v >= 0.2) return 'bg-primary-200 text-primary-900';
  if (v > -0.2) return 'bg-slate-100 text-slate-600';
  if (v > -0.4) return 'bg-error-200 text-error-900';
  if (v > -0.7) return 'bg-error-400 text-white';
  return 'bg-error-600 text-white';
}

const strengthStyles: Record<string, string> = {
  'strong-positive': 'bg-primary-50 text-primary-700 border-primary-200',
  'strong-negative': 'bg-error-50 text-error-700 border-error-200',
  'moderate-positive': 'bg-primary-50/60 text-primary-600 border-primary-100',
  'moderate-negative': 'bg-error-50/60 text-error-600 border-error-100',
  weak: 'bg-slate-50 text-slate-600 border-slate-200',
  none: 'bg-slate-50 text-slate-400 border-slate-100',
};

export function CorrelationSection({ correlation }: { correlation: CorrelationResult }) {
  const { columns, matrix, pairs } = correlation;

  if (columns.length < 2) {
    return (
      <SectionCard icon={GitCompareArrows} title="Correlation Analysis" subtitle="Relationships between numeric variables">
        <p className="text-sm text-slate-500 italic">At least two numeric columns are needed for correlation analysis.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={GitCompareArrows} title="Correlation Analysis" subtitle="Pearson correlation matrix and strongest relationships">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heatmap */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Correlation matrix</h4>
          <div className="overflow-auto scrollbar-thin rounded-xl border border-slate-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-slate-50 px-2 py-1.5"></th>
                  {columns.map((c) => (
                    <th key={c} className="px-1 py-1.5 font-medium text-slate-500 whitespace-nowrap" title={c}>
                      {titleCase(c).slice(0, 4)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="sticky left-0 bg-slate-50 px-2 py-1.5 font-medium text-slate-600 whitespace-nowrap" title={columns[i]}>
                      {titleCase(columns[i]).slice(0, 6)}
                    </td>
                    {row.map((v, j) => (
                      <td key={j} className="p-0.5">
                        <div className={`w-12 h-9 rounded flex items-center justify-center font-mono text-[10px] font-medium ${corrColor(v)}`} title={`${columns[i]} ↔ ${columns[j]}: ${v.toFixed(2)}`}>
                          {v.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top pairs */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Strongest correlations</h4>
          <div className="space-y-2 max-h-80 overflow-auto scrollbar-thin pr-1">
            {pairs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No notable correlations detected.</p>
            ) : (
              pairs.slice(0, 12).map((p, i) => (
                <div key={i} className={`flex items-center justify-between gap-3 p-3 rounded-lg border ${strengthStyles[p.strength]}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{titleCase(p.a)} ↔ {titleCase(p.b)}</p>
                    <p className="text-xs text-slate-500">{correlationLabel(p.strength)}</p>
                  </div>
                  <span className="font-mono text-sm font-bold flex-shrink-0">{p.value.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">How to read this</h4>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="badge bg-primary-600 text-white">+0.7 to +1.0 strong positive</span>
          <span className="badge bg-primary-200 text-primary-900">+0.4 to +0.7 moderate positive</span>
          <span className="badge bg-slate-100 text-slate-600">-0.2 to +0.2 weak / none</span>
          <span className="badge bg-error-200 text-error-900">-0.7 to -0.4 moderate negative</span>
          <span className="badge bg-error-600 text-white">-1.0 to -0.7 strong negative</span>
        </div>
      </div>
    </SectionCard>
  );
}
