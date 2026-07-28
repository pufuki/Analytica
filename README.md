# Analytica AI

AI-powered CSV analysis that runs entirely in your browser. Upload a CSV (or pick a demo dataset) and instantly get a full analytics dashboard — dataset overview, data quality report, interactive charts, statistics, correlations, outlier detection, AI-generated insights, ML recommendations, optional model training, and PDF export.

No accounts. No backend. No database. Nothing is stored — all analysis happens locally in your browser and is discarded when you close the tab.

## Features

- **Drag & drop CSV upload** with progress, encoding-error handling, and 100 MB limit
- **Dataset overview** — rows, columns, memory, duplicates, missing values, types, 20-row preview
- **Data quality report** — missingness, duplicates, constant columns, high-cardinality flags, cleanup suggestions
- **Statistics** — mean, median, mode, std, variance, min/max, quartiles, IQR, skewness, kurtosis
- **Interactive visualizations** — histograms, bar charts, box plots, pie charts, scatter plots (Recharts)
- **Correlation analysis** — color-coded heatmap + ranked strongest pairs with explanations
- **Outlier detection** — IQR (Tukey) method with per-column counts and sample values
- **AI insights** — executive summary, dataset description, important variables, patterns, findings, business insights, risks, recommendations, suggested ML tasks, future analyses
- **Optional model training** — pick a target, auto-detect regression vs classification, compare Linear/Logistic Regression, Decision Tree, KNN, with feature importance and confusion matrix
- **PDF export** — downloadable report with overview, stats, correlations, outliers, and AI insights
- **5 built-in demo datasets** — Employee Performance, E-commerce Sales, Hospital Patients, Student Performance, Bank Loans (deterministic, with realistic relationships)

## Tech Stack

- **React** (Vite) + TypeScript
- **TailwindCSS** for styling
- **Recharts** for interactive charts
- **PapaParse** for CSV parsing
- **jsPDF** for PDF export
- **lucide-react** for icons

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

The output is generated in the `dist/` folder. Preview it with:

```bash
npm run preview
```

## How it works

1. You upload a CSV (or pick a demo dataset).
2. PapaParse parses the text in your browser.
3. The analysis service infers column types, computes statistics, builds a correlation matrix, detects outliers, and generates chart specs.
4. The insights engine produces an AI-style executive summary, patterns, business insights, risks, and ML task recommendations — using only metadata (column names, types, stats, correlations), never raw data.
5. Everything renders in an interactive dashboard. Nothing is sent to a server or stored.

## Future enhancements

- Real LLM integration (OpenAI API) for richer natural-language insights
- More chart types (violin, pair plots, geographic maps)
- Additional ML models (random forest, gradient boosting)
- CSV column transformer / cleanup tools
- Dark mode
- Shareable analysis links (via URL-encoded state)
