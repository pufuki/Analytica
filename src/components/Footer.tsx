import { Sparkles, ShieldCheck, Github, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/60 bg-white/40 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-slate-900">Analytica AI</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI-powered CSV analysis that runs entirely in your browser. No accounts, no servers, no data stored.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Features</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li>Dataset overview &amp; quality report</li>
              <li>Statistics &amp; correlations</li>
              <li>Outlier detection &amp; visualizations</li>
              <li>AI insights &amp; ML recommendations</li>
              <li>Optional model training &amp; PDF export</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success-500" /> Privacy
            </h4>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your CSV never leaves your browser. All parsing, analysis, and insights are computed locally and discarded when you close the tab.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            Built with <Heart className="w-3.5 h-3.5 text-error-400" /> using React, Recharts &amp; TailwindCSS
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Github className="w-4 h-4" />
            <span>Analytica AI © {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
