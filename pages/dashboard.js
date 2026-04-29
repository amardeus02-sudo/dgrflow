import OpenAI from "openai";
import { supabase } from "../../lib/supabaseClient";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {

  try {

    console.log("🚀 CLASSIFY START");

    // METHOD
    if (req.method !== "POST") {

      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    // BODY
    console.log("BODY:", req.body);

    const { jobId } = req.body;

    if (!jobId) {

      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    // API KEY
    console.log(
      "OPENAI KEY:",
      process.env.OPENAI_API_KEY
        ? "FOUND"
        : "MISSING"
    );

    // FETCH JOB
    const {
      data: job,
      error: jobError,
    } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {

      console.error("JOB ERROR:", jobError);

      return res.status(404).json({
        error: "Job not found",
      });
    }

    console.log("JOB FOUND");

    // SDS TEXT
    const sdsText =
      job.sds_text ||
      job.raw_text ||
      "";

    if (!sdsText) {

      console.error("NO SDS TEXT");

      return res.status(400).json({
        error: "No SDS text found",
      });
    }

    // CLEAN TEXT
    const cleanText = sdsText
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/�/g, "")
      .trim()
      .slice(0, 12000);

    console.log(
      "TEXT LENGTH:",
      cleanText.length
    );

    // PROMPT
    const prompt = `
You are a dangerous goods specialist.

Analyze ONLY this SDS.

Return ONLY valid JSON.

NO markdown.
NO explanation.
NO comments.

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

    console.log("CALLING OPENAI");

    // OPENAI
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

    console.log("OPENAI RESPONSE OK");

    // RAW RESPONSE
    const raw =
      completion
        .choices?.[0]
        ?.message
        ?.content || "";

    console.log("RAW AI RESPONSE:");
    console.log(raw);

    // PARSE
    let parsed;

    try {

      parsed = JSON.parse(raw);

    } catch (jsonErr) {

      console.error(
        "JSON PARSE ERROR:",
        jsonErr
      );

      return res.status(500).json({
        error: "Invalid AI JSON",
        raw,
      });
    }

    console.log("JSON PARSED");

    // FLASH POINT FALLBACK
    if (!parsed.flash_point) {

      const flashRegex =
        /flash point[:\s]*([\-0-9\.]+\s?[CF]?)/i;

      const match =
        cleanText.match(flashRegex);

      if (match) {

        parsed.flash_point =
          match[1];
      }
    }

    // TRANSPORT MODE
    const lower =
      cleanText.toLowerCase();

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
      parsed.transport_mode =
        "GROUND";
    }

    // SAVE TO DB
    const {
      error: updateError,
    } = await supabase
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

      console.error(
        "UPDATE ERROR:",
        updateError
      );

      return res.status(500).json({
        error:
          updateError.message,
      });
    }

    console.log("JOB UPDATED");

    return res.status(200).json({
      success: true,
      data: parsed,
    });

  } catch (err) {

    console.error(
      "🚨 CLASSIFY ERROR:"
    );

    console.error(err);

    return res.status(500).json({
      error:
        err?.message ||
        "Classification failed",
    });
  }
}
```
