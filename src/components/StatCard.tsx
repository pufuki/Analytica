import { type LucideIcon } from 'lucide-react';
import { formatCompact } from '@/utils/format';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'primary' | 'accent' | 'success' | 'warning' | 'error';
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { gradient: string; icon: string }> = {
  primary: { gradient: 'from-primary-500 to-primary-600', icon: 'text-white' },
  accent: { gradient: 'from-accent-500 to-accent-600', icon: 'text-white' },
  success: { gradient: 'from-success-500 to-success-600', icon: 'text-white' },
  warning: { gradient: 'from-warning-500 to-warning-600', icon: 'text-white' },
  error: { gradient: 'from-error-500 to-error-600', icon: 'text-white' },
};

export function StatCard({ icon: Icon, label, value, hint, accent = 'primary' }: StatCardProps) {
  const s = accentStyles[accent];
  return (
    <div className="card card-hover group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${s.icon}`} strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
          <p className="text-2xl font-bold font-display text-slate-900 mt-0.5 truncate">
            {typeof value === 'number' ? formatCompact(value) : value}
          </p>
          {hint && <p className="text-xs text-slate-400 mt-0.5 truncate">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
