```js id="h9m2xq"
import { useState, useEffect } from "react";

export default function Dashboard() {

  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createJob();
  }, []);

  async function createJob() {

    try {

      const res = await fetch("/api/create-job", {
        method: "POST",
      });

      const data = await res.json();

      console.log("CREATE JOB:", data);

      if (data.id) {
        setJobId(data.id);
      }

    } catch (err) {

      console.error(err);

      alert("Create job failed");
    }
  }

  async function loadJob(currentJobId) {

    try {

      const res = await fetch(
        "/api/get-job?id=" + currentJobId
      );

      const data = await res.json();

      console.log("JOB DATA:", data);

      setJobData(data);

    } catch (err) {

      console.error(err);
    }
  }

  async function handleReadSDS() {

    try {

      if (!file) {
        alert("Select PDF first");
        return;
      }

      if (!jobId) {
        alert("No job ID");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("jobId", jobId);

      const res = await fetch(
        "/api/read-sds",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      console.log("READ SDS:", data);

      if (!res.ok) {

        alert(
          data.error ||
          "Read SDS failed"
        );

        setLoading(false);
        return;
      }

      alert("SDS parsed successfully");

      await loadJob(jobId);

      setLoading(false);

    } catch (err) {

      console.error(err);

      alert(err.message);

      setLoading(false);
    }
  }

  async function handleClassify() {

    try {

      if (!jobId) {
        alert("No job ID");
        return;
      }

      setLoading(true);

      const res = await fetch(
        "/api/classify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            jobId,
          }),
        }
      );

      const data = await res.json();

      console.log("CLASSIFY:", data);

      if (!res.ok) {

        alert(
          data.error ||
          "Classification failed"
        );

        setLoading(false);
        return;
      }

      alert("Classification complete");

      await loadJob(jobId);

      setLoading(false);

    } catch (err) {

      console.error(err);

      alert(err.message);

      setLoading(false);
    }
  }

  async function handleValidateDG() {

    if (!jobData) {
      alert("No classification data");
      return;
    }

    const errors = [];

    if (!jobData.un_number)
      errors.push("Missing UN Number");

    if (!jobData.hazard_class)
      errors.push("Missing Hazard Class");

    if (!jobData.packing_group)
      errors.push("Missing Packing Group");

    if (!jobData.technical_name)
      errors.push("Missing Technical Name");

    if (errors.length > 0) {

      alert(
        "DG Validation Errors:\n\n" +
        errors.join("\n")
      );

      return;
    }

    alert("DG Validation Passed ✅");
  }

  async function handleGeneratePDF() {

    try {

      if (!jobData) {
        alert("No job data");
        return;
      }

      setLoading(true);

      const res = await fetch(
        "/api/generate-pdf",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(jobData),
        }
      );

      const data = await res.json();

      console.log("PDF:", data);

      if (!res.ok) {

        alert(
          data.error ||
          "PDF generation failed"
        );

        setLoading(false);
        return;
      }

      alert("PDF generated");

      if (data.url) {
        window.open(data.url, "_blank");
      }

      setLoading(false);

    } catch (err) {

      console.error(err);

      alert(err.message);

      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>

      <h1 style={styles.title}>
        🚀 DGRFlow Dashboard
      </h1>

      <div style={styles.card}>

        <h2>Upload SDS</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

        <div style={styles.buttons}>

          <button
            style={styles.blue}
            onClick={handleReadSDS}
          >
            📄 Read SDS
          </button>

          <button
            style={styles.purple}
            onClick={handleClassify}
          >
            🎭 Classify
          </button>

          <button
            style={styles.green}
            onClick={handleValidateDG}
          >
            🛡 Validate DG
          </button>

          <button
            style={styles.orange}
            onClick={handleGeneratePDF}
          >
            📄 Generate PDF
          </button>

        </div>

      </div>

      <div style={styles.card}>

        <h2>Status</h2>

        {loading && (
          <p>Processing...</p>
        )}

        {jobData && (

          <div style={styles.grid}>

            <Info
              label="UN Number"
              value={jobData.un_number}
            />

            <Info
              label="Technical Name"
              value={jobData.technical_name}
            />

            <Info
              label="Hazard Class"
              value={jobData.hazard_class}
            />

            <Info
              label="Packing Group"
              value={jobData.packing_group}
            />

            <Info
              label="Flash Point"
              value={jobData.flash_point}
            />

            <Info
              label="EMS"
              value={jobData.ems}
            />

            <Info
              label="Transport"
              value={jobData.transport_mode}
            />

            <Info
              label="Status"
              value={jobData.status}
            />

          </div>
        )}

      </div>

    </div>
  );
}

function Info({ label, value }) {

  return (
    <div style={styles.infoCard}>

      <div style={styles.infoLabel}>
        {label}
      </div>

      <div style={styles.infoValue}>
        {value || "-"}
      </div>

    </div>
  );
}

const styles = {

  page: {
    background: "#020617",
    minHeight: "100vh",
    color: "white",
    padding: 40,
    fontFamily: "Arial",
  },

  title: {
    fontSize: 42,
    marginBottom: 30,
  },

  card: {
    background: "#0f172a",
    padding: 25,
    borderRadius: 14,
    marginBottom: 25,
  },

  buttons: {
    marginTop: 20,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 15,
    marginTop: 20,
  },

  infoCard: {
    background: "#1e293b",
    padding: 18,
    borderRadius: 12,
  },

  infoLabel: {
    opacity: 0.7,
    marginBottom: 8,
  },

  infoValue: {
    fontWeight: "bold",
    fontSize: 18,
  },

  blue: {
    border: "none",
    background: "#0284c7",
    color: "white",
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
  },

  purple: {
    border: "none",
    background: "#7c3aed",
    color: "white",
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
  },

  green: {
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
  },

  orange: {
    border: "none",
    background: "#ea580c",
    color: "white",
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
  },

};
```
