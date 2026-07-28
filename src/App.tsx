import { Hero } from '@/components/Hero';
import { UploadZone } from '@/components/UploadZone';
import { DemoDatasetGallery } from '@/components/DemoDatasetGallery';
import { Dashboard } from '@/components/Dashboard';
import { Footer } from '@/components/Footer';
import { useAnalysis } from '@/hooks/useAnalysis';

function App() {
  const { status, progress, error, result, analyzeFile, analyzeCsvText, reset } = useAnalysis();

  const isWorking = status === 'parsing' || status === 'analyzing';

  return (
    <div className="min-h-screen flex flex-col">
      {result && status === 'done' ? (
        <Dashboard result={result} onReset={reset} />
      ) : (
        <main className="flex-1">
          <Hero />
          <UploadZone
            onFile={analyzeFile}
            status={status}
            progress={progress}
            error={error}
            fileName={result?.fileName}
            fileSize={result?.fileSizeBytes}
            onReset={reset}
          />
          {!isWorking && (
            <DemoDatasetGallery onSelect={analyzeCsvText} disabled={isWorking} />
          )}
          <div className="mt-16" />
          <Footer />
        </main>
      )}
    </div>
  );
}

export default App;
