import type {
  AISummary,
  ColumnInfo,
  CorrelationResult,
  DatasetOverview,
  MLTaskRecommendation,
  OutlierReport,
  QualityReport,
} from '@/types';
import { correlationLabel, formatPct, titleCase } from '@/utils/format';

// Generate the AI-style summary and insights from analysis metadata only.
// This mimics what an LLM would produce given column names, types, stats,
// correlations, missing value report, unique counts, and first rows.
export function generateInsights(
  overview: DatasetOverview,
  columns: ColumnInfo[],
  quality: QualityReport,
  correlation: CorrelationResult,
  outliers: OutlierReport,
  fileName: string,
): AISummary {
  const numericCols = columns.filter((c) => c.type === 'numeric');
  const categoricalCols = columns.filter((c) => c.type === 'categorical');
  const booleanCols = columns.filter((c) => c.type === 'boolean');

  // ---- Executive summary ----
  const execParts: string[] = [];
  execParts.push(
    `The dataset "${fileName}" contains ${overview.rows.toLocaleString()} records across ${overview.columns} columns, ` +
      `comprising ${numericCols.length} numeric, ${categoricalCols.length} categorical, ${booleanCols.length} boolean, ` +
      `and ${quality.datetimeColumns.length} date fields.`,
  );
  if (overview.missingValues > 0) {
    execParts.push(
      `Approximately ${formatPct(quality.missingPct)} of cells are missing, and ${overview.duplicateRows} duplicate rows were detected.`,
    );
  } else {
    execParts.push('No missing values were detected across the dataset.');
  }
  if (correlation.pairs.length > 0) {
    const top = correlation.pairs[0];
    execParts.push(
      `The strongest relationship observed is between ${titleCase(top.a)} and ${titleCase(top.b)} (${correlationLabel(top.strength)}, r=${top.value.toFixed(2)}).`,
    );
  }
  if (outliers.totalOutliers > 0) {
    execParts.push(
      `Statistical outliers were identified in ${outliers.columns.length} numeric column(s), warranting review before modeling.`,
    );
  }
  const executiveSummary = execParts.join(' ');

  // ---- Dataset description ----
  const descParts: string[] = [];
  descParts.push(
    `This dataset appears to contain ${overview.rows.toLocaleString()} observations with ${overview.columns} attributes. ` +
      `The structure suggests a ${guessDomain(columns)} dataset with a mix of numerical measurements and categorical descriptors.`,
  );
  if (quality.highCardinalityColumns.length > 0) {
    descParts.push(
      `Several columns (${quality.highCardinalityColumns.slice(0, 3).map(titleCase).join(', ')}) exhibit high cardinality, ` +
        `likely serving as identifiers or free-text fields.`,
    );
  }
  const datasetDescription = descParts.join(' ');

  // ---- Important variables ----
  const importantVariables: string[] = [];
  // variables with high variance / spread
  const spreadVars = numericCols
    .filter((c) => c.stats && c.stats.std > 0)
    .sort((a, b) => (b.stats?.std ?? 0) - (a.stats?.std ?? 0))
    .slice(0, 5)
    .map((c) => c.name);
  importantVariables.push(...spreadVars);
  // add key categorical columns
  for (const c of categoricalCols.slice(0, 3)) {
    if (!importantVariables.includes(c.name)) importantVariables.push(c.name);
  }
  // add boolean targets
  for (const c of booleanCols.slice(0, 2)) {
    if (!importantVariables.includes(c.name)) importantVariables.push(c.name);
  }

  // ---- Patterns ----
  const patterns: string[] = [];
  for (const pair of correlation.pairs.slice(0, 5)) {
    if (Math.abs(pair.value) < 0.2) continue;
    const dir = pair.value > 0 ? 'increase together' : 'move in opposite directions';
    patterns.push(
      `${titleCase(pair.a)} and ${titleCase(pair.b)} show a ${correlationLabel(pair.strength).toLowerCase()} relationship (r=${pair.value.toFixed(2)}): as one changes, the other tends to ${dir}.`,
    );
  }
  if (patterns.length === 0) {
    patterns.push('No strong linear correlations were detected among the numeric variables.');
  }

  // ---- Interesting findings ----
  const interestingFindings: string[] = [];
  // most skewed column
  const skewed = numericCols
    .filter((c) => c.stats)
    .sort((a, b) => Math.abs(b.stats?.skewness ?? 0) - Math.abs(a.stats?.skewness ?? 0))[0];
  if (skewed && skewed.stats && Math.abs(skewed.stats.skewness) > 0.5) {
    const dir = skewed.stats.skewness > 0 ? 'right' : 'left';
    interestingFindings.push(
      `${titleCase(skewed.name)} is ${dir}-skewed (skewness=${skewed.stats.skewness.toFixed(2)}), indicating an asymmetric distribution that may need transformation.`,
    );
  }
  // columns with most missingness
  const mostMissing = [...columns].sort((a, b) => b.missingPct - a.missingPct)[0];
  if (mostMissing && mostMissing.missingPct > 0) {
    interestingFindings.push(
      `${titleCase(mostMissing.name)} has the highest rate of missing values at ${formatPct(mostMissing.missingPct)}.`,
    );
  }
  // constant columns
  if (quality.constantColumns.length > 0) {
    interestingFindings.push(
      `${quality.constantColumns.map(titleCase).join(', ')} contain${quality.constantColumns.length === 1 ? 's' : ''} a single value and provide no discriminative power.`,
    );
  }
  // high cardinality
  if (quality.highCardinalityColumns.length > 0) {
    interestingFindings.push(
      `${quality.highCardinalityColumns.map(titleCase).join(', ')} ha${quality.highCardinalityColumns.length === 1 ? 's' : 've'} very high cardinality, suggesting identifier-like behavior.`,
    );
  }
  if (interestingFindings.length === 0) {
    interestingFindings.push('The dataset is relatively well-balanced with no extreme distributional anomalies.');
  }

  // ---- Business insights ----
  const businessInsights: string[] = [];
  for (const pair of correlation.pairs.slice(0, 3)) {
    if (Math.abs(pair.value) < 0.3) continue;
    const sign = pair.value > 0 ? 'positively' : 'negatively';
    businessInsights.push(
      `${titleCase(pair.a)} is ${sign} correlated with ${titleCase(pair.b)} (r=${pair.value.toFixed(2)}). ` +
        `This relationship can inform forecasting, segmentation, or targeting strategies.`,
    );
  }
  // missingness business impact
  if (quality.missingPct > 0.05) {
    businessInsights.push(
      `With ${formatPct(quality.missingPct)} overall missingness, decisions based on incomplete records may be biased. Prioritize data collection for the most affected fields.`,
    );
  }
  // duplicate impact
  if (overview.duplicateRows > 0) {
    businessInsights.push(
      `${overview.duplicateRows} duplicate rows (${formatPct(overview.duplicateRows / overview.rows)}) could inflate metrics and should be de-duplicated before reporting.`,
    );
  }
  if (businessInsights.length === 0) {
    businessInsights.push('The dataset is clean and ready for direct analytical use.');
  }

  // ---- Potential risks ----
  const potentialRisks: string[] = [];
  if (quality.missingPct > 0.1) {
    potentialRisks.push(
      'High missingness in several columns may bias models and summary statistics if not handled explicitly.',
    );
  }
  if (outliers.totalOutliers > overview.rows * 0.05) {
    potentialRisks.push(
      `Outliers comprise more than 5% of records in some columns and may distort mean-based metrics and regressions.`,
    );
  }
  if (overview.duplicateRows > overview.rows * 0.02) {
    potentialRisks.push('Duplicate records can skew aggregate metrics and model training if not removed.');
  }
  if (quality.highCardinalityColumns.length > 0) {
    potentialRisks.push(
      'High-cardinality columns risk overfitting if one-hot encoded without grouping or regularization.',
    );
  }
  if (potentialRisks.length === 0) {
    potentialRisks.push('No significant data quality risks were identified.');
  }

  // ---- Recommendations ----
  const recommendations: string[] = [];
  if (quality.missingPct > 0) {
    recommendations.push('Impute missing values using median (numeric) or mode (categorical), or drop rows if missingness is low.');
  }
  if (overview.duplicateRows > 0) {
    recommendations.push(`Remove ${overview.duplicateRows} duplicate rows before further analysis.`);
  }
  if (quality.constantColumns.length > 0) {
    recommendations.push(`Drop constant columns (${quality.constantColumns.join(', ')}) to reduce dimensionality.`);
  }
  if (skewed && skewed.stats && Math.abs(skewed.stats.skewness) > 1) {
    recommendations.push(
      `Apply a log or Box-Cox transformation to ${titleCase(skewed.name)} to reduce skewness before modeling.`,
    );
  }
  if (outliers.totalOutliers > 0) {
    recommendations.push('Investigate outliers — cap, transform, or remove them depending on domain validity.');
  }
  recommendations.push('Encode categorical variables with target or one-hot encoding prior to supervised learning.');
  if (recommendations.length === 0) {
    recommendations.push('Proceed with exploratory analysis and modeling — the dataset is in good shape.');
  }

  // ---- Suggested ML tasks ----
  const suggestedMLTasks = recommendMLTasks(columns, correlation, quality);

  // ---- Future analyses ----
  const futureAnalyses: string[] = [];
  futureAnalyses.push('Perform feature engineering to derive ratios, aggregates, or time-based features.');
  if (quality.datetimeColumns.length > 0) {
    futureAnalyses.push('Conduct a time-series decomposition and seasonality analysis on date-indexed metrics.');
  }
  if (numericCols.length >= 3) {
    futureAnalyses.push('Apply PCA or t-SNE to visualize high-dimensional structure and clusters.');
  }
  futureAnalyses.push('Build a supervised model once a target variable is selected, and validate with cross-validation.');
  if (categoricalCols.length >= 2) {
    futureAnalyses.push('Run association-rule mining between categorical variables to discover co-occurrence patterns.');
  }

  return {
    executiveSummary,
    datasetDescription,
    importantVariables: importantVariables.map(titleCase),
    patterns,
    interestingFindings,
    businessInsights,
    potentialRisks,
    recommendations,
    suggestedMLTasks,
    futureAnalyses,
  };
}

// Guess the domain of the dataset from column names.
function guessDomain(columns: ColumnInfo[]): string {
  const names = columns.map((c) => c.name.toLowerCase()).join(' ');
  if (/(employee|salary|department|promotion|resign)/.test(names)) return 'human-resources / workforce';
  if (/(order|customer|product|sales|payment|return)/.test(names)) return 'e-commerce / retail';
  if (/(patient|disease|blood|heart|cholesterol|hospital|treatment)/.test(names)) return 'healthcare';
  if (/(student|grade|exam|study|attendance|school)/.test(names)) return 'education';
  if (/(loan|credit|income|debt|approved|default)/.test(names)) return 'finance / lending';
  return 'business';
}

// Recommend ML tasks based on column types and correlations.
function recommendMLTasks(
  columns: ColumnInfo[],
  correlation: CorrelationResult,
  quality: QualityReport,
): MLTaskRecommendation[] {
  const tasks: MLTaskRecommendation[] = [];
  const numericCols = quality.numericColumns;
  const booleanCols = quality.booleanColumns;
  const lowCardCats = columns
    .filter((c) => c.type === 'categorical' && c.cardinality === 'low')
    .map((c) => c.name);

  // Classification if there's a boolean or low-cardinality target
  const classTargets = [...booleanCols, ...lowCardCats.filter((n) => {
    const col = columns.find((c) => c.name === n);
    return col && col.uniqueCount >= 2 && col.uniqueCount <= 10;
  })];
  if (classTargets.length > 0) {
    tasks.push({
      task: 'Classification',
      reason:
        'The dataset contains boolean or low-cardinality categorical columns that make natural target labels for predicting class membership.',
      targetCandidates: classTargets,
    });
  }

  // Regression if there are multiple numeric columns with correlation
  if (numericCols.length >= 2 && correlation.pairs.some((p) => Math.abs(p.value) >= 0.3)) {
    const regTargets = numericCols.filter((n) => {
      const pair = correlation.pairs.find((p) => p.a === n || p.b === n);
      return pair && Math.abs(pair.value) >= 0.3;
    });
    tasks.push({
      task: 'Regression',
      reason:
        'Several numeric columns show meaningful correlations, making them suitable targets for continuous value prediction.',
      targetCandidates: regTargets.length ? regTargets : numericCols.slice(0, 3),
    });
  }

  // Clustering if there are 3+ numeric columns
  if (numericCols.length >= 3) {
    tasks.push({
      task: 'Clustering',
      reason:
        'With multiple numeric features, unsupervised clustering can reveal natural groupings and customer/patient/employee segments.',
      targetCandidates: [],
    });
  }

  // Anomaly detection if outliers exist
  if (correlation.columns.length >= 2) {
    tasks.push({
      task: 'Anomaly Detection',
      reason:
        'Outlier analysis and multivariate distance methods can flag unusual records for fraud detection or quality control.',
      targetCandidates: [],
    });
  }

  // Time series if datetime columns exist
  if (quality.datetimeColumns.length > 0) {
    tasks.push({
      task: 'Time Series Forecasting',
      reason:
        'The presence of date columns enables temporal aggregation and forecasting of trends and seasonality.',
      targetCandidates: numericCols.slice(0, 3),
    });
  }

  return tasks;
}
