import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Dashboard() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    console.log("BUSCANDO JOBS...");

    const { data, error } = await supabase
      .from("jobs")
      .select("*");

    console.log("DATA:", data);
    console.log("ERROR:", error);

    if (data) {
      setJobs(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const filePath = `${Date.now()}-${file.name}`;

    await supabase.storage
      .from("sds-files")
      .upload(filePath, file);

    await supabase.from("jobs").insert([
      {
        product_name: productName,
        file_name: filePath,
        status: "pending",
      },
    ]);

    fetchJobs();
  }

  async function updateStatus(id, status) {
    await supabase.from("jobs").update({ status }).eq("id", id);
    fetchJobs();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>DGRFlow Dashboard</h1>

      <h2>Create Job</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit">Submit Job</button>
      </form>

      <hr />

      <h2>Jobs</h2>

      {jobs.length === 0 && <p>Nenhum job encontrado.</p>}

      {jobs.map((job) => (
        <div key={job.id}>
          <p>
            {job.product_name} - {job.status}
          </p>

          <a
            href={`https://wwbvrhqeycokiojwzugg.supabase.co/storage/v1/object/public/sds-files/${job.file_name}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            📄 Download
          </a>

          <br />

          <button onClick={() => updateStatus(job.id, "done")}>
            Done
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}
