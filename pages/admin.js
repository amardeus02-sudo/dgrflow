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

  async function updateStatus(id, status) {
    await supabase
      .from("jobs")
      .update({ status })
      .eq("id", id);

    fetchJobs();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Panel</h1>

      {jobs.map((job) => (
        <div key={job.id} style={{ marginBottom: 20 }}>
          <strong>{job.product_name}</strong>
          <p>Status: {job.status}</p>

          <button onClick={() => updateStatus(job.id, "classified")}>
            Classify
          </button>

          <button onClick={() => updateStatus(job.id, "done")}>
            Done
          </button>
        </div>
      ))}
    </div>
  );
}
