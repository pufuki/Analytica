import { Rows3, Columns3, HardDrive, Copy, AlertTriangle, Hash, Table2, FileSpreadsheet } from 'lucide-react';
import type { DatasetOverview } from '@/types';
import { SectionCard } from './SectionCard';
import { StatCard } from './StatCard';
import { formatBytes, formatNumber, titleCase } from '@/utils/format';

const typeColors: Record<string, string> = {
  numeric: 'bg-primary-50 text-primary-700',
  categorical: 'bg-accent-50 text-accent-700',
  boolean: 'bg-success-50 text-success-700',
  datetime: 'bg-warning-50 text-warning-700',
};

export function OverviewSection({ overview }: { overview: DatasetOverview }) {
  return (
    <SectionCard icon={Table2} title="Dataset Overview" subtitle="Shape, memory, and structure at a glance">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Rows3} label="Rows" value={overview.rows} accent="primary" />
        <StatCard icon={Columns3} label="Columns" value={overview.columns} accent="accent" />
        <StatCard icon={HardDrive} label="Memory" value={formatBytes(overview.memoryBytes)} accent="success" />
        <StatCard icon={Copy} label="Duplicates" value={overview.duplicateRows} accent="warning" />
        <StatCard icon={AlertTriangle} label="Missing cells" value={overview.missingValues} accent="error" />
        <StatCard icon={Hash} label="Unique values" value={overview.columnNames.reduce((a, n) => a + 1, 0)} hint="columns tracked" accent="primary" />
        <StatCard icon={FileSpreadsheet} label="File size" value={formatBytes(overview.fileSizeBytes)} accent="accent" />
        <StatCard icon={Table2} label="Total cells" value={overview.totalCells} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Columns &amp; data types</h4>
          <div className="flex flex-wrap gap-2">
            {overview.columnNames.map((name) => (
              <div key={name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 border border-slate-200">
                <span className="text-sm font-medium text-slate-700">{titleCase(name)}</span>
                <span className={`badge ${typeColors[overview.columnTypes[name]] ?? 'bg-slate-100 text-slate-600'}`}>
                  {overview.columnTypes[name]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Preview — first 20 rows</h4>
          <div className="overflow-auto max-h-72 scrollbar-thin rounded-xl border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
                <tr>
                  {overview.columnNames.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">
                      {titleCase(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overview.preview.map((row, i) => (
                  <tr key={i} className="hover:bg-primary-50/40 transition-colors">
                    {overview.columnNames.map((c) => (
                      <td key={c} className="px-3 py-1.5 text-slate-600 whitespace-nowrap max-w-[200px] truncate">
                        {row[c] === '' ? <span className="text-slate-300 italic">—</span> : row[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-2">{overview.preview.length} of {formatNumber(overview.rows)} rows shown</p>
        </div>
      </div>
    </SectionCard>
  );
}
