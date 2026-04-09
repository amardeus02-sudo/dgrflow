'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [productName, setProductName] = useState('');
  const [jobs, setJobs] = useState([]);

  async function fetchJobs() {
    const res = await fetch('/api/get-jobs');
    const data = await res.json();
    setJobs(data.jobs || []);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function handleUpload() {
    if (!file) return alert('Selecione um arquivo');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_name', productName);

    const res = await fetch('/api/create-job', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.error) {
      alert(data.error);
    } else {
      alert('Job criado!');
      fetchJobs();
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>

      <input
        type="text"
        placeholder="Nome do produto"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>Upload</button>

      <h2>Jobs</h2>

      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            {job.product_name} - {job.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
