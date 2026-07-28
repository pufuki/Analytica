import { Users, ShoppingCart, HeartPulse, GraduationCap, Landmark, type LucideIcon } from 'lucide-react';
import type { DemoDataset } from '@/types';
import { getDemoDatasets } from '@/services/demoData';

const iconMap: Record<string, LucideIcon> = {
  Users,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Landmark,
};

interface DemoDatasetGalleryProps {
  onSelect: (csv: string, fileName: string) => void;
  disabled?: boolean;
}

export function DemoDatasetGallery({ onSelect, disabled }: DemoDatasetGalleryProps) {
  const datasets = getDemoDatasets();
  return (
    <div className="max-w-5xl mx-auto px-4 mt-10">
      <div className="text-center mb-6">
        <h3 className="font-display text-xl font-bold text-slate-900">Try a demo dataset</h3>
        <p className="text-sm text-slate-500 mt-1">No CSV handy? Explore a built-in sample — analyzed the same way as your upload.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d) => {
          const Icon = iconMap[d.icon] ?? Users;
          return (
            <button
              key={d.id}
              disabled={disabled}
              onClick={() => onSelect(d.csv, `${d.id}.csv`)}
              className="card card-hover text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5.5 h-5.5 text-white" strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-semibold text-slate-900 leading-tight">{d.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="badge bg-primary-50 text-primary-700">{d.rows.toLocaleString()} rows</span>
                    <span className="badge bg-accent-50 text-accent-700">{d.columns} cols</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
