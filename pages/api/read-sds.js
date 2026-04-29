import formidable from "formidable";
import fs from "fs";
import pdfParse from "pdf-parse";
import { supabase } from "../../lib/supabaseClient";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const jobId = req.headers["x-job-id"];

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Form parse error",
          });
        }

        const file = files.file?.[0] || files.file;

        if (!file) {
          return res.status(400).json({
            error: "No file uploaded",
          });
        }

        const dataBuffer = fs.readFileSync(file.filepath);

        const pdfData = await pdfParse(dataBuffer);

        let text = pdfData.text || "";

        // 🔥 limpeza anti-herança
        text = text
          .replace(/\s+/g, " ")
          .replace(/[^\x00-\x7F]/g, "")
          .trim()
          .slice(0, 15000);

        console.log("PDF TEXT LENGTH:", text.length);

        const { error } = await supabase
          .from("jobs")
          .update({
            sds_text: text,
            status: "parsed",
            file_name: file.originalFilename,
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

      } catch (innerErr) {
        console.error(innerErr);

        return res.status(500).json({
          error: "PDF processing failed",
        });
      }
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Read SDS failed",
    });
  }
}
