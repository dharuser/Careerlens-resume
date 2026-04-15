"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  RotateCcw,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Compass,
  Target,
  Lightbulb,
  Loader2,
  Cpu,
  Zap,
  Layout,
  BookOpen,
  PlusCircle,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ScoreCircle } from "./score-circle";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

import Link from 'next/link';

interface CareerPath {
  title: string;
  description: string;
  match_percent: number;
}

interface JobMatch {
  role: string;
  fit_percent: number;
}

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  career_paths: CareerPath[];
  job_matches: JobMatch[];
  tips: string[];
  ats_score?: number;
  keyword_match?: number;
  format_score?: number;
  readability_score?: number;
  ats_issues?: string[];
  ats_fixes?: string[];
  missing_keywords?: string[];
}

interface Props {
  result: AnalysisResult;
  fileName: string;
  targetRole: string;
  analysisId: string | null;
  onReset: () => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45 },
  }),
};

export function ResultsDashboard({
  result,
  fileName,
  targetRole,
  analysisId,
  onReset,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.05 });

  const safeResult = {
    score: result?.score ?? 0,
    strengths: result?.strengths ?? [],
    weaknesses: result?.weaknesses ?? [],
    missing_skills: result?.missing_skills ?? [],
    career_paths: result?.career_paths ?? [],
    job_matches: result?.job_matches ?? [],
    tips: result?.tips ?? [],
    ats_score: result?.ats_score ?? 0,
    keyword_match: result?.keyword_match ?? 0,
    format_score: result?.format_score ?? 0,
    readability_score: result?.readability_score ?? 0,
    ats_issues: result?.ats_issues ?? [],
    ats_fixes: result?.ats_fixes ?? [],
    missing_keywords: result?.missing_keywords ?? [],
  };

  const handleDownloadPDF = async () => {
    if (!analysisId) {
      toast.error("No analysis ID found");
      return;
    }
    setDownloading(true);
    try {
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      });
      if (!response?.ok) {
        const err = await response
          ?.json?.()
          .catch(() => ({ error: "Download failed" }));
        throw new Error(err?.error ?? "Download failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careerlens-analysis-${fileName?.replace?.(".pdf", "") ?? "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error(err?.message ?? "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div ref={ref}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Analysis Results
          </h1>
          <p className="text-muted-foreground mt-1">
            {fileName} • Target:{" "}
            <span className="text-primary font-medium">{targetRole}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white font-medium text-sm shadow-md disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloading ? "Generating..." : "Download PDF"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium text-sm hover:bg-muted/50"
          >
            <RotateCcw className="w-4 h-4" /> New Analysis
          </motion.button>
        </div>
      </div>

      {/* Score + Strengths/Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <motion.div
          custom={0}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <h3 className="font-display text-lg font-semibold mb-4">
            Resume Score
          </h3>
          <ScoreCircle score={safeResult.score} />
          <p className="text-sm text-muted-foreground mt-4">
            {safeResult.score >= 80
              ? "Excellent"
              : safeResult.score >= 60
                ? "Good"
                : safeResult.score >= 40
                  ? "Average"
                  : "Needs Work"}
          </p>
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="p-6 rounded-2xl bg-card border border-border/50"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="font-display text-lg font-semibold">Strengths</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {safeResult.strengths?.map?.((s: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20"
              >
                {s ?? ""}
              </span>
            )) ?? []}
          </div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="p-6 rounded-2xl bg-card border border-border/50"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-400" />
            <h3 className="font-display text-lg font-semibold">Weaknesses</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {safeResult.weaknesses?.map?.((w: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium border border-red-500/20"
              >
                {w ?? ""}
              </span>
            )) ?? []}
          </div>
        </motion.div>
      </div>

      {/* ATS Compatibility Score */}
      <motion.div
        custom={3}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">
              ATS Compatibility Score
            </h3>
            <p className="text-sm text-muted-foreground">
              AI scan for Applicant Tracking System compatibility
            </p>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-3xl font-display font-bold text-primary">
              {safeResult.ats_score}%
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              Overall ATS Score
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-400" /> Keyword Match
              </span>
              <span className="font-bold">{safeResult.keyword_match}%</span>
            </div>
            <Progress
              value={safeResult.keyword_match}
              className="h-2 bg-muted"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Layout className="w-4 h-4 text-blue-400" /> Format Score
              </span>
              <span className="font-bold">{safeResult.format_score}%</span>
            </div>
            <Progress
              value={safeResult.format_score}
              className="h-2 bg-muted"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="w-4 h-4 text-green-400" /> Readability
              </span>
              <span className="font-bold">{safeResult.readability_score}%</span>
            </div>
            <Progress
              value={safeResult.readability_score}
              className="h-2 bg-muted"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> ATS Issues
            </h4>
            <div className="flex flex-wrap gap-2">
              {safeResult.ats_issues?.map?.((issue: string, i: number) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                >
                  {issue}
                </Badge>
              )) ?? []}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
            <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
              <PlusCircle className="w-4 h-4" /> ATS Fixes
            </h4>
            <div className="flex flex-wrap gap-2">
              {safeResult.ats_fixes?.map?.((fix: string, i: number) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                >
                  {fix}
                </Badge>
              )) ?? []}
            </div>
          </div>
        </div>

        {safeResult.missing_keywords &&
          safeResult.missing_keywords.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <h4 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Missing Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {safeResult.missing_keywords?.map?.(
                  (keyword: string, i: number) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
                    >
                      {keyword}
                    </Badge>
                  ),
                ) ?? []}
              </div>
            </div>
          )}
      </motion.div>

      {/* Missing Skills */}
      <motion.div
        custom={3}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="font-display text-lg font-semibold">
            Missing Skills for {targetRole}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {safeResult.missing_skills?.map?.((skill: string, i: number) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium border border-orange-500/20"
            >
              {skill ?? ""}
            </span>
          )) ?? []}
        </div>
      </motion.div>

      {/* Career Paths + Job Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          custom={4}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="p-6 rounded-2xl bg-card border border-border/50"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Compass className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">
              Career Path Recommendations
            </h3>
          </div>
          <div className="space-y-4">
            {safeResult.career_paths?.map?.((path: CareerPath, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-muted/30 border border-border/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">
                    {path?.title ?? ""}
                  </h4>
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {path?.match_percent ?? 0}% match
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {path?.description ?? ""}
                </p>
              </div>
            )) ?? []}
          </div>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeInUp}
          className="p-6 rounded-2xl bg-card border border-border/50"
          style={{ boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-secondary" />
            <h3 className="font-display text-lg font-semibold">
              Job Role Matches
            </h3>
          </div>
          <div className="space-y-4">
            {safeResult.job_matches?.map?.((match: JobMatch, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {match?.role ?? ""}
                  </span>
                  <span className="text-sm font-mono font-bold text-foreground">
                    {match?.fit_percent ?? 0}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(to right, #7C3AED, #3B82F6)`,
                    }}
                    initial={{ width: "0%" }}
                    animate={
                      inView
                        ? { width: `${match?.fit_percent ?? 0}%` }
                        : { width: "0%" }
                    }
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>
            )) ?? []}
          </div>
        </motion.div>
      </div>

      {/* Improvement Tips */}
      <motion.div
        custom={6}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={fadeInUp}
        className="p-6 rounded-2xl bg-card border border-border/50"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="font-display text-lg font-semibold">
            Improvement Tips
          </h3>
        </div>
        <div className="space-y-3">
          {safeResult.tips?.map?.((tip: string, i: number) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/20"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
                {i + 1}
              </span>
              <p className="text-sm text-foreground leading-relaxed pt-1">
                {tip ?? ""}
              </p>
            </div>
          )) ?? []}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        custom={7}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        variants={fadeInUp}
        className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-[#7C3AED]/10 to-[#3B82F6]/10 border border-primary/20 text-center"
      >
        <h3 className="font-display text-2xl font-bold mb-3">Ready to take the next step?</h3>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Use your analyzed resume to match specific job descriptions or prepare for your upcoming interviews with AI-generated questions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/jd-matcher">
            <Button size="lg" className="rounded-xl px-8 py-6 bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Target className="w-5 h-5 mr-2" /> Match with a Job
            </Button>
          </Link>
          <Link href="/interview-prep">
            <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 border-primary/30 text-primary hover:bg-primary/5">
              <MessageSquare className="w-5 h-5 mr-2" /> Prepare for Interview
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
