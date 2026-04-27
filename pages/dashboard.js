import { useState, useEffect } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createJob();
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(() => {
      loadJob();
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  async function createJob() {
    const res = await fetch("/api/create-job", { method: "POST" });
    const data = await res.json();
    setJobId(data.id);
  }

  async function loadJob() {
    const res = await fetch(`/api/get-job?id=${jobId}`);
    const data = await res.json();
    setJob(data);
  }

  async function readSDS() {
    if (!file || !jobId) return;

    setLoading(true);

    await fetch("/api/read-sds", {
      method: "POST",
      headers: { "x-job-id": jobId },
      body: file,
    });

    setLoading(false);
  }

  async function classify() {
    if (!jobId) return;

    setLoading(true);

    await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });

    setLoading(false);
  }

  function StatusBadge({ status }) {
    const colors = {
      uploaded: "#64748b",
      parsed: "#f59e0b",
      classified: "#22c55e",
      error: "#ef4444",
    };

    return (
      <span style={{
        background: colors[status] || "#333",
        padding: "6px 12px",
        borderRadius: 6
      }}>
        {status}
      </span>
    );
  }

  return (
    <div style={container}>
      <h1 style={title}>DGRFlow</h1>

      {/* UPLOAD */}
      <div style={card}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div style={{ marginTop: 15 }}>
          <button
            onClick={readSDS}
            disabled={!file || loading}
            style={btn}
          >
            Read SDS
          </button>

          <button
            onClick={classify}
            disabled={!job || job.status !== "parsed" || loading}
            style={btnPurple}
          >
            Classify
          </button>
        </div>
      </div>

      {/* STATUS */}
      {job && (
        <div style={card}>
          <h3>Status</h3>
          <StatusBadge status={job.status} />
        </div>
      )}

      {/* RESULTADOS */}
      {job?.status === "classified" && (
        <div style={card}>
          <h3>Classification</h3>

          <div style={grid}>
            <Field label="UN Number" value={job.un_number} />
            <Field label="Technical Name" value={job.technical_name} />
            <Field label="Hazard Class" value={job.hazard_class} />
            <Field label="Packing Group" value={job.packing_group} />
            <Field label="Flash Point" value={job.flash_point} />
            <Field label="EMS" value={job.ems} />
            <Field label="Transport" value={job.transport_mode} />
          </div>
        </div>
      )}

      {loading && <p style={{ marginTop: 20 }}>Processing...</p>}
    </div>
  );
}

/* COMPONENTES */

function Field({ label, value }) {
  return (
    <div style={field}>
      <strong>{label}</strong>
      <div>{value || "-"}</div>
    </div>
  );
}

/* STYLES */

const container = {
  background: "#020617",
  color: "white",
  minHeight: "100vh",
  padding: 40,
  fontFamily: "Arial"
};

const title = {
  marginBottom: 20
};

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 10,
  marginBottom: 20
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: 10,
  marginTop: 15
};

const field = {
  background: "#1e293b",
  padding: 10,
  borderRadius: 6
};

const btn = {
  padding: 10,
  marginRight: 10,
  background: "#38bdf8",
  border: "none",
  borderRadius: 6,
  color: "white",
  cursor: "pointer"
};

const btnPurple = {
  ...btn,
  background: "#7c3aed"
};
