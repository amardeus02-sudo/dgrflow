import PDFDocument from "pdfkit";
import { supabase } from "../../lib/supabaseClient";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const fileName = `dgd-${jobId}.pdf`;
    const filePath = path.join("/tmp", fileName);

    const doc = new PDFDocument({ margin: 40 });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    /* ===== HEADER ===== */
    doc
      .fontSize(18)
      .text("DANGEROUS GOODS DECLARATION", { align: "center" });

    doc.moveDown();

    /* ===== SHIPPER / CONSIGNEE ===== */
    doc.fontSize(10);

    doc.text(`Shipper: ${job.shipper || "-"}`);
    doc.text(`Consignee: ${job.consignee || "-"}`);
    doc.text(`BOL: ${job.bol || "-"}`);

    doc.moveDown();

    /* ===== MAIN TABLE ===== */
    doc.fontSize(12).text("Dangerous Goods Details", {
      underline: true,
    });

    doc.moveDown();

    const rows = [
      ["UN Number", job.un_number],
      ["Proper Shipping Name", job.technical_name],
      ["Class", job.hazard_class],
      ["Packing Group", job.packing_group],
      ["Flash Point", job.flash_point],
      ["EMS", job.ems],
      ["Transport Mode", job.transport_mode],
    ];

    rows.forEach(([label, value]) => {
      doc
        .fontSize(10)
        .text(`${label}: ${value || "-"}`);
    });

    doc.moveDown();

    /* ===== VALIDATION ===== */
    if (job.validation) {
      doc.fontSize(12).text("Validation", { underline: true });

      doc.moveDown();

      doc
        .fontSize(10)
        .text(
          job.validation.valid ? "VALID" : "INVALID",
          { underline: true }
        );

      job.validation.errors?.forEach((e) => {
        doc.fillColor("red").text(`ERROR: ${e}`);
      });

      job.validation.warnings?.forEach((w) => {
        doc.fillColor("orange").text(`WARNING: ${w}`);
      });

      doc.fillColor("black");
    }

    doc.moveDown();

    /* ===== SIGNATURE ===== */
    doc.text("I hereby declare that the contents are fully and accurately described.");
    doc.moveDown();

    doc.text("Name: _______________________");
    doc.text("Signature: ___________________");
    doc.text("Date: ________________________");

    doc.end();

    await new Promise((resolve) => stream.on("finish", resolve));

    // 🔥 upload para Supabase Storage (opcional)
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error(error);
    }

    const { data: publicUrl } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // salvar no job
    await supabase
      .from("jobs")
      .update({ pdf_url: publicUrl.publicUrl })
      .eq("id", jobId);

    res.status(200).json({
      url: publicUrl.publicUrl,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
}
