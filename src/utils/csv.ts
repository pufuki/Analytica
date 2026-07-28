import Papa from 'papaparse';
import type { ColumnType } from '@/types';
import { toBool, toDate, toNumber } from './stats';

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  rawText: string;
  fileSizeBytes: number;
}

// Parse CSV text into headers + row objects. Throws on empty/invalid input.
export function parseCSVText(text: string, fileName = 'upload.csv'): ParsedCSV {
  if (!text || text.trim() === '') {
    throw new Error('The file appears to be empty.');
  }
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Delimiter' || e.row === undefined);
    if (fatal) {
      throw new Error(`CSV parsing error: ${fatal.message}`);
    }
  }

  const headers = (result.meta.fields ?? []).filter((h) => h && h.length > 0);
  if (headers.length === 0) {
    throw new Error('No columns were detected. Please check that your file has a header row.');
  }

  const rows = (result.data ?? []).filter((r) => r && Object.values(r).some((v) => v !== null && v !== ''));
  if (rows.length === 0) {
    throw new Error('No data rows were found in the file.');
  }

  return {
    headers,
    rows,
    rawText: text,
    fileSizeBytes: new Blob([text]).size,
  };
}

// Infer the type of a column from its values.
export function inferColumnType(name: string, values: unknown[]): ColumnType {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'categorical';

  const sample = nonNull.slice(0, Math.min(500, nonNull.length));
  let boolCount = 0;
  let numCount = 0;
  let dateCount = 0;

  for (const v of sample) {
    if (toBool(v) !== null) boolCount++;
    if (toNumber(v) !== null) numCount++;
    if (toDate(v) !== null) dateCount++;
  }

  const total = sample.length;
  // Boolean: nearly all values parse as bool AND cardinality is low
  if (boolCount / total >= 0.95) {
    const uniq = new Set(nonNull.map((v) => String(v).toLowerCase()));
    if (uniq.size <= 3) return 'boolean';
  }
  // Datetime: most values parse as dates and it's not purely numeric
  if (dateCount / total >= 0.8 && numCount / total < 0.5) {
    return 'datetime';
  }
  // Numeric: most values parse as numbers
  if (numCount / total >= 0.8) {
    return 'numeric';
  }
  return 'categorical';
}

// Read a File object as text, handling encoding errors gracefully.
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (text.trim() === '') {
        reject(new Error('The file is empty or could not be read.'));
        return;
      }
      // Detect replacement chars suggesting encoding issues
      const replacementRatio = (text.match(/\uFFFD/g)?.length ?? 0) / text.length;
      if (replacementRatio > 0.05) {
        // Try re-reading as latin1 as a fallback
        const fallback = new FileReader();
        fallback.onload = () => resolve(String(fallback.result ?? ''));
        fallback.onerror = () => resolve(text);
        fallback.readAsText(file, 'latin1');
        return;
      }
      resolve(text);
    };
    reader.onerror = () => reject(new Error('Failed to read the file. It may be corrupted.'));
    reader.readAsText(file);
  });
}
