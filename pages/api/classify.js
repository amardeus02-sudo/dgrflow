import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractByRegex(text) {
  const clean = text || "";

  const unMatch = clean.match(/\bUN\s?(\d{4})\b/i);

  const classMatch =
    clean.match(/(?:hazard\s*)?class\s*[:\-]?\s*([0-9](?:\.[0-9])?)/i) ||
    clean.match(/transport hazard class.*?([0-9](?:\.[0-9])?)/i);

  const pgMatch =
    clean.match(/packing group\s*[:\-]?\s*(I{1,3}|IV|V)/i);

  const flashMatch =
    clean.match(/flash point\s*[:\-]?\s*([\-0-9.]+\s?°?\s?[CF])/i);

  const emsMatch =
    clean.match(/\bEMS\s*[:\-]?\s*([A-Z]\-[A-Z0-9,\s]+)/i);

  const marineMatch =
    clean.match(/marine pollutant\s*[:\-]?\s*(yes|no)/i);

  const psnMatch =
    clean.match(/proper shipping name\s*[:\-]?\s*([^\n\r]+)/i) ||
    clean.match(/shipping name\s*[:\-]?\s*([^\n\r]+)/i);

  const section14Match =
    clean.match(/14\.?\s*transport information([\s\S]*?)(15\.|16\.|regulatory information|other information)/i);

  const section14 = section14Match ? section14Match[1] : clean;

  return {
    un_number: unMatch ? `UN${unMatch[1]}` : null,
    proper_shipping_name: psnMatch ? psnMatch[1].trim().slice(0, 120) : null,
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
    transport_mode: section14.toLowerCase().includes("imdg")
      ? "SEA"
      : section14.toLowerCase().includes("iata")
        ? "AIR"
        : section14.toLowerCase().includes("adr")
          ? "GROUND"
          : null,
    segregation: null,
    source_confidence: unMatch || classMatch ? "medium" : "low",
    notes: [
      "Fallback extraction used. Review classification manually.",
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

    if (!sdsText || sdsText.length < 20) {
      return res.status(400).json({
        success: false,
        error: "No valid SDS text received for classification",
      });
    }

    const cleanText = sdsText
      .replace(/\s+/g, " ")
      .replace(/[^\x00-\x7F]/g, "")
      .trim()
      .slice(0, 14000);

    let classification = null;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing");
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "You are a dangerous goods classification specialist. Analyze ONLY the SDS text provided in the current request. Do not use memory, previous files, examples, assumptions, or default values. If information is not clearly found in the SDS, return null.",
          },
          {
            role: "user",
            content: `
Analyze the following Safety Data Sheet.

Extract dangerous goods transport information.

Return ONLY valid JSON in this exact structure:

{
  "success": true,
  "classification": {
    "un_number": null,
    "proper_shipping_name": null,
    "technical_name": null,
    "hazard_class": null,
    "subsidiary_risk": null,
    "packing_group": null,
    "marine_pollutant": null,
    "ems": null,
    "flash_point": null,
    "limited_quantity": null,
    "excepted_quantity": null,
    "labels": [],
    "transport_mode": null,
    "segregation": null,
    "source_confidence": "low",
    "notes": []
  }
}

Rules:
- Use ONLY the SDS text below.
- Do NOT invent UN numbers.
- Do NOT default to UN1993.
- Do NOT default to Class 3.
- If the product is not regulated for transport, return null for UN number, hazard class and packing group.
- If not regulated, explain that clearly in notes.
- Prefer Section 14 Transport Information.
- Flash point must come only from the SDS.
- If multiple transport modes are listed, summarize them in transport_mode.
- If data is missing, return null instead of guessing.

SDS TEXT:
${cleanText}
`,
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content || "";

      const parsed = JSON.parse(raw);

      classification = parsed.classification || parsed;
    } catch (openaiError) {
      console.error("OPENAI CLASSIFY FAILED:", openaiError.message);

      classification = extractByRegex(cleanText);
    }

    return res.status(200).json({
      success: true,
      classification: {
        un_number: classification.un_number || null,
        proper_shipping_name: classification.proper_shipping_name || null,
        technical_name: classification.technical_name || null,
        hazard_class: classification.hazard_class || null,
        subsidiary_risk: classification.subsidiary_risk || null,
        packing_group: classification.packing_group || null,
        marine_pollutant: classification.marine_pollutant || null,
        ems: classification.ems || null,
        flash_point: classification.flash_point || null,
        limited_quantity: classification.limited_quantity || null,
        excepted_quantity: classification.excepted_quantity || null,
        labels: Array.isArray(classification.labels)
          ? classification.labels
          : [],
        transport_mode: classification.transport_mode || null,
        segregation: classification.segregation || null,
        source_confidence: classification.source_confidence || "low",
        notes: Array.isArray(classification.notes)
          ? classification.notes
          : [],
      },
    });
  } catch (error) {
    console.error("CLASSIFY API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Classification failed",
    });
  }
}
