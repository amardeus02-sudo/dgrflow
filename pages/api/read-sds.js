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

    const buffers = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const fileBuffer = Buffer.concat(buffers);

    const pdfData = await pdfParse(fileBuffer);

    let text = pdfData.text;

    // 🔥 limpeza forte (anti-SDS herdado)
    text = text
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .trim()
      .slice(0, 15000);

    // salvar no banco
    const { error } = await supabase
      .from("jobs")
      .update({
        sds_text: text,
        status: "parsed",
      })
      .eq("id", jobId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to read SDS" });
  }
}
