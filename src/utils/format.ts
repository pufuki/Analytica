// Format a byte count into a human-readable string.
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format a number with thousands separators and fixed decimals.
export function formatNumber(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

// Format a number as a percentage.
export function formatPct(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(decimals)}%`;
}

// Format a number compactly (e.g. 1.2K).
export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

// Title-case a snake_case string.
export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Truncate a string to a max length with ellipsis.
export function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

// Classify a correlation value into a strength bucket.
export function correlationStrength(v: number): string {
  const a = Math.abs(v);
  if (a >= 0.7) return v > 0 ? 'strong-positive' : 'strong-negative';
  if (a >= 0.4) return v > 0 ? 'moderate-positive' : 'moderate-negative';
  if (a >= 0.2) return 'weak';
  return 'none';
}

// Human-readable label for a correlation strength.
export function correlationLabel(strength: string): string {
  const map: Record<string, string> = {
    'strong-positive': 'Strong Positive',
    'strong-negative': 'Strong Negative',
    'moderate-positive': 'Moderate Positive',
    'moderate-negative': 'Moderate Negative',
    weak: 'Weak',
    none: 'Negligible',
  };
  return map[strength] ?? strength;
}
