import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  }

  async function updateField(id, field, value) {
    await supabase.from("jobs").update({ [field]: value }).eq("id", id);
  }

  async function updateStatus(job, status) {
    await supabase.from("jobs").update({ status }).eq("id", job.id);

    if (status === "done") {
      // GERAR PDF
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      const data = await res.json();

      if (data?.url) {
        await supabase
          .from("jobs")
          .update({ pdf_url: data.url })
          .eq("id", job.id);
      }
    }

    fetchJobs();
  }

  return (
    <div style={layout}>
      <h1 style={title}>Admin Panel</h1>

      {jobs.map((job) => (
        <div key={job.id} style={card}>
          
          {/* HEADER */}
          <div style={header}>
            <strong>{job.shipper || "No shipper"}</strong>
            <span style={status(job.status)}>{job.status}</span>
          </div>

          {/* CLIENT INFO */}
          <div style={section}>
            <h4>Client Info</h4>
            <div style={grid}>
              <input value={job.shipper || ""} onChange={(e)=>updateField(job.id,"shipper",e.target.value)} placeholder="Shipper"/>
              <input value={job.consignee || ""} onChange={(e)=>updateField(job.id,"consignee",e.target.value)} placeholder="Consignee"/>
              <input value={job.bol || ""} onChange={(e)=>updateField(job.id,"bol",e.target.value)} placeholder="BOL"/>
              <input value={job.job_date || ""} onChange={(e)=>updateField(job.id,"job_date",e.target.value)} placeholder="Date"/>
              <input value={job.emergency_contact || ""} onChange={(e)=>updateField(job.id,"emergency_contact",e.target.value)} placeholder="Emergency Contact"/>
            </div>
          </div>

          {/* PACKAGING */}
          <div style={section}>
            <h4>Packaging</h4>
            <div style={grid}>
              <input value={job.type_of_packages || ""} onChange={(e)=>updateField(job.id,"type_of_packages",e.target.value)} placeholder="Type of Packages"/>
              <input value={job.number_of_packages || ""} onChange={(e)=>updateField(job.id,"number_of_packages",e.target.value)} placeholder="Number of Packages"/>
              <input value={job.quantity_boxes || ""} onChange={(e)=>updateField(job.id,"quantity_boxes",e.target.value)} placeholder="Boxes"/>
              <input value={job.gross_weight || ""} onChange={(e)=>updateField(job.id,"gross_weight",e.target.value)} placeholder="Weight"/>
              <input value={job.unit || ""} onChange={(e)=>updateField(job.id,"unit",e.target.value)} placeholder="Unit"/>
            </div>
          </div>

          {/* DANGEROUS GOODS */}
          <div style={section}>
            <h4>Dangerous Goods</h4>
            <div style={grid}>
              <input value={job.un_number || ""} onChange={(e)=>updateField(job.id,"un_number",e.target.value)} placeholder="UN Number"/>
              <input value={job.technical_name || ""} onChange={(e)=>updateField(job.id,"technical_name",e.target.value)} placeholder="Technical Name"/>
              <input value={job.hazard_class || ""} onChange={(e)=>updateField(job.id,"hazard_class",e.target.value)} placeholder="Hazard Class"/>
              <input value={job.subsidiary_risk || ""} onChange={(e)=>updateField(job.id,"subsidiary_risk",e.target.value)} placeholder="Subsidiary Risk"/>
              <input value={job.packing_group || ""} onChange={(e)=>updateField(job.id,"packing_group",e.target.value)} placeholder="Packing Group"/>
              <input value={job.flash_point || ""} onChange={(e)=>updateField(job.id,"flash_point",e.target.value)} placeholder="Flash Point"/>
              <input value={job.special_permit || ""} onChange={(e)=>updateField(job.id,"special_permit",e.target.value)} placeholder="Special Permit"/>
              <input value={job.ems || ""} onChange={(e)=>updateField(job.id,"ems",e.target.value)} placeholder="EMS"/>
            </div>
          </div>

          {/* ACTIONS */}
          <div style={actions}>
            <button onClick={() => updateStatus(job, "classified")} style={btnBlue}>
              Classify
            </button>

            <button onClick={() => updateStatus(job, "done")} style={btnGreen}>
              Done + PDF
            </button>
          </div>

          {/* PDF */}
          {job.pdf_url && (
            <a href={job.pdf_url} target="_blank" style={pdfLink}>
              View PDF
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

/* STYLES */

const layout = {
  background: "#020617",
  minHeight: "100vh",
  color: "white",
  padding: 30
};

const title = { fontSize: 26, marginBottom: 20 };

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 15
};

const section = { marginBottom: 15 };

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 10
};

const actions = {
  marginTop: 15,
  display: "flex",
  gap: 10
};

const btnBlue = {
  padding: 10,
  background: "#38bdf8",
  border: "none",
  borderRadius: 6,
  color: "white"
};

const btnGreen = {
  padding: 10,
  background: "#22c55e",
  border: "none",
  borderRadius: 6,
  color: "white"
};

const pdfLink = {
  display: "block",
  marginTop: 10,
  color: "#38bdf8"
};

function status(s) {
  if (s === "pending") return { color: "#facc15" };
  if (s === "classified") return { color: "#38bdf8" };
  if (s === "done") return { color: "#22c55e" };
}
