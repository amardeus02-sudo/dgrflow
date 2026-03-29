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
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
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
    <div style={{ padding: 30, background: "#020617", color: "white", minHeight: "100vh" }}>
      <h1>Admin Panel</h1>

      {jobs.map((job) => (
        <div key={job.id} style={{ background: "#0f172a", padding: 20, marginBottom: 20 }}>

          <h3>{job.shipper}</h3>

          {/* CAMPOS ADMIN */}
          <input placeholder="UN Number" onChange={(e) => updateField(job.id, "un_number", e.target.value)} />
          <input placeholder="Technical Name" onChange={(e) => updateField(job.id, "technical_name", e.target.value)} />
          <input placeholder="Hazard Class" onChange={(e) => updateField(job.id, "hazard_class", e.target.value)} />
          <input placeholder="Packing Group" onChange={(e) => updateField(job.id, "packing_group", e.target.value)} />

          <p>Status: {job.status}</p>

          <button onClick={() => updateStatus(job, "classified")}>
            Classify
          </button>

          <button onClick={() => updateStatus(job, "done")}>
            Done
          </button>

        </div>
      ))}
    </div>
  );
}
