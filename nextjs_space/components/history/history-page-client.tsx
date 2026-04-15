'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Calendar, Briefcase, TrendingUp, FileText, Loader2, Inbox, Search, MessageSquare, Target } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalysisRecord {
  id: string;
  type: 'analysis';
  fileName: string;
  targetRole: string;
  score: number;
  strengths: string[];
  createdAt: string;
}

interface JDMatchRecord {
  id: string;
  type: 'jd_match';
  fileName: string;
  overallMatch: number;
  recommendation: string;
  createdAt: string;
}

interface InterviewPrepRecord {
  id: string;
  type: 'interview_prep';
  fileName: string;
  targetRole: string;
  difficulty: string;
  createdAt: string;
}

export function HistoryPageClient() {
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [jdMatches, setJdMatches] = useState<JDMatchRecord[]>([]);
  const [interviewPreps, setInterviewPreps] = useState<InterviewPrepRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        if (!response?.ok) {
          throw new Error('Failed to fetch history');
        }
        const data = await response.json();
        setAnalyses(data?.analyses ?? []);
        setJdMatches(data?.jdMatches ?? []);
        setInterviewPreps(data?.interviewPreps ?? []);
      } catch (err: any) {
        console.error('History fetch error:', err);
        setError(err?.message ?? 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getScoreColor = (score: number) => {
    const s = score ?? 0;
    if (s >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (s >= 60) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (s >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Analysis History
        </h1>
        <p className="text-muted-foreground text-lg">
          Review all past resume analyses and track progress over time
        </p>
      </motion.div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={() => window?.location?.reload?.()}
            className="px-5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium text-sm hover:bg-muted/50"
          >
            Try Again
          </button>
        </div>
      ) : (
        <Tabs defaultValue="analyses" className="w-full">
          <TabsList className="flex w-full sm:w-auto bg-card border border-border/50 rounded-xl p-1 mb-8">
            <TabsTrigger value="analyses" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <FileText className="w-4 h-4" /> Resume Analysis
            </TabsTrigger>
            <TabsTrigger value="jd-matches" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Target className="w-4 h-4" /> JD Matches
            </TabsTrigger>
            <TabsTrigger value="interview-prep" className="flex-1 sm:flex-none gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <MessageSquare className="w-4 h-4" /> Interview Prep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyses" className="mt-0">
            {analyses.length === 0 ? (
              <EmptyState title="No analyses yet" description="Upload your first resume to get started" link="/analyze" icon={FileText} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <AnimatePresence>
                  {analyses.map((analysis, index) => (
                    <motion.div
                      key={analysis.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 cursor-default"
                      style={{ boxShadow: 'var(--shadow-md)' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{analysis.fileName}</h3>
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(analysis.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {analysis.targetRole}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${getScoreColor(analysis.score)}`}>
                          {analysis.score}/100
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.strengths.slice(0, 3).map((s, i) => (
                          <span key={i} className="px-2 py-1 rounded-md bg-green-500/8 text-green-400 text-xs font-medium border border-green-500/15">
                            {s}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="jd-matches" className="mt-0">
            {jdMatches.length === 0 ? (
              <EmptyState title="No JD matches yet" description="Compare your resume against a JD to see history here" link="/jd-matcher" icon={Target} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jdMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                    style={{ boxShadow: 'var(--shadow-md)' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{match.fileName}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(match.createdAt)}
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg border font-mono text-sm font-bold ${getScoreColor(match.overallMatch)}`}>
                        {match.overallMatch}%
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                      {match.recommendation}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="interview-prep" className="mt-0">
            {interviewPreps.length === 0 ? (
              <EmptyState title="No interview preps yet" description="Generate interview questions to see them here" link="/interview-prep" icon={MessageSquare} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {interviewPreps.map((prep, index) => (
                  <motion.div
                    key={prep.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                    style={{ boxShadow: 'var(--shadow-md)' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{prep.fileName}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(prep.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {prep.targetRole}
                          </span>
                        </div>
                      </div>
                      <Badge className="capitalize bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {prep.difficulty}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EmptyState({ title, description, link, icon: Icon }: { title: string, description: string, link: string, icon: any }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Link href={link}>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white font-semibold shadow-lg shadow-primary/25"
        >
          Get Started
        </motion.button>
      </Link>
    </motion.div>
  );
}
