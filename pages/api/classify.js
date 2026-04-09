import { supabase } from "../../lib/supabaseClient";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    // 🔥 pega do banco (fonte única)
    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !job?.sds_text) {
      return res.status(400).json({ error: "No SDS text found" });
    }

    const prompt = `
Extract dangerous goods classification from this SDS.

Return ONLY valid JSON:

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
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    let resultText = completion.choices[0].message.content;

    // 🔥 segurança JSON
    resultText = resultText.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    // 🔥 fallback flash point
    if (!result.flash_point) {
      const match = job.sds_text.match(/flash point[:\s]*([\d\.]+\s?[CF])/i);
      if (match) result.flash_point = match[1];
    }

    // salvar no banco
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        ...result,
        status: "classified",
      })
      .eq("id", jobId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Classification failed" });
  }
}
