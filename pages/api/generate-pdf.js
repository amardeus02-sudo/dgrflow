import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const job = req.body;

  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=job-${job.id}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(20).text("DGRFlow Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text(`Product: ${job.product_name}`);
  doc.text(`Company: ${job.company}`);
  doc.text(`Category: ${job.category}`);

  doc.moveDown();

  doc.text(`Quantity: ${job.quantity}`);
  doc.text(`Unit: ${job.unit_type}`);
  doc.text(`Weight: ${job.gross_weight}`);

  doc.moveDown();

  doc.text(`Boxes: ${job.boxes}`);
  doc.text(`Units per Box: ${job.units_per_box}`);

  doc.moveDown();

  doc.text(`Transport: ${job.transport_type}`);
  doc.text(`Status: ${job.status}`);

  doc.moveDown();

  doc.text(`Generated at: ${new Date().toLocaleString()}`);

  doc.end();
}
