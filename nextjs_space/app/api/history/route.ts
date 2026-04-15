export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [analyses, jdMatches, interviewPreps] = await Promise.all([
      prisma.analysis.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.jDMatch.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.interviewPrep.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const safeAnalyses = (analyses ?? [])?.map?.((a: any) => ({
      id: a?.id ?? '',
      type: 'analysis',
      fileName: a?.fileName ?? '',
      targetRole: a?.targetRole ?? '',
      score: a?.score ?? 0,
      strengths: a?.strengths ?? [],
      createdAt: a?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })) ?? [];

    const safeJdMatches = (jdMatches ?? [])?.map?.((m: any) => ({
      id: m?.id ?? '',
      type: 'jd_match',
      fileName: m?.fileName ?? '',
      overallMatch: m?.overallMatch ?? 0,
      recommendation: m?.recommendation ?? '',
      createdAt: m?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })) ?? [];

    const safeInterviewPreps = (interviewPreps ?? [])?.map?.((p: any) => ({
      id: p?.id ?? '',
      type: 'interview_prep',
      fileName: p?.fileName ?? '',
      targetRole: p?.targetRole ?? '',
      difficulty: p?.difficulty ?? '',
      createdAt: p?.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })) ?? [];

    return NextResponse.json({ 
      analyses: safeAnalyses,
      jdMatches: safeJdMatches,
      interviewPreps: safeInterviewPreps
    });
  } catch (err: any) {
    console.error('History fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
