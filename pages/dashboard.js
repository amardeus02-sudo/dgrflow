import { useState, useEffect } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);

  // 🔥 criar job automático ao abrir
  useEffect(() => {
    createJob();
  }, []);

  async function createJob() {
    const res = await fetch("/api/create-job", { method: "POST" });
    const data = await res.json();

    setJobId(data.id);
    console.log("JOB CREATED:", data.id);
  }

  // 📄 upload + IA
  async function handleReadSDS() {
    if (!file || !jobId) {
      alert("Upload file first");
      return;
    }

    const res = await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": jobId,
      },
      body: file,
    });

    const data = await res.json();

    console.log("READ SDS RESPONSE:", data);

    alert("IA finished reading SDS");

    await loadJob(); // 🔥 atualiza tela
  }

  // 🧠 classify
  async function handleClassify() {
    if (!jobId) return;

    const res = await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });

    const data = await res.json();

    console.log("CLASSIFY:", data);

    alert("Classified");

    await loadJob(); // 🔥 atualiza tela
  }

  // 🔄 carregar dados do job
  async function loadJob() {
    if (!jobId) return;

    const res = await fetch(`/api/get-job?id=${jobId}`);
    const data = await res.json();

    console.log("JOB DATA:", data);

    setJobData(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleReadSDS}>
        🤖 Read SDS
      </button>

      <button onClick={handleClassify} style={{ marginLeft: 10 }}>
        ⚡ Classify
      </button>

      <hr />

      {jobData && (
        <div>
          <p><b>UN:</b> {jobData.un_number}</p>
          <p><b>Name:</b> {jobData.technical_name}</p>
          <p><b>Class:</b> {jobData.hazard_class}</p>
          <p><b>PG:</b> {jobData.packing_group}</p>
          <p><b>Flash:</b> {jobData.flash_point}</p>
          <p><b>EMS:</b> {jobData.ems}</p>
          <p><b>Transport:</b> {jobData.transport_mode}</p>
        </div>
      )}
    </div>
  );
}
