import { useState, useEffect } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
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

  async function handleReadSDS() {
    if (!file || !jobId) return;

    setLoading(true);

    await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": jobId,
      },
      body: file,
    });

    setLoading(false);
  }

  async function handleClassify() {
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

  async function loadJob() {
    const res = await fetch(`/api/get-job?id=${jobId}`);
    const data = await res.json();
    setJobData(data);
  }

  function getStatusColor(status) {
    if (status === "uploaded") return "#64748b";
    if (status === "parsed") return "#f59e0b";
    if (status === "classified") return "#22c55e";
    return "#ef4444";
  }

  return (
    <div style={container}>
      <h1 style={title}>🚀 DGRFlow Dashboard</h1>

      {/* UPLOAD */}
      <div style={card}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <div style={{ marginTop: 15 }}>
          <button
            onClick={handleReadSDS}
            disabled={!file || loading}
            style={btn}
          >
            📄 Read SDS
          </button>

          <button
            onClick={handleClassify}
            disabled={!jobData || jobData.status !== "parsed" || loading}
            style={btnPurple}
          >
            🤖 Classify
          </button>
        </div>
      </div>

      {/* STATUS */}
      {jobData && (
        <div style={card}>
          <h3>Status</h3>
          <div
            style={{
              background: getStatusColor(jobData.status),
              padding: 10,
              borderRadius: 6,
              display: "inline-block",
              marginTop: 10,
            }}
          >
            {jobData.status}
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      {jobData?.status === "classified" && (
        <div style={card}>
          <h3>📦 Dangerous Goods Classification</h3>

          <div style={grid}>
            <Item label="UN Number" value={jobData.un_number} />
            <Item label="Technical Name" value={jobData.technical_name} />
            <Item label="Hazard Class" value={jobData.hazard_class} />
            <Item label="Packing Group" value={jobData.packing_group} />
            <Item label="Flash Point" value={jobData.flash_point} />
            <Item label="EMS" value={jobData.ems} />
            <Item label="Transport Mode" value={jobData.transport_mode} />
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div style={loadingBox}>
          ⏳ Processing...
        </div>
      )}
    </div>
  );
}

/* COMPONENTE ITEM */

function Item({ label, value }) {
  return (
    <div style={item}>
      <strong>{label}</strong>
      <div>{value || "-"}</div>
    </div>
  );
}

/* STYLES */

const container = {
  background: "#020617",
  minHeight: "100vh",
  color: "white",
  padding: 40,
  fontFamily: "Arial",
};

const title = {
  marginBottom: 20,
};

const card = {
  background: "#0f172a",
  padding: 20,
  borderRadius: 10,
  marginBottom: 20,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))",
  gap: 15,
  marginTop: 20,
};

const item = {
  background: "#1e293b",
  padding: 10,
  borderRadius: 6,
};

const btn = {
  padding: 10,
  marginRight: 10,
  background: "#38bdf8",
  border: "none",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
};

const btnPurple = {
  ...btn,
  background: "#7c3aed",
};

const loadingBox = {
  marginTop: 20,
  padding: 15,
  background: "#1e293b",
  borderRadius: 8,
};
