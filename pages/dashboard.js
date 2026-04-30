import { useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function uploadAndRead() {
    if (!file) {
      alert("Select SDS PDF first");
      return;
    }

    setLoading(true);
    setStatus("Reading SDS...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "SDS read failed");
      }

      setResult(data);
      setStatus("SDS Parsed Successfully");
    } catch (err) {
      console.error(err);
      setStatus("Read SDS Failed");
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function classifyDG() {
    if (!result) {
      alert("Read SDS first");
      return;
    }

    setLoading(true);
    setStatus("Classifying Dangerous Goods...");

    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Classification failed");
      }

      setResult(data);
      setStatus("DG Classification Complete");
    } catch (err) {
      console.error(err);
      setStatus("Classification Failed");
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generatePDF() {
    if (!result) {
      alert("No classification data");
      return;
    }

    setLoading(true);

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

      setStatus("PDF Generated");
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* TOP BAR */}
      <div className="border-b border-slate-800 backdrop-blur-xl bg-black/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" className="h-12" />

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                DGRFlow
              </h1>

              <p className="text-slate-400 text-sm">
                Dangerous Goods Automation Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm">
              Status: <span className="text-cyan-400">{status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="lg:col-span-1 space-y-8">

          {/* UPLOAD */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-2">
              Upload SDS
            </h2>

            <p className="text-slate-400 mb-6 text-sm">
              Upload Safety Data Sheet PDF for AI DG classification.
            </p>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:border-cyan-500 transition-all">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-4"
              />

              <p className="text-slate-500 text-sm">
                PDF only
              </p>
            </div>

            {file && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm">
                📄 {file.name}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">
              Actions
            </h2>

            <div className="space-y-4">
              <button
                onClick={uploadAndRead}
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 transition-all rounded-2xl py-4 font-bold text-lg shadow-lg"
              >
                📄 Read SDS
              </button>

              <button
                onClick={classifyDG}
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 transition-all rounded-2xl py-4 font-bold text-lg shadow-lg"
              >
                🤖 Classify DG
              </button>

              <button
                onClick={generatePDF}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all rounded-2xl py-4 font-bold text-lg shadow-lg"
              >
                📦 Generate IMO PDF
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-8">

          {/* RESULT HEADER */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  DG Classification
                </h2>

                <p className="text-slate-400 mt-2">
                  AI-powered dangerous goods extraction
                </p>
              </div>

              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-cyan-500 to-violet-600 blur-2xl opacity-50"></div>
            </div>

            {!result && (
              <div className="h-96 flex items-center justify-center border border-dashed border-slate-700 rounded-3xl text-slate-500 text-lg">
                No SDS processed yet
              </div>
            )}

            {result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">UN Number</p>
                  <h3 className="text-3xl font-bold text-cyan-400">
                    {result.un_number || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">Hazard Class</p>
                  <h3 className="text-3xl font-bold text-red-400">
                    {result.hazard_class || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:col-span-2">
                  <p className="text-slate-500 text-sm mb-2">Technical Name</p>
                  <h3 className="text-2xl font-bold">
                    {result.technical_name || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">Packing Group</p>
                  <h3 className="text-2xl font-bold text-amber-400">
                    {result.packing_group || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">Flash Point</p>
                  <h3 className="text-2xl font-bold text-orange-400">
                    {result.flash_point || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">EMS</p>
                  <h3 className="text-2xl font-bold text-emerald-400">
                    {result.ems || "N/A"}
                  </h3>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
                  <p className="text-slate-500 text-sm mb-2">Transport</p>
                  <h3 className="text-2xl font-bold text-violet-400">
                    {result.transport_mode || "N/A"}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* RAW JSON */}
          {result && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">
                Raw AI Output
              </h2>

              <pre className="bg-black rounded-2xl p-6 overflow-auto text-sm border border-slate-800 text-slate-300">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
