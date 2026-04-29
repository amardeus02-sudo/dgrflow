```js
import { useState, useEffect } from "react";

export default function Dashboard() {

  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🚀 cria job automático
  useEffect(() => {
    createJob();
  }, []);

  // 🚀 criar job
  async function createJob() {

    try {

      const res = await fetch("/api/create-job", {
        method: "POST",
      });

      const data = await res.json();

      console.log("CREATE JOB:", data);

      setJobId(data.id);

    } catch (err) {

      console.error(err);
      alert("Create job error");
    }
  }

  // 🚀 carregar dados do job
 async function loadJob() {

  if (!jobId) return;

  try {

    const res = await fetch(
      "/api/get-job?id=" + jobId
    );

    const data = await res.json();

    console.log("JOB DATA:", data);

    setJobData(data);

  } catch (err) {

    console.error(err);
  }
}

  // 🚀 READ SDS
  async function handleReadSDS() {

    try {

      if (!file) {
        alert("Select PDF first");
        return;
      }

      if (!jobId) {
        alert("Job not created");
        return;
      }

      setLoading(true);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("jobId", jobId);

      const res = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("READ SDS:", data);

      if (!res.ok) {

        alert(
          data.error || "Read SDS error"
        );

        setLoading(false);
        return;
      }

      alert("SDS parsed successfully");

      await loadJob();

      setLoading(false);

    } catch (err) {

      console.error(err);

      alert(err.message);

      setLoading(false);
    }
  }

  // 🚀 CLASSIFY
  async function handleClassify() {

    try {

      if (!jobId) {
        alert("Missing jobId");
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

        alert(
          data.error ||
          "Classification failed"
        );

        setLoading(false);
        return;
      }

      alert("Classification complete");

      await loadJob();

      setLoading(false);

    } catch (err) {

      console.error(err);

      alert(err.message);

      setLoading(false);
    }
  }

  // 🚀 VALIDATE DG
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

  // 🚀 GENERATE PDF
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
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        color: "white",
        padding: 40,
        fontFamily: "Arial",
      }}
    >

      <h1
        style={{
          marginBottom: 30,
          fontSize: 48,
        }}
      >
        🚀 DGRFlow Dashboard
      </h1>

      {/* UPLOAD */}

      <div
        style={{
          background: "#0f172a",
          padding: 25,
          borderRadius: 14,
          marginBottom: 25,
        }}
      >

        <h2>Upload SDS</h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) =>
            setFile(e.target.files[0])
          }
        />

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >

          <button
            onClick={handleReadSDS}
            style={btnBlue}
          >
            📄 Read SDS
          </button>

          <button
            onClick={handleClassify}
            style={btnPurple}
          >
            🎭 Classify
          </button>

          <button
            onClick={handleValidateDG}
            style={btnGreen}
          >
            🛡 Validate DG
          </button>

          <button
            onClick={handleGeneratePDF}
            style={btnOrange}
          >
            📄 Generate PDF
          </button>

        </div>

      </div>

      {/* STATUS */}

      <div
        style={{
          background: "#0f172a",
          padding: 25,
          borderRadius: 14,
        }}
      >

        <h2>Status</h2>

        {loading && (
          <p>Processing...</p>
        )}

        {jobData && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: 15,
              marginTop: 20,
            }}
          >

            <Card
              title="UN Number"
              value={jobData.un_number}
            />

            <Card
              title="Technical Name"
              value={jobData.technical_name}
            />

            <Card
              title="Hazard Class"
              value={jobData.hazard_class}
            />

            <Card
              title="Packing Group"
              value={jobData.packing_group}
            />

            <Card
              title="Flash Point"
              value={jobData.flash_point}
            />

            <Card
              title="EMS"
              value={jobData.ems}
            />

            <Card
              title="Transport"
              value={jobData.transport_mode}
            />

            <Card
              title="Status"
              value={jobData.status}
            />

          </div>
        )}

      </div>

    </div>
  );
}

// 🚀 CARD

function Card({ title, value }) {

  return (
    <div
      style={{
        background: "#1e293b",
        padding: 18,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          opacity: 0.7,
          marginBottom: 8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontWeight: "bold",
          fontSize: 18,
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

// 🚀 BUTTONS

const baseBtn = {
  border: "none",
  padding: "14px 22px",
  borderRadius: 10,
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const btnBlue = {
  ...baseBtn,
  background: "#0ea5e9",
};

const btnPurple = {
  ...baseBtn,
  background: "#7c3aed",
};

const btnGreen = {
  ...baseBtn,
  background: "#16a34a",
};

const btnOrange = {
  ...baseBtn,
  background: "#ea580c",
};
```
