import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const SYSTEM_PROMPT = `You are an expert recruiter. Compare this resume against the job description and return ONLY this JSON:
{
  "overall_match": <number 0-100>,
  "skill_match": <number 0-100>,
  "experience_match": <number 0-100>,
  "education_match": <number 0-100>,
  "matched_keywords": [<list of keywords found in both resume and JD>],
  "missing_keywords": [<list of important JD keywords not in resume>],
  "strong_points": [<list of 3-4 reasons this candidate fits the role>],
  "weak_points": [<list of 3-4 gaps between resume and JD>],
  "recommendation": "<Highly Recommended | Recommended | Needs Improvement | Not Suitable>",
  "summary": "<2 sentence recruiter summary of this candidate for this role>"
}
Return nothing else. Pure JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const { resume_text, job_description, fileName } = await request.json();

    if (!resume_text || !job_description) {
      return new Response(
        JSON.stringify({
          error: "Resume text and job description are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Resume Content:\n${resume_text}\n\nJob Description:\n${job_description}`,
      },
    ];

    const llmResponse = await fetch(
      "https://apps.abacus.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-5.4-mini",
          messages,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      },
    );

    if (!llmResponse?.ok) {
      const errText = await llmResponse
        ?.text?.()
        .catch(() => "Unknown LLM error");
      console.error("LLM API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI analysis service failed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await llmResponse.json();
    let resultText = data?.choices?.[0]?.message?.content ?? "";

    if (resultText?.startsWith("```")) {
      resultText =
        resultText
          ?.replace(/^```(?:json)?\s*/i, "")
          ?.replace(/```\s*$/, "")
          ?.trim() ?? "";
    }

    const finalResult = JSON.parse(resultText);

    // Save to database (optional)
    let matchId = null;
    try {
      const match = await prisma.jDMatch.create({
        data: {
          fileName: fileName || "Uploaded Resume",
          jobDescription: job_description,
          overallMatch: Number(finalResult?.overall_match ?? 0),
          skillMatch: Number(finalResult?.skill_match ?? 0),
          experienceMatch: Number(finalResult?.experience_match ?? 0),
          educationMatch: Number(finalResult?.education_match ?? 0),
          matchedKeywords: finalResult?.matched_keywords ?? [],
          missingKeywords: finalResult?.missing_keywords ?? [],
          strongPoints: finalResult?.strong_points ?? [],
          weakPoints: finalResult?.weak_points ?? [],
          recommendation: finalResult?.recommendation ?? "Not Specified",
          summary: finalResult?.summary ?? "",
        },
      });
      matchId = match.id;
    } catch (dbErr) {
      console.error("Database save failed:", dbErr);
      // Continue even if DB save fails
    }

    return new Response(JSON.stringify({ result: finalResult, id: matchId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("JD Match error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
