import { Calculator, type LucideIcon } from 'lucide-react';
import type { ColumnInfo } from '@/types';
import { SectionCard } from './SectionCard';
import { formatNumber, titleCase } from '@/utils/format';

interface StatRowProps {
  label: string;
  value: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium font-mono text-slate-800">{formatNumber(value, 3)}</span>
    </div>
  );
}

export function StatisticsSection({ columns }: { columns: ColumnInfo[] }) {
  const numericCols = columns.filter((c) => c.type === 'numeric' && c.stats);

  if (numericCols.length === 0) {
    return (
      <SectionCard icon={Calculator} title="Statistical Summary" subtitle="Descriptive statistics for numeric columns">
        <p className="text-sm text-slate-500 italic">No numeric columns detected in this dataset.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard icon={Calculator} title="Statistical Summary" subtitle="Descriptive statistics for numeric columns">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {numericCols.map((col) => {
          const s = col.stats!;
          return (
            <div key={col.name} className="rounded-xl bg-white/70 border border-slate-200 p-4 hover:border-primary-200 hover:shadow-md transition-all duration-200">
              <h4 className="text-sm font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500" />
                {titleCase(col.name)}
              </h4>
              <div className="space-y-0.5">
                <StatRow label="Mean" value={s.mean} />
                <StatRow label="Median" value={s.median} />
                <StatRow label="Mode" value={s.mode} />
                <StatRow label="Std dev" value={s.std} />
                <StatRow label="Variance" value={s.variance} />
                <StatRow label="Min" value={s.min} />
                <StatRow label="Max" value={s.max} />
                <StatRow label="Q1 (25%)" value={s.q1} />
                <StatRow label="Q3 (75%)" value={s.q3} />
                <StatRow label="IQR" value={s.iqr} />
                <StatRow label="Skewness" value={s.skewness} />
                <StatRow label="Kurtosis" value={s.kurtosis} />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
