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

// 🔍 Detect transport mode
function detectTransportMode(text) {
  if (/iata/i.test(text)) return "AIR";
  if (/imdg/i.test(text)) return "SEA";
  if (/adr|rid/i.test(text)) return "GROUND";
  return "";
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const jobId = req.headers["x-job-id"];

    if (!jobId) {
      return res.status(400).json({ error: "Missing job ID" });
    }

    // 📥 receber arquivo
    const buffers = [];

    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => buffers.push(chunk));
      req.on("end", resolve);
      req.on("error", reject);
    });

    const fileBuffer = Buffer.concat(buffers);

    // 📄 extrair texto do PDF
    const pdfData = await pdfParse(fileBuffer);
    const fullText = pdfData.text;

    console.log("PDF LENGTH:", fullText.length);

    // 🧠 pegar parte relevante
    const relevantText = fullText.slice(0, 15000);

    // 🔥 FLASH POINT (regex forte)
    const flashMatch = fullText.match(
      /(flash point|fp|closed cup|pensky)[^0-9\-<]{0,30}([<]?\s?\d+(\.\d+)?\s?°?\s?[CF])/i
    );

    const detectedFlashPoint = flashMatch
      ? flashMatch[2].replace(/\s+/g, "")
      : "";

    console.log("FLASH DETECTED:", detectedFlashPoint);

    // 🚛 TRANSPORT MODE
    const detectedTransport = detectTransportMode(fullText);

    console.log("TRANSPORT DETECTED:", detectedTransport);

    // 🧹 LIMPAR DADOS ANTIGOS (ANTI BUG)
    await supabase
      .from("jobs")
      .update({
        un_number: "",
        technical_name: "",
        hazard_class: "",
        subsidiary_risk: "",
        packing_group: "",
        flash_point: "",
        ems: "",
        transport_mode: "",
      })
      .eq("id", jobId);

    // 🧠 PROMPT
    const prompt = `
You are a dangerous goods classification expert.

Extract data from this SDS.

IMPORTANT:
- Transport mode must be AIR, SEA or GROUND
- IMDG = SEA
- IATA = AIR
- ADR/RID = GROUND

Flash point may appear as:
Flash Point, FP, Closed Cup, Pensky

Return ONLY JSON.

{
  "un_number": "",
  "technical_name": "",
  "hazard_class": "",
  "subsidiary_risk": "",
  "packing_group": "",
  "flash_point": "",
  "ems": "",
  "transport_mode": ""
}

Detected flash point: ${detectedFlashPoint}
Detected transport: ${detectedTransport}

SDS TEXT:
${relevantText}
`;

    // 🤖 IA
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

    console.log("PARSED:", result);

    // 🔥 fallback inteligente
    if (!result.flash_point && detectedFlashPoint) {
      result.flash_point = detectedFlashPoint;
    }

    if (!result.transport_mode && detectedTransport) {
      result.transport_mode = detectedTransport;
    }

    // 💾 salvar no banco
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
        transport_mode: result.transport_mode || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    console.log("DB ERROR:", error);

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
