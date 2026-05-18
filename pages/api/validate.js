export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
    }

    const input = req.body || {};

    console.log("VALIDATE INPUT:", input);

    const dg =
      input.classification ||
      input.data?.classification ||
      input.data ||
      input;

    const errors = [];
    const warnings = [];

    const unNumber =
      dg.un_number ||
      dg.unNumber ||
      dg.UN ||
      dg["UN Number"] ||
      "";

    const properShippingName =
      dg.proper_shipping_name ||
      dg.properShippingName ||
      dg.shipping_name ||
      dg["Proper Shipping Name"] ||
      "";

    const hazardClass =
      dg.hazard_class ||
      dg.hazardClass ||
      dg.class ||
      dg["Hazard Class"] ||
      "";

    const packingGroup =
      dg.packing_group ||
      dg.packingGroup ||
      dg.pg ||
      dg["Packing Group"] ||
      "";

    const marinePollutant =
      dg.marine_pollutant ||
      dg.marinePollutant ||
      dg["Marine Pollutant"] ||
      "Not confirmed";

    const labels = Array.isArray(dg.labels)
      ? dg.labels
      : hazardClass
        ? [String(hazardClass)]
        : [];

    if (!unNumber) {
      errors.push("Missing UN Number");
    }

    if (!properShippingName) {
      errors.push("Missing Proper Shipping Name");
    }

    if (!hazardClass) {
      errors.push("Missing Hazard Class");
    }

    const classesThatUsuallyRequirePG = [
      "3",
      "4",
      "4.1",
      "4.2",
      "4.3",
      "5.1",
      "6.1",
      "8",
      "9",
    ];

    if (
      classesThatUsuallyRequirePG.includes(String(hazardClass)) &&
      !packingGroup
    ) {
      warnings.push("Packing Group should be confirmed for this hazard class");
    }

    if (String(hazardClass) === "3" && !dg.flash_point) {
      warnings.push("Flash Point should be confirmed for Class 3 flammable liquids");
    }

    if (!labels || labels.length === 0) {
      warnings.push("Hazard labels were not clearly identified");
    }

    if (!dg.limited_quantity) {
      warnings.push("Limited Quantity status was not confirmed");
    }

    if (!dg.ems) {
      warnings.push("EMS code was not confirmed");
    }

    const validation = {
      approved: errors.length === 0,
      status: errors.length === 0 ? "APPROVED" : "REVIEW_REQUIRED",
      errors,
      warnings,
      checked_rules: [
        "UN Number present",
        "Proper Shipping Name present",
        "Hazard Class present",
        "Packing Group reviewed",
        "Class 3 Flash Point reviewed",
        "Hazard labels reviewed",
        "Limited Quantity reviewed",
        "EMS reviewed",
        "Marine Pollutant reviewed",
      ],
      normalized_data: {
        un_number: unNumber || null,
        proper_shipping_name: properShippingName || null,
        hazard_class: hazardClass || null,
        packing_group: packingGroup || null,
        marine_pollutant: marinePollutant || null,
        labels,
        flash_point: dg.flash_point || null,
        ems: dg.ems || null,
        limited_quantity: dg.limited_quantity || null,
      },
      message:
        errors.length === 0
          ? "DG validation completed successfully."
          : "DG validation found issues that require review.",
    };

    return res.status(200).json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error("VALIDATE API ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Validation failed",
    });
  }
}
