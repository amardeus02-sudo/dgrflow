import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase.from("jobs").select("*");
    setJobs(data || []);
  }

  async function updateStatus(job, status) {
    await supabase.from("jobs").update({ status }).eq("id", job.id);

    if (status === "done") {
      await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      if (job.email) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: job.email,
            pdfUrl: job.pdf_url,
          }),
        });
      }
    }

    fetchJobs();
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Admin</h1>

      {jobs.map((job) => (
        <div key={job.id} style={{ border: "1px solid #ccc", marginBottom: 20, padding: 10 }}>
          <p>{job.shipper}</p>
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
