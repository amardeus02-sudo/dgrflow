import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://wwbvrhqeycokiojwzugg.supabase.co",
  "sb_publishable_cWTy7Bccrdn_Bn0kZY_-wQ_8nDVbWoX"
);

export default function Dashboard() {
  const [productName, setProductName] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
    } else {
      setJobs(data);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file || !productName) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    // Upload arquivo
    const { error: fileError } = await supabase.storage
      .from("sds-files")
      .upload(file.name, file);

    if (fileError) {
      alert("Erro no upload");
      console.log(fileError);
      setLoading(false);
      return;
    }

    // Salvar job
    const { error: dbError } = await supabase.from("jobs").insert([
      {
        product_name: productName,
        file_name: file.name,
        status: "pending",
      },
    ]);

    if (dbError) {
      alert("Erro ao salvar job");
      console.log(dbError);
    } else {
      alert("Job criado com sucesso!");
      setProductName("");
      setFile(null);
      fetchJobs();
    }

    setLoading(false);
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.log(error);
    } else {
      fetchJobs();
    }
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

        <button type="submit">
          {loading ? "Sending..." : "Submit Job"}
        </button>
      </form>

      <hr />

      <h2>Jobs</h2>

      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <strong>{job.product_name}</strong> - {job.status}
            <br />

            <button onClick={() => updateStatus(job.id, "pending")}>
              Pending
            </button>

            <button onClick={() => updateStatus(job.id, "in progress")}>
              In Progress
            </button>

            <button onClick={() => updateStatus(job.id, "done")}>
              Done
            </button>

            <hr />
          </li>
        ))}
      </ul>
    </div>
  );
}
