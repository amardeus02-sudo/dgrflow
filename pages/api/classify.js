export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

function normalizeText(input) {
  return String(input || "")
    .replace(/\s+/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
}

function extractClassification(text) {
  const cleanText = normalizeText(text);

  const unMatch = cleanText.match(/\bUN\s?(\d{4})\b/i);

  const classMatch =
    cleanText.match(/hazard class\s*[:\-]?\s*([0-9](?:\.[0-9])?)/i) ||
    cleanText.match(/class\s*[:\-]?\s*([0-9](?:\.[0-9])?)/i);

  const pgMatch =
    cleanText.match(/packing group\s*[:\-]?\s*(I{1,3})/i);

  const flashMatch =
    cleanText.match(/flash point\s*[:\-]?\s*([\-0-9.]+\s?°?\s?[CF])/i);

  const marineMatch =
    cleanText.match(/marine pollutant\s*[:\-]?\s*(yes|no)/i);

  const emsMatch =
    cleanText.match(/\bEMS\s*[:\-]?\s*([A-Z]\-[A-Z0-9,\s]+)/i);

  const psnMatch =
    cleanText.match(/proper shipping name\s*[:\-]?\s*([^.;]+)/i) ||
    cleanText.match(/shipping name\s*[:\-]?\s*([^.;]+)/i);

  const lower = cleanText.toLowerCase();

  return {
    un_number: unMatch ? `UN${unMatch[1]}` : null,
    proper_shipping_name: psnMatch ? psnMatch[1].trim() : null,
    technical_name: null,
    hazard_class: classMatch ? classMatch[1] : null,
    subsidiary_risk: null,
    packing_group: pgMatch ? pgMatch[1] : null,
    marine_pollutant: marineMatch ? marineMatch[1].toUpperCase() : null,
    ems: emsMatch ? emsMatch[1].trim() : null,
    flash_point: flashMatch ? flashMatch[1].trim() : null,
    limited_quantity: null,
    excepted_quantity: null,
    labels: classMatch ? [classMatch[1]] : [],
    transport_mode: lower.includes("imdg")
      ? "SEA"
      : lower.includes("iata")
      ? "AIR"
      : lower.includes("adr")
      ? "GROUND"
      : null,
    segregation: null,
    source_confidence: unMatch || classMatch ? "medium" : "low",
    notes: [
      "Classification generated only from the uploaded SDS text.",
      "Regex fallback active. Manual DG review recommended.",
    ],
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const input = req.body || {};

    const sdsText =
      input.text ||
      input.raw_text ||
      input.rawText ||
      input.extracted_text ||
      input.sds_text ||
      input.extracted?.section_14 ||
      "";

    if (!sdsText || String(sdsText).length < 20) {
      return res.status(400).json({
        success: false,
        error: "No valid SDS text received for classification",
      });
    }

    const classification = extractClassification(sdsText);

    return res.status(200).json({
      success: true,
      classification,
    });
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: error.message || "Classification failed safely",
    });
  }
}
