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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      window.location.href = "/login";
    } else {
      setUser(data.user);
      fetchJobs(data.user.id);
    }
  }

  async function fetchJobs(userId) {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.log("Erro ao buscar jobs:", error);
    } else {
      setJobs(data || []);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file || !productName) {
      alert("Preencha todos os campos!");
      return;
    }

    setLoading(true);

    const filePath = `${Date.now()}-${file.name}`;

    // Upload arquivo
    const { error: fileError } = await supabase.storage
      .from("sds-files")
      .upload(filePath, file);

    if (fileError) {
      alert("Erro no upload");
      console.log(fileError);
      setLoading(false);
      return;
    }

    // Salvar job com user_id
    const { error: dbError } = await supabase.from("jobs").insert([
      {
        product_name: productName,
        file_name: filePath,
        status: "pending",
        user_id: user.id,
      },
    ]);

    if (dbError) {
      alert("Erro ao salvar job");
      console.log(dbError);
    } else {
      alert("Job criado com sucesso!");
      setProductName("");
      setFile(null);
      fetchJobs(user.id);
    }

    setLoading(false);
  }

  async function updateStatus(id, status) {
    const { error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.log("Erro ao atualizar status:", error);
    } else {
      fetchJobs(user.id);
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>DGRFlow Dashboard</h1>

      {/* FORM */}
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

      {/* LISTA */}
      <h2>Jobs</h2>

      {jobs.length === 0 && <p>Nenhum job encontrado.</p>}

      {jobs.map((job) => (
        <div key={job.id} style={{ marginBottom: 20 }}>
          <p>
            <strong>{job.product_name}</strong> - {job.status}
          </p>

          <div style={{ marginBottom: 10 }}>
            <a
              href={`https://wwbvrhqeycokiojwzugg.supabase.co/storage/v1/object/public/sds-files/${job.file_name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Download SDS
            </a>
          </div>

          <div style={{ marginBottom: 10 }}>
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

          <hr />
        </div>
      ))}
    </div>
  );
}
