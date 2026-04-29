import { useState, useEffect } from "react";
console.log("CLASSIFY START");
console.log("BODY:", req.body);
export default function Dashboard() {

  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);

  // criar job ao abrir
  useEffect(() => {
    createJob();
  }, []);

  async function createJob() {
    try {
      const res = await fetch("/api/create-job", {
        method: "POST"
      });

      const data = await res.json();

      if (data?.id) {
        setJobId(data.id);
        console.log("JOB CREATED:", data.id);
      }

    } catch (err) {
      console.error("CREATE JOB ERROR:", err);
    }
  }

  async function loadJob() {
    if (!jobId) return;

    try {
      const res = await fetch(`/api/get-job?id=${jobId}`);
      const data = await res.json();

      setJobData(data);

    } catch (err) {
      console.error("LOAD JOB ERROR:", err);
    }
  }

  // 📄 READ SDS
  async function handleReadSDS() {

    if (!file || !jobId) {
      alert("Upload file first");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/read-sds", {
        method: "POST",
        headers: {
          "x-job-id": jobId
        },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Read SDS error");
        return;
      }

      alert("SDS processed");

      await loadJob();

    } catch (err) {
      console.error(err);
      alert("Read SDS failed");
    }

    setLoading(false);
  }

  // 🧠 CLASSIFY
  async function handleClassify() {

    if (!jobId) return;

    setLoading(true);

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ jobId })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Classification error");
        return;
      }

      alert("Classified");

      await loadJob();

    } catch (err) {
      console.error(err);
      alert("Classification failed");
    }

    setLoading(false);
  }

  // 🛡 VALIDATE DG
  function handleValidate() {

    if (!jobData) return;

    const errors = [];

    if (!jobData.un_number) errors.push("Missing UN Number");
    if (!jobData.hazard_class) errors.push("Missing Hazard Class");
    if (!jobData.packing_group) errors.push("Missing Packing Group");

    if (errors.length > 0) {
      alert("DG INVALID:\n\n" + errors.join("\n"));
    } else {
      alert("DG VALID ✅");
    }
  }

  // 📄 GENERATE PDF
  async function handleGeneratePDF() {

    if (!jobData) return;

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(jobData)
      });

      const data = await res.json();

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        alert("PDF error");
      }

    } catch (err) {
      console.error(err);
      alert("PDF failed");
    }
  }

  return (
    <div style={{ padding: 40, background: "#020617", minHeight: "100vh", color: "white" }}>

      <h1>🚀 DGRFlow Dashboard</h1>

      {/* UPLOAD */}
      <div style={{ marginTop: 20 }}>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <div style={{ marginTop: 10 }}>

          <button onClick={handleReadSDS} disabled={loading}>
            📄 Read SDS
          </button>

          <button onClick={handleClassify} style={{ marginLeft: 10 }} disabled={loading}>
            🧠 Classify
          </button>

          <button onClick={handleValidate} style={{ marginLeft: 10 }}>
            🛡 Validate DG
          </button>

          <button onClick={handleGeneratePDF} style={{ marginLeft: 10 }}>
            📦 Generate PDF
          </button>

        </div>
      </div>

      {/* STATUS */}
      <div style={{ marginTop: 30 }}>
        <h3>Status</h3>
        <p>{jobData?.status || "no status"}</p>
      </div>

      {/* RESULTS */}
      {jobData && (
        <div style={{ marginTop: 30 }}>

          <h3>DG Data</h3>

          <p><b>UN:</b> {jobData.un_number}</p>
          <p><b>Name:</b> {jobData.technical_name}</p>
          <p><b>Class:</b> {jobData.hazard_class}</p>
          <p><b>PG:</b> {jobData.packing_group}</p>
          <p><b>Flash:</b> {jobData.flash_point}</p>
          <p><b>EMS:</b> {jobData.ems}</p>

        </div>
      )}

    </div>
  );
}
