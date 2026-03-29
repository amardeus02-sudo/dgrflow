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

  async function updateStatus(job, status) {
    await supabase.from("jobs").update({ status }).eq("id", job.id);

    if (status === "done") {

      // GERAR PDF
      const pdfRes = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      const pdfData = await pdfRes.json();

      // ENVIAR EMAIL
      if (pdfData?.url && job.email) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: job.email,
            pdfUrl: pdfData.url,
          }),
        });
      }
    }

    fetchJobs();
  }

  return (
    <div style={layout}>
      <div style={main}>
        <h1 style={title}>Admin Panel</h1>

        {jobs.map((job) => (
          <div key={job.id} style={card}>
            <strong>{job.shipper}</strong>
            <p>Status: {job.status}</p>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={() => updateStatus(job, "classified")} style={btnBlue}>
                Classify
              </button>

              <button onClick={() => updateStatus(job, "done")} style={btnGreen}>
                Done
              </button>
            </div>

            {job.pdf_url && (
              <a href={job.pdf_url} target="_blank" style={{ color: "#38bdf8" }}>
                View PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* STYLES */

const layout = { background: "#020617", minHeight: "100vh", color: "white" };

const main = { padding: 30 };

const title = { fontSize: 24, marginBottom: 20 };

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 10,
  marginBottom: 15
};

const btnBlue = {
  padding: 10,
  background: "#38bdf8",
  border: "none",
  color: "white",
  borderRadius: 6
};

const btnGreen = {
  padding: 10,
  background: "#22c55e",
  border: "none",
  color: "white",
  borderRadius: 6
};
