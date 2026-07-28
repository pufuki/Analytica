import {
  BrainCircuit, FileText, KeyRound, TrendingUp, Lightbulb, Sparkles,
  AlertTriangle, Target, Rocket, Telescope, type LucideIcon,
} from 'lucide-react';
import type { AISummary } from '@/types';
import { SectionCard } from './SectionCard';
import { titleCase } from '@/utils/format';

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  items?: string[];
  body?: string;
  accent?: string;
}

function InsightCard({ icon: Icon, title, items, body, accent = 'from-primary-500 to-accent-500' }: InsightCardProps) {
  return (
    <div className="rounded-xl bg-white/70 border border-slate-200 p-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shadow-md`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
        <h4 className="text-sm font-display font-semibold text-slate-800">{title}</h4>
      </div>
      {body && <p className="text-sm text-slate-600 leading-relaxed">{body}</p>}
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-slate-600 flex items-start gap-2 leading-relaxed">
              <span className="text-primary-400 mt-1 flex-shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AIInsightsSection({ ai }: { ai: AISummary }) {
  return (
    <div className="space-y-6">
      <SectionCard icon={BrainCircuit} title="AI Executive Summary" subtitle="Generated from dataset metadata — no raw data leaves your browser">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InsightCard icon={FileText} title="Executive Summary" body={ai.executiveSummary} accent="from-primary-500 to-primary-700" />
          <InsightCard icon={Sparkles} title="Dataset Description" body={ai.datasetDescription} accent="from-accent-500 to-accent-700" />
        </div>
      </SectionCard>

      <SectionCard icon={Lightbulb} title="AI Insights" subtitle="Patterns, findings, and business interpretation">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InsightCard icon={KeyRound} title="Important Variables" items={ai.importantVariables.map(titleCase)} accent="from-primary-500 to-accent-500" />
          <InsightCard icon={TrendingUp} title="Patterns" items={ai.patterns} accent="from-success-500 to-accent-500" />
          <InsightCard icon={Sparkles} title="Interesting Findings" items={ai.interestingFindings} accent="from-warning-500 to-primary-500" />
          <InsightCard icon={Target} title="Business Insights" items={ai.businessInsights} accent="from-primary-500 to-success-500" />
          <InsightCard icon={AlertTriangle} title="Potential Risks" items={ai.potentialRisks} accent="from-error-500 to-warning-500" />
          <InsightCard icon={Telescope} title="Future Analyses" items={ai.futureAnalyses} accent="from-accent-500 to-primary-500" />
        </div>
      </SectionCard>
    </div>
  );
}

export function RecommendationsSection({ ai }: { ai: AISummary }) {
  return (
    <div className="space-y-6">
      <SectionCard icon={Rocket} title="Recommendations" subtitle="Actionable next steps to improve data quality and analysis">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ai.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-primary-50/80 to-accent-50/80 border border-primary-100">
              <div className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard icon={Target} title="Machine Learning Recommendations" subtitle="Suggested modeling approaches — no models are trained automatically">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ai.suggestedMLTasks.map((task, i) => (
            <div key={i} className="rounded-xl bg-white/70 border border-slate-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-md">
                  <BrainCircuit className="w-4 h-4 text-white" strokeWidth={2.2} />
                </div>
                <h4 className="text-sm font-display font-semibold text-slate-800">{task.task}</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{task.reason}</p>
              {task.targetCandidates.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1.5">Candidate targets:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.targetCandidates.map((t) => (
                      <span key={t} className="badge bg-primary-50 text-primary-700">{titleCase(t)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
