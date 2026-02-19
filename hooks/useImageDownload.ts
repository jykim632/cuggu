import { useState, useCallback } from 'react';

const MAX_CONCURRENT = 4;
const ZIP_WARNING_THRESHOLD = 20;

async function fetchBlob(url: string): Promise<Blob> {
  // CloudFront direct fetch
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.blob();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractFilename(url: string, index: number): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').pop();
    if (base && /\.(jpe?g|png|webp)$/i.test(base)) return base;
  } catch {
    // fallback
  }
  return `photo-${index + 1}.jpg`;
}

export function useImageDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const downloadSingle = useCallback(async (url: string, filename?: string) => {
    setIsDownloading(true);
    try {
      const blob = await fetchBlob(url);
      triggerDownload(blob, filename ?? extractFilename(url, 0));
    } finally {
      setIsDownloading(false);
    }
  }, []);

  const downloadMultiple = useCallback(async (urls: string[], zipName = 'photos.zip') => {
    if (urls.length === 0) return;

    if (urls.length === 1) {
      return downloadSingle(urls[0]);
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: urls.length });

    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Concurrent fetch with limit
      let completed = 0;
      const queue = [...urls];
      const results: { index: number; blob: Blob }[] = [];

      const worker = async () => {
        while (queue.length > 0) {
          const url = queue.shift()!;
          const index = urls.indexOf(url);
          try {
            const blob = await fetchBlob(url);
            results.push({ index, blob });
          } catch {
            // skip failed downloads
          }
          completed++;
          setProgress({ current: completed, total: urls.length });
        }
      };

      const workers = Array.from(
        { length: Math.min(MAX_CONCURRENT, urls.length) },
        () => worker()
      );
      await Promise.all(workers);

      // Add to zip
      for (const { index, blob } of results) {
        zip.file(extractFilename(urls[index], index), blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, zipName);
    } finally {
      setIsDownloading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [downloadSingle]);

  return {
    downloadSingle,
    downloadMultiple,
    isDownloading,
    progress,
    needsWarning: (count: number) => count > ZIP_WARNING_THRESHOLD,
  };
}
