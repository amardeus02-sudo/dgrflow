import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const job = JSON.parse(req.body);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const doc = new PDFDocument();

    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);

      const fileName = `job-${job.id}.pdf`;

      // 🚀 UPLOAD PARA STORAGE
      const { error } = await supabase.storage
        .from("sds-files")
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) {
        console.log("UPLOAD ERROR:", error);
        return res.status(500).json({ error });
      }

      // 🔗 GET PUBLIC URL
      const { data } = supabase.storage
        .from("sds-files")
        .getPublicUrl(fileName);

      return res.status(200).json({ url: data.publicUrl });
    });

    // 🧾 PDF CONTENT (SIMPLES AGORA)
    doc.fontSize(18).text("DGR Declaration", { align: "center" });

    doc.moveDown();
    doc.fontSize(12).text(`Shipper: ${job.shipper || ""}`);
    doc.text(`Consignee: ${job.consignee || ""}`);
    doc.text(`BOL: ${job.bol || ""}`);

    doc.moveDown();
    doc.text(`UN Number: ${job.un_number || ""}`);
    doc.text(`Technical Name: ${job.technical_name || ""}`);
    doc.text(`Hazard Class: ${job.hazard_class || ""}`);
    doc.text(`Packing Group: ${job.packing_group || ""}`);

    doc.end();

  } catch (err) {
    console.log("PDF ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
