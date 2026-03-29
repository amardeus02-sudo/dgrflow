import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    unit: "kg",
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

    // 📁 Upload SDS
    if (file) {
      filePath = `${userId}/${Date.now()}_${file.name}`;

      const { error } = await supabase.storage
        .from("sds-files")
        .upload(filePath, file);

      if (error) {
        alert("Erro ao enviar arquivo");
        return;
      }
    }

    await supabase.from("jobs").insert([{
      ...form,
      user_id: userId,
      sds_file: filePath,
      status: "pending"
    }]);

    setForm({ unit: "kg" });
    setFile(null);
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
  }

  return (
    <div style={layout}>
      
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2>DGRFlow</h2>

        <div>
          <button style={navBtn}>Dashboard</button>

          {isAdmin && (
            <button onClick={() => router.push("/admin")} style={navBtn}>
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
          <h3>Create Job</h3>

          <form onSubmit={handleSubmit} style={grid}>

            <input name="product_name" placeholder="Product Name" onChange={handleChange} />
            <input name="bol" placeholder="Bill of Lading (BOL)" onChange={handleChange} />
          
            <input name="shipper" placeholder="Shipper" onChange={handleChange}/>
            <input name="consignee" placeholder="Consignee" onChange={handleChange}/>
            <input name="bol" placeholder="Bill of Lading"/>

            <input name="job_date" placeholder="Date" onChange={handleChange}/>
            <input name="emergency_contact" placeholder="Emergency Contact" onChange={handleChange}/>
            <input name="client_email" placeholder="Client Email" onChange={handleChange}/>

            <input name="type_of_packages" placeholder="Type of Packages" onChange={handleChange}/>
            <input name="number_of_packages" placeholder="Number of Packages" onChange={handleChange}/>
            <input name="quantity_boxes" placeholder="Quantity of Boxes" onChange={handleChange}/>

            <input name="gross_weight" placeholder="Weight" onChange={handleChange}/>

            <select name="unit" onChange={handleChange}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </select>

            {/* 📁 SDS UPLOAD */}
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ gridColumn: "span 3" }}
            />

            <button style={btn}>Create Job</button>
          </form>
        </div>

        {/* JOBS */}
        <div style={jobsGrid}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>
              <strong>{job.shipper || "No name"}</strong>

              <span style={{
                background: statusColor(job.status),
                padding: "4px 10px",
                borderRadius: 20,
                fontSize: 12
              }}>
                {job.status}
              </span>
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
  background: "#020617",
  minHeight: "100vh",
  color: "white"
};

const sidebar = {
  width: 200,
  padding: 20,
  borderRight: "1px solid #1e293b",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const navBtn = {
  display: "block",
  marginBottom: 10,
  background: "none",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const logoutBtn = {
  background: "#7c3aed",
  color: "white",
  padding: 10,
  border: "none",
  borderRadius: 8
};

const main = {
  flex: 1,
  padding: 30
};

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

const btn = {
  gridColumn: "span 3",
  padding: 12,
  background: "#7c3aed",
  border: "none",
  borderRadius: 8,
  color: "white"
};

const jobsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))",
  gap: 10
};

const jobCard = {
  background: "#0f172a",
  padding: 15,
  borderRadius: 10
};
