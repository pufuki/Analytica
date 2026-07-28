import { useState } from 'react';
import { FlaskConical, ChevronDown, ChevronUp, Loader2, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { AnalysisResult, MLTrainingResult } from '@/types';
import { SectionCard } from './SectionCard';
import { trainModels } from '@/services/ml';
import { formatNumber, titleCase } from '@/utils/format';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  fontSize: '12px',
};

export function MLTrainingPanel({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [training, setTraining] = useState(false);
  const [mlResult, setMlResult] = useState<MLTrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // candidate targets: numeric with reasonable cardinality, boolean, or low-card categorical
  const candidates = result.columns.filter((c) => {
    if (c.type === 'numeric') return c.uniqueCount > 1 && c.uniqueCount < result.overview.rows * 0.5;
    if (c.type === 'boolean') return true;
    if (c.type === 'categorical' && c.cardinality !== 'high') return c.uniqueCount >= 2 && c.uniqueCount <= 10;
    return false;
  });

  const handleTrain = async () => {
    if (!target) return;
    setTraining(true);
    setError(null);
    setMlResult(null);
    try {
      await new Promise((r) => setTimeout(r, 50)); // let UI paint
      const res = trainModels(result.rows, result.columns, target);
      setMlResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Training failed.');
    } finally {
      setTraining(false);
    }
  };

  return (
    <SectionCard
      icon={FlaskConical}
      title="Optional: Train a Model"
      subtitle="Pick a target column and compare models — runs entirely in your browser"
      action={
        <button onClick={() => setOpen(!open)} className="btn-ghost text-sm">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {open ? 'Hide' : 'Show'}
        </button>
      }
    >
      {open && (
        <div className="animate-fade-in-up">
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No suitable target columns found. Need a numeric, boolean, or low-cardinality categorical column.</p>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end mb-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Target column</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  >
                    <option value="">Select a target…</option>
                    {candidates.map((c) => (
                      <option key={c.name} value={c.name}>
                        {titleCase(c.name)} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleTrain}
                  disabled={!target || training}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {training ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                  {training ? 'Training…' : 'Train models'}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-200 text-sm text-error-700 mb-4">
                  {error}
                </div>
              )}

              {mlResult && <MLResults result={mlResult} />}
            </>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function MLResults({ result }: { result: MLTrainingResult }) {
  const chartData = result.models.map((m) => ({
    name: m.name,
    train: Number((m.trainScore * 100).toFixed(1)),
    test: Number((m.testScore * 100).toFixed(1)),
  }));
  const importanceData = result.featureImportances.slice(0, 8).map((f) => ({
    name: titleCase(f.feature),
    importance: Number((f.importance * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-success-700">
        <CheckCircle2 className="w-4 h-4" />
        Trained {result.models.length} models for {result.taskType} on target "{titleCase(result.target)}".
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Model comparison ({result.models[0]?.metric})</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.05)' }} formatter={(v) => `${v}%`} />
              <Bar dataKey="train" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="test" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {importanceData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Top feature importance</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importanceData} layout="vertical" margin={{ top: 8, right: 16, left: 20, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} width={100} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.05)' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {importanceData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? '#2563eb' : '#0891b2'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {result.confusion && result.confusion.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Confusion matrix</h4>
          <div className="overflow-auto scrollbar-thin rounded-xl border border-slate-200">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-slate-500">Actual</th>
                  <th className="px-3 py-2 text-left text-slate-500">Predicted</th>
                  <th className="px-3 py-2 text-right text-slate-500">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.confusion.map((c, i) => (
                  <tr key={i} className="hover:bg-primary-50/40">
                    <td className="px-3 py-1.5 text-slate-600">{c.actual}</td>
                    <td className="px-3 py-1.5 text-slate-600">{c.predicted}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-slate-800">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export formatNumber for potential external use
export { formatNumber };
