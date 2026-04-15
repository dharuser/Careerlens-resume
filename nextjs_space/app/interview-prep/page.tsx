'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCcw,
  Zap,
  Layout,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Question {
  question: string;
  why_asked: string;
  tip: string;
}

interface InterviewPrepResult {
  technical_questions: Question[];
  behavioral_questions: Question[];
  resume_specific_questions: Question[];
  tricky_questions: Question[];
}

export default function InterviewPrepPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e?.dataTransfer?.files?.[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleGenerate = async () => {
    if (!file) {
      toast.error('Please upload a resume first.');
      return;
    }
    if (!targetRole.trim()) {
      toast.error('Please enter a target role.');
      return;
    }

    setIsGenerating(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text: `[PDF_FILE_DATA:base64:${base64}]`,
            target_role: targetRole,
            difficulty,
            fileName: file.name
          }),
        });

        if (!response.ok) throw new Error('Generation failed');
        const data = await response.json();
        setResult(data.result);
        toast.success('Interview questions generated!');
      };
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const all = [
      ...result.technical_questions,
      ...result.behavioral_questions,
      ...result.resume_specific_questions,
      ...result.tricky_questions
    ].map(q => `Q: ${q.question}\nWhy Asked: ${q.why_asked}\nTip: ${q.tip}\n`).join('\n---\n\n');
    
    navigator.clipboard.writeText(all);
    toast.success('All questions copied to clipboard!');
  };

  const QuestionCard = ({ q, id }: { q: Question, id: string }) => (
    <Card className="p-5 bg-card border-border/50 hover:border-primary/30 transition-all group mb-4 overflow-hidden">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <p className="font-bold text-lg leading-tight mb-2 text-foreground group-hover:text-primary transition-colors">
            {q.question}
          </p>
          <p className="text-xs text-muted-foreground italic mb-3">
            <span className="font-semibold uppercase text-[10px] tracking-wider">Insight:</span> {q.why_asked}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpandedIndex(expandedIndex === id ? null : id)}
          className="shrink-0"
        >
          {expandedIndex === id ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      
      <AnimatePresence>
        {expandedIndex === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 pt-4 border-t border-border/30"
          >
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm font-bold text-green-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Expert Tip
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed italic">
                {q.tip}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4 uppercase tracking-widest">
           <Zap className="w-3 h-3" /> CareerLens AI
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight mb-3">Interview Prep</h1>
        <p className="text-muted-foreground text-lg">AI-generated questions tailored to your resume and target role</p>
      </div>

      {!result ? (
        <Card className="max-w-2xl mx-auto p-8 border-border/50 bg-card/80 backdrop-blur-sm shadow-2xl">
          <div className="space-y-6">
             <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">1. Target Role</label>
                <Input 
                  placeholder="e.g. Senior Frontend Engineer" 
                  value={targetRole} 
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="bg-muted/50 border-border h-12 text-lg"
                />
             </div>

             <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">2. Difficulty Level</label>
                <ToggleGroup type="single" value={difficulty} onValueChange={(v) => v && setDifficulty(v)} className="justify-start">
                  <ToggleGroupItem value="easy" className="px-6 py-2 rounded-xl border border-border data-[state=on]:bg-green-500/10 data-[state=on]:text-green-400 data-[state=on]:border-green-500/30">Easy</ToggleGroupItem>
                  <ToggleGroupItem value="medium" className="px-6 py-2 rounded-xl border border-border data-[state=on]:bg-blue-500/10 data-[state=on]:text-blue-400 data-[state=on]:border-blue-500/30">Medium</ToggleGroupItem>
                  <ToggleGroupItem value="hard" className="px-6 py-2 rounded-xl border border-border data-[state=on]:bg-red-500/10 data-[state=on]:text-red-400 data-[state=on]:border-red-500/30">Hard</ToggleGroupItem>
                </ToggleGroup>
             </div>

             <div className="space-y-3">
                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">3. Resume Upload</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/20'
                  }`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }} className="hidden" />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="w-6 h-6 text-green-400" />
                      <span className="font-semibold">{file.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-muted-foreground mb-1" />
                      <p className="text-sm font-medium">Click or drag resume PDF here</p>
                    </div>
                  )}
                </div>
             </div>

             <Button 
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:opacity-90 shadow-xl shadow-primary/20"
                disabled={isGenerating || !file || !targetRole}
                onClick={handleGenerate}
             >
               {isGenerating ? (
                 <>
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Questions...
                 </>
               ) : (
                 <>
                   <Sparkles className="mr-2 h-5 w-5" /> Generate My Questions
                 </>
               )}
             </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl border-border/50">
                <RefreshCcw className="w-4 h-4 mr-2" /> Start Over
              </Button>
              <Button variant="outline" onClick={copyAll} className="rounded-xl border-border/50">
                <Copy className="w-4 h-4 mr-2" /> Copy All
              </Button>
            </div>
            <div className="text-right">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Role</p>
               <p className="font-bold text-primary">{targetRole}</p>
            </div>
          </div>

          <Tabs defaultValue="technical" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1 bg-card border border-border/50 rounded-2xl mb-8">
              <TabsTrigger value="technical" className="py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Technical</TabsTrigger>
              <TabsTrigger value="behavioral" className="py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Behavioral</TabsTrigger>
              <TabsTrigger value="resume" className="py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Resume-Based</TabsTrigger>
              <TabsTrigger value="tricky" className="py-3 rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:text-primary">Tricky</TabsTrigger>
            </TabsList>
            
            <TabsContent value="technical" className="mt-0">
               {result.technical_questions.map((q, i) => <QuestionCard key={i} q={q} id={`tech-${i}`} />)}
            </TabsContent>
            <TabsContent value="behavioral" className="mt-0">
               {result.behavioral_questions.map((q, i) => <QuestionCard key={i} q={q} id={`beh-${i}`} />)}
            </TabsContent>
            <TabsContent value="resume" className="mt-0">
               {result.resume_specific_questions.map((q, i) => <QuestionCard key={i} q={q} id={`res-${i}`} />)}
            </TabsContent>
            <TabsContent value="tricky" className="mt-0">
               {result.tricky_questions.map((q, i) => <QuestionCard key={i} q={q} id={`tri-${i}`} />)}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
