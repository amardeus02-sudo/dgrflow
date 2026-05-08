export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const body = req.body;

    console.log("CLASSIFY INPUT:", body);

    // =========================
    // MOCK AI CLASSIFICATION
    // =========================

    const result = {
      success: true,

      classification: {
        un_number: body.un_number || "UN1993",

        proper_shipping_name:
          body.shipping_name || "FLAMMABLE LIQUID, N.O.S.",

        hazard_class:
          body.hazard_class || "3",

        packing_group:
          body.packing_group || "II",

        marine_pollutant:
          body.marine_pollutant || "No",

        tunnel_code:
          body.tunnel_code || "D/E",

        labels: ["3"],

        segregation: "Away from oxidizers",

        limited_quantity: "5L",

        excepted_quantity: "E2",
      },
    };

    console.log("CLASSIFY OUTPUT:", result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("CLASSIFY API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
}
