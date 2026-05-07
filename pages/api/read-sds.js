import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({
          error: "Upload failed",
        });
      }

      const file = files.file;

      if (!file) {
        return res.status(400).json({
          error: "No PDF uploaded",
        });
      }

      const dataBuffer = fs.readFileSync(file.filepath);

      const pdfData = await pdf(dataBuffer);

      return res.status(200).json({
        success: true,
        text: pdfData.text,
      });
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "PDF processing failed",
    });
  }
}
