import OpenAI from "openai";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
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

// função para extrair seções (funciona com vários formatos)
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

    // 📄 extrair texto do PDF
    const pdfData = await pdfParse(fileBuffer);
    const fullText = pdfData.text;

    console.log("PDF TEXT LENGTH:", fullText.length);

    // 🔍 extrair seções importantes
    const section14 = extractSection(fullText, 14);
    const section9 = extractSection(fullText, 9);

    console.log("SECTION 14:", section14.slice(0, 500));
    console.log("SECTION 9:", section9.slice(0, 500));

    // 🧠 PROMPT FORTE
    const prompt = `
You are a dangerous goods classification expert.

Extract ONLY from SDS Section 14 (Transport Information) and Section 9.

Return STRICT JSON only. No explanation.

If data is missing, return "".

JSON format:

{
  "un_number": "",
  "technical_name": "",
  "hazard_class": "",
  "subsidiary_risk": "",
  "packing_group": "",
  "flash_point": "",
  "ems": ""
}

SECTION 14:
${section14}

SECTION 9:
${section9}
`;

    // 🤖 chamar IA
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
      console.error("JSON PARSE ERROR:", err);
      return res.status(500).json({
        error: "AI did not return valid JSON",
        raw,
      });
    }

    console.log("PARSED RESULT:", result);

    // ⚠️ se não veio nada útil
    if (!result.un_number && !result.hazard_class) {
      console.log("⚠️ IA não encontrou dados relevantes");
    }

    // 🔥 SALVAR NO BANCO
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

      console.log("DB UPDATE ERROR:", error);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("🔥 ERROR:", error);
    return res.status(500).json({
      error: "Internal error",
      details: error.message,
    });
  }
}
