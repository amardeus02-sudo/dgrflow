import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    const editable = data.map((job) => ({
      ...job,
      editing: { ...job },
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

    alert("Saved");
    fetchJobs();
  }

  async function readSDS(job) {
    if (!job.sds_file) {
      alert("No SDS file uploaded");
      return;
    }

    await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filePath: job.sds_file,
        jobId: job.id,
      }),
    });

    alert("AI finished reading SDS");
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
      
      {/* HEADER */}
      <div style={top}>
        <h1>Admin Panel</h1>
        <button onClick={() => router.push("/dashboard")} style={backBtn}>
          ← Dashboard
        </button>
      </div>

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

          {/* DANGEROUS GOODS */}
          <h4>Dangerous Goods</h4>
          <div style={grid}>
            <input value={job.editing.un_number || ""} onChange={(e)=>handleChange(i,"un_number",e.target.value)} placeholder="UN Number"/>
            <input value={job.editing.technical_name || ""} onChange={(e)=>handleChange(i,"technical_name",e.target.value)} placeholder="Technical Name"/>
            <input value={job.editing.hazard_class || ""} onChange={(e)=>handleChange(i,"hazard_class",e.target.value)} placeholder="Hazard Class"/>
            <input value={job.editing.subsidiary_risk || ""} onChange={(e)=>handleChange(i,"subsidiary_risk",e.target.value)} placeholder="Subsidiary Risk"/>
            <input value={job.editing.packing_group || ""} onChange={(e)=>handleChange(i,"packing_group",e.target.value)} placeholder="Packing Group"/>
            
            {/* 🔥 NOVO CAMPO */}
            <input value={job.editing.flash_point || ""} onChange={(e)=>handleChange(i,"flash_point",e.target.value)} placeholder="Flash Point"/>

            <input value={job.editing.ems || ""} onChange={(e)=>handleChange(i,"ems",e.target.value)} placeholder="EMS"/>
          </div>

          {/* ACTIONS */}
          <div style={actions}>
            <button onClick={() => saveJob(job)} style={btn}>
              💾 Save
            </button>

            <button onClick={() => readSDS(job)} style={btnPurple}>
              🤖 Read SDS
            </button>

            <button onClick={() => updateStatus(job, "classified")} style={btnBlue}>
              Classify
            </button>

            <button onClick={() => updateStatus(job, "done")} style={btnGreen}>
              Done + PDF
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}

/* STYLES */

const layout = {
  background: "#020617",
  minHeight: "100vh",
  padding: 30,
  color: "white"
};

const top = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 20
};

const backBtn = {
  background: "#7c3aed",
  border: "none",
  padding: 10,
  color: "white",
  borderRadius: 8
};

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 12,
  marginBottom: 20
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 10
};

const actions = {
  marginTop: 15,
  display: "flex",
  gap: 10,
  flexWrap: "wrap"
};

const btn = {
  padding: 10,
  border: "none",
  borderRadius: 6
};

const btnPurple = {
  ...btn,
  background: "#7c3aed",
  color: "white"
};

const btnBlue = {
  ...btn,
  background: "#38bdf8",
  color: "white"
};

const btnGreen = {
  ...btn,
  background: "#22c55e",
  color: "white"
};
