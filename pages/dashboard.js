import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    shipper: "",
    consignee: "",
    bol: "",
    job_date: "",
    emergency_contact: "",
    type_of_packages: "",
    number_of_packages: "",
    quantity_boxes: "",
    gross_weight: "",
    unit: "kg",
  });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      router.push("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
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

    const { data } = await supabase.auth.getUser();

    await supabase.from("jobs").insert([
      {
        ...form,
        user_id: data.user.id,
        status: "pending",
      },
    ]);

    fetchJobs();
  }

  const isAdmin = profile?.role === "admin";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#020617", color: "white" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: 220, padding: 20, borderRight: "1px solid #1e293b" }}>
        <h2>DGRFlow</h2>

        <button>Dashboard</button>

        {isAdmin && (
          <button onClick={() => router.push("/admin")}>
            Admin
          </button>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: 30 }}>

        <h1>Dashboard</h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <input name="shipper" placeholder="Shipper" onChange={handleChange}/>
          <input name="consignee" placeholder="Consignee" onChange={handleChange}/>
          <input name="bol" placeholder="BOL" onChange={handleChange}/>
          <input name="job_date" placeholder="Date" onChange={handleChange}/>
          <input name="emergency_contact" placeholder="Emergency Contact" onChange={handleChange}/>
          <input name="type_of_packages" placeholder="Type of Packages" onChange={handleChange}/>
          <input name="number_of_packages" placeholder="Number of Packages" onChange={handleChange}/>
          <input name="quantity_boxes" placeholder="Quantity of Boxes" onChange={handleChange}/>
          <input name="gross_weight" placeholder="Weight" onChange={handleChange}/>

          <select name="unit" onChange={handleChange}>
            <option>kg</option>
            <option>lb</option>
            <option>oz</option>
          </select>

          <button style={{ gridColumn: "span 3" }}>Create Job</button>
        </form>

        {/* JOB LIST */}
        <div style={{ marginTop: 30 }}>
          {jobs.map((job) => (
            <div key={job.id} style={{ background: "#0f172a", padding: 15, marginBottom: 10 }}>

              <strong>{job.shipper}</strong>

              <p>{job.consignee}</p>
              <p>BOL: {job.bol}</p>

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
      
