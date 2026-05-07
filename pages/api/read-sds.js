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
    console.log("START READ SDS");

    // Optional job ID
    const jobId = req.headers["x-job-id"] || null;

    console.log("JOB ID:", jobId);

    // Parse upload form
    const { files } = await parseForm(req);

    // Get uploaded file
    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : files.file;

    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    console.log(
      "FILE:",
      uploadedFile.originalFilename
    );

    // Read PDF buffer
    const dataBuffer = fs.readFileSync(
      uploadedFile.filepath
    );

    // Parse PDF
    const parsed = await pdf(dataBuffer);

    let text = parsed.text || "";

    console.log(
      "RAW TEXT LENGTH:",
      text.length
    );

    // Cleanup text
    text = text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/�/g, "")
      .trim()
      .slice(0, 15000);

    console.log(
      "CLEAN TEXT LENGTH:",
      text.length
    );

    // Validate readable text
    if (!text || text.length < 30) {
      return res.status(400).json({
        success: false,
        error: "PDF has no readable text",
      });
    }

    // Save to Supabase only if jobId exists
    if (jobId) {
      const { error } = await supabase
        .from("jobs")
        .update({
          sds_text: text,
          file_name:
            uploadedFile.originalFilename,
          status: "parsed",
        })
        .eq("id", jobId);

      if (error) {
        console.error(
          "SUPABASE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: "SDS parsed successfully",
      fileName:
        uploadedFile.originalFilename,
      textLength: text.length,
      preview: text.slice(0, 1000),
      savedToSupabase: !!jobId,
    });

  } catch (err) {
    console.error("READ SDS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: "PDF processing failed",
      details: err.message,
    });
  }
}
