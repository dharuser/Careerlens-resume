'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Sparkles, AlertCircle, Loader2, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { ResultsDashboard } from '@/components/results/results-dashboard';

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  career_paths: { title: string; description: string; match_percent: number }[];
  job_matches: { role: string; fit_percent: number }[];
  tips: string[];
}

export function AnalyzePageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (f: File): boolean => {
    if (f?.type !== 'application/pdf') {
      toast.error('Invalid file type. Please upload a PDF file.');
      return false;
    }
    if ((f?.size ?? 0) > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 5MB.');
      return false;
    }
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e?.dataTransfer?.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e?.target?.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast.error('Please upload a resume PDF first.');
      return;
    }
    if (!targetRole?.trim()) {
      toast.error('Please enter a target job role.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);
    setAnalysisId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetRole', targetRole.trim());

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response?.ok) {
        const errData = await response?.json?.().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(errData?.error ?? 'Analysis failed');
      }

      const reader = response?.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines?.pop() ?? '';

        for (const line of (lines ?? [])) {
          if (line?.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setProgress((prev: number) => Math.min((prev ?? 0) + 2, 95));
              } else if (parsed?.status === 'completed') {
                setResult(parsed?.result ?? null);
                setAnalysisId(parsed?.analysisId ?? null);
                setProgress(100);
                toast.success('Resume analysis complete!');
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'Analysis failed');
              }
            } catch (parseErr: any) {
              if (parseErr?.message && parseErr?.message !== 'Analysis failed') {
                // skip invalid JSON chunks
              } else if (parseErr?.message === 'Analysis failed') {
                throw parseErr;
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err?.message ?? 'An unexpected error occurred');
      toast.error(err?.message ?? 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setTargetRole('');
    setResult(null);
    setAnalysisId(null);
    setError(null);
    setProgress(0);
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <ResultsDashboard
              result={result}
              fileName={file?.name ?? 'resume.pdf'}
              targetRole={targetRole}
              analysisId={analysisId}
              onReset={resetAnalysis}
            />
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                Analyze Your Resume
              </h1>
              <p className="text-muted-foreground text-lg">
                Upload your PDF resume and specify your target role for AI-powered insights
              </p>
            </div>

            {/* Upload area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef?.current?.click?.()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : file
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-border hover:border-primary/50 hover:bg-card'
              }`}
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-green-500/15 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{file?.name ?? 'resume.pdf'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {((file?.size ?? 0) / 1024 / 1024)?.toFixed?.(2) ?? '0'} MB
                    </p>
                  </div>
                  <button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef?.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Drop your resume here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse · PDF only · Max 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Target role input */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-foreground">
                Target Job Role
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetRole(e?.target?.value ?? '')}
                  placeholder="e.g., Data Scientist, Frontend Developer, Product Manager"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Error display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {/* Analyze button */}
            <motion.button
              whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
              whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file || !targetRole?.trim()}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing... {progress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze My Resume
                </>
              )}
            </motion.button>

            {/* Progress bar */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6]"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {progress < 30
                    ? 'Reading your resume...'
                    : progress < 60
                    ? 'Analyzing skills and experience...'
                    : progress < 90
                    ? 'Generating career recommendations...'
                    : 'Finalizing results...'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
