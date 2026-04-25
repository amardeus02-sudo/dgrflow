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
    if (!data.user) return router.push("/login");

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
      const { error } = await supabase.storage.from("sds-files").upload(filePath, file);
      if (error) return alert(error.message);
    }

    const { error } = await supabase.from("jobs").insert([{
      ...form,
      user_id: userId,
      file_name: filePath,
      status: "pending"
    }]);

    if (error) return alert(error.message);

    alert("Job enviado 🚀");
    setForm({ transport_type: "air" });
    setFile(null);
    fetchJobs();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAdmin = profile?.email === "amardeus02@gmail.com";

  function statusColor(status) {
    if (status === "pending") return "#facc15";
    if (status === "classified") return "#38bdf8";
    if (status === "done") return "#22c55e";
    return "#64748b";
  }

  function getFileUrl(path) {
    return supabase.storage.from("results").getPublicUrl(path).data.publicUrl;
  }

  return (
    <div style={layout}>

      <div style={sidebar}>
        <h2>DGRFlow</h2>

        {isAdmin && (
          <button onClick={() => router.push("/admin")} style={navBtn}>
            Admin
          </button>
        )}

        <button onClick={logout} style={logoutBtn}>
          Logout
        </button>
      </div>

      <div style={main}>

        <h1>Create Job</h1>

        <div style={card}>
          <form onSubmit={handleSubmit} style={grid}>

            <input name="product_name" placeholder="Product" onChange={handleChange} style={input}/>
            <input name="company" placeholder="Company" onChange={handleChange} style={input}/>
            <input name="category" placeholder="Category" onChange={handleChange} style={input}/>

            <input name="quantity" placeholder="Quantity" onChange={handleChange} style={input}/>
            <input name="unit_type" placeholder="Unit Type" onChange={handleChange} style={input}/>
            <input name="gross_weight" placeholder="Weight" onChange={handleChange} style={input}/>

            <input name="boxes" placeholder="Boxes" onChange={handleChange} style={input}/>
            <input name="units_per_box" placeholder="Units/Box" onChange={handleChange} style={input}/>

            <select name="transport_type" onChange={handleChange} style={input}>
              <option value="air">Air</option>
              <option value="sea">Sea</option>
              <option value="ground">Ground</option>
            </select>

            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={full}/>

            <button style={btn}>Submit</button>
          </form>
        </div>

        <h2>My Jobs</h2>

        <div style={jobsGrid}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>

              <div style={jobTop}>
                <strong>{job.product_name}</strong>
                <span style={{
                  background: statusColor(job.status),
                  padding: "4px 10px",
                  borderRadius: 999
                }}>
                  {job.status}
                </span>
              </div>

              <p>{job.company}</p>

              {job.result_file && (
                <a href={getFileUrl(job.result_file)} target="_blank">
                  Download Document
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
const sidebar = { width: 200, padding: 20, borderRight: "1px solid #1e293b" };
const main = { flex: 1, padding: 30 };

const card = { background: "#0f172a", padding: 20, borderRadius: 10 };
const grid = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 };

const input = { padding: 10, borderRadius: 8 };
const full = { gridColumn: "span 3" };

const btn = { gridColumn: "span 3", padding: 10, background: "#7c3aed", color: "white" };

const navBtn = { marginTop: 10 };
const logoutBtn = { marginTop: 20 };

const jobsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px,1fr))", gap: 10 };
const jobCard = { background: "#0f172a", padding: 10, borderRadius: 10 };

const jobTop = { display: "flex", justifyContent: "space-between" };
