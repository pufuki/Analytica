import type { ColumnInfo, MLTrainingResult, ModelMetrics, FeatureImportance } from '@/types';
import { linearRegression, mean, standardize, toNumber, toBool } from '@/utils/stats';

// Split indices into train/test with a deterministic shuffle.
function trainTestSplit(n: number, testRatio: number, seed = 42): { train: number[]; test: number[] } {
  const indices = Array.from({ length: n }, (_, i) => i);
  let a = seed;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const cut = Math.floor(n * testRatio);
  return { test: indices.slice(0, cut), train: indices.slice(cut) };
}

// Build a feature matrix from selected columns, one-hot encoding categoricals.
function buildFeatures(
  rows: Record<string, string>[],
  featureCols: ColumnInfo[],
): { X: number[][]; featureNames: string[] } {
  const featureNames: string[] = [];
  // determine encoding plan
  const plan: { col: ColumnInfo; numeric: boolean; categories: string[] }[] = [];
  for (const col of featureCols) {
    if (col.type === 'numeric') {
      plan.push({ col, numeric: true, categories: [] });
      featureNames.push(col.name);
    } else if (col.type === 'boolean') {
      plan.push({ col, numeric: false, categories: ['No', 'Yes'] });
      featureNames.push(col.name);
    } else {
      const cats = (col.topValues ?? []).slice(0, 8).map((t) => t.value);
      plan.push({ col, numeric: false, categories: cats });
      for (const c of cats) featureNames.push(`${col.name}_${c}`);
    }
  }

  const X: number[][] = [];
  for (const row of rows) {
    const feats: number[] = [];
    for (const p of plan) {
      if (p.numeric) {
        feats.push(toNumber(row[p.col.name]) ?? 0);
      } else {
        const val = String(row[p.col.name] ?? '');
        if (p.col.type === 'boolean') {
          feats.push(toBool(val) ? 1 : 0);
        } else {
          for (const c of p.categories) feats.push(val === c ? 1 : 0);
        }
      }
    }
    X.push(feats);
  }
  return { X, featureNames };
}

// Standardize columns of a matrix (return means + stds for reuse).
function fitStandardize(X: number[][]): { means: number[]; stds: number[] } {
  const d = X[0]?.length ?? 0;
  const means = new Array(d).fill(0);
  const stds = new Array(d).fill(1);
  for (let j = 0; j < d; j++) {
    const col = X.map((r) => r[j]);
    means[j] = mean(col);
    stds[j] = Math.sqrt(col.reduce((a, b) => a + (b - means[j]) ** 2, 0) / col.length) || 1;
  }
  return { means, stds };
}

function applyStandardize(X: number[][], means: number[], stds: number[]): number[][] {
  return X.map((r) => r.map((v, j) => (v - means[j]) / stds[j]));
}

// R^2 score.
function r2Score(actual: number[], pred: number[]): number {
  const m = mean(actual);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < actual.length; i++) {
    ssRes += (actual[i] - pred[i]) ** 2;
    ssTot += (actual[i] - m) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

// Mean squared error.
function mse(actual: number[], pred: number[]): number {
  return actual.reduce((a, b, i) => a + (b - pred[i]) ** 2, 0) / actual.length;
}

// Accuracy.
function accuracy(actual: number[], pred: number[]): number {
  let correct = 0;
  for (let i = 0; i < actual.length; i++) if (actual[i] === pred[i]) correct++;
  return actual.length ? correct / actual.length : 0;
}

// ---- Linear regression (gradient descent) ----
function trainLinearRegression(X: number[][], y: number[], epochs = 200, lr = 0.05): number[] {
  const n = X.length;
  const d = X[0].length;
  const w = new Array(d).fill(0);
  let b = 0;
  for (let e = 0; e < epochs; e++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      let pred = b;
      for (let j = 0; j < d; j++) pred += w[j] * X[i][j];
      const err = pred - y[i];
      for (let j = 0; j < d; j++) gradW[j] += err * X[i][j];
      gradB += err;
    }
    for (let j = 0; j < d; j++) w[j] -= (lr * gradW[j]) / n;
    b -= (lr * gradB) / n;
  }
  return [...w, b];
}

function predictLinear(model: number[], X: number[][]): number[] {
  const b = model[model.length - 1];
  const w = model.slice(0, -1);
  return X.map((r) => r.reduce((a, v, j) => a + w[j] * v, b));
}

// ---- Logistic regression (binary, gradient descent) ----
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
}

function trainLogisticRegression(X: number[][], y: number[], epochs = 200, lr = 0.1): number[] {
  const n = X.length;
  const d = X[0].length;
  const w = new Array(d).fill(0);
  let b = 0;
  for (let e = 0; e < epochs; e++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      let z = b;
      for (let j = 0; j < d; j++) z += w[j] * X[i][j];
      const err = sigmoid(z) - y[i];
      for (let j = 0; j < d; j++) gradW[j] += err * X[i][j];
      gradB += err;
    }
    for (let j = 0; j < d; j++) w[j] -= (lr * gradW[j]) / n;
    b -= (lr * gradB) / n;
  }
  return [...w, b];
}

function predictLogistic(model: number[], X: number[][]): number[] {
  const b = model[model.length - 1];
  const w = model.slice(0, -1);
  return X.map((r) => (sigmoid(r.reduce((a, v, j) => a + w[j] * v, b)) >= 0.5 ? 1 : 0));
}

// ---- Simple decision tree (depth-limited, single-feature splits) ----
interface TreeNode {
  leaf: boolean;
  prediction?: number;
  feature?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function gini(y: number[]): number {
  if (y.length === 0) return 0;
  const counts = [0, 0];
  for (const v of y) counts[v]++;
  const p0 = counts[0] / y.length;
  const p1 = counts[1] / y.length;
  return 1 - p0 * p0 - p1 * p1;
}

function buildTree(X: number[][], y: number[], depth: number, maxDepth: number): TreeNode {
  if (depth >= maxDepth || y.length < 4 || new Set(y).size === 1) {
    const ones = y.filter((v) => v === 1).length;
    return { leaf: true, prediction: ones >= y.length / 2 ? 1 : 0 };
  }
  let bestGini = Infinity;
  let bestFeat = 0;
  let bestThr = 0;
  let bestLeftIdx: number[] = [];
  let bestRightIdx: number[] = [];
  for (let f = 0; f < X[0].length; f++) {
    const vals = [...new Set(X.map((r) => r[f]))].sort((a, b) => a - b);
    for (let t = 0; t < vals.length - 1; t++) {
      const thr = (vals[t] + vals[t + 1]) / 2;
      const leftIdx: number[] = [];
      const rightIdx: number[] = [];
      for (let i = 0; i < X.length; i++) {
        if (X[i][f] <= thr) leftIdx.push(i);
        else rightIdx.push(i);
      }
      if (leftIdx.length === 0 || rightIdx.length === 0) continue;
      const g = (leftIdx.length * gini(leftIdx.map((i) => y[i])) + rightIdx.length * gini(rightIdx.map((i) => y[i]))) / y.length;
      if (g < bestGini) {
        bestGini = g;
        bestFeat = f;
        bestThr = thr;
        bestLeftIdx = leftIdx;
        bestRightIdx = rightIdx;
      }
    }
  }
  if (bestGini === Infinity) {
    const ones = y.filter((v) => v === 1).length;
    return { leaf: true, prediction: ones >= y.length / 2 ? 1 : 0 };
  }
  return {
    leaf: false,
    feature: bestFeat,
    threshold: bestThr,
    left: buildTree(bestLeftIdx.map((i) => X[i]), bestLeftIdx.map((i) => y[i]), depth + 1, maxDepth),
    right: buildTree(bestRightIdx.map((i) => X[i]), bestRightIdx.map((i) => y[i]), depth + 1, maxDepth),
  };
}

function predictTree(node: TreeNode, x: number[]): number {
  if (node.leaf) return node.prediction ?? 0;
  return x[node.feature!] <= node.threshold! ? predictTree(node.left!, x) : predictTree(node.right!, x);
}

// ---- K-Means clustering ----
function kmeans(X: number[][], k: number, iters = 50): number[] {
  const n = X.length;
  const d = X[0].length;
  // init: pick k random points
  const centroids: number[][] = [];
  for (let i = 0; i < k; i++) {
    centroids.push([...X[Math.floor((i * n) / k)]]);
  }
  let labels = new Array(n).fill(0);
  for (let it = 0; it < iters; it++) {
    // assign
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        let dist = 0;
        for (let j = 0; j < d; j++) dist += (X[i][j] - centroids[c][j]) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed = true;
      }
    }
    // update
    for (let c = 0; c < k; c++) {
      const sum = new Array(d).fill(0);
      let count = 0;
      for (let i = 0; i < n; i++) {
        if (labels[i] === c) {
          for (let j = 0; j < d; j++) sum[j] += X[i][j];
          count++;
        }
      }
      if (count > 0) for (let j = 0; j < d; j++) centroids[c][j] = sum[j] / count;
    }
    if (!changed) break;
  }
  return labels;
}

// Main entry: train models given a target column.
export function trainModels(
  rows: Record<string, string>[],
  columns: ColumnInfo[],
  targetName: string,
): MLTrainingResult {
  const targetCol = columns.find((c) => c.name === targetName);
  if (!targetCol) throw new Error('Target column not found.');

  // determine task type
  let taskType: 'regression' | 'classification' = 'regression';
  let y: number[] = [];
  if (targetCol.type === 'numeric') {
    y = rows.map((r) => toNumber(r[targetName]) ?? 0);
    // if low unique count, treat as classification
    const uniq = new Set(y).size;
    if (uniq <= 10 && uniq > 1) {
      taskType = 'classification';
      const vals = [...new Set(y)].sort((a, b) => a - b);
      const map = new Map(vals.map((v, i) => [v, i]));
      y = y.map((v) => map.get(v) ?? 0);
    }
  } else {
    taskType = 'classification';
    const vals = (targetCol.topValues ?? []).map((t) => t.value);
    if (vals.length < 2) throw new Error('Target column needs at least 2 classes.');
    const map = new Map(vals.map((v, i) => [v, i]));
    y = rows.map((r) => map.get(String(r[targetName] ?? '')) ?? 0);
  }

  // feature columns: everything except target and ID-like high-cardinality
  const featureCols = columns.filter(
    (c) => c.name !== targetName && !(c.cardinality === 'high' && c.type === 'categorical'),
  );

  const { X, featureNames } = buildFeatures(rows, featureCols);
  const { train, test } = trainTestSplit(rows.length, 0.25);
  const XTrain = train.map((i) => X[i]);
  const yTrain = train.map((i) => y[i]);
  const XTest = test.map((i) => X[i]);
  const yTest = test.map((i) => y[i]);

  // standardize
  const { means, stds } = fitStandardize(XTrain);
  const XTrainS = applyStandardize(XTrain, means, stds);
  const XTestS = applyStandardize(XTest, means, stds);

  const models: ModelMetrics[] = [];
  let featureImportances: FeatureImportance[] = [];

  if (taskType === 'regression') {
    // Linear regression
    const lrModel = trainLinearRegression(XTrainS, yTrain, 300, 0.05);
    const lrTrain = r2Score(yTrain, predictLinear(lrModel, XTrainS));
    const lrTest = r2Score(yTest, predictLinear(lrModel, XTestS));
    models.push({ name: 'Linear Regression', trainScore: lrTrain, testScore: lrTest, metric: 'R²' });

    // Linear regression on raw features (for feature importance via correlation)
    const fullModel = trainLinearRegression(XTrainS, yTrain, 300, 0.05);
    const w = fullModel.slice(0, -1);
    featureImportances = featureNames
      .map((f, i) => ({ feature: f, importance: Math.abs(w[i]) }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 12);

    // K-Means as a "clustering" baseline (silhouette-ish via inertia not computed)
    // Decision-tree regression via simple feature-target correlation split
    const treePreds = simpleRegressionTree(XTrain, yTrain, XTest, 4);
    const treeTest = r2Score(yTest, treePreds);
    const treeTrain = r2Score(yTrain, simpleRegressionTree(XTrain, yTrain, XTrain, 4));
    models.push({ name: 'Decision Tree (Regression)', trainScore: treeTrain, testScore: treeTest, metric: 'R²' });

    // KNN-style regression
    const knnTest = knnRegression(XTrainS, yTrain, XTestS, 5);
    const knnTrain = knnRegression(XTrainS, yTrain, XTrainS, 5);
    models.push({ name: 'K-Nearest Neighbors', trainScore: r2Score(yTrain, knnTrain), testScore: r2Score(yTest, knnTest), metric: 'R²' });

    const predictions = test.map((i, idx) => ({ actual: yTest[idx], predicted: predictLinear(lrModel, XTestS)[idx] })).slice(0, 100);
    return {
      taskType,
      target: targetName,
      features: featureNames,
      models,
      featureImportances,
      predictions,
    };
  }

  // classification
  // Logistic regression
  const logModel = trainLogisticRegression(XTrainS, yTrain, 300, 0.1);
  const logTrain = accuracy(yTrain, predictLogistic(logModel, XTrainS));
  const logTest = accuracy(yTest, predictLogistic(logModel, XTestS));
  models.push({ name: 'Logistic Regression', trainScore: logTrain, testScore: logTest, metric: 'Accuracy' });

  // feature importance from logistic weights
  const w = logModel.slice(0, -1);
  featureImportances = featureNames
    .map((f, i) => ({ feature: f, importance: Math.abs(w[i]) }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 12);

  // Decision tree
  const tree = buildTree(XTrainS, yTrain, 0, 5);
  const treeTrainPreds = XTrainS.map((x) => predictTree(tree, x));
  const treeTestPreds = XTestS.map((x) => predictTree(tree, x));
  models.push({ name: 'Decision Tree', trainScore: accuracy(yTrain, treeTrainPreds), testScore: accuracy(yTest, treeTestPreds), metric: 'Accuracy' });

  // KNN classification
  const knnTest = knnClassify(XTrainS, yTrain, XTestS, 5);
  const knnTrain = knnClassify(XTrainS, yTrain, XTrainS, 5);
  models.push({ name: 'K-Nearest Neighbors', trainScore: accuracy(yTrain, knnTrain), testScore: accuracy(yTest, knnTest), metric: 'Accuracy' });

  // confusion matrix (binary or multi)
  const classes = [...new Set(y)].sort((a, b) => a - b).map(String);
  const confusionMap = new Map<string, number>();
  for (let i = 0; i < yTest.length; i++) {
    const key = `${yTest[i]}_${predictLogistic(logModel, [XTestS[i]])[0]}`;
    confusionMap.set(key, (confusionMap.get(key) ?? 0) + 1);
  }
  const confusion = [...confusionMap.entries()].map(([k, count]) => {
    const [actual, predicted] = k.split('_');
    return { actual, predicted, count };
  });

  return {
    taskType,
    target: targetName,
    features: featureNames,
    models,
    featureImportances,
    confusion,
    classes,
  };
}

// Simple regression tree: pick best single-feature split recursively.
function simpleRegressionTree(
  XTrain: number[][],
  yTrain: number[],
  XPred: number[][],
  maxDepth: number,
): number[] {
  const root = buildRegTree(XTrain, yTrain, 0, maxDepth);
  return XPred.map((x) => predictRegTree(root, x));
}

interface RegNode {
  leaf: boolean;
  value?: number;
  feature?: number;
  threshold?: number;
  left?: RegNode;
  right?: RegNode;
}

function buildRegTree(X: number[][], y: number[], depth: number, maxDepth: number): RegNode {
  const m = mean(y);
  if (depth >= maxDepth || y.length < 4) return { leaf: true, value: m };
  let bestSse = Infinity;
  let bestFeat = 0;
  let bestThr = 0;
  let bestLeft: number[] = [];
  let bestRight: number[] = [];
  for (let f = 0; f < X[0].length; f++) {
    const vals = [...new Set(X.map((r) => r[f]))].sort((a, b) => a - b);
    for (let t = 0; t < vals.length - 1; t++) {
      const thr = (vals[t] + vals[t + 1]) / 2;
      const li: number[] = [];
      const ri: number[] = [];
      for (let i = 0; i < X.length; i++) {
        if (X[i][f] <= thr) li.push(i);
        else ri.push(i);
      }
      if (li.length === 0 || ri.length === 0) continue;
      const sse = li.reduce((a, i) => a + (y[i] - mean(li.map((j) => y[j]))) ** 2, 0) +
        ri.reduce((a, i) => a + (y[i] - mean(ri.map((j) => y[j]))) ** 2, 0);
      if (sse < bestSse) {
        bestSse = sse;
        bestFeat = f;
        bestThr = thr;
        bestLeft = li;
        bestRight = ri;
      }
    }
  }
  if (bestSse === Infinity) return { leaf: true, value: m };
  return {
    leaf: false,
    feature: bestFeat,
    threshold: bestThr,
    left: buildRegTree(bestLeft.map((i) => X[i]), bestLeft.map((i) => y[i]), depth + 1, maxDepth),
    right: buildRegTree(bestRight.map((i) => X[i]), bestRight.map((i) => y[i]), depth + 1, maxDepth),
  };
}

function predictRegTree(node: RegNode, x: number[]): number {
  if (node.leaf) return node.value ?? 0;
  return x[node.feature!] <= node.threshold! ? predictRegTree(node.left!, x) : predictRegTree(node.right!, x);
}

// KNN regression.
function knnRegression(XTrain: number[][], yTrain: number[], XPred: number[][], k: number): number[] {
  return XPred.map((x) => {
    const dists = XTrain.map((t, i) => ({ d: dist(x, t), y: yTrain[i] }));
    dists.sort((a, b) => a.d - b.d);
    return mean(dists.slice(0, k).map((d) => d.y));
  });
}

// KNN classification.
function knnClassify(XTrain: number[][], yTrain: number[], XPred: number[][], k: number): number[] {
  return XPred.map((x) => {
    const dists = XTrain.map((t, i) => ({ d: dist(x, t), y: yTrain[i] }));
    dists.sort((a, b) => a.d - b.d);
    const votes = new Map<number, number>();
    for (const v of dists.slice(0, k)) votes.set(v.y, (votes.get(v.y) ?? 0) + 1);
    let best = 0;
    let bestCount = -1;
    for (const [label, c] of votes) if (c > bestCount) { best = label; bestCount = c; }
    return best;
  });
}

function dist(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

// Re-export standardize for potential external use
export { standardize, linearRegression };
