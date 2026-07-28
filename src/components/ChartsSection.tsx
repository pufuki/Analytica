import { BarChart3, BarChart2, PieChart, ScatterChart as ScatterIcon, Box } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, ScatterChart, Scatter, Legend,
} from 'recharts';
import type { ChartSpec } from '@/types';
import { SectionCard } from './SectionCard';
import { titleCase } from '@/utils/format';

const PIE_COLORS = ['#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0d9488'];

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(8px)',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
};

function ChartCard({ chart }: { chart: ChartSpec }) {
  return (
    <div className="rounded-xl bg-white/70 border border-slate-200 p-4 hover:shadow-lg transition-all duration-200">
      <h4 className="text-sm font-display font-semibold text-slate-800">{chart.title}</h4>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">{chart.description}</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chart)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(chart: ChartSpec) {
  switch (chart.type) {
    case 'histogram':
    case 'bar':
      return (
        <BarChart data={chart.data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey={chart.type === 'histogram' ? 'bin' : 'value'} tick={{ fontSize: 10, fill: '#64748b' }} angle={chart.data.length > 6 ? -25 : 0} textAnchor={chart.data.length > 6 ? 'end' : 'middle'} height={chart.data.length > 6 ? 60 : 30} />
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
          <Bar dataKey="count" fill={chart.color} radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      );
    case 'pie':
      return (
        <RPieChart>
          <Pie data={chart.data} dataKey="count" nameKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
            {chart.data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
        </RPieChart>
      );
    case 'scatter':
      return (
        <ScatterChart margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="x" name={chart.xColumn} tick={{ fontSize: 10, fill: '#64748b' }} type="number" />
          <YAxis dataKey="y" name={chart.yColumn} tick={{ fontSize: 10, fill: '#64748b' }} type="number" />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }}
            formatter={(v, n) => [Number(v).toFixed(2), titleCase(n === 'x' ? chart.xColumn ?? '' : chart.yColumn ?? '')] as [string, string]} />
          <Scatter data={chart.data} fill={chart.color} fillOpacity={0.6} />
        </ScatterChart>
      );
    case 'box':
      return (
        <BarChart data={chart.data} layout="vertical" margin={{ top: 8, right: 16, left: 40, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
          <YAxis type="category" dataKey="column" tick={{ fontSize: 10, fill: '#64748b' }} width={80} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
          <Bar dataKey="min" fill="#dbeafe" radius={2} stackId="box" maxBarSize={20} />
          <Bar dataKey="q1" fill="#93c5fd" radius={2} stackId="box" maxBarSize={20} />
          <Bar dataKey="median" fill={chart.color} radius={2} stackId="box" maxBarSize={20} />
          <Bar dataKey="q3" fill="#93c5fd" radius={2} stackId="box" maxBarSize={20} />
          <Bar dataKey="max" fill="#dbeafe" radius={2} stackId="box" maxBarSize={20} />
        </BarChart>
      );
    default:
      return <BarChart data={[]} />;
  }
}

export function ChartsSection({ charts }: { charts: ChartSpec[] }) {
  if (charts.length === 0) return null;
  return (
    <SectionCard icon={BarChart3} title="Interactive Visualizations" subtitle="Automatically generated charts based on your data">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {charts.map((chart) => (
          <ChartCard key={chart.id} chart={chart} />
        ))}
      </div>
    </SectionCard>
  );
}
