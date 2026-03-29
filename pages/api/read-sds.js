import { OpenAI } from "openai";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";

function extractSections(text) {
  const section9 = text.split(/section\s*9/i)[1]?.split(/section\s*10/i)[0] || "";
  const section14 = text.split(/section\s*14/i)[1]?.split(/section\s*15/i)[0] || "";

  return {
    section9: section9.slice(0, 5000),
    section14: section14.slice(0, 5000),
  };
}

export default async function handler(req, res) {
  try {
    const { filePath, jobId } = req.body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 📥 baixar SDS
    const { data } = await supabase.storage
      .from("sds-files")
      .download(filePath);

    const buffer = await data.arrayBuffer();

    // 📄 extrair texto
    const parsed = await pdfParse(Buffer.from(buffer));
    const fullText = parsed.text;

    // ✂️ pegar apenas seções importantes
    const { section9, section14 } = extractSections(fullText);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a dangerous goods specialist.

Extract ONLY from the provided SDS sections.

Return JSON in this exact format:

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

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return only JSON." },
        { role: "user", content: prompt },
      ],
    });

    let result;

    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch {
      return res.status(500).json({ error: "AI parse error" });
    }

    // 💾 salvar no banco
    await supabase
      .from("jobs")
      .update({
        un_number: result.un_number,
        technical_name: result.technical_name,
        hazard_class: result.hazard_class,
        subsidiary_risk: result.subsidiary_risk,
        packing_group: result.packing_group,
        flash_point: result.flash_point,
        ems: result.ems,
      })
      .eq("id", jobId);

    res.status(200).json({ success: true, result });

  } catch (err) {
    console.log("SDS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
