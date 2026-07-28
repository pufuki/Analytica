import { useCallback, useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2, X } from 'lucide-react';
import { formatBytes } from '@/utils/format';

interface UploadZoneProps {
  onFile: (file: File) => void;
  status: 'idle' | 'parsing' | 'analyzing' | 'done' | 'error';
  progress: number;
  error: string | null;
  fileName?: string;
  fileSize?: number;
  onReset: () => void;
}

export function UploadZone({ onFile, status, progress, error, fileName, fileSize, onReset }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  const isWorking = status === 'parsing' || status === 'analyzing';
  const statusLabel = status === 'parsing' ? 'Parsing CSV…' : status === 'analyzing' ? 'Analyzing dataset…' : '';

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isWorking && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragging
            ? 'border-primary-500 bg-primary-50/80 scale-[1.02]'
            : 'border-slate-300 bg-white/60 hover:border-primary-400 hover:bg-white/80'
        } ${isWorking ? 'pointer-events-none' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />

        <div className="px-6 py-10 text-center">
          {isWorking ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <div>
                <p className="font-display font-semibold text-slate-800">{statusLabel}</p>
                <p className="text-sm text-slate-500 mt-1 truncate max-w-xs">{fileName}</p>
              </div>
              <div className="w-full max-w-xs h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{progress}%</p>
            </div>
          ) : status === 'done' && fileName ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-success-50 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-success-600" />
              </div>
              <div>
                <p className="font-display font-semibold text-slate-800">{fileName}</p>
                {fileSize !== undefined && <p className="text-sm text-slate-500">{formatBytes(fileSize)} · analyzed</p>}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                className="btn-ghost text-sm"
              >
                <X className="w-4 h-4" /> Analyze another file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${dragging ? 'bg-primary-100 scale-110' : 'bg-primary-50'}`}>
                <UploadCloud className={`w-8 h-8 transition-colors ${dragging ? 'text-primary-600' : 'text-primary-500'}`} />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-slate-800">
                  {dragging ? 'Drop your CSV here' : 'Drag & drop your CSV file'}
                </p>
                <p className="text-sm text-slate-500 mt-1">or click to browse · max 100 MB · processed locally</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-error-50 border border-error-200 animate-fade-in-up">
          <AlertCircle className="w-5 h-5 text-error-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error-700 text-sm">Upload failed</p>
            <p className="text-error-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
