import PDFDocument from "pdfkit";

export default async function handler(req, res) {
  try {
    const { dg } = req.body;

    const doc = new PDFDocument();

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);

      res.writeHead(200, {
        "Content-Length": Buffer.byteLength(pdfData),
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment;filename=imo-declaration.pdf",
      });

      res.end(pdfData);
    });

    doc.fontSize(22).text("IMO Dangerous Goods Declaration");

    doc.moveDown();

    doc.fontSize(14).text(JSON.stringify(dg, null, 2));

    doc.end();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "PDF generation failed",
    });
  }
}
