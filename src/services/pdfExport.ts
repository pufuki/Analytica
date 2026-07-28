import jsPDF from 'jspdf';
import type { AnalysisResult } from '@/types';
import { formatBytes, formatNumber, formatPct, titleCase, correlationLabel } from '@/utils/format';

// Generate and download a PDF report from the analysis result.
export function exportReport(result: AnalysisResult): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 14) => {
    ensureSpace(size + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(15, 23, 42);
    doc.text(text, margin, y);
    y += size + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
  };

  const paragraph = (text: string, size = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += 4;
  };

  const bullet = (text: string) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentW - 16);
    doc.text('•', margin + 2, y);
    for (const line of lines) {
      doc.text(line, margin + 16, y);
      y += 14;
    }
  };

  // ---- Title ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('Analytica AI — Analysis Report', margin, y);
  y += 28;
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`File: ${result.fileName}   |   Size: ${formatBytes(result.fileSizeBytes)}   |   Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 20;

  // ---- Overview ----
  heading('Dataset Overview');
  const o = result.overview;
  paragraph(`Rows: ${o.rows.toLocaleString()}  |  Columns: ${o.columns}  |  Memory: ${formatBytes(o.memoryBytes)}  |  Duplicates: ${o.duplicateRows}  |  Missing: ${o.missingValues} (${formatPct(o.missingValues / o.totalCells)})`);
  paragraph(`Column types: ${result.quality.numericColumns.length} numeric, ${result.quality.categoricalColumns.length} categorical, ${result.quality.booleanColumns.length} boolean, ${result.quality.datetimeColumns.length} datetime.`);

  // ---- Quality ----
  heading('Data Quality Report');
  for (const s of result.quality.cleanupSuggestions) bullet(s);

  // ---- Statistics ----
  heading('Statistical Summary');
  for (const col of result.columns) {
    if (col.type !== 'numeric' || !col.stats) continue;
    ensureSpace(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(titleCase(col.name), margin, y);
    y += 14;
    const s = col.stats;
    const statsLine = `Mean: ${formatNumber(s.mean)}  |  Median: ${formatNumber(s.median)}  |  Std: ${formatNumber(s.std)}  |  Min: ${formatNumber(s.min)}  |  Max: ${formatNumber(s.max)}  |  Skew: ${formatNumber(s.skewness)}  |  Kurt: ${formatNumber(s.kurtosis)}`;
    paragraph(statsLine, 9);
  }

  // ---- Correlation ----
  heading('Correlation Analysis');
  if (result.correlation.pairs.length === 0) {
    paragraph('No significant correlations detected among numeric columns.');
  } else {
    for (const p of result.correlation.pairs.slice(0, 10)) {
      bullet(`${titleCase(p.a)} ↔ ${titleCase(p.b)}: r=${p.value.toFixed(3)} (${correlationLabel(p.strength)})`);
    }
  }

  // ---- Outliers ----
  heading('Outlier Detection (IQR)');
  if (result.outliers.columns.length === 0) {
    paragraph('No outliers detected.');
  } else {
    for (const oc of result.outliers.columns.slice(0, 10)) {
      bullet(`${titleCase(oc.column)}: ${oc.count} outliers (${formatPct(oc.pct)}), bounds [${formatNumber(oc.lowerBound)}, ${formatNumber(oc.upperBound)}]`);
    }
  }

  // ---- AI Summary ----
  heading('AI-Generated Executive Summary');
  paragraph(result.ai.executiveSummary);
  heading('Dataset Description', 12);
  paragraph(result.ai.datasetDescription);

  heading('Important Variables', 12);
  for (const v of result.ai.importantVariables) bullet(v);

  heading('Patterns', 12);
  for (const p of result.ai.patterns) bullet(p);

  heading('Interesting Findings', 12);
  for (const f of result.ai.interestingFindings) bullet(f);

  // ---- Insights ----
  heading('Business Insights');
  for (const i of result.ai.businessInsights) bullet(i);

  heading('Potential Risks', 12);
  for (const r of result.ai.potentialRisks) bullet(r);

  // ---- Recommendations ----
  heading('Recommendations');
  for (const r of result.ai.recommendations) bullet(r);

  heading('Suggested ML Tasks', 12);
  for (const t of result.ai.suggestedMLTasks) {
    bullet(`${t.task}: ${t.reason}`);
  }

  heading('Future Analyses', 12);
  for (const f of result.ai.futureAnalyses) bullet(f);

  // ---- Footer page numbers ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Analytica AI — Page ${i} of ${pageCount}`, margin, pageH - 16);
  }

  doc.save(`analytica-ai-report-${result.fileName.replace(/\.[^.]+$/, '')}.pdf`);
}
