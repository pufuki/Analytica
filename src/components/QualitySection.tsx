import { ShieldCheck, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import type { QualityReport } from '@/types';
import { SectionCard } from './SectionCard';
import { formatPct, titleCase } from '@/utils/format';

const severityConfig = {
  info: { icon: Info, color: 'text-primary-500 bg-primary-50 border-primary-100' },
  warning: { icon: AlertTriangle, color: 'text-warning-500 bg-warning-50 border-warning-200' },
  critical: { icon: AlertOctagon, color: 'text-error-500 bg-error-50 border-error-200' },
};

export function QualitySection({ quality }: { quality: QualityReport }) {
  const colTypeGroups = [
    { label: 'Numeric', cols: quality.numericColumns, color: 'bg-primary-50 text-primary-700' },
    { label: 'Categorical', cols: quality.categoricalColumns, color: 'bg-accent-50 text-accent-700' },
    { label: 'Boolean', cols: quality.booleanColumns, color: 'bg-success-50 text-success-700' },
    { label: 'Datetime', cols: quality.datetimeColumns, color: 'bg-warning-50 text-warning-700' },
  ];

  return (
    <SectionCard icon={ShieldCheck} title="Data Quality Report" subtitle="Detected issues and cleanup suggestions">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl bg-white/70 border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Missing values</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{quality.missingValues}</p>
          <p className="text-xs text-slate-400">{formatPct(quality.missingPct)} of cells</p>
        </div>
        <div className="rounded-xl bg-white/70 border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Duplicate rows</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{quality.duplicateRows}</p>
        </div>
        <div className="rounded-xl bg-white/70 border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Constant cols</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{quality.constantColumns.length}</p>
        </div>
        <div className="rounded-xl bg-white/70 border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide">High cardinality</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-1">{quality.highCardinalityColumns.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Column type breakdown</h4>
          <div className="space-y-3">
            {colTypeGroups.map((g) => (
              <div key={g.label}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`badge ${g.color}`}>{g.label}</span>
                  <span className="text-xs text-slate-400">{g.cols.length}</span>
                </div>
                {g.cols.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {g.cols.map((c) => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                        {titleCase(c)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">None</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Detected issues</h4>
          <div className="space-y-2 max-h-64 overflow-auto scrollbar-thin pr-1">
            {quality.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-success-600">
                <CheckCircle2 className="w-4 h-4" /> No issues detected.
              </div>
            ) : (
              quality.issues.map((issue, i) => {
                const cfg = severityConfig[issue.severity];
                const Icon = cfg.icon;
                return (
                  <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg border ${cfg.color}`}>
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{issue.column === '(entire row)' ? issue.issue : `${titleCase(issue.column)}: ${issue.issue}`}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{issue.suggestion}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100">
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-primary-600" /> Suggested cleanup
        </h4>
        <ul className="space-y-1.5">
          {quality.cleanupSuggestions.map((s, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
              <span className="text-primary-500 mt-1">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionCard>
  );
}
