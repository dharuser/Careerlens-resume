'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Search, Lightbulb, TrendingUp, Cpu, Target, MessageSquare } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Resume Analysis',
    description: 'Deep AI analysis of your resume content, structure, and relevance to your target role.',
    gradient: 'from-[#7C3AED] to-[#9333EA]',
  },
  {
    icon: Cpu,
    title: 'ATS Score',
    description: 'Check your resume compatibility with Applicant Tracking Systems and get improvement tips.',
    gradient: 'from-[#3B82F6] to-[#06B6D4]',
  },
  {
    icon: Target,
    title: 'JD Matcher',
    description: 'Compare your resume against any job description to see how well you fit the role.',
    gradient: 'from-[#10B981] to-[#34D399]',
  },
  {
    icon: MessageSquare,
    title: 'Interview Prep',
    description: 'Generate personalized interview questions and expert tips based on your resume.',
    gradient: 'from-[#F59E0B] to-[#D97706]',
  },
  {
    icon: Lightbulb,
    title: 'Career Paths',
    description: 'Get personalized career path recommendations and discover roles that match your profile.',
    gradient: 'from-[#EC4899] to-[#DB2777]',
  },
  {
    icon: TrendingUp,
    title: 'Actionable Tips',
    description: 'Receive actionable improvement tips and identify missing skills to boost your career prospects.',
    gradient: 'from-[#8B5CF6] to-[#6D28D9]',
  },
];

export function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section ref={ref} className="relative py-20 sm:py-28">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Powerful AI Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to optimize your resume and land your next job
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features?.map?.((feature: any, index: number) => {
            const Icon = feature?.icon;
            return (
              <motion.div
                key={feature?.title ?? index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature?.gradient ?? ''} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature?.title ?? ''}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature?.description ?? ''}</p>
              </motion.div>
            );
          }) ?? []}
        </div>
      </div>
    </section>
  );
}
