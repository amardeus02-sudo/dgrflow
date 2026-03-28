import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [adminForm, setAdminForm] = useState({});
  const [resultFile, setResultFile] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    const user = data.user;

    const isAdmin = user.email === "amardeus02@gmail.com";

    if (!isAdmin) {
      alert("Acesso negado");
      router.push("/dashboard");
      return;
    }

    fetchJobs();
  }

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  }

  function handleChange(e, jobId) {
    setAdminForm({
      ...adminForm,
      [jobId]: {
        ...adminForm[jobId],
        [e.target.name]: e.target.value
      }
    });
  }

  async function save(jobId) {
    const data = adminForm[jobId];

    if (!data) return alert("Preencha os dados");

    const { error } = await supabase
      .from("jobs")
      .update({
        ...data,
        status: "classified"
      })
      .eq("id", jobId);

    if (error) return alert(error.message);

    alert("Classificação salva");
    fetchJobs();
  }

  async function uploadResult() {
    if (!resultFile || !selectedJob) return alert("Selecione arquivo");

    const filePath = `result_${Date.now()}_${resultFile.name}`;

    const { error } = await supabase.storage.from("results").upload(filePath, resultFile);
    if (error) return alert(error.message);

    await supabase.from("jobs")
      .update({
        result_file: filePath,
        status: "done"
      })
      .eq("id", selectedJob.id);

    fetchJobs();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div style={container}>

      {/* HEADER */}
      <div style={header}>
        <h1>Admin Panel</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => router.push("/dashboard")} style={btn}>
            Client View
          </button>

          <button onClick={logout} style={btn}>
            Logout
          </button>
        </div>
      </div>

      {/* JOBS */}
      {jobs.map((job) => (
        <div key={job.id} style={card}>
          <h3>{job.product_name}</h3>
          <p>Status: {job.status}</p>

          <input name="un_number" placeholder="UN Number" onChange={(e) => handleChange(e, job.id)} style={input}/>
          <input name="psn" placeholder="Proper Shipping Name" onChange={(e) => handleChange(e, job.id)} style={input}/>
          <input name="hazard_class" placeholder="Hazard Class" onChange={(e) => handleChange(e, job.id)} style={input}/>
          <input name="packing_group" placeholder="Packing Group" onChange={(e) => handleChange(e, job.id)} style={input}/>

          <button onClick={() => save(job.id)} style={btn}>
            Save Classification
          </button>

          <input type="file" onChange={(e) => {
            setSelectedJob(job);
            setResultFile(e.target.files[0]);
          }}/>

          <button onClick={uploadResult} style={btn}>
            Upload Result
          </button>
        </div>
      ))}

    </div>
  );
}

/* STYLES */

const container = { padding: 40, background: "#020617", color: "white", minHeight: "100vh" };
const header = { display: "flex", justifyContent: "space-between", marginBottom: 20 };
const card = { background: "#0f172a", padding: 20, borderRadius: 12, marginBottom: 20 };
const input = { display: "block", marginTop: 8, padding: 10, borderRadius: 8, width: "100%", background: "#020617", border: "1px solid #334155", color: "white" };
const btn = { marginTop: 10, padding: 10, borderRadius: 8, background: "#7c3aed", color: "white", border: "none", cursor: "pointer" };
