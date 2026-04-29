import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
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
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed",
      });
    }

    const jobId = req.headers["x-job-id"];

    console.log("JOB ID:", jobId);

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    const { files } = await parseForm(req);

    console.log("FILES:", files);

    const uploadedFile = files.file?.[0] || files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        error: "No uploaded file found",
      });
    }

    const filePath = uploadedFile.filepath;

    console.log("FILE PATH:", filePath);

    const pdfBuffer = fs.readFileSync(filePath);

    const parsed = await pdfParse(pdfBuffer);

    let text = parsed.text || "";

    text = text
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/�/g, "")
      .trim()
      .slice(0, 15000);

    console.log("TEXT LENGTH:", text.length);

    if (!text || text.length < 20) {
      return res.status(400).json({
        error: "Could not extract text from PDF",
      });
    }

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
    console.error("READ SDS ERROR:", err);

    return res.status(500).json({
      error: err.message || "Read SDS failed",
    });
  }
}
