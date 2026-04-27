import { supabase } from "../../lib/supabaseClient";

const UN_TABLE = {
  "1203": { hazard: "3", name: "Gasoline" },
  "1090": { hazard: "3", name: "Acetone" },
  "1993": { hazard: "3", name: "Flammable Liquid, N.O.S." },
};

export default async function handler(req, res) {
  try {
    const { jobId } = req.body;

    const { data: job } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const errors = [];
    const warnings = [];

    const un = job.un_number?.replace("UN", "").trim();

    // 🔥 1. UN vs Hazard
    if (un && UN_TABLE[un]) {
      if (job.hazard_class !== UN_TABLE[un].hazard) {
        errors.push(`Hazard class mismatch for UN${un}`);
      }
    }

    // 🔥 2. Packing Group obrigatório
    if (["3", "4", "5", "6.1"].includes(job.hazard_class)) {
      if (!job.packing_group) {
        errors.push("Missing Packing Group");
      }
    }

    // 🔥 3. Flash Point check
    if (job.flash_point) {
      const value = parseFloat(job.flash_point);

      if (!isNaN(value)) {
        if (value < 60 && job.hazard_class !== "3") {
          errors.push("Flash point indicates Class 3 but class differs");
        }
      }
    }

    // 🔥 4. EMS obrigatório (simples)
    if (!job.ems) {
      warnings.push("Missing EMS code");
    }

    // 🔥 5. Nome técnico
    if (!job.technical_name) {
      errors.push("Missing technical name");
    }

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
    };

    await supabase
      .from("jobs")
      .update({ validation: result })
      .eq("id", jobId);

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Validation failed" });
  }
}
