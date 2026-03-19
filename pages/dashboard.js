import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data } = await supabase.from("jobs").select("*");
    setJobs(data || []);
  }

  async function updateStatus(id, status) {
    await supabase.from("jobs").update({ status }).eq("id", id);
    fetchJobs();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>TESTE DASHBOARD</h1>

      {jobs.map((job) => (
        <div key={job.id} style={{ marginBottom: 20 }}>
       <p>
  <strong>{job.product_name}</strong> - {job.status}
</p>

<a
  href={`https://wwbvrhqeycokiojwzugg.supabase.co/storage/v1/object/public/sds-files/${job.file_name}`}
  target="_blank"
>
  📄 Download SDS
</a>

          {/* BOTÕES GRANDES */}
          <button onClick={() => updateStatus(job.id, "pending")}>
            🔴 Pending
          </button>

          <button onClick={() => updateStatus(job.id, "in progress")}>
            🟡 In Progress
          </button>

          <button onClick={() => updateStatus(job.id, "done")}>
            🟢 Done
          </button>
        </div>
      ))}
    </div>
  );
}
