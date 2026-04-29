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
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const jobId = req.headers["x-job-id"];

    if (!jobId) {
      return res.status(400).json({
        error: "Missing jobId",
      });
    }

    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          console.error("FORM PARSE ERROR:", err);

          return res.status(500).json({
            error: "Form parse failed",
          });
        }

        const uploadedFile = Array.isArray(files.file)
          ? files.file[0]
          : files.file;

        if (!uploadedFile) {
          return res.status(400).json({
            error: "No file uploaded",
          });
        }

        const fileBuffer = fs.readFileSync(uploadedFile.filepath);

        const parsedPdf = await pdfParse(fileBuffer);

        let cleanText = parsedPdf.text || "";

        // 🔥 limpeza anti-herança
        cleanText = cleanText
          .replace(/\s+/g, " ")
          .replace(/[^\x00-\x7F]/g, "")
          .replace(/�/g, "")
          .trim()
          .slice(0, 15000);

        console.log("PDF PARSED");
        console.log("TEXT LENGTH:", cleanText.length);

        if (!cleanText || cleanText.length < 50) {
          return res.status(400).json({
            error: "PDF text extraction failed",
          });
        }

        const { error: updateError } = await supabase
          .from("jobs")
          .update({
            sds_text: cleanText,
            file_name: uploadedFile.originalFilename,
            status: "parsed",
          })
          .eq("id", jobId);

        if (updateError) {
          console.error("SUPABASE UPDATE ERROR:", updateError);

          return res.status(500).json({
            error: updateError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: "SDS parsed successfully",
          textLength: cleanText.length,
        });

      } catch (innerError) {
        console.error("INNER ERROR:", innerError);

        return res.status(500).json({
          error: "PDF processing failed",
        });
      }
    });

  } catch (error) {
    console.error("READ SDS ERROR:", error);

    return res.status(500).json({
      error: "Unexpected server error",
    });
  }
}
