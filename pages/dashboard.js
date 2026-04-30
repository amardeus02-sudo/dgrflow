import { useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  async function uploadAndRead() {
    if (!file) {
      alert("Select SDS file");
      return;
    }

    setStatus("reading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log(data);

      if (!res.ok) {
        alert(data.error || "Read SDS failed");
        setStatus("error");
        return;
      }

      setResult(data);
      setStatus("success");

    } catch (err) {
      console.log(err);
      alert("Read SDS error");
      setStatus("error");
    }
  }

  async function classifyDG() {
    if (!result) {
      alert("Read SDS first");
      return;
    }

    setStatus("classifying");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      console.log(data);

      if (!res.ok) {
        alert(data.error || "Classification failed");
        return;
      }

      setResult(data);

      alert("DG classified successfully");

    } catch (err) {
      console.log(err);
      alert("Classification error");
    }
  }

  async function validateDG() {
    if (!result) {
      alert("No DG data");
      return;
    }

    try {
      const res = await fetch("/api/create-job", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      console.log(data);

      alert("DG validated");

    } catch (err) {
      console.log(err);
      alert("Validation failed");
    }
  }

  async function generatePDF() {
    if (!result) {
      alert("No data");
      return;
    }

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "IMO_DGD.pdf";
      a.click();

    } catch (err) {
      console.log(err);
      alert("PDF generation failed");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <h1 className="text-5xl font-bold mb-10">
        🚀 DGRFlow Dashboard
      </h1>

      <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">

        <h2 className="text-2xl font-bold mb-6">
          Upload SDS
        </h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-6 block"
        />

        <div className="flex flex-wrap gap-4">

          <button
            onClick={uploadAndRead}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold"
          >
            📄 Read SDS
          </button>

          <button
            onClick={classifyDG}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold"
          >
            😈 Classify
          </button>

          <button
            onClick={validateDG}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold"
          >
            🛡 Validate DG
          </button>

          <button
            onClick={generatePDF}
            className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-xl font-bold"
          >
            📄 Generate PDF
          </button>

        </div>

      </div>

      <div className="mt-10 bg-slate-900 rounded-2xl p-8 border border-slate-800">

        <h2 className="text-2xl font-bold mb-4">
          Status
        </h2>

        <div className="inline-block bg-slate-700 px-4 py-2 rounded-xl">
          {status}
        </div>

      </div>

      {result && (
        <div className="mt-10 bg-slate-900 rounded-2xl p-8 border border-slate-800">

          <h2 className="text-2xl font-bold mb-4">
            SDS Data
          </h2>

          <pre className="overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>

        </div>
      )}

    </div>
  );
}
