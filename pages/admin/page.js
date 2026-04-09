'use client';

import { useEffect, useState } from 'react';

export default function Admin() {
  const [jobs, setJobs] = useState([]);

  async function fetchJobs() {
    const res = await fetch('/api/get-jobs');
    const data = await res.json();
    setJobs(data.jobs || []);
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Status</th>
            <th>Arquivo</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.product_name}</td>
              <td>{job.status}</td>
              <td>
                <a href={job.pdf_url} target="_blank">
                  Ver arquivo
                </a>
              </td>
              <td>{job.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
