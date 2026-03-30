import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// extrair seção (robusto)
function extractSection(text, sectionNumber) {
  const regex = new RegExp(
    `(SECTION|Section|Seção|SEÇÃO)\\s*${sectionNumber}[\\s\\S]*?(?=SECTION|Section|Seção|SEÇÃO|$)`,
    "i"
  );
  const match = text.match(regex);
  return match ? match[0] : "";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const buffers = [];

    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => buffers.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const fileBuffer = Buffer.concat(buffers);

    // 📄 ler PDF
    const pdfData = await pdfParse(fileBuffer);
    const fullText = pdfData.text;

    console.log("PDF TEXT LENGTH:", fullText.length);

    // 🔍 extrair seções
    const relevantText = fullText.slice(0, 15000);

    console.log("SECTION 14:", section14.slice(0, 300));
    console.log("SECTION 9:", section9.slice(0, 300));

    // 🧠 PROMPT
   const prompt = `
You are a dangerous goods classification expert.

From the SDS text below, extract transport and chemical safety data.

Focus on:
- UN number
- Proper Shipping Name (technical name)
- Hazard Class
- Subsidiary Risk
- Packing Group
- Flash Point
- EMS code

Return ONLY JSON.

If not found, return "".

{
  "un_number": "",
  "technical_name": "",
  "hazard_class": "",
  "subsidiary_risk": "",
  "packing_group": "",
  "flash_point": "",
  "ems": ""
}

SDS TEXT:
${relevantText}
`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = response.choices[0].message.content;

    console.log("AI RAW:", raw);

    let result;

    try {
      result = JSON.parse(raw);
    } catch (err) {
      console.error("JSON ERROR:", err);
      return res.status(500).json({
        error: "Invalid JSON from AI",
        raw,
      });
    }

    console.log("PARSED RESULT:", result);

    const jobId = req.headers["x-job-id"];

    if (jobId) {
      const { error } = await supabase
        .from("jobs")
        .update({
          un_number: result.un_number || "",
          technical_name: result.technical_name || "",
          hazard_class: result.hazard_class || "",
          subsidiary_risk: result.subsidiary_risk || "",
          packing_group: result.packing_group || "",
          flash_point: result.flash_point || "",
          ems: result.ems || "",
        })
        .eq("id", jobId);

      console.log("DB ERROR:", error);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("🔥 ERROR:", error);
    return res.status(500).json({
      error: error.message,
    });
  }
}
