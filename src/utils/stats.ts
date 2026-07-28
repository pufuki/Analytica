import type { NumericStats } from '@/types';

// Parse a cell value into a number, returning null if not numeric.
export function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/[$,€£%]/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Parse a value as a boolean (true/false, yes/no, 1/0).
export function toBool(v: unknown): boolean | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v;
  const s = String(v).trim().toLowerCase();
  if (['true', 'yes', 'y', '1'].includes(s)) return true;
  if (['false', 'no', 'n', '0'].includes(s)) return false;
  return null;
}

// Parse a value as a Date, returning null if not parseable.
export function toDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  if (s === '') return null;
  // ISO or common formats
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d;
  // Try DD/MM/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    const day = Number(m[1]);
    const mon = Number(m[2]) - 1;
    let yr = Number(m[3]);
    if (yr < 100) yr += 2000;
    const dd = new Date(yr, mon, day);
    if (!Number.isNaN(dd.getTime())) return dd;
  }
  return null;
}

// Extract numeric values from a column array, filtering nulls.
export function numericValues(col: unknown[]): number[] {
  const out: number[] = [];
  for (const v of col) {
    const n = toNumber(v);
    if (n !== null) out.push(n);
  }
  return out;
}

// Mean of an array.
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Median (sorted copy).
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

// Mode (first most frequent value).
export function mode(arr: number[]): number {
  if (arr.length === 0) return 0;
  const counts = new Map<number, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = arr[0];
  let bestCount = 0;
  for (const [v, c] of counts) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

// Variance (population).
export function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  return arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length;
}

// Standard deviation (population).
export function std(arr: number[]): number {
  return Math.sqrt(variance(arr));
}

// Quantile via linear interpolation.
export function quantile(arr: number[], q: number): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return s[base + 1] !== undefined ? s[base] + rest * (s[base + 1] - s[base]) : s[base];
}

// Skewness (Fisher-Pearson, adjusted).
export function skewness(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  const sum = arr.reduce((a, b) => a + ((b - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

// Excess kurtosis.
export function kurtosis(arr: number[]): number {
  if (arr.length < 4) return 0;
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return 0;
  const n = arr.length;
  const sum = arr.reduce((a, b) => a + ((b - m) / s) ** 4, 0);
  return (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum - (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
}

// Full descriptive statistics for a numeric column.
export function describeNumeric(values: number[]): NumericStats {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  return {
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    std: std(values),
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
    q1,
    q3,
    variance: variance(values),
    skewness: skewness(values),
    kurtosis: kurtosis(values),
    iqr: q3 - q1,
    count: values.length,
  };
}

// Pearson correlation between two numeric arrays (aligned, non-null pairs).
export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma;
    const y = b[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const den = Math.sqrt(da * db);
  return den === 0 ? 0 : num / den;
}

// Linear regression slope + intercept (least squares).
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { slope: 0, intercept: mean(y) };
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: my - slope * mx };
}

// Standardize (z-score) an array in place.
export function standardize(arr: number[]): number[] {
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return arr.map(() => 0);
  return arr.map((v) => (v - m) / s);
}
