export default function Dashboard() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      <p>Welcome to your DGRFlow system</p>

      <h2>Upload SDS</h2>
      <input type="file" />

      <h2>Jobs</h2>
      <ul>
        <li>Product A - Pending</li>
        <li>Product B - Completed</li>
      </ul>
    </div>
  );
}
