import puppeteer from "puppeteer";

export default async function handler(req, res) {
  try {
    const { html } = req.body;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.send(pdf);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
