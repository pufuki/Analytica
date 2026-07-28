import { Sparkles, FileSpreadsheet, BarChart3, BrainCircuit } from 'lucide-react';

export function Hero() {
  return (
    <header className="relative overflow-hidden pt-16 pb-12">
      {/* floating decorative blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl animate-float" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-5xl mx-auto text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          AI-powered CSV analysis, instantly
        </div>

        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 text-balance animate-fade-in-up">
          Analytica{' '}
          <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent">
            AI
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto text-balance animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Upload a CSV and get a complete analytics dashboard — dataset overview, data quality report,
          interactive charts, statistics, correlations, outlier detection, and AI-generated insights.
          No account, no storage, everything in your browser.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <span className="inline-flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4 text-primary-500" /> Drag &amp; drop CSV</span>
          <span className="inline-flex items-center gap-1.5"><BarChart3 className="w-4 h-4 text-accent-500" /> Auto visualizations</span>
          <span className="inline-flex items-center gap-1.5"><BrainCircuit className="w-4 h-4 text-success-500" /> AI insights</span>
        </div>
      </div>
    </header>
  );
}
