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

    const jobId = req.headers["x-job-id"] || null;

    const { files } = await parseForm(req);

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

    const dataBuffer = fs.readFileSync(
      uploadedFile.filepath
    );

    const parsed = await pdf(dataBuffer);

    let text = parsed.text || "";

    console.log("RAW PDF TEXT:");
    console.log(text.slice(0, 5000));

    text = text
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // EXTRACTION
    const unNumberMatch =
      text.match(/UN\s*(\d{4})/i);

    const hazardClassMatch =
      text.match(
        /Class\s*[:\-]?\s*([0-9\.]+)/i
      );

    const packingGroupMatch =
      text.match(
        /Packing Group\s*[:\-]?\s*([I|II|III]+)/i
      );

    const shippingNameMatch =
      text.match(
        /Proper Shipping Name\s*[:\-]?\s*([A-Z0-9\s\-]+)/i
      );

    const result = {
      unNumber:
        unNumberMatch?.[1] || "N/A",

      hazardClass:
        hazardClassMatch?.[1] || "N/A",

      packingGroup:
        packingGroupMatch?.[1] || "N/A",

      shippingName:
        shippingNameMatch?.[1] || "N/A",

      preview: text.slice(0, 3000),
    };

    console.log("EXTRACTED RESULT:");
    console.log(result);

    // SAVE IF JOB EXISTS
    if (jobId) {
      await supabase
        .from("jobs")
        .update({
          sds_text: text,
          extracted_data: result,
          status: "parsed",
        })
        .eq("id", jobId);
    }

    return res.status(200).json({
      success: true,
      data: result,
    });

  } catch (err) {
    console.error("READ SDS ERROR:", err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
