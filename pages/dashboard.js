import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    transport_type: "air",
    shipper: "",
    consignee: "",
    bol: "",
    job_date: "",
    emergency_contact: "",
    type_of_packages: "",
    number_of_packages: "",
    quantity_boxes: "",
    gross_weight: "",
    unit: "kg"
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.push("/login");
        return;
      }

      const user = data.user;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData || {});
      fetchJobs();
    } catch (err) {
      console.error("INIT ERROR", err);
    }
  }

  async function fetchJobs() {
    try {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      setJobs(data || []);
    } catch (err) {
      console.error("FETCH JOBS ERROR", err);
    }
  }

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) return;

      await supabase.from("jobs").insert([
        {
          ...form,
          user_id: userId,
          status: "pending",
        },
      ]);

      // reset form
      setForm({
        transport_type: "air",
        shipper: "",
        consignee: "",
        bol: "",
        job_date: "",
        emergency_contact: "",
        type_of_packages: "",
        number_of_packages: "",
        quantity_boxes: "",
        gross_weight: "",
        unit: "kg"
      });

      fetchJobs();
    } catch (err) {
      console.error("SUBMIT ERROR", err);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div style={layout}>
      
      {/* SIDEBAR */}
      <div style={sidebar}>
        <h2>DGRFlow</h2>

        <button style={navItem}>Dashboard</button>

        {isAdmin && (
          <button onClick={() => router.push("/admin")} style={navItem}>
            Admin
          </button>
        )}

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
            <input name="shipper" value={form.shipper} placeholder="Shipper" onChange={handleChange} style={input}/>
            <input name="consignee" value={form.consignee} placeholder="Consignee" onChange={handleChange} style={input}/>
            <input name="bol" value={form.bol} placeholder="BOL" onChange={handleChange} style={input}/>
            <input name="job_date" value={form.job_date} placeholder="Date" onChange={handleChange} style={input}/>
            <input name="emergency_contact" value={form.emergency_contact} placeholder="Emergency Contact" onChange={handleChange} style={input}/>

            <input name="type_of_packages" value={form.type_of_packages} placeholder="Type of Packages" onChange={handleChange} style={input}/>
            <input name="number_of_packages" value={form.number_of_packages} placeholder="Number of Packages" onChange={handleChange} style={input}/>
            <input name="quantity_boxes" value={form.quantity_boxes} placeholder="Quantity of Boxes" onChange={handleChange} style={input}/>
            <input name="gross_weight" value={form.gross_weight} placeholder="Weight" onChange={handleChange} style={input}/>

            <select name="unit" value={form.unit} onChange={handleChange} style={input}>
              <option value="kg">kg</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </select>

            <button style={primaryBtn}>Create Job</button>
          </form>
        </div>

        {/* JOBS */}
        <div style={jobsGrid}>
          {jobs.map((job) => (
            <div key={job.id} style={jobCard}>
              <strong>{job.shipper || "No name"}</strong>
              <p>Status: {job.status}</p>

              {job.pdf_url && (
                <a href={job.pdf_url} target="_blank">
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

const navItem = {
  marginTop: 10,
  padding: 10,
  background: "transparent",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const logoutBtn = {
  marginTop: 20,
  padding: 10,
  background: "#7c3aed",
  border: "none",
  color: "white"
};

const main = { flex: 1, padding: 30 };

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 10,
  marginBottom: 20
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10
};

const input = {
  padding: 10,
  borderRadius: 6,
  border: "1px solid #334155",
  background: "#020617",
  color: "white"
};

const primaryBtn = {
  gridColumn: "span 3",
  padding: 12,
  background: "#7c3aed",
  border: "none",
  color: "white"
};

const jobsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: 10
};

const jobCard = {
  background: "#0f172a",
  padding: 15,
  borderRadius: 10
};
