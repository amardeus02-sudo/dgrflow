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

  const isAdmin = profile?.role === "admin";

  function statusColor(status) {
    if (status === "pending") return "#facc15";
    if (status === "classified") return "#38bdf8";
    if (status === "done") return "#22c55e";
    return "#64748b";
  }

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2 style={brand}>DGRFlow</h2>

        <div style={nav}>
          <button style={navItem}>Dashboard</button>

          {isAdmin && (
            <button onClick={() => router.push("/admin")} style={navItem}>
              Admin
            </button>
          )}
        </div>

        <button onClick={logout} style={logoutBtn}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={main}>

        <h1>Dashboard</h1>

        {/* FORM */}
        <div style={card}>
          <form onSubmit={handleSubmit} style={grid}>

            <input name="product_name" placeholder="Product" onChange={handleChange} style={input}/>
            <input name="company" placeholder="Company" onChange={handleChange} style={input}/>
            <input name="category" placeholder="Category" onChange={handleChange} style={input}/>

            <input name="quantity" placeholder="Qty" onChange={handleChange} style={input}/>
            <input name="unit_type" placeholder="Unit" onChange={handleChange} style={input}/>
            <input name="gross_weight" placeholder="Weight" onChange={handleChange} style={input}/>

            <input name="boxes" placeholder="Boxes" onChange={handleChange} style={input}/>
            <input name="units_per_box" placeholder="Units/Box" onChange={handleChange} style={input}/>

            <select name="transport_type" onChange={handleChange} style={input}>
              <option>air</option>
              <option>sea</option>
              <option>ground</option>
            </select>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={full}/>

            <button style={primaryBtn}>Create Job</button>
          </form>
        </div>

        {/* JOBS */}
        <div style={jobsGrid}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>
              <div style={jobTop}>
                <strong>{job.product_name}</strong>
                <span style={{
                  background: statusColor(job.status),
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12
                }}>
                  {job.status}
                </span>
              </div>

              <p style={muted}>{job.company}</p>

              <div style={divider}/>

              <button onClick={() => generatePDF(job)} style={smallBtn}>
                Generate PDF
              </button>

              {job.pdf_url && (
                <a href={job.pdf_url} target="_blank" style={link}>
                  View PDF
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* STYLES */

const layout = { display: "flex", minHeight: "100vh", background: "#020617", color: "white" };

const sidebar = {
  width: 220,
  padding: 20,
  borderRight: "1px solid #1e293b",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const brand = { fontSize: 22 };

const nav = { display: "flex", flexDirection: "column", gap: 10 };

const navItem = {
  padding: 10,
  borderRadius: 8,
  background: "transparent",
  border: "none",
  color: "white",
  textAlign: "left",
  cursor: "pointer"
};

const logoutBtn = {
  padding: 10,
  borderRadius: 8,
  background: "#7c3aed",
  border: "none",
  color: "white"
};

const main = { flex: 1, padding: 30 };

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 12,
  marginBottom: 30
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10
};

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#020617",
  color: "white"
};

const full = { gridColumn: "span 3" };

const primaryBtn = {
  gridColumn: "span 3",
  padding: 12,
  borderRadius: 10,
  background: "#7c3aed",
  border: "none",
  color: "white"
};

const jobsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 15
};

const jobCard = {
  background: "#0f172a",
  padding: 16,
  borderRadius: 12
};

const jobTop = {
  display: "flex",
  justifyContent: "space-between"
};

const muted = { color: "#94a3b8", fontSize: 12 };

const divider = {
  height: 1,
  background: "#1e293b",
  margin: "10px 0"
};

const smallBtn = {
  padding: 8,
  borderRadius: 6,
  background: "#334155",
  border: "none",
  color: "white",
  marginTop: 10
};

const link = { display: "block", marginTop: 10, color: "#38bdf8" };
