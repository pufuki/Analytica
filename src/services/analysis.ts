import type {
  ChartSpec,
  ColumnInfo,
  CorrelationPair,
  CorrelationResult,
  DatasetOverview,
  OutlierColumn,
  OutlierReport,
  QualityIssue,
  QualityReport,
} from '@/types';
import { describeNumeric, mean, numericValues, pearson, quantile, toNumber } from '@/utils/stats';
import { correlationStrength, titleCase } from '@/utils/format';
import { inferColumnType, type ParsedCSV } from '@/utils/csv';

const CHART_COLORS = [
  '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626',
  '#7c3aed', '#db2777', '#0d9488', '#ea580c', '#4f46e5',
];

// Build per-column metadata + statistics.
function buildColumns(parsed: ParsedCSV): ColumnInfo[] {
  return parsed.headers.map((name) => {
    const values = parsed.rows.map((r) => r[name]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
    const type = inferColumnType(name, values);
    const uniqueCount = new Set(nonNull.map((v) => String(v))).size;
    const missingCount = values.length - nonNull.length;
    const missingPct = values.length ? missingCount / values.length : 0;

    const info: ColumnInfo = {
      name,
      type,
      uniqueCount,
      missingCount,
      missingPct,
    };

    if (type === 'numeric') {
      const nums = numericValues(values);
      info.stats = describeNumeric(nums);
    } else {
      // top values for categorical/boolean/datetime
      const counts = new Map<string, number>();
      for (const v of nonNull) {
        const key = String(v);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      info.topValues = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, count]) => ({ value, count }));
      info.isConstant = uniqueCount <= 1;
      info.cardinality =
        uniqueCount <= 5 ? 'low' : uniqueCount <= 50 ? 'medium' : 'high';
    }
    return info;
  });
}

// Build the dataset overview.
function buildOverview(parsed: ParsedCSV, columns: ColumnInfo[]): DatasetOverview {
  const columnTypes: Record<string, typeof columns[number]['type']> = {};
  for (const c of columns) columnTypes[c.name] = c.type;

  const seen = new Set<string>();
  let duplicateRows = 0;
  for (const r of parsed.rows) {
    const key = JSON.stringify(r);
    if (seen.has(key)) duplicateRows++;
    else seen.add(key);
  }

  let missingValues = 0;
  for (const c of columns) missingValues += c.missingCount;

  // rough memory estimate
  const memoryBytes = parsed.rawText.length;

  return {
    rows: parsed.rows.length,
    columns: parsed.headers.length,
    memoryBytes,
    columnNames: parsed.headers,
    columnTypes,
    duplicateRows,
    missingValues,
    totalCells: parsed.rows.length * parsed.headers.length,
    fileSizeBytes: parsed.fileSizeBytes,
    preview: parsed.rows.slice(0, 20),
  };
}

// Build the data quality report.
function buildQuality(parsed: ParsedCSV, columns: ColumnInfo[]): QualityReport {
  const issues: QualityIssue[] = [];
  const suggestions: string[] = [];

  const numericColumns = columns.filter((c) => c.type === 'numeric').map((c) => c.name);
  const categoricalColumns = columns.filter((c) => c.type === 'categorical').map((c) => c.name);
  const booleanColumns = columns.filter((c) => c.type === 'boolean').map((c) => c.name);
  const datetimeColumns = columns.filter((c) => c.type === 'datetime').map((c) => c.name);

  const constantColumns = columns.filter((c) => c.isConstant).map((c) => c.name);
  const highCardinalityColumns = columns
    .filter((c) => c.cardinality === 'high')
    .map((c) => c.name);

  let missingValues = 0;
  for (const c of columns) {
    if (c.missingCount > 0) {
      missingValues += c.missingCount;
      const severity = c.missingPct > 0.3 ? 'critical' : c.missingPct > 0.1 ? 'warning' : 'info';
      issues.push({
        column: c.name,
        issue: `${(c.missingPct * 100).toFixed(1)}% missing values`,
        severity,
        suggestion:
          c.missingPct > 0.3
            ? `Consider dropping "${c.name}" or imputing with ${c.type === 'numeric' ? 'median' : 'mode'}.`
            : `Impute missing values in "${c.name}" with ${c.type === 'numeric' ? 'median' : 'most frequent category'}.`,
      });
    }
  }

  for (const name of constantColumns) {
    issues.push({
      column: name,
      issue: 'Constant column (no variance)',
      severity: 'info',
      suggestion: `Column "${name}" has a single value and adds no information — consider dropping it.`,
    });
  }
  for (const name of highCardinalityColumns) {
    issues.push({
      column: name,
      issue: 'High cardinality',
      severity: 'warning',
      suggestion: `Column "${name}" has many unique values. If it's an ID, exclude it from modeling; if categorical, consider grouping rare categories.`,
    });
  }

  // duplicate rows
  const dupRows = buildOverview(parsed, columns).duplicateRows;
  if (dupRows > 0) {
    issues.push({
      column: '(entire row)',
      issue: `${dupRows} duplicate rows`,
      severity: 'warning',
      suggestion: 'Remove duplicate rows to avoid biasing analyses and models.',
    });
  }

  // build cleanup suggestions list
  if (missingValues > 0) suggestions.push('Handle missing values via imputation or row removal.');
  if (dupRows > 0) suggestions.push(`Remove ${dupRows} duplicate rows.`);
  if (constantColumns.length) suggestions.push(`Drop constant columns: ${constantColumns.join(', ')}.`);
  if (highCardinalityColumns.length) suggestions.push('Review high-cardinality columns before encoding.');
  if (suggestions.length === 0) suggestions.push('No major data quality issues detected. Dataset looks clean.');

  return {
    missingValues,
    missingPct: parsed.rows.length * parsed.headers.length
      ? missingValues / (parsed.rows.length * parsed.headers.length)
      : 0,
    duplicateRows: dupRows,
    constantColumns,
    highCardinalityColumns,
    numericColumns,
    categoricalColumns,
    booleanColumns,
    datetimeColumns,
    issues,
    cleanupSuggestions: suggestions,
  };
}

// Build the correlation matrix across numeric columns.
function buildCorrelation(parsed: ParsedCSV, columns: ColumnInfo[]): CorrelationResult {
  const numericCols = columns.filter((c) => c.type === 'numeric').map((c) => c.name);
  if (numericCols.length < 2) {
    return { columns: numericCols, matrix: [], pairs: [] };
  }

  // aligned numeric arrays
  const colArrays: Record<string, number[]> = {};
  for (const name of numericCols) {
    colArrays[name] = parsed.rows.map((r) => toNumber(r[name]) ?? NaN);
  }

  const matrix: number[][] = [];
  for (let i = 0; i < numericCols.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < numericCols.length; j++) {
      if (i === j) {
        row.push(1);
      } else {
        // pair-wise non-null
        const a = colArrays[numericCols[i]];
        const b = colArrays[numericCols[j]];
        const pairs: [number, number][] = [];
        for (let k = 0; k < a.length; k++) {
          if (!Number.isNaN(a[k]) && !Number.isNaN(b[k])) pairs.push([a[k], b[k]]);
        }
        row.push(pairs.length > 1 ? pearson(pairs.map((p) => p[0]), pairs.map((p) => p[1])) : 0);
      }
    }
    matrix.push(row);
  }

  // top pairs
  const pairs: CorrelationPair[] = [];
  for (let i = 0; i < numericCols.length; i++) {
    for (let j = i + 1; j < numericCols.length; j++) {
      const v = matrix[i][j];
      if (Math.abs(v) >= 0.2) {
        pairs.push({
          a: numericCols[i],
          b: numericCols[j],
          value: v,
          strength: correlationStrength(v) as CorrelationPair['strength'],
        });
      }
    }
  }
  pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return { columns: numericCols, matrix, pairs };
}

// Detect outliers per numeric column using IQR.
function buildOutliers(parsed: ParsedCSV, columns: ColumnInfo[]): OutlierReport {
  const result: OutlierColumn[] = [];
  let totalOutliers = 0;

  for (const col of columns) {
    if (col.type !== 'numeric' || !col.stats) continue;
    const values = numericValues(parsed.rows.map((r) => r[col.name]));
    if (values.length < 4) continue;

    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const outliers = values.filter((v) => v < lower || v > upper);
    if (outliers.length > 0) {
      totalOutliers += outliers.length;
      result.push({
        column: col.name,
        count: outliers.length,
        pct: outliers.length / values.length,
        lowerBound: lower,
        upperBound: upper,
        values: outliers.slice(0, 20),
      });
    }
  }

  result.sort((a, b) => b.count - a.count);
  return { columns: result, totalOutliers };
}

// Build histogram bins for a numeric column.
function histogramBins(values: number[], bins = 12): { bin: string; count: number }[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ bin: String(min), count: values.length }];
  const width = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }
  return counts.map((count, i) => ({
    bin: `${(min + i * width).toFixed(1)}`,
    count,
  }));
}

// Build chart specs automatically from the dataset.
function buildCharts(parsed: ParsedCSV, columns: ColumnInfo[], correlation: CorrelationResult): ChartSpec[] {
  const charts: ChartSpec[] = [];
  let colorIdx = 0;
  const nextColor = () => CHART_COLORS[colorIdx++ % CHART_COLORS.length];

  const numericCols = columns.filter((c) => c.type === 'numeric');
  const categoricalCols = columns.filter((c) => c.type === 'categorical' && c.cardinality !== 'high');
  const booleanCols = columns.filter((c) => c.type === 'boolean');

  // Histograms for numeric columns (limit to 6)
  for (const col of numericCols.slice(0, 6)) {
    const values = numericValues(parsed.rows.map((r) => r[col.name]));
    charts.push({
      id: `hist-${col.name}`,
      title: `Distribution of ${titleCase(col.name)}`,
      description: 'Histogram showing the frequency distribution of values.',
      type: 'histogram',
      column: col.name,
      data: histogramBins(values),
      color: nextColor(),
    });
  }

  // Box plots for numeric columns (limit to 8 in one chart)
  if (numericCols.length > 0) {
    const boxData = numericCols.slice(0, 8).map((col) => {
      const values = numericValues(parsed.rows.map((r) => r[col.name]));
      const sorted = [...values].sort((a, b) => a - b);
      return {
        column: titleCase(col.name),
        min: quantile(sorted, 0),
        q1: quantile(sorted, 0.25),
        median: quantile(sorted, 0.5),
        q3: quantile(sorted, 0.75),
        max: quantile(sorted, 1),
      };
    });
    charts.push({
      id: 'box-all',
      title: 'Box Plots — Numeric Columns',
      description: 'Box plots showing quartiles, range, and potential outliers.',
      type: 'box',
      data: boxData,
      color: nextColor(),
    });
  }

  // Bar charts for categorical columns (limit to 4)
  for (const col of categoricalCols.slice(0, 4)) {
    const counts = new Map<string, number>();
    for (const r of parsed.rows) {
      const v = r[col.name];
      if (v !== '' && v !== null && v !== undefined) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    const data = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([value, count]) => ({ value, count }));
    charts.push({
      id: `bar-${col.name}`,
      title: `Count by ${titleCase(col.name)}`,
      description: 'Bar chart of category frequencies.',
      type: 'bar',
      column: col.name,
      data,
      color: nextColor(),
    });
  }

  // Pie charts for boolean / low-cardinality categorical (limit to 3)
  const pieCols = [...booleanCols, ...categoricalCols.filter((c) => c.cardinality === 'low')].slice(0, 3);
  for (const col of pieCols) {
    const counts = new Map<string, number>();
    for (const r of parsed.rows) {
      const v = r[col.name];
      if (v !== '' && v !== null && v !== undefined) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
    const data = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([value, count]) => ({ value, count }));
    charts.push({
      id: `pie-${col.name}`,
      title: `Proportion of ${titleCase(col.name)}`,
      description: 'Pie chart showing the share of each category.',
      type: 'pie',
      column: col.name,
      data,
      color: nextColor(),
    });
  }

  // Scatter plot for top correlated pair
  if (correlation.pairs.length > 0 && Math.abs(correlation.pairs[0].value) >= 0.2) {
    const top = correlation.pairs[0];
    const data: Record<string, string | number>[] = [];
    for (const r of parsed.rows) {
      const x = toNumber(r[top.a]);
      const y = toNumber(r[top.b]);
      if (x !== null && y !== null) data.push({ x, y });
    }
    // sample if too many points
    const sampled = data.length > 500 ? data.filter((_, i) => i % Math.ceil(data.length / 500) === 0) : data;
    charts.push({
      id: `scatter-${top.a}-${top.b}`,
      title: `Scatter: ${titleCase(top.a)} vs ${titleCase(top.b)}`,
      description: `Scatter plot of the strongest correlated pair (r=${top.value.toFixed(2)}).`,
      type: 'scatter',
      xColumn: top.a,
      yColumn: top.b,
      data: sampled,
      color: nextColor(),
    });
  }

  return charts;
}

// Run the full analysis pipeline on parsed CSV data.
export function analyzeDataset(parsed: ParsedCSV): {
  overview: DatasetOverview;
  columns: ColumnInfo[];
  quality: QualityReport;
  correlation: CorrelationResult;
  outliers: OutlierReport;
  charts: ChartSpec[];
} {
  const columns = buildColumns(parsed);
  const overview = buildOverview(parsed, columns);
  const quality = buildQuality(parsed, columns);
  const correlation = buildCorrelation(parsed, columns);
  const outliers = buildOutliers(parsed, columns);
  const charts = buildCharts(parsed, columns, correlation);
  return { overview, columns, quality, correlation, outliers, charts };
}

// Re-export for convenience
export { mean };
