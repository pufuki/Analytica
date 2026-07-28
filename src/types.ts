export type ColumnType = 'numeric' | 'categorical' | 'boolean' | 'datetime';

export interface ColumnInfo {
  name: string;
  type: ColumnType;
  uniqueCount: number;
  missingCount: number;
  missingPct: number;
  // numeric-only
  stats?: NumericStats;
  // categorical-only
  topValues?: { value: string; count: number }[];
  cardinality?: 'low' | 'medium' | 'high';
  isConstant?: boolean;
}

export interface NumericStats {
  mean: number;
  median: number;
  mode: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  iqr: number;
  count: number;
}

export interface DatasetOverview {
  rows: number;
  columns: number;
  memoryBytes: number;
  columnNames: string[];
  columnTypes: Record<string, ColumnType>;
  duplicateRows: number;
  missingValues: number;
  totalCells: number;
  fileSizeBytes: number;
  preview: Record<string, string>[];
}

export interface QualityIssue {
  column: string;
  issue: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion: string;
}

export interface QualityReport {
  missingValues: number;
  missingPct: number;
  duplicateRows: number;
  constantColumns: string[];
  highCardinalityColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  booleanColumns: string[];
  datetimeColumns: string[];
  issues: QualityIssue[];
  cleanupSuggestions: string[];
}

export interface CorrelationPair {
  a: string;
  b: string;
  value: number;
  strength: 'strong-positive' | 'strong-negative' | 'moderate-positive' | 'moderate-negative' | 'weak' | 'none';
}

export interface CorrelationResult {
  columns: string[];
  matrix: number[][];
  pairs: CorrelationPair[];
}

export interface OutlierColumn {
  column: string;
  count: number;
  pct: number;
  lowerBound: number;
  upperBound: number;
  values: number[];
}

export interface OutlierReport {
  columns: OutlierColumn[];
  totalOutliers: number;
}

export interface ChartSpec {
  id: string;
  title: string;
  description: string;
  type: 'histogram' | 'bar' | 'box' | 'scatter' | 'pie' | 'frequency';
  column?: string;
  xColumn?: string;
  yColumn?: string;
  data: Record<string, string | number>[];
  color: string;
}

export interface InsightSection {
  title: string;
  body: string;
  icon?: string;
}

export interface AISummary {
  executiveSummary: string;
  datasetDescription: string;
  importantVariables: string[];
  patterns: string[];
  interestingFindings: string[];
  businessInsights: string[];
  potentialRisks: string[];
  recommendations: string[];
  suggestedMLTasks: MLTaskRecommendation[];
  futureAnalyses: string[];
}

export interface MLTaskRecommendation {
  task: string;
  reason: string;
  targetCandidates: string[];
}

export interface AnalysisResult {
  overview: DatasetOverview;
  columns: ColumnInfo[];
  quality: QualityReport;
  correlation: CorrelationResult;
  outliers: OutlierReport;
  charts: ChartSpec[];
  ai: AISummary;
  fileName: string;
  fileSizeBytes: number;
  rows: Record<string, string>[];
}

export interface ModelMetrics {
  name: string;
  trainScore: number;
  testScore: number;
  metric: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface MLTrainingResult {
  taskType: 'regression' | 'classification';
  target: string;
  features: string[];
  models: ModelMetrics[];
  featureImportances: FeatureImportance[];
  predictions?: { actual: number; predicted: number }[];
  confusion?: { actual: string; predicted: string; count: number }[];
  classes?: string[];
}

export interface DemoDataset {
  id: string;
  name: string;
  description: string;
  icon: string;
  rows: number;
  columns: number;
  csv: string;
}
