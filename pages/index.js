<div style={{
  textAlign: "center",
  padding: 40,
  background: "linear-gradient(135deg, #0f172a, #1e293b)",
  color: "white"
}}>
  <img 
    src="/logo.png" 
    style={{ height: 90, marginBottom: 20 }} 
  />

  <h1 style={{ fontSize: 36, fontWeight: "bold" }}>
    DGRFlow
  </h1>

  <p style={{ opacity: 0.8 }}>
    From SDS to DG Classification — Instantly
  </p>
</div>
      export default function Home() {
  return (
    <div style={{ fontFamily: "Inter, Arial", background: "#0f172a", color: "#fff", minHeight: "100vh" }}>
      
      {/* NAVBAR */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px"
      }}>
        <img src="/logo.png" style={{ height: 50 }} />

        <div>
          <a href="/login" style={{ marginRight: 15, color: "#fff", textDecoration: "none" }}>
            Login
          </a>

          <a href="mailto:seuemail@email.com" style={{
            background: "#6366f1",
            padding: "8px 16px",
            borderRadius: 6,
            color: "#fff",
            textDecoration: "none"
          }}>
            Get Access
          </a>
        </div>
      </div>

      {/* HERO */}
      <div style={{
        textAlign: "center",
        padding: "100px 20px",
        maxWidth: 800,
        margin: "auto"
      }}>
        <h1 style={{ fontSize: 48 }}>
          From SDS to DG Classification — Instantly
        </h1>

        <p style={{ fontSize: 18, opacity: 0.8 }}>
          Upload Safety Data Sheets and automatically classify dangerous goods.
          Reduce manual work, errors, and compliance risks.
        </p>

        <br />

        <a href="/login">
          <button style={{
            background: "#6366f1",
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            color: "#fff",
            marginRight: 10,
            cursor: "pointer"
          }}>
            Start Now
          </button>
        </a>

        <a href="mailto:seuemail@email.com">
          <button style={{
            background: "#1f2937",
            padding: "12px 24px",
            borderRadius: 8,
            border: "1px solid #444",
            color: "#fff",
            cursor: "pointer"
          }}>
            Request Demo
          </button>
        </a>
      </div>

      {/* FEATURES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px,1fr))",
        gap: 20,
        padding: 40
      }}>
        {[
          "📄 SDS Upload",
          "⚡ Instant Classification",
          "📦 Job Management",
          "📊 Reduce Errors"
        ].map((item, i) => (
          <div key={i} style={{
            background: "#1e293b",
            padding: 20,
            borderRadius: 10
          }}>
            {item}
          </div>
        ))}
      </div>

    </div>
  );
}
