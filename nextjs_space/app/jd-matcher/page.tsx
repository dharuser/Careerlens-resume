'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  Search, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Briefcase,
  Target,
  FileCode,
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface JDMatchResult {
  overall_match: number;
  skill_match: number;
  experience_match: number;
  education_match: number;
  matched_keywords: string[];
  missing_keywords: string[];
  strong_points: string[];
  weak_points: string[];
  recommendation: string;
  summary: string;
}

export default function JDMatcherPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [result, setResult] = useState<JDMatchResult | null>(null);
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
      toast.error('Please upload a PDF file.');
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
      setResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e?.target?.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleMatch = async () => {
    if (!file) {
      toast.error('Please upload a resume first.');
      return;
    }
    if (!jdText.trim()) {
      toast.error('Please paste a job description.');
      return;
    }

    setIsMatching(true);
    try {
      // For real implementation, we need to extract text from PDF.
      // Since we don't have a direct text extractor in browser here without a library,
      // and the existing /api/analyze handles file upload + LLM file reading,
      // we'll send the file to a specialized endpoint that can read it.
      
      const formData = new FormData();
      formData.append('file', file);
      
      // We'll reuse the logic from analyze to get text or just send it to a new route
      // For this demo, we'll simulate text extraction or assume the API handles it.
      // Let's create a small helper to convert file to base64 for simplicity in this demo.
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/match-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text: `[PDF_FILE_DATA:base64:${base64}]`, // Simplified for LLM prompt in route
            job_description: jdText,
            fileName: file.name
          }),
        });

        if (!response.ok) throw new Error('Matching failed');
        const data = await response.json();
        setResult(data.result);
        toast.success('Match analysis complete!');
      };
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsMatching(false);
    }
  };

  const getRecommendationColor = (rec: string) => {
    if (rec.includes('Highly')) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (rec.includes('Recommended')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (rec.includes('Improvement')) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight mb-3">JD Matcher</h1>
        <p className="text-muted-foreground text-lg">Compare your resume against any job description for deep insights</p>
      </div>

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resume Upload */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Step 1: Upload Resume
            </h3>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all h-[300px] flex flex-col items-center justify-center ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
              {file ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="font-semibold">{file.name}</p>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    Change File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium">Drop resume here or click to browse</p>
                  <p className="text-xs text-muted-foreground">PDF only, max 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* JD Input */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" /> Step 2: Paste Job Description
            </h3>
            <Textarea
              placeholder="Paste the full job description here..."
              className="h-[300px] bg-card border-border resize-none p-6 text-sm leading-relaxed focus:ring-primary/50"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2 flex justify-center pt-4">
            <Button 
              size="lg" 
              className="px-12 py-6 text-lg rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              disabled={isMatching || !file || !jdText}
              onClick={handleMatch}
            >
              {isMatching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Match...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" /> Match Now
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Header Result */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-8 rounded-3xl bg-card border border-border/50">
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                   <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle className="text-muted stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                      <circle 
                        className="text-primary stroke-current" 
                        strokeWidth="8" 
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={2 * Math.PI * 40 * (1 - result.overall_match / 100)}
                        strokeLinecap="round" 
                        fill="transparent" 
                        r="40" cx="50" cy="50" 
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-bold">{result.overall_match}%</span>
                     <span className="text-[10px] text-muted-foreground uppercase">Overall</span>
                   </div>
                </div>
                <div>
                  <Badge className={`mb-2 px-3 py-1 ${getRecommendationColor(result.recommendation)}`}>
                    {result.recommendation}
                  </Badge>
                  <h2 className="text-2xl font-bold">Recruiter's Verdict</h2>
                  <p className="text-muted-foreground max-w-md mt-1 italic">"{result.summary}"</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl">
                Try Another JD
              </Button>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="p-6 bg-card/50 border-border/50">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <Target className="w-5 h-5 text-blue-400" />
                     <span className="font-semibold">Skills Match</span>
                   </div>
                   <span className="font-bold">{result.skill_match}%</span>
                 </div>
                 <Progress value={result.skill_match} className="h-2" />
               </Card>
               <Card className="p-6 bg-card/50 border-border/50">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <Briefcase className="w-5 h-5 text-purple-400" />
                     <span className="font-semibold">Experience</span>
                   </div>
                   <span className="font-bold">{result.experience_match}%</span>
                 </div>
                 <Progress value={result.experience_match} className="h-2" />
               </Card>
               <Card className="p-6 bg-card/50 border-border/50">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                     <GraduationCap className="w-5 h-5 text-green-400" />
                     <span className="font-semibold">Education</span>
                   </div>
                   <span className="font-bold">{result.education_match}%</span>
                 </div>
                 <Progress value={result.education_match} className="h-2" />
               </Card>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-green-400">
                   <CheckCircle className="w-5 h-5" /> Matched Keywords
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {result.matched_keywords.map((kw, i) => (
                     <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                       {kw}
                     </Badge>
                   ))}
                 </div>
               </div>
               <div className="space-y-4">
                 <h3 className="text-lg font-bold flex items-center gap-2 text-red-400">
                   <XCircle className="w-5 h-5" /> Missing Keywords
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {result.missing_keywords.map((kw, i) => (
                     <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-400 border-red-500/20">
                       {kw}
                     </Badge>
                   ))}
                 </div>
               </div>
            </div>

            {/* Points */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="p-6 border-green-500/20 bg-green-500/5">
                 <h3 className="font-bold mb-4 flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-green-400" /> Why You Fit
                 </h3>
                 <ul className="space-y-3">
                   {result.strong_points.map((pt, i) => (
                     <li key={i} className="flex gap-3 text-sm">
                       <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                       {pt}
                     </li>
                   ))}
                 </ul>
               </Card>
               <Card className="p-6 border-red-500/20 bg-red-500/5">
                 <h3 className="font-bold mb-4 flex items-center gap-2">
                   <AlertCircle className="w-5 h-5 text-red-400" /> Gaps to Bridge
                 </h3>
                 <ul className="space-y-3">
                   {result.weak_points.map((pt, i) => (
                     <li key={i} className="flex gap-3 text-sm">
                       <ArrowRight className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                       {pt}
                     </li>
                   ))}
                 </ul>
               </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
