import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export default async function handler(req, res) {
  try {
    const { html } = req.body;

    if (!html) {
      return res.status(400).json({ error: "Missing HTML" });
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // 🔥 AQUI ESTÁ A CORREÇÃO CRÍTICA
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=document.pdf");

    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message
    });
  }
}
