import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    transport_type: "air"
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    setLoading(true);

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

    await fetchJobs();

    setLoading(false);
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
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large (max 5MB)");
        return;
      }

      filePath = `${userId}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from("sds-files")
        .upload(filePath, file);

      if (error) {
        alert("Upload error");
        return;
      }
    }

    await supabase.from("jobs").insert([{
      ...form,
      quantity: Number(form.quantity),
      boxes: Number(form.boxes),
      units_per_box: Number(form.units_per_box),
      gross_weight: Number(form.gross_weight),
      user_id: userId,
      file_name: filePath,
      status: "pending"
    }]);

    alert("Job created successfully 🚀");

    setForm({ transport_type: "air" });
    setFile(null);
    fetchJobs();
  }

  async function updateStatus(id, status) {
    await supabase
      .from("jobs")
      .update({ status })
      .eq("id", id);

    fetchJobs();
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

  if (loading) {
    return <div style={{ padding: 40 }}>Loading...</div>;
  }

  return (
    <div style={layout}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2 style={brand}>DGRFlow</h2>

        <div style={nav}>
          <button style={navItem}>Dashboard</button>

          {/* MAIN */}
      <div style={main}>

        {/* HEADER */}
        <div style={topbar}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>
              Manage your jobs and classifications
            </p>
          </div>
        </div>

        {/* FORM */}
        <div style={card}>
          <h3>Create Job</h3>

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

            {file && (
              <p style={fileText}>Selected: {file.name}</p>
            )}

            <button style={primaryBtn}>Create Job</button>
          </form>
        </div>

        {/* JOBS */}
        <div style={jobsGrid}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={jobCard}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <div style={jobTop}>
                <strong>{job.product_name}</strong>
                <span style={{
                  background: statusColor(job.status),
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  textTransform: "capitalize"
                }}>
                  {job.status}
                </span>
              </div>

              <p style={muted}>{job.company}</p>

              <div style={divider}/>

              <div style={jobMeta}>
                <span>{job.quantity} units</span>
                <span>{job.boxes} boxes</span>
                <span>{job.transport_type}</span>
              </div>

              {isAdmin && (
                <div style={adminActions}>
                  <button onClick={() => updateStatus(job.id, "classified")} style={smallBtn}>
                    Classify
                  </button>
                  <button onClick={() => updateStatus(job.id, "done")} style={smallBtn}>
                    Done
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

/* STYLES */

const layout = {
  display: "flex",
  minHeight: "100vh",
  background: "#020617",
  color: "white"
};

const sidebar = {
  width: 220,
  padding: 20,
  background: "#020617",
  borderRight: "1px solid rgba(255,255,255,0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const brand = { fontSize: 20, fontWeight: 600 };

const nav = { display: "flex", flexDirection: "column", gap: 10 };

const navItem = {
  padding: 10,
  borderRadius: 8,
  background: "transparent",
  border: "none",
  color: "white",
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

const topbar = { marginBottom: 20 };

const title = { fontSize: 22, fontWeight: 600 };

const subtitle = { fontSize: 13, color: "#64748b" };

const card = {
  background: "#0b1220",
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
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#020617",
  color: "white"
};

const fileText = {
  gridColumn: "span 3",
  fontSize: 12,
  color: "#94a3b8"
};

const full = { gridColumn: "span 3" };

const primaryBtn = {
  gridColumn: "span 3",
  padding: 12,
  borderRadius: 10,
  background: "#7c3aed",
  border: "none",
  color: "white",
  fontWeight: "bold"
};

const jobsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 15
};

const jobCard = {
  background: "#0b1220",
  padding: 16,
  borderRadius: 12,
  transition: "all 0.2s ease",
  cursor: "pointer"
};

const jobTop = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 8
};

const jobMeta = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12
};

const adminActions = {
  marginTop: 10,
  display: "flex",
  gap: 5
};

const smallBtn = {
  flex: 1,
  padding: 6,
  borderRadius: 6,
  border: "none",
  background: "#1e293b",
  color: "white",
  fontSize: 12,
  cursor: "pointer"
};

const muted = { color: "#94a3b8", fontSize: 12 };

const divider = {
  height: 1,
  background: "#1e293b",
  margin: "10px 0"
};
