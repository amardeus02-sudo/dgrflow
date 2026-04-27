import { supabase } from "../../lib/supabaseClient";
import pdfParse from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const jobId = req.headers["x-job-id"];

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    const pdf = await pdfParse(buffer);

    let text = pdf.text;

    // 🔥 limpeza (CRÍTICO)
    text = text
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .slice(0, 15000)
      .trim();

    const { error } = await supabase
      .from("jobs")
      .update({
        sds_text: text,
        status: "parsed",
      })
      .eq("id", jobId);

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read SDS" });
  }
}
