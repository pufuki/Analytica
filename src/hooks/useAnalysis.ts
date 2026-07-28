import { useCallback, useState } from 'react';
import type { AnalysisResult } from '@/types';
import { parseCSVText, readFileAsText } from '@/utils/csv';
import { analyzeDataset } from '@/services/analysis';
import { generateInsights } from '@/services/insights';

export type AnalysisStatus = 'idle' | 'parsing' | 'analyzing' | 'done' | 'error';

export interface UseAnalysisState {
  status: AnalysisStatus;
  progress: number;
  error: string | null;
  result: AnalysisResult | null;
  analyzeFile: (file: File) => Promise<void>;
  analyzeCsvText: (csv: string, fileName: string) => Promise<void>;
  reset: () => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function useAnalysis(): UseAnalysisState {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const runAnalysis = async (csvText: string, fileName: string, fileSizeBytes: number) => {
    setStatus('parsing');
    setProgress(15);
    const parsed = parseCSVText(csvText, fileName);

    setStatus('analyzing');
    setProgress(45);
    // allow the UI to paint the loading state
    await new Promise((r) => setTimeout(r, 50));

    const { overview, columns, quality, correlation, outliers, charts } = analyzeDataset(parsed);
    setProgress(70);

    const ai = generateInsights(overview, columns, quality, correlation, outliers, fileName);
    setProgress(95);

    const fullResult: AnalysisResult = {
      overview,
      columns,
      quality,
      correlation,
      outliers,
      charts,
      ai,
      fileName,
      fileSizeBytes,
      rows: parsed.rows,
    };

    setResult(fullResult);
    setProgress(100);
    setStatus('done');
  };

  const analyzeFile = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setStatus('parsing');
    setProgress(5);

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Only CSV files are supported. Please upload a .csv file.');
      setStatus('error');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The maximum supported size is 100 MB.`);
      setStatus('error');
      return;
    }
    if (file.size === 0) {
      setError('The selected file is empty.');
      setStatus('error');
      return;
    }

    try {
      const text = await readFileAsText(file);
      await runAnalysis(text, file.name, file.size);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze the file.');
      setStatus('error');
    }
  }, []);

  const analyzeCsvText = useCallback(async (csv: string, fileName: string) => {
    setError(null);
    setResult(null);
    try {
      const sizeBytes = new Blob([csv]).size;
      await runAnalysis(csv, fileName, sizeBytes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze the demo dataset.');
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return { status, progress, error, result, analyzeFile, analyzeCsvText, reset };
}
