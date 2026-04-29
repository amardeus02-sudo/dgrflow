import { supabase } from "../../lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const { jobId } = req.body;

    console.log("CLASSIFY JOB:", jobId);

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    if (!job.sds_text) {
      return res.status(400).json({
        error: "No SDS text found",
      });
    }

    const prompt = `
Extract dangerous goods transport data from SDS.

Return ONLY valid JSON.

{
  "un_number": "",
  "technical_name": "",
  "hazard_class": "",
  "packing_group": "",
  "ems": "",
  "flash_point": "",
  "transport_mode": ""
}

SDS:
${job.sds_text}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let aiText = completion.choices[0].message.content;

    console.log("AI RESPONSE:", aiText);

    aiText = aiText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(aiText);
    } catch (jsonErr) {
      console.error("JSON ERROR:", jsonErr);

      return res.status(500).json({
        error: "AI returned invalid JSON",
      });
    }

    // 🔥 fallback flash point
    if (!parsed.flash_point) {
      const match = job.sds_text.match(
        /flash point[:\s]*([\d\.]+\s?[CF])/i
      );

      if (match) {
        parsed.flash_point = match[1];
      }
    }

    // 🔥 transport mode
    const sds = job.sds_text.toLowerCase();

    if (sds.includes("iata")) {
      parsed.transport_mode = "AIR";
    } else if (sds.includes("imdg")) {
      parsed.transport_mode = "SEA";
    } else if (
      sds.includes("adr") ||
      sds.includes("rid")
    ) {
      parsed.transport_mode = "GROUND";
    }

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        ...parsed,
        status: "classified",
      })
      .eq("id", jobId);

    if (updateError) {
      console.error(updateError);

      return res.status(500).json({
        error: updateError.message,
      });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("CLASSIFY ERROR:", err);

    return res.status(500).json({
      error: err.message || "Classification failed",
    });
  }
}
