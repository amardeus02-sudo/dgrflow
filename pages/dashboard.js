import { useState, useEffect } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);

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

    await fetch("/api/read-sds", {
      method: "POST",
      headers: {
        "x-job-id": jobId,
      },
      body: file,
    });
  }

  async function handleClassify() {
    if (!jobId) return;

    await fetch("/api/classify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId }),
    });
  }

  async function loadJob() {
    const res = await fetch(`/api/get-job?id=${jobId}`);
    const data = await res.json();
    setJobData(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br /><br />

      <button onClick={handleReadSDS}>Read SDS</button>
      <button onClick={handleClassify}>Classify</button>

      <hr />

      {jobData && (
        <div>
          <p>Status: {jobData.status}</p>
          <p>UN: {jobData.un_number}</p>
          <p>Name: {jobData.technical_name}</p>
          <p>Class: {jobData.hazard_class}</p>
          <p>PG: {jobData.packing_group}</p>
          <p>Flash: {jobData.flash_point}</p>
          <p>EMS: {jobData.ems}</p>
          <p>Transport: {jobData.transport_mode}</p>
        </div>
      )}
    </div>
  );
}
