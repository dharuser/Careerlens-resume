export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { generatePresignedUploadUrl } from "@/lib/s3";

const SYSTEM_PROMPT = `You are an expert career counselor and HR professional with 20 years of experience. Analyze the following resume for the target job role and return ONLY a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "strengths": [<list of 4-5 strength strings>],
  "weaknesses": [<list of 3-4 weakness strings>],
  "missing_skills": [<list of 4-6 skills missing for the target role>],
  "career_paths": [{"title": "", "description": "", "match_percent": <number>}],
  "job_matches": [{"role": "", "fit_percent": <number>}],
  "tips": [<list of 5 actionable improvement tips>],
  "ats_score": <number 0-100>,
  "keyword_match": <number 0-100>,
  "format_score": <number 0-100>,
  "readability_score": <number 0-100>,
  "ats_issues": [<list of 3-5 specific ATS problems found>],
  "ats_fixes": [<list of 3-5 specific fixes to improve ATS score>],
  "missing_keywords": [<list of important keywords missing for the target role>]
}
Provide exactly 3 career paths and exactly 5 job matches.
Return nothing else. No explanation. Pure JSON only.`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetRole = (formData.get("targetRole") as string) ?? "";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (file?.type !== "application/pdf") {
      return new Response(
        JSON.stringify({ error: "Only PDF files are accepted" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if ((file?.size ?? 0) > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 5MB limit" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!targetRole?.trim()) {
      return new Response(
        JSON.stringify({ error: "Target role is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Upload file to S3
    let cloudStoragePath = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);
      const { uploadUrl, cloud_storage_path } =
        await generatePresignedUploadUrl(
          file?.name ?? "resume.pdf",
          "application/pdf",
          false,
        );
      cloudStoragePath = cloud_storage_path;

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: fileBuffer,
      });

      if (!uploadResponse?.ok) {
        console.error("S3 upload failed:", uploadResponse?.status);
      }
    } catch (uploadErr: any) {
      console.error("S3 upload error:", uploadErr);
      // Continue with analysis even if S3 upload fails
    }

    // Base64 encode PDF for LLM
    const base64Buffer = await file.arrayBuffer();
    const base64String = Buffer.from(base64Buffer).toString("base64");

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
        content: [
          {
            type: "file",
            file: {
              filename: file?.name ?? "resume.pdf",
              file_data: `data:application/pdf;base64,${base64String}`,
            },
          },
          {
            type: "text",
            text: `Analyze this resume for the target job role: "${targetRole.trim()}". Return the JSON analysis.`,
          },
        ],
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
          stream: true,
          max_tokens: 4000,
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
        JSON.stringify({
          error: "AI analysis service failed. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const reader = llmResponse?.body?.getReader();
    if (!reader) {
      return new Response(
        JSON.stringify({ error: "No response from AI service" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const fileName = file?.name ?? "resume.pdf";

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        let partialRead = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split("\n");
            partialRead = lines?.pop() ?? "";

            for (const line of lines ?? []) {
              if (line?.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  // Parse and save result
                  try {
                    let cleanBuffer = buffer?.trim() ?? "";
                    // Remove markdown code fences if present
                    if (cleanBuffer?.startsWith("```")) {
                      cleanBuffer =
                        cleanBuffer
                          ?.replace(/^```(?:json)?\s*/i, "")
                          ?.replace(/```\s*$/, "")
                          ?.trim() ?? "";
                    }
                    const finalResult = JSON.parse(cleanBuffer);

                    // Save to database
                    const analysis = await prisma.analysis.create({
                      data: {
                        fileName,
                        targetRole: targetRole?.trim() ?? "",
                        score: Number(finalResult?.score ?? 0),
                        strengths: finalResult?.strengths ?? [],
                        weaknesses: finalResult?.weaknesses ?? [],
                        missingSkills: finalResult?.missing_skills ?? [],
                        careerPaths: finalResult?.career_paths ?? [],
                        jobMatches: finalResult?.job_matches ?? [],
                        tips: finalResult?.tips ?? [],
                        atsScore: Number(finalResult?.ats_score ?? 0),
                        keywordMatch: Number(finalResult?.keyword_match ?? 0),
                        formatScore: Number(finalResult?.format_score ?? 0),
                        readabilityScore: Number(
                          finalResult?.readability_score ?? 0,
                        ),
                        atsIssues: finalResult?.ats_issues ?? [],
                        atsFixes: finalResult?.ats_fixes ?? [],
                        missingKeywords: finalResult?.missing_keywords ?? [],
                        cloudStoragePath: cloudStoragePath || null,
                        isPublic: false,
                      },
                    });

                    const finalData = JSON.stringify({
                      status: "completed",
                      result: finalResult,
                      analysisId: analysis?.id ?? null,
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${finalData}\n\n`),
                    );
                  } catch (parseErr: any) {
                    console.error(
                      "JSON parse error:",
                      parseErr,
                      "Buffer:",
                      buffer?.substring?.(0, 500),
                    );
                    const errorData = JSON.stringify({
                      status: "error",
                      message: "Failed to parse AI response. Please try again.",
                    });
                    controller.enqueue(
                      encoder.encode(`data: ${errorData}\n\n`),
                    );
                  }
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed?.choices?.[0]?.delta?.content ?? "";
                  buffer += content;

                  const progressData = JSON.stringify({
                    status: "processing",
                    message: "Analyzing resume...",
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${progressData}\n\n`),
                  );
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }

          // If we get here without [DONE], try to parse what we have
          if (buffer?.trim()) {
            try {
              let cleanBuffer = buffer?.trim() ?? "";
              if (cleanBuffer?.startsWith("```")) {
                cleanBuffer =
                  cleanBuffer
                    ?.replace(/^```(?:json)?\s*/i, "")
                    ?.replace(/```\s*$/, "")
                    ?.trim() ?? "";
              }
              const finalResult = JSON.parse(cleanBuffer);

              const analysis = await prisma.analysis.create({
                data: {
                  fileName,
                  targetRole: targetRole?.trim() ?? "",
                  score: Number(finalResult?.score ?? 0),
                  strengths: finalResult?.strengths ?? [],
                  weaknesses: finalResult?.weaknesses ?? [],
                  missingSkills: finalResult?.missing_skills ?? [],
                  careerPaths: finalResult?.career_paths ?? [],
                  jobMatches: finalResult?.job_matches ?? [],
                  tips: finalResult?.tips ?? [],
                  atsScore: Number(finalResult?.ats_score ?? 0),
                  keywordMatch: Number(finalResult?.keyword_match ?? 0),
                  formatScore: Number(finalResult?.format_score ?? 0),
                  readabilityScore: Number(finalResult?.readability_score ?? 0),
                  atsIssues: finalResult?.ats_issues ?? [],
                  atsFixes: finalResult?.ats_fixes ?? [],
                  missingKeywords: finalResult?.missing_keywords ?? [],
                  cloudStoragePath: cloudStoragePath || null,
                  isPublic: false,
                },
              });

              const finalData = JSON.stringify({
                status: "completed",
                result: finalResult,
                analysisId: analysis?.id ?? null,
              });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch (parseErr: any) {
              console.error("Final parse error:", parseErr);
              const errorData = JSON.stringify({
                status: "error",
                message: "Failed to parse AI response. Please try again.",
              });
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            }
          }

          controller.close();
        } catch (streamErr: any) {
          console.error("Stream error:", streamErr);
          try {
            const errorData = JSON.stringify({
              status: "error",
              message: "Analysis stream failed. Please try again.",
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } catch {}
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Analyze error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
