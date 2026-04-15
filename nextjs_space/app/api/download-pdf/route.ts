export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysisId = body?.analysisId;

    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID is required' }, { status: 400 });
    }

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const safeAnalysis = {
      fileName: analysis?.fileName ?? 'resume.pdf',
      targetRole: analysis?.targetRole ?? 'N/A',
      score: analysis?.score ?? 0,
      strengths: (analysis?.strengths as string[]) ?? [],
      weaknesses: (analysis?.weaknesses as string[]) ?? [],
      missingSkills: (analysis?.missingSkills as string[]) ?? [],
      careerPaths: (analysis?.careerPaths as any[]) ?? [],
      jobMatches: (analysis?.jobMatches as any[]) ?? [],
      tips: (analysis?.tips as string[]) ?? [],
      createdAt: analysis?.createdAt?.toISOString?.() ?? '',
    };

    const scoreColor = safeAnalysis.score >= 80 ? '#10B981' : safeAnalysis.score >= 60 ? '#3B82F6' : safeAnalysis.score >= 40 ? '#F59E0B' : '#EF4444';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; background: white; padding: 40px; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e5e5; }
    .header h1 { font-size: 28px; color: #7C3AED; margin-bottom: 8px; }
    .header p { font-size: 14px; color: #666; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; color: #555; }
    .score-section { text-align: center; margin-bottom: 32px; }
    .score-number { font-size: 56px; font-weight: bold; color: ${scoreColor}; }
    .score-label { font-size: 14px; color: #888; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 18px; margin-bottom: 12px; color: #1a1a2e; border-left: 4px solid #7C3AED; padding-left: 12px; }
    .badge-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; }
    .badge-green { background: #ECFDF5; color: #059669; }
    .badge-red { background: #FEF2F2; color: #DC2626; }
    .badge-orange { background: #FFF7ED; color: #EA580C; }
    .career-card { background: #F8F9FA; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
    .career-title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
    .career-desc { font-size: 13px; color: #555; }
    .career-match { font-size: 12px; color: #7C3AED; font-weight: 600; }
    .job-bar { margin-bottom: 10px; }
    .job-header { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    .bar-bg { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(to right, #7C3AED, #3B82F6); border-radius: 4px; }
    .tip { display: flex; gap: 10px; margin-bottom: 10px; font-size: 13px; }
    .tip-num { width: 24px; height: 24px; border-radius: 6px; background: #7C3AED; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CareerLens Analysis Report</h1>
    <p>AI-Powered Resume Analysis & Career Advisory</p>
  </div>
  <div class="meta">
    <span>File: ${safeAnalysis.fileName}</span>
    <span>Target Role: ${safeAnalysis.targetRole}</span>
    <span>Date: ${safeAnalysis.createdAt ? new Date(safeAnalysis.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
  </div>

  <div class="score-section">
    <div class="score-number">${safeAnalysis.score}/100</div>
    <div class="score-label">Resume Score</div>
  </div>

  <div class="section">
    <h2>Strengths</h2>
    <div class="badge-list">
      ${(safeAnalysis.strengths ?? [])?.map?.((s: string) => `<span class="badge badge-green">${s ?? ''}</span>`)?.join?.('') ?? ''}
    </div>
  </div>

  <div class="section">
    <h2>Weaknesses</h2>
    <div class="badge-list">
      ${(safeAnalysis.weaknesses ?? [])?.map?.((w: string) => `<span class="badge badge-red">${w ?? ''}</span>`)?.join?.('') ?? ''}
    </div>
  </div>

  <div class="section">
    <h2>Missing Skills</h2>
    <div class="badge-list">
      ${(safeAnalysis.missingSkills ?? [])?.map?.((s: string) => `<span class="badge badge-orange">${s ?? ''}</span>`)?.join?.('') ?? ''}
    </div>
  </div>

  <div class="section">
    <h2>Career Path Recommendations</h2>
    ${(safeAnalysis.careerPaths ?? [])?.map?.((cp: any) => `
      <div class="career-card">
        <div class="career-title">${cp?.title ?? ''} <span class="career-match">${cp?.match_percent ?? 0}% match</span></div>
        <div class="career-desc">${cp?.description ?? ''}</div>
      </div>
    `)?.join?.('') ?? ''}
  </div>

  <div class="section">
    <h2>Job Role Matches</h2>
    ${(safeAnalysis.jobMatches ?? [])?.map?.((jm: any) => `
      <div class="job-bar">
        <div class="job-header"><span>${jm?.role ?? ''}</span><span>${jm?.fit_percent ?? 0}%</span></div>
        <div class="bar-bg"><div class="bar-fill" style="width: ${jm?.fit_percent ?? 0}%"></div></div>
      </div>
    `)?.join?.('') ?? ''}
  </div>

  <div class="section">
    <h2>Improvement Tips</h2>
    ${(safeAnalysis.tips ?? [])?.map?.((t: string, i: number) => `
      <div class="tip">
        <div class="tip-num">${i + 1}</div>
        <div>${t ?? ''}</div>
      </div>
    `)?.join?.('') ?? ''}
  </div>

  <div class="footer">
    Generated by CareerLens – AI Resume Analyzer & Career Advisor
  </div>
</body>
</html>`;

    // Step 1: Create PDF request
    const createResponse = await fetch('https://apps.abacus.ai/api/createConvertHtmlToPdfRequest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        html_content: htmlContent,
        pdf_options: { format: 'A4', print_background: true },
        base_url: process.env.NEXTAUTH_URL ?? '',
      }),
    });

    if (!createResponse?.ok) {
      return NextResponse.json({ error: 'Failed to initiate PDF generation' }, { status: 500 });
    }

    const { request_id } = await createResponse.json();
    if (!request_id) {
      return NextResponse.json({ error: 'No request ID from PDF service' }, { status: 500 });
    }

    // Step 2: Poll for status
    const maxAttempts = 120;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const statusResponse = await fetch('https://apps.abacus.ai/api/getConvertHtmlToPdfStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: process.env.ABACUSAI_API_KEY }),
      });

      const statusResult = await statusResponse.json();
      const status = statusResult?.status ?? 'FAILED';
      const result = statusResult?.result ?? null;

      if (status === 'SUCCESS') {
        if (result?.result) {
          const pdfBuffer = Buffer.from(result.result, 'base64');
          return new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="careerlens-report.pdf"`,
            },
          });
        }
        return NextResponse.json({ error: 'PDF generated but no data returned' }, { status: 500 });
      } else if (status === 'FAILED') {
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
      }
      attempts++;
    }

    return NextResponse.json({ error: 'PDF generation timed out' }, { status: 500 });
  } catch (err: any) {
    console.error('Download PDF error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to generate PDF' }, { status: 500 });
  }
}
