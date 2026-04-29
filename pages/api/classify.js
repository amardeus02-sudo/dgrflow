import OpenAI from "openai";
import { supabase } from "../../lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

console.log("OPENAI KEY:", process.env.OPENAI_API_KEY);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    console.log("CLASSIFY JOB:", jobId);

    // 🔥 buscar job
    const { data: job, error: fetchError } =
      await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

    if (fetchError || !job) {
      console.error(fetchError);

      return res.status(404).json({
        error: "Job not found",
      });
    }

    if (!job.sds_text) {
      return res.status(400).json({
        error: "No SDS text found",
      });
    }

    // 🔥 limpar texto
    const cleanText = job.sds_text
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/�/g, "")
      .trim()
      .slice(0, 12000);

    // 🔥 prompt
    const prompt = `
You are a dangerous goods specialist.

Analyze ONLY this SDS.

Return ONLY valid JSON.

DO NOT explain.
DO NOT add markdown.
DO NOT add comments.

JSON FORMAT:

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

${cleanText}
`;

    // 🔥 OPENAI
    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const raw =
      completion.choices[0].message.content;

    console.log("AI RAW:", raw);

    let parsed;

    try {
      parsed = JSON.parse(raw);

    } catch (jsonErr) {
      console.error(jsonErr);

      return res.status(500).json({
        error: "Invalid AI JSON",
        raw,
      });
    }

    // 🔥 fallback flash point
    if (!parsed.flash_point) {
      const flashRegex =
        /flash point[:\s]*([\-0-9\.]+\s?[CF]?)/i;

      const match = cleanText.match(flashRegex);

      if (match) {
        parsed.flash_point = match[1];
      }
    }

    // 🔥 transport mode
    const lower = cleanText.toLowerCase();

    if (lower.includes("iata")) {
      parsed.transport_mode = "AIR";
    }

    if (lower.includes("imdg")) {
      parsed.transport_mode = "SEA";
    }

    if (
      lower.includes("adr") ||
      lower.includes("rid")
    ) {
      parsed.transport_mode = "GROUND";
    }

    // 🔥 salvar no banco
    const { error: updateError } =
      await supabase
        .from("jobs")
        .update({
          un_number:
            parsed.un_number || null,

          technical_name:
            parsed.technical_name || null,

          hazard_class:
            parsed.hazard_class || null,

          packing_group:
            parsed.packing_group || null,

          ems:
            parsed.ems || null,

          flash_point:
            parsed.flash_point || null,

          transport_mode:
            parsed.transport_mode || null,

          status: "classified",
        })
        .eq("id", jobId);

    if (updateError) {
      console.error(updateError);

      return res.status(500).json({
        error: updateError.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: parsed,
    });

  } catch (err) {
    console.error("CLASSIFY ERROR:", err);

    return res.status(500).json({
      error:
        err.message ||
        "Classification failed",
    });
  }
}
