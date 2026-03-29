import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    transport_type: "air",
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

    await supabase.from("jobs").insert([
      {
        ...form,
        user_id: userId,
        status: "pending",
      },
    ]);

    setForm({ transport_type: "air" });
    fetchJobs();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020617", color: "white" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 220, padding: 20, borderRight: "1px solid #1e293b" }}>
        <h2>DGRFlow</h2>

        <button style={{ display: "block", marginTop: 20 }}>Dashboard</button>

        {isAdmin && (
          <button onClick={() => router.push("/admin")} style={{ display: "block", marginTop: 10 }}>
            Admin
          </button>
        )}

        <button onClick={logout} style={{ marginTop: 20 }}>
          Logout
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 30 }}>
        <h1>Dashboard</h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ marginBottom: 30 }}>

          <input name="shipper" placeholder="Shipper" onChange={handleChange} />
          <input name="consignee" placeholder="Consignee" onChange={handleChange} />
          <input name="bol" placeholder="BOL" onChange={handleChange} />
          <input name="job_date" placeholder="Date" onChange={handleChange} />
          <input name="emergency_contact" placeholder="Emergency" onChange={handleChange} />

          <input name="type_of_packages" placeholder="Type of Packages" onChange={handleChange} />
          <input name="number_of_packages" placeholder="Number of Packages" onChange={handleChange} />
          <input name="quantity_boxes" placeholder="Quantity of Boxes" onChange={handleChange} />
          <input name="gross_weight" placeholder="Weight" onChange={handleChange} />

          <select name="unit" onChange={handleChange}>
            <option value="kg">kg</option>
            <option value="lb">lb</option>
            <option value="oz">oz</option>
          </select>

          <button>Create Job</button>
        </form>

        {/* JOBS */}
        {jobs.map((job) => (
          <div key={job.id} style={{ border: "1px solid #333", padding: 10, marginBottom: 10 }}>
            <strong>{job.shipper}</strong>
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
  );
}
