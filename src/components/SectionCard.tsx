import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function SectionCard({ icon: Icon, title, subtitle, children, className = '', action }: SectionCardProps) {
  return (
    <section className={`card animate-fade-in-up ${className}`}>
      <header className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="section-title">{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
