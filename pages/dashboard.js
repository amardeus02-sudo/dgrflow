<div style={{ marginBottom: 10 }}>
  <a
    href={`https://wwbvrhqeycokiojwzugg.supabase.co/storage/v1/object/public/sds-files/${job.file_name}`}
    target="_blank"
  >
    📄 Download SDS
  </a>
</div>

<div style={{ marginBottom: 10 }}>
  <button onClick={() => updateStatus(job.id, "pending")}>
    🔴 Pending
  </button>

  <button onClick={() => updateStatus(job.id, "in progress")}>
    🟡 In Progress
  </button>

  <button onClick={() => updateStatus(job.id, "done")}>
    🟢 Done
  </button>
</div>
