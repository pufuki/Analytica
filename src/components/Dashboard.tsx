import { useState } from 'react';
import { Download, RotateCcw, Sparkles } from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { OverviewSection } from './OverviewSection';
import { QualitySection } from './QualitySection';
import { StatisticsSection } from './StatisticsSection';
import { ChartsSection } from './ChartsSection';
import { CorrelationSection } from './CorrelationSection';
import { OutliersSection } from './OutliersSection';
import { AIInsightsSection, RecommendationsSection } from './AISections';
import { MLTrainingPanel } from './MLTrainingPanel';
import { exportReport } from '@/services/pdfExport';

export function Dashboard({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    try {
      exportReport(result);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-slate-900 text-sm truncate">Analytica AI</p>
              <p className="text-xs text-slate-400 truncate">{result.fileName} · analysis complete</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleExport} disabled={exporting} className="btn-primary text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">{exporting ? 'Generating…' : 'Export PDF'}</span>
            </button>
            <button onClick={onReset} className="btn-ghost text-sm">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">New analysis</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        <OverviewSection overview={result.overview} />
        <QualitySection quality={result.quality} />
        <StatisticsSection columns={result.columns} />
        <ChartsSection charts={result.charts} />
        <CorrelationSection correlation={result.correlation} />
        <OutliersSection outliers={result.outliers} />
        <AIInsightsSection ai={result.ai} />
        <RecommendationsSection ai={result.ai} />
        <MLTrainingPanel result={result} />
      </div>
    </div>
  );
}
