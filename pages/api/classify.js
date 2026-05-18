import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const input = req.body || {};

    console.log("CLASSIFY INPUT RECEIVED");

    const sdsText =
      input.text ||
      input.raw_text ||
      input.rawText ||
      input.extracted_text ||
      input.sds_text ||
      "";

    if (!sdsText || sdsText.length < 50) {
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
            "You are a dangerous goods classification specialist. You must analyze ONLY the SDS text provided in the current request. Do not use memory, previous SDS files, assumptions, examples, or default values. If data is not clearly found, return null.",
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
    "source_confidence": "low | medium | high",
    "notes": []
  }
}

Rules:
- Use ONLY the SDS text below.
- Do NOT invent UN numbers.
- Do NOT default to UN1993.
- Do NOT default to Class 3.
- If the SDS says "not regulated", return null for UN/class/packing group and note it.
- Prefer Section 14 Transport Information.
- If multiple transport modes appear, identify them in transport_mode.
- Flash point must come from the SDS only.

SDS TEXT:
${cleanText}
`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";

    console.log("OPENAI RAW CLASSIFY:", raw);

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: "OpenAI returned invalid JSON",
        raw,
      });
    }

    const classification = parsed.classification || parsed;

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
