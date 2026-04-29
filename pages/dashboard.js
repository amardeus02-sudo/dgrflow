import { useEffect, useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);

  const [loading, setLoading] = useState(false);

  // 🚀 cria job automático
  useEffect(() => {
    createJob();
  }, []);

  // 🔄 polling
  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(() => {
      loadJob();
    }, 2500);

    return () => clearInterval(interval);
  }, [jobId]);

  async function createJob() {
    try {
      const res = await fetch("/api/create-job", {
        method: "POST",
      });

      const data = await res.json();

      console.log("JOB CREATED:", data);

      setJobId(data.id);

    } catch (err) {
      console.error(err);
      alert("Failed creating job");
    }
  }

  async function loadJob() {
    try {
      const res = await fetch(`/api/get-job?id=${jobId}`);

      const data = await res.json();

      console.log("JOB DATA:", data);

      setJob(data);

    } catch (err) {
      console.error(err);
    }
  }

  // 📄 READ SDS
  async function readSDS() {
  try {
    if (!file) {
      alert("Upload PDF first");
      return;
    }

    if (!jobId) {
      alert("Job not created");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    formData.append("file", file);

    const res = await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": jobId,
      },
      body: formData,
    });

    const data = await res.json();

    console.log("READ SDS RESPONSE:", data);

    if (!res.ok) {
      alert(
        data.details ||
        data.error ||
        "Read SDS failed"
      );

      return;
    }

    alert("SDS parsed successfully");

    await loadJob();

  } catch (err) {
    console.error(err);

    alert(err.message);

  } finally {
    setLoading(false);
  }
}

  // 🤖 CLASSIFY
  async function classify() {
    try {
      if (!jobId) {
        alert("Missing job");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
        }),
      });

      const data = await res.json();

      console.log("CLASSIFY:", data);

      if (!res.ok) {
        alert(data.error || "Classification failed");
        return;
      }

      alert("Classification completed");

      await loadJob();

    } catch (err) {
      console.error(err);
      alert("Classification error");

    } finally {
      setLoading(false);
    }
  }

  // 🛡️ VALIDATE
  async function validateDG() {
    try {
      setLoading(true);

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
        }),
      });

      const data = await res.json();

      console.log("VALIDATION:", data);

      if (!res.ok) {
        alert(data.error || "Validation failed");
        return;
      }

      alert("Validation completed");

      await loadJob();

    } catch (err) {
      console.error(err);
      alert("Validation error");

    } finally {
      setLoading(false);
    }
  }

  // 📄 PDF
  async function generatePDF() {
    try {
      setLoading(true);

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
        }),
      });

      const data = await res.json();

      console.log("PDF:", data);

      if (!res.ok) {
        alert(data.error || "PDF generation failed");
        return;
      }

      if (data.url) {
        window.open(data.url, "_blank");
      }

      await loadJob();

    } catch (err) {
      console.error(err);
      alert("PDF error");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={container}>
      <h1 style={title}>🚀 DGRFlow Dashboard</h1>

      {/* UPLOAD */}
      <div style={card}>
        <h2>Upload SDS</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={input}
        />

        <div style={buttonRow}>
          <button
            onClick={readSDS}
            disabled={loading}
            style={btnBlue}
          >
            📄 Read SDS
          </button>

          <button
            onClick={classify}
            disabled={loading || job?.status !== "parsed"}
            style={btnPurple}
          >
            🤖 Classify
          </button>

          <button
            onClick={validateDG}
            disabled={loading || job?.status !== "classified"}
            style={btnGreen}
          >
            🛡️ Validate DG
          </button>

          <button
            onClick={generatePDF}
            disabled={loading || !job}
            style={btnOrange}
          >
            📄 Generate PDF
          </button>
        </div>
      </div>

      {/* STATUS */}
      <div style={card}>
        <h2>Status</h2>

        <StatusBadge status={job?.status} />
      </div>

      {/* RESULT */}
      {job && (
        <div style={card}>
          <h2>Classification Result</h2>

          <div style={grid}>
            <Field label="UN Number" value={job.un_number} />
            <Field label="Technical Name" value={job.technical_name} />
            <Field label="Hazard Class" value={job.hazard_class} />
            <Field label="Packing Group" value={job.packing_group} />
            <Field label="EMS" value={job.ems} />
            <Field label="Flash Point" value={job.flash_point} />
            <Field label="Transport Mode" value={job.transport_mode} />
          </div>
        </div>
      )}

      {/* VALIDATION */}
      {job?.validation && (
        <div style={card}>
          <h2>Validation</h2>

          <p>
            Status:
            {" "}
            {job.validation.valid
              ? " ✅ VALID"
              : " ❌ INVALID"}
          </p>

          {job.validation.errors?.map((e, i) => (
            <p key={i} style={{ color: "#ef4444" }}>
              ❌ {e}
            </p>
          ))}

          {job.validation.warnings?.map((w, i) => (
            <p key={i} style={{ color: "#f59e0b" }}>
              ⚠️ {w}
            </p>
          ))}
        </div>
      )}

      {/* PDF */}
      {job?.pdf_url && (
        <div style={card}>
          <h2>Generated PDF</h2>

          <a
            href={job.pdf_url}
            target="_blank"
            style={pdfLink}
          >
            Open PDF
          </a>
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

function StatusBadge({ status }) {
  const colors = {
    uploaded: "#64748b",
    parsed: "#f59e0b",
    classified: "#22c55e",
    validated: "#3b82f6",
  };

  return (
    <div
      style={{
        background: colors[status] || "#334155",
        padding: "10px 16px",
        borderRadius: 8,
        display: "inline-block",
        marginTop: 10,
      }}
    >
      {status || "waiting"}
    </div>
  );
}

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
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  padding: 40,
  fontFamily: "Arial",
};

const title = {
  marginBottom: 30,
};

const card = {
  background: "#0f172a",
  padding: 24,
  borderRadius: 14,
  marginBottom: 24,
};

const input = {
  marginTop: 10,
  marginBottom: 20,
};

const buttonRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
};

const btnBase = {
  border: "none",
  padding: "12px 18px",
  borderRadius: 8,
  color: "white",
  cursor: "pointer",
};

const btnBlue = {
  ...btnBase,
  background: "#0ea5e9",
};

const btnPurple = {
  ...btnBase,
  background: "#7c3aed",
};

const btnGreen = {
  ...btnBase,
  background: "#22c55e",
};

const btnOrange = {
  ...btnBase,
  background: "#f97316",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
  marginTop: 20,
};

const field = {
  background: "#1e293b",
  padding: 12,
  borderRadius: 8,
};

const loadingBox = {
  marginTop: 20,
  background: "#1e293b",
  padding: 14,
  borderRadius: 10,
};

const pdfLink = {
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: "bold",
};
