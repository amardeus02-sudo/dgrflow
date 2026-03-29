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

    // 👇 cria estado editável
    const editable = data.map((job) => ({
      ...job,
      editing: { ...job }
    }));

    setJobs(editable || []);
  }

  function handleChange(index, field, value) {
    const updated = [...jobs];
    updated[index].editing[field] = value;
    setJobs(updated);
  }

  async function saveJob(job) {
    await supabase
      .from("jobs")
      .update(job.editing)
      .eq("id", job.id);

    fetchJobs();
  }

  async function updateStatus(job, status) {
    await supabase
      .from("jobs")
      .update({ status })
      .eq("id", job.id);

    if (status === "done") {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        body: JSON.stringify(job.editing),
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

      {jobs.map((job, i) => (
        <div key={job.id} style={card}>

          <div style={header}>
            <strong>{job.editing.product_name || "No name"}</strong>
            <span>{job.status}</span>
          </div>

          {/* CLIENT */}
          <h4>Client</h4>
          <div style={grid}>
            <input value={job.editing.shipper || ""} onChange={(e)=>handleChange(i,"shipper",e.target.value)} placeholder="Shipper"/>
            <input value={job.editing.consignee || ""} onChange={(e)=>handleChange(i,"consignee",e.target.value)} placeholder="Consignee"/>
            <input value={job.editing.bol || ""} onChange={(e)=>handleChange(i,"bol",e.target.value)} placeholder="BOL"/>
            <input value={job.editing.client_email || ""} onChange={(e)=>handleChange(i,"client_email",e.target.value)} placeholder="Client Email"/>
          </div>

          {/* DG */}
          <h4>Dangerous Goods</h4>
          <div style={grid}>
            <input value={job.editing.un_number || ""} onChange={(e)=>handleChange(i,"un_number",e.target.value)} placeholder="UN"/>
            <input value={job.editing.technical_name || ""} onChange={(e)=>handleChange(i,"technical_name",e.target.value)} placeholder="Technical Name"/>
            <input value={job.editing.hazard_class || ""} onChange={(e)=>handleChange(i,"hazard_class",e.target.value)} placeholder="Class"/>
            <input value={job.editing.packing_group || ""} onChange={(e)=>handleChange(i,"packing_group",e.target.value)} placeholder="PG"/>
          </div>

          {/* ACTIONS */}
          <div style={actions}>
            <button onClick={() => saveJob(job)}>💾 Save</button>

            <button onClick={() => updateStatus(job, "classified")}>
              Classify
            </button>

            <button onClick={() => updateStatus(job, "done")}>
              Done + PDF
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}

/* STYLES */

const layout = { padding: 30, background: "#020617", color: "white" };
const title = { fontSize: 24 };

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 10,
  marginBottom: 20
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: 10
};

const actions = {
  marginTop: 10,
  display: "flex",
  gap: 10
};
