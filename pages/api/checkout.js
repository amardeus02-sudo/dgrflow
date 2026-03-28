import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
    } else {
      fetchJobs(data.user.id);
    }
  }

  async function fetchJobs(userId) {
    const { data } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", userId);

    setJobs(data || []);
  }

  async function createJob(e) {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return;

    // LIMIT FREE PLAN
    if (jobs.length >= 3) {
      alert("Free plan limit reached. Upgrade to Pro 🚀");
      return;
    }

    let fileName = null;

    if (file) {
      fileName = Date.now() + "-" + file.name;

      await supabase.storage
        .from("sds-files")
        .upload(fileName, file);
    }

    await supabase.from("jobs").insert([
      {
        name,
        file_name: fileName,
        status: "pending",
        user_id: user.id
      }
    ]);

    setName("");
    setFile(null);

    fetchJobs(user.id);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function upgrade() {
    const res = await fetch("/api/checkout");
    const data = await res.json();
    window.location.href = data.url;
  }

  return (
    <div style={{ fontFamily: "Arial", background: "#f1f5f9", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{
        background: "#0f172a",
        color: "white",
        padding: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <img src="/logo.png" style={{ height: 50 }} />
        </div>

        <div>
          <button onClick={upgrade} style={upgradeBtn}>
            Upgrade 🚀
          </button>

          <button onClick={logout} style={logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* FORM */}
      <div style={{
        maxWidth: 500,
        margin: "40px auto",
        background: "white",
        padding: 30,
        borderRadius: 12
      }}>
        <h3>Create Job</h3>

        <form onSubmit={createJob}>
          <input
            placeholder="Product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={input}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            style={input}
          />

          <button style={button}>
            Submit Job
          </button>
        </form>
      </div>

      {/* JOBS */}
      <div style={{ maxWidth: 700, margin: "auto" }}>
        <h3>Jobs</h3>

        {jobs.length === 0 && <p>No jobs yet</p>}

        {jobs.map((job) => (
          <div key={job.id} style={jobCard}>
            <strong>{job.name}</strong>
            <p>Status: {job.status}</p>

            {job.file_name && (
              <a
                href={`https://wwbvrhqeycokiojwzugg.supabase.co/storage/v1/object/public/sds-files/${job.file_name}`}
                target="_blank"
              >
                📄 Download
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  padding: 10,
  marginTop: 10,
  borderRadius: 6,
  border: "1px solid #ddd"
};

const button = {
  marginTop: 15,
  padding: 12,
  width: "100%",
  background: "#a855f7",
  color: "white",
  border: "none",
  borderRadius: 8
};

const jobCard = {
  background: "white",
  padding: 20,
  marginTop: 10,
  borderRadius: 10
};

const logoutBtn = {
  marginLeft: 10,
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#ef4444",
  color: "white"
};

const upgradeBtn = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#22c55e",
  color: "white"
};
