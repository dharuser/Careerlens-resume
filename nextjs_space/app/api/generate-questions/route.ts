import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

const SYSTEM_PROMPT = `You are a senior technical interviewer. Based on this resume and target role, generate personalized interview questions and return ONLY this JSON:
{
  "technical_questions": [
    {"question": "", "why_asked": "", "tip": ""}
  ],
  "behavioral_questions": [
    {"question": "", "why_asked": "", "tip": ""}
  ],
  "resume_specific_questions": [
    {"question": "", "why_asked": "", "tip": ""}
  ],
  "tricky_questions": [
    {"question": "", "why_asked": "", "tip": ""}
  ]
}
Generate 4 questions per category (16 total). Return nothing else. Pure JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const { resume_text, target_role, difficulty, fileName } = await request.json();

    if (!resume_text || !target_role) {
      return new Response(JSON.stringify({ error: 'Resume text and target role are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Resume Content:\n${resume_text}\n\nTarget Role: ${target_role}\nDifficulty: ${difficulty || 'medium'}`,
      },
    ];

    const llmResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmResponse?.ok) {
      const errText = await llmResponse?.text?.().catch(() => 'Unknown LLM error');
      console.error('LLM API error:', errText);
      return new Response(JSON.stringify({ error: 'AI analysis service failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await llmResponse.json();
    let resultText = data?.choices?.[0]?.message?.content ?? '';
    
    if (resultText?.startsWith('```')) {
        resultText = resultText?.replace(/^```(?:json)?\s*/i, '')?.replace(/```\s*$/, '')?.trim() ?? '';
    }
    
    const finalResult = JSON.parse(resultText);

    // Save to database
    const prep = await prisma.interviewPrep.create({
      data: {
        fileName: fileName || 'Uploaded Resume',
        targetRole: target_role,
        difficulty: difficulty || 'medium',
        questions: finalResult,
      },
    });

    return new Response(JSON.stringify({ result: finalResult, id: prep.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('Interview Prep error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
