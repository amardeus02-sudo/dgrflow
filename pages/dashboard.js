import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    transport_type: "air"
  });

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

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);
    fetchJobs();
  }

  async function fetchJobs() {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    setJobs(data || []);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;

    let filePath = null;

    if (file) {
      filePath = `${userId}/${Date.now()}_${file.name}`;
      await supabase.storage.from("sds-files").upload(filePath, file);
    }

    await supabase.from("jobs").insert([{
      ...form,
      user_id: userId,
      file_name: filePath,
      status: "pending"
    }]);

    setForm({ transport_type: "air" });
    setFile(null);
    fetchJobs();
  }

  async function generatePDF(job) {
    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(job),
    });

    const data = await res.json();

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert("Erro ao gerar PDF");
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function statusColor(status) {
    if (status === "pending") return "#facc15";
    if (status === "classified") return "#38bdf8";
    if (status === "done") return "#22c55e";
    return "#64748b";
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020617", color: "white" }}>

      {/* SIDEBAR */}
      <div style={{
        width: 220,
        padding: 20,
        borderRight: "1px solid #1e293b",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}>
        <h2>DGRFlow</h2>

        <button onClick={logout}>Logout</button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 30 }}>

        <h1>Dashboard</h1>

        {/* FORM */}
        <div style={{ marginBottom: 30 }}>
          <form onSubmit={handleSubmit}>

            <input name="product_name" placeholder="Product" onChange={handleChange}/>
            <input name="company" placeholder="Company" onChange={handleChange}/>
            <input name="category" placeholder="Category" onChange={handleChange}/>

            <input name="quantity" placeholder="Qty" onChange={handleChange}/>
            <input name="unit_type" placeholder="Unit" onChange={handleChange}/>
            <input name="gross_weight" placeholder="Weight" onChange={handleChange}/>

            <input name="boxes" placeholder="Boxes" onChange={handleChange}/>
            <input name="units_per_box" placeholder="Units/Box" onChange={handleChange}/>

            <select name="transport_type" onChange={handleChange}>
              <option>air</option>
              <option>sea</option>
              <option>ground</option>
            </select>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} />

            <button>Create Job</button>
          </form>
        </div>

        {/* JOBS */}
        {jobs.map((job) => (
          <div key={job.id} style={{ marginBottom: 20, border: "1px solid #333", padding: 10 }}>
            <strong>{job.product_name}</strong>
            <p>{job.company}</p>
            <p>Status: {job.status}</p>

            <button onClick={() => generatePDF(job)}>
              Generate PDF
            </button>

            {job.pdf_url && (
              <a href={job.pdf_url} target="_blank">
                View PDF
              </a>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}
