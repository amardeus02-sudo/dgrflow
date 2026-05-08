import { useState } from "react";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [sdsText, setSdsText] = useState("");
  const [classification, setClassification] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // =========================
  // READ SDS
  // =========================
  const handleReadSDS = async () => {
    if (!file) {
      alert("Upload SDS first");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/read-sds", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Read SDS failed");
        return;
      }

      setSdsText(data.text);

      alert("SDS extracted successfully");
    } catch (error) {
      console.error(error);
      alert("Read SDS error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CLASSIFY DG
  // =========================
  const handleClassify = async () => {
    if (!sdsText) {
      alert("Read SDS first");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: sdsText,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Classification failed");
        return;
      }

      let parsed;

      try {
        parsed = JSON.parse(data.result);
      } catch {
        parsed = {
          raw: data.result,
        };
      }

      setClassification(parsed);

      alert("DG classified successfully");
    } catch (error) {
      console.error(error);
      alert("Classification error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VALIDATE DG
  // =========================
  const handleValidate = async () => {
    if (!classification) {
      alert("Classify DG first");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dg: classification,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Validation failed");
        return;
      }

      setValidation(data.validation);

      alert("DG validated successfully");
    } catch (error) {
      console.error(error);
      alert("Validation error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GENERATE PDF
  // =========================
  const handleGeneratePDF = async () => {
    if (!classification) {
      alert("Classify DG first");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dg: classification,
        }),
      });

      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "imo-declaration.pdf";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);

      alert("IMO PDF generated");
    } catch (error) {
      console.error(error);
      alert("PDF generation error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HEADER */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">
              DGRFlow
            </h1>
            <p className="text-zinc-400 text-sm">
              Dangerous Goods Automation Platform
            </p>
          </div>

          <button className="bg-orange-500 hover:bg-orange-600 px-5 py-2 rounded-xl font-semibold transition">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1 rounded-full text-sm">
            AI Dangerous Goods Platform
          </span>

          <h2 className="text-5xl font-bold mt-6 leading-tight max-w-4xl">
            Automate SDS extraction, DG validation and IMO generation.
          </h2>

          <p className="text-zinc-400 text-lg mt-5 max-w-2xl">
            Upload Safety Data Sheets and automatically extract transport data with AI.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT PANEL */}
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-6">

            <h3 className="text-2xl font-bold mb-6">
              Upload SDS
            </h3>

            {/* UPLOAD AREA */}
            <div className="border border-dashed border-zinc-700 rounded-3xl p-10 text-center">

              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📄</span>
              </div>

              <h4 className="text-2xl font-bold mb-2">
                Drag & Drop SDS PDF
              </h4>

              <p className="text-zinc-500 mb-6">
                Upload dangerous goods Safety Data Sheets
              </p>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="mb-6"
              />

              {file && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center mt-6">
                  <div>
                    <p className="font-semibold">
                      {file.name}
                    </p>

                    <p className="text-zinc-500 text-sm">
                      PDF ready for processing
                    </p>
                  </div>

                  <span className="text-green-400 font-bold">
                    READY
                  </span>
                </div>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-4 mt-8">

              <button
                onClick={handleReadSDS}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold transition"
              >
                {loading ? "Processing..." : "Read SDS"}
              </button>

              <button
                onClick={handleClassify}
                className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl font-semibold transition"
              >
                {loading ? "Processing..." : "Classify DG"}
              </button>

              <button
                onClick={handleValidate}
                className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold transition"
              >
                {loading ? "Processing..." : "Validate DG"}
              </button>

              <button
                onClick={handleGeneratePDF}
                className="bg-orange-500 hover:bg-orange-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                {loading ? "Processing..." : "Generate IMO PDF"}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-6">

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-xl font-bold mb-5">
                Platform Status
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    AI Extraction
                  </span>

                  <span className="text-green-400 font-bold">
                    ONLINE
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    DG Validation
                  </span>

                  <span className="text-green-400 font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    IMO Generator
                  </span>

                  <span className="text-green-400 font-bold">
                    READY
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6">
              <h3 className="text-2xl font-bold mb-3">
                Enterprise Plan
              </h3>

              <p className="text-sm text-orange-100 mb-5">
                Unlock unlimited SDS processing, AI classification and PDF automation.
              </p>

              <button className="bg-white text-black font-bold px-5 py-2 rounded-xl">
                Upgrade
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS */}
        <div className="mt-10 bg-zinc-950 border border-zinc-800 rounded-3xl p-8">

          <h3 className="text-3xl font-bold mb-8">
            SDS Extraction Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">
                UN NUMBER
              </p>

              <h4 className="text-4xl font-bold text-orange-400">
                {classification?.["UN Number"] || "N/A"}
              </h4>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">
                HAZARD CLASS
              </p>

              <h4 className="text-4xl font-bold text-pink-400">
                {classification?.["Hazard Class"] || "N/A"}
              </h4>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">
                PACKING GROUP
              </p>

              <h4 className="text-4xl font-bold text-green-400">
                {classification?.["Packing Group"] || "N/A"}
              </h4>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-500 text-sm mb-2">
                SHIPPING NAME
              </p>

              <h4 className="text-2xl font-bold text-white">
                {classification?.["Proper Shipping Name"] || "N/A"}
              </h4>
            </div>
          </div>

          {/* VALIDATION */}
          {validation && (
            <div className="mt-8 bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                DG Validation
              </h3>

              <p className="text-green-200">
                {validation.message}
              </p>
            </div>
          )}

          {/* SDS TEXT */}
          {sdsText && (
            <div className="mt-10">
              <h3 className="text-2xl font-bold mb-4">
                Extracted SDS Text
              </h3>

              <div className="bg-black border border-zinc-800 rounded-2xl p-6 max-h-[400px] overflow-y-auto text-zinc-300 whitespace-pre-wrap">
                {sdsText}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
