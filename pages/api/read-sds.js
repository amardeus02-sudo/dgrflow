import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { supabase } from "../../lib/supabaseClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  try {
    const jobId = req.headers["x-job-id"];

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    const { files } = await parseForm(req);

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log("FILE:", uploadedFile.originalFilename);

    const dataBuffer = fs.readFileSync(
      uploadedFile.filepath
    );

    // 🔥 parse PDF
    const parsed = await pdf(dataBuffer);

    let text = parsed.text || "";

    console.log("RAW TEXT LENGTH:", text.length);

    // 🔥 limpeza pesada
    text = text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/�/g, "")
      .trim()
      .slice(0, 15000);

    console.log("CLEAN TEXT LENGTH:", text.length);

    if (!text || text.length < 30) {
      return res.status(400).json({
        error: "PDF has no readable text",
      });
    }

    // 🔥 salvar SDS
    const { error } = await supabase
      .from("jobs")
      .update({
        sds_text: text,
        file_name: uploadedFile.originalFilename,
        status: "parsed",
      })
      .eq("id", jobId);

    if (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      textLength: text.length,
    });

  } catch (err) {
    console.error("PDF ERROR:", err);

    return res.status(500).json({
      error: "PDF processing failed",
      details: err.message,
    });
  }
}
