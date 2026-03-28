import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const job = req.body;

  const doc = new PDFDocument();
  const chunks = [];

  doc.on("data", chunk => chunks.push(chunk));

  doc.on("end", async () => {
    const pdfBuffer = Buffer.concat(chunks);

    const filePath = `pdfs/job-${job.id}.pdf`;

    await supabase.storage
      .from("sds-files")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true
      });

    const { data } = supabase
      .storage
      .from("sds-files")
      .getPublicUrl(filePath);

    await supabase
      .from("jobs")
      .update({ pdf_url: data.publicUrl })
      .eq("id", job.id);

    res.status(200).json({ url: data.publicUrl });
  });

  doc.text(`Product: ${job.product_name}`);
  doc.text(`Company: ${job.company}`);
  doc.text(`Status: ${job.status}`);

  doc.end();
}
