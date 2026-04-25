import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function Admin() {
  const router = useRouter();

  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) return router.push("/login");

    if (data.user.email !== "amardeus02@gmail.com") {
      return router.push("/dashboard");
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

  function handleChange(e, id) {
    setForm({
      ...form,
      [id]: {
        ...form[id],
        [e.target.name]: e.target.value
      }
    });
  }

  async function save(id) {
    const data = form[id];

    if (!data) return alert("Fill classification");

    await supabase
      .from("jobs")
      .update({
        ...data,
        status: "classified"
      })
      .eq("id", id);

    alert("Saved");
    fetchJobs();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin - Classification</h1>

      {jobs.map((job) => (
        <div key={job.id} style={{ marginBottom: 20 }}>
          <h3>{job.product_name}</h3>

          <input name="un_number" placeholder="UN Number" onChange={(e) => handleChange(e, job.id)} />
          <input name="psn" placeholder="PSN" onChange={(e) => handleChange(e, job.id)} />
          <input name="hazard_class" placeholder="Hazard Class" onChange={(e) => handleChange(e, job.id)} />
          <input name="packing_group" placeholder="Packing Group" onChange={(e) => handleChange(e, job.id)} />

          <button onClick={() => save(job.id)}>Save</button>
        </div>
      ))}
    </div>
  );
}
